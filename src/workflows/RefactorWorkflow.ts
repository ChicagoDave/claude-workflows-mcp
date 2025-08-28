import { BaseWorkflow } from './BaseWorkflow.js';
import { WorkflowResult, RefactorScope, RefactorType } from '../types/index.js';
import * as path from 'path';

export interface RefactorCreateOptions {
  title: string;
  type: RefactorType;
  scope: RefactorScope;
  description: string;
  motivation: string;
  targetFiles?: string[];
  currentImplementation?: {
    description: string;
    problems: string[];
    codeSnippets?: Array<{
      file: string;
      lineRange?: string;
      code: string;
      issue?: string;
    }>;
  };
  proposedChanges: {
    description: string;
    benefits: string[];
    approach: string;
    codeSnippets?: Array<{
      file: string;
      lineRange?: string;
      code: string;
      explanation?: string;
    }>;
  };
  impacts?: {
    breaking: boolean;
    affectedComponents?: string[];
    migrationSteps?: string[];
    risks?: string[];
  };
  testingStrategy?: {
    unitTests?: string[];
    integrationTests?: string[];
    verificationSteps?: string[];
  };
  estimatedEffort?: {
    hours?: number;
    complexity?: 'low' | 'medium' | 'high';
    dependencies?: string[];
  };
}

export interface RefactorUpdateProgressOptions {
  filePath: string;
  filesCompleted: string[];
  filesRemaining: string[];
  notes?: string;
  blockers?: string[];
}

export class RefactorWorkflow extends BaseWorkflow {
  constructor() {
    super('refactor', 'refactor-spec.hbs');
  }

