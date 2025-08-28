import { BaseWorkflow } from './BaseWorkflow.js';
import { WorkflowResult, ImplementationPhase, Milestone } from '../types/index.js';
import * as path from 'path';

export interface PlanCreateOptions {
  title: string;
  goal: string;
  scope?: string;
  assumptions?: string[];
  constraints?: string[];
  phases: ImplementationPhase[];
  milestones?: Milestone[];
  risks?: Array<{
    description: string;
    impact: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  dependencies?: string[];
  successCriteria?: string[];
  timeline?: {
    start?: string;
    end?: string;
    duration?: string;
  };
}

export interface PhaseUpdateOptions {
  filePath: string;
  phaseName: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  completedTasks?: string[];
  notes?: string;
}

export class PlanWorkflow extends BaseWorkflow {
  constructor() {
    super('plan', 'plan.hbs');
  }

  async create(options: PlanCreateOptions): Promise<WorkflowResult> {
    try {
      // Generate document number
      const docNumber = await this.numberingSystem.getNextNumber('plan');
      
      // Generate filename
      const sanitizedTitle = options.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `plan-${docNumber.toString().padStart(3, '0')}-${sanitizedTitle}.md`;
      const filePath = path.join(this.getDocumentPath('plan'), filename);

      // Calculate phase metrics
      const totalTasks = options.phases.reduce((sum, phase) => 
        sum + (phase.tasks?.length || 0), 0
      );

      // Prepare template data
      const templateData = {
        number: docNumber,
        title: options.title,
        date: new Date().toISOString().split('T')[0],
        goal: options.goal,
        scope: options.scope || '',
        assumptions: options.assumptions || [],
        constraints: options.constraints || [],
        phases: options.phases.map((phase, index) => ({
          ...phase,
          number: index + 1,
          status: phase.status || 'not-started',
          completedTasks: 0,
          totalTasks: phase.tasks?.length || 0,
          progress: 0
        })),
        milestones: options.milestones || [],
        risks: options.risks || [],
        dependencies: options.dependencies || [],
        successCriteria: options.successCriteria || [],
        timeline: options.timeline || {},
        status: 'draft',
        metrics: {
          totalPhases: options.phases.length,
          totalTasks,
          completedPhases: 0,
          completedTasks: 0,
          overallProgress: 0
        }
      };

      // Render template
      const content = await this.templateEngine.render('plan.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      return {
        success: true,
        message: `Plan ${docNumber} created successfully`,
        data: {
          number: docNumber,
          path: filePath,
          filename,
          metrics: templateData.metrics
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updatePhase(options: PhaseUpdateOptions): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(options.filePath);
      
      // Find the phase to update
      const phaseIndex = doc.frontmatter?.phases?.findIndex(
        (phase: ImplementationPhase) => phase.name === options.phaseName
      );

      if (phaseIndex === undefined || phaseIndex < 0) {
        return {
          success: false,
          error: `Phase "${options.phaseName}" not found in plan`
        };
      }

      // Update phase
      const updatedPhases = [...(doc.frontmatter?.phases || [])];
      const phase = updatedPhases[phaseIndex];
      
      phase.status = options.status;
      if (options.completedTasks) {
        phase.completedTasks = options.completedTasks.length;
      }
      if (options.notes) {
        phase.notes = options.notes;
      }

      // Calculate progress
      phase.progress = phase.totalTasks > 0 
        ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
        : 0;

      // Update overall metrics
      const metrics = this.calculatePlanMetrics(updatedPhases);

      // Update plan status based on progress
      let planStatus = 'in-progress';
      if (metrics.overallProgress === 0) {
        planStatus = 'draft';
      } else if (metrics.overallProgress === 100) {
        planStatus = 'completed';
      } else if (updatedPhases.some((p: ImplementationPhase) => p.status === 'blocked')) {
        planStatus = 'blocked';
      }

      // Update frontmatter
      const updatedFrontmatter = {
        ...doc.frontmatter,
        phases: updatedPhases,
        metrics,
        status: planStatus,
        lastModified: new Date().toISOString().split('T')[0]
      };

      await this.documentManager.update(options.filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Phase "${options.phaseName}" updated successfully`,
        data: {
          phase: updatedPhases[phaseIndex],
          metrics,
          status: planStatus
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update phase: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getProgress(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      const phases = doc.frontmatter?.phases || [];
      const metrics = this.calculatePlanMetrics(phases);

      // Generate progress report
      const report = {
        title: doc.frontmatter?.title,
        status: doc.frontmatter?.status,
        metrics,
        phases: phases.map((phase: ImplementationPhase) => ({
          name: phase.name,
          status: phase.status,
          progress: phase.progress || 0,
          completedTasks: phase.completedTasks || 0,
          totalTasks: phase.totalTasks || 0,
          estimatedDuration: phase.estimatedDuration
        })),
        milestones: doc.frontmatter?.milestones?.map((milestone: Milestone) => ({
          name: milestone.name,
          targetDate: milestone.targetDate,
          status: milestone.status || 'pending',
          criteria: milestone.criteria
        })),
        timeline: doc.frontmatter?.timeline
      };

      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get progress: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateMilestone(
    filePath: string,
    milestoneName: string,
    status: 'pending' | 'completed' | 'missed'
  ): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const milestoneIndex = doc.frontmatter?.milestones?.findIndex(
        (m: Milestone) => m.name === milestoneName
      );

      if (milestoneIndex === undefined || milestoneIndex < 0) {
        return {
          success: false,
          error: `Milestone "${milestoneName}" not found`
        };
      }

      const updatedMilestones = [...(doc.frontmatter?.milestones || [])];
      updatedMilestones[milestoneIndex].status = status;
      
      if (status === 'completed') {
        updatedMilestones[milestoneIndex].completedDate = new Date().toISOString().split('T')[0];
      }

      const updatedFrontmatter = {
        ...doc.frontmatter,
        milestones: updatedMilestones,
        lastModified: new Date().toISOString().split('T')[0]
      };

      await this.documentManager.update(filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Milestone "${milestoneName}" updated to ${status}`,
        data: {
          milestone: updatedMilestones[milestoneIndex]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update milestone: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateChecklist(filePath: string, phaseName: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const phase = doc.frontmatter?.phases?.find(
        (p: ImplementationPhase) => p.name === phaseName
      );

      if (!phase) {
        return {
          success: false,
          error: `Phase "${phaseName}" not found`
        };
      }

      // Generate checklist markdown
      const checklist = this.generatePhaseChecklist(phase);

      // Save as separate checklist document
      const checklistPath = path.join(
        this.getDocumentPath('checklist'),
        `checklist-${doc.frontmatter?.title?.toLowerCase().replace(/\s+/g, '-')}-${phaseName.toLowerCase().replace(/\s+/g, '-')}.md`
      );

      await this.documentManager.create(checklistPath, checklist);

      return {
        success: true,
        message: `Checklist generated for phase "${phaseName}"`,
        data: {
          checklistPath,
          phase: phaseName,
          tasks: phase.tasks?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate checklist: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private calculatePlanMetrics(phases: ImplementationPhase[]): any {
    const totalPhases = phases.length;
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const totalTasks = phases.reduce((sum, p) => sum + (p.totalTasks || 0), 0);
    const completedTasks = phases.reduce((sum, p) => sum + (p.completedTasks || 0), 0);
    
    const overallProgress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return {
      totalPhases,
      completedPhases,
      totalTasks,
      completedTasks,
      overallProgress
    };
  }

  private generatePhaseChecklist(phase: ImplementationPhase): string {
    const lines: string[] = [
      `# Checklist: ${phase.name}`,
      '',
      `**Phase ${phase.number || 1}**: ${phase.description || ''}`,
      '',
      '## Tasks',
      ''
    ];

    if (phase.tasks && phase.tasks.length > 0) {
      phase.tasks.forEach((task, index) => {
        lines.push(`- [ ] ${index + 1}. ${task}`);
      });
    } else {
      lines.push('_No tasks defined_');
    }

    lines.push('', '## Notes', '', phase.notes || '_No notes_');
    lines.push('', '## Dependencies', '');

    if (phase.dependencies && phase.dependencies.length > 0) {
      phase.dependencies.forEach(dep => {
        lines.push(`- ${dep}`);
      });
    } else {
      lines.push('_No dependencies_');
    }

    return lines.join('\n');
  }
}