  async create(options: RefactorCreateOptions): Promise<WorkflowResult> {
    try {
      // Generate document number
      const docNumber = await this.numberingSystem.getNextNumber('refactor');
      
      // Generate filename
      const sanitizedTitle = options.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `refactor-${docNumber.toString().padStart(3, '0')}-${sanitizedTitle}.md`;
      const filePath = path.join(this.getDocumentPath('refactor'), filename);

      // Calculate initial metrics
      const totalFiles = options.targetFiles?.length || 0;
      const metrics = {
        totalFiles,
        completedFiles: 0,
        progress: 0,
        estimatedHours: options.estimatedEffort?.hours || 0,
        actualHours: 0
      };

      // Prepare template data
      const templateData = {
        number: docNumber,
        title: options.title,
        date: new Date().toISOString().split('T')[0],
        type: options.type,
        scope: options.scope,
        description: options.description,
        motivation: options.motivation,
        targetFiles: options.targetFiles || [],
        currentImplementation: options.currentImplementation || {
          description: '',
          problems: [],
          codeSnippets: []
        },
        proposedChanges: options.proposedChanges,
        impacts: options.impacts || {
          breaking: false,
          affectedComponents: [],
          migrationSteps: [],
          risks: []
        },
        testingStrategy: options.testingStrategy || {
          unitTests: [],
          integrationTests: [],
          verificationSteps: []
        },
        estimatedEffort: options.estimatedEffort || {
          hours: 0,
          complexity: 'medium',
          dependencies: []
        },
        status: 'proposed',
        metrics,
        timeline: {
          proposed: new Date().toISOString().split('T')[0],
          approved: null,
          started: null,
          completed: null
        }
      };

      // Render template
      const content = await this.templateEngine.render('refactor-spec.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      return {
        success: true,
        message: `Refactor specification ${docNumber} created successfully`,
        data: {
          number: docNumber,
          path: filePath,
          filename,
          metrics
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create refactor specification: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateStatus(
    filePath: string,
    status: 'proposed' | 'approved' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const timeline = doc.frontmatter?.timeline || {};
      const currentDate = new Date().toISOString().split('T')[0];

      // Update timeline based on status
      switch (status) {
        case 'approved':
          timeline.approved = currentDate;
          break;
        case 'in-progress':
          timeline.started = currentDate;
          break;
        case 'completed':
          timeline.completed = currentDate;
          break;
      }

      const updatedFrontmatter = {
        ...doc.frontmatter,
        status,
        timeline,
        lastModified: currentDate
      };

      await this.documentManager.update(filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Refactor status updated to ${status}`,
        data: {
          status,
          timeline
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update status: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateProgress(options: RefactorUpdateProgressOptions): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(options.filePath);
      
      const totalFiles = doc.frontmatter?.targetFiles?.length || 0;
      const completedFiles = options.filesCompleted.length;
      const progress = totalFiles > 0 
        ? Math.round((completedFiles / totalFiles) * 100)
        : 0;

      const metrics = {
        ...doc.frontmatter?.metrics,
        completedFiles,
        progress,
        lastUpdated: new Date().toISOString()
      };

      const progressData = {
        filesCompleted: options.filesCompleted,
        filesRemaining: options.filesRemaining,
        notes: options.notes || '',
        blockers: options.blockers || []
      };

      const updatedFrontmatter = {
        ...doc.frontmatter,
        metrics,
        progress: progressData,
        lastModified: new Date().toISOString().split('T')[0]
      };

      // Auto-update status based on progress
      if (progress === 100 && doc.frontmatter?.status === 'in-progress') {
        updatedFrontmatter.status = 'completed';
        updatedFrontmatter.timeline.completed = new Date().toISOString().split('T')[0];
      } else if (progress > 0 && doc.frontmatter?.status === 'approved') {
        updatedFrontmatter.status = 'in-progress';
        updatedFrontmatter.timeline.started = new Date().toISOString().split('T')[0];
      }

      await this.documentManager.update(options.filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Progress updated: ${progress}% complete`,
        data: {
          metrics,
          progress: progressData,
          status: updatedFrontmatter.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update progress: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async analyzeImpact(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const impact = {
        type: doc.frontmatter?.type,
        scope: doc.frontmatter?.scope,
        breaking: doc.frontmatter?.impacts?.breaking || false,
        affectedComponents: doc.frontmatter?.impacts?.affectedComponents || [],
        targetFiles: doc.frontmatter?.targetFiles || [],
        risks: doc.frontmatter?.impacts?.risks || [],
        complexity: doc.frontmatter?.estimatedEffort?.complexity || 'unknown',
        estimatedHours: doc.frontmatter?.estimatedEffort?.hours || 0,
        dependencies: doc.frontmatter?.estimatedEffort?.dependencies || []
      };

      // Calculate risk score
      let riskScore = 0;
      if (impact.breaking) riskScore += 3;
      if (impact.scope === 'major') riskScore += 2;
      else if (impact.scope === 'minor') riskScore += 1;
      riskScore += Math.min(impact.risks.length, 3);
      riskScore += Math.min(Math.floor(impact.affectedComponents.length / 3), 2);

      const riskLevel = riskScore <= 2 ? 'low' : riskScore <= 5 ? 'medium' : 'high';

      return {
        success: true,
        data: {
          impact,
          riskScore,
          riskLevel,
          recommendation: this.generateImpactRecommendation(riskLevel, impact)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze impact: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateChecklist(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const checklist = this.generateRefactorChecklist(doc.frontmatter);
      
      const checklistPath = path.join(
        this.getDocumentPath('checklist'),
        `refactor-checklist-${doc.frontmatter?.number || 'unknown'}.md`
      );

      await this.documentManager.create(checklistPath, checklist);

      return {
        success: true,
        message: 'Refactor checklist generated',
        data: {
          checklistPath,
          itemCount: doc.frontmatter?.targetFiles?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate checklist: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async validateCompletion(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const validation = {
        filesComplete: doc.frontmatter?.metrics?.progress === 100,
        testsDocumented: (doc.frontmatter?.testingStrategy?.unitTests?.length || 0) > 0 ||
                        (doc.frontmatter?.testingStrategy?.integrationTests?.length || 0) > 0,
        migrationStepsProvided: !doc.frontmatter?.impacts?.breaking ||
                                (doc.frontmatter?.impacts?.migrationSteps?.length || 0) > 0,
        statusCorrect: doc.frontmatter?.status === 'completed' && 
                      doc.frontmatter?.metrics?.progress === 100
      };

      const isValid = Object.values(validation).every(v => v);
      const issues = Object.entries(validation)
        .filter(([_, valid]) => !valid)
        .map(([key, _]) => key);

      return {
        success: true,
        data: {
          isValid,
          validation,
          issues,
          message: isValid 
            ? 'Refactor is complete and properly documented'
            : `Refactor has ${issues.length} validation issues`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate completion: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private generateImpactRecommendation(riskLevel: string, impact: any): string {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Consider breaking this refactor into smaller, incremental changes');
      recommendations.push('Ensure comprehensive testing at each step');
      recommendations.push('Plan for rollback strategy');
    }

    if (impact.breaking) {
      recommendations.push('Communicate breaking changes to all stakeholders');
      recommendations.push('Provide detailed migration guide');
      recommendations.push('Consider deprecation period before removal');
    }

    if (impact.affectedComponents.length > 5) {
      recommendations.push('Review impact on each affected component');
      recommendations.push('Coordinate with component owners');
    }

    if (recommendations.length === 0) {
      recommendations.push('Proceed with standard refactoring process');
    }

    return recommendations.join('; ');
  }

  private generateRefactorChecklist(frontmatter: any): string {
    const lines: string[] = [
      `# Refactor Checklist: ${frontmatter?.title || 'Unknown'}`,
      '',
      `**Type**: ${frontmatter?.type || 'Unknown'}`,
      `**Scope**: ${frontmatter?.scope || 'Unknown'}`,
      '',
      '## Pre-refactor',
      '- [ ] Review current implementation',
      '- [ ] Identify all affected components',
      '- [ ] Document existing behavior',
      '- [ ] Create baseline tests',
      '',
      '## Implementation'
    ];

    if (frontmatter?.targetFiles && frontmatter.targetFiles.length > 0) {
      frontmatter.targetFiles.forEach((file: string) => {
        lines.push(`- [ ] Refactor: ${file}`);
      });
    }

    lines.push('', '## Testing');
    
    if (frontmatter?.testingStrategy?.unitTests) {
      frontmatter.testingStrategy.unitTests.forEach((test: string) => {
        lines.push(`- [ ] Unit test: ${test}`);
      });
    }

    if (frontmatter?.testingStrategy?.integrationTests) {
      frontmatter.testingStrategy.integrationTests.forEach((test: string) => {
        lines.push(`- [ ] Integration test: ${test}`);
      });
    }

    lines.push('', '## Post-refactor');
    lines.push('- [ ] Run all tests');
    lines.push('- [ ] Update documentation');
    lines.push('- [ ] Review code changes');
    
    if (frontmatter?.impacts?.breaking) {
      lines.push('- [ ] Document breaking changes');
      lines.push('- [ ] Create migration guide');
    }

    lines.push('- [ ] Notify stakeholders');

    return lines.join('\n');
  }
}