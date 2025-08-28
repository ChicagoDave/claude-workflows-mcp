import { BaseWorkflow } from './BaseWorkflow.js';
import { WorkflowResult, DesignOption, EvaluationCriteria } from '../types/index.js';
import * as path from 'path';

export interface DesignCreateOptions {
  title: string;
  problem: string;
  context?: string;
  constraints?: string[];
  requirements?: string[];
  options: DesignOption[];
  criteria?: EvaluationCriteria[];
  recommendation?: string;
  decision?: string;
  rationale?: string;
  references?: Array<{
    title: string;
    url?: string;
    description?: string;
  }>;
}

export interface DesignEvaluateOptions {
  filePath: string;
  optionName: string;
  scores: Record<string, number>;
  notes?: string;
}

export class DesignWorkflow extends BaseWorkflow {
  constructor() {
    super('design', 'design-discussion.hbs');
  }

  async create(options: DesignCreateOptions): Promise<WorkflowResult> {
    try {
      // Generate document number
      const docNumber = await this.numberingSystem.getNextNumber('design');
      
      // Generate filename
      const sanitizedTitle = options.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `design-${docNumber.toString().padStart(3, '0')}-${sanitizedTitle}.md`;
      const filePath = path.join(this.getDocumentPath('design'), filename);

      // Default criteria if not provided
      const defaultCriteria: EvaluationCriteria[] = [
        { name: 'complexity', weight: 3, description: 'Implementation complexity' },
        { name: 'performance', weight: 2, description: 'Runtime performance' },
        { name: 'maintainability', weight: 3, description: 'Long-term maintainability' },
        { name: 'scalability', weight: 2, description: 'Ability to scale' }
      ];

      // Prepare template data
      const templateData = {
        number: docNumber,
        title: options.title,
        date: new Date().toISOString().split('T')[0],
        problem: options.problem,
        context: options.context || '',
        constraints: options.constraints || [],
        requirements: options.requirements || [],
        options: options.options.map(opt => ({
          ...opt,
          scores: opt.scores || {},
          totalScore: 0
        })),
        criteria: options.criteria || defaultCriteria,
        recommendation: options.recommendation || '',
        decision: options.decision || '',
        rationale: options.rationale || '',
        references: options.references || [],
        status: 'evaluating'
      };

      // Calculate initial scores with proper type mapping
      const scoredOptions = this.calculateScores(
        templateData.options,
        templateData.criteria
      );
      templateData.options = scoredOptions;

      // Render template
      const content = await this.templateEngine.render('design-discussion.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      return {
        success: true,
        message: `Design document ${docNumber} created successfully`,
        data: {
          number: docNumber,
          path: filePath,
          filename
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create design document: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async evaluate(options: DesignEvaluateOptions): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(options.filePath);
      
      // Find the option to update
      const optionIndex = doc.frontmatter?.options?.findIndex(
        (opt: DesignOption) => opt.name === options.optionName
      );

      if (optionIndex === undefined || optionIndex < 0) {
        return {
          success: false,
          error: `Option "${options.optionName}" not found in design document`
        };
      }

      // Update scores
      const updatedOptions = [...(doc.frontmatter?.options || [])];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        scores: options.scores,
        evaluationNotes: options.notes
      };

      // Recalculate total scores
      const criteria = doc.frontmatter?.criteria || [];
      updatedOptions[optionIndex] = this.calculateScores(
        [updatedOptions[optionIndex]],
        criteria
      )[0];

      // Update frontmatter
      const updatedFrontmatter = {
        ...doc.frontmatter,
        options: updatedOptions,
        lastModified: new Date().toISOString().split('T')[0]
      };

      // Update recommendation if all options are evaluated
      const allEvaluated = updatedOptions.every((opt: DesignOption) => 
        opt.scores && Object.keys(opt.scores).length > 0
      );

      if (allEvaluated) {
        const bestOption = this.findBestOption(updatedOptions);
        updatedFrontmatter.recommendation = `Based on evaluation scores, "${bestOption.name}" is recommended with a total score of ${bestOption.totalScore}.`;
        updatedFrontmatter.status = 'evaluated';
      }

      await this.documentManager.update(options.filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Option "${options.optionName}" evaluated successfully`,
        data: {
          option: updatedOptions[optionIndex],
          allEvaluated,
          recommendation: updatedFrontmatter.recommendation
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to evaluate option: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async compare(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      const options = doc.frontmatter?.options || [];
      const criteria = doc.frontmatter?.criteria || [];

      if (options.length === 0) {
        return {
          success: false,
          error: 'No options found in design document'
        };
      }

      // Calculate scores for all options
      const scoredOptions = this.calculateScores(options, criteria);
      
      // Sort by total score
      scoredOptions.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

      // Generate comparison matrix
      const comparisonMatrix = this.generateComparisonMatrix(scoredOptions, criteria);

      return {
        success: true,
        data: {
          rankedOptions: scoredOptions,
          comparisonMatrix,
          bestOption: scoredOptions[0],
          criteria
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to compare options: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async finalize(
    filePath: string,
    decision: string,
    rationale: string
  ): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const updatedFrontmatter = {
        ...doc.frontmatter,
        decision,
        rationale,
        status: 'decided',
        decisionDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };

      await this.documentManager.update(filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: 'Design decision finalized',
        data: {
          decision,
          rationale,
          path: filePath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to finalize design: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private calculateScores(
    options: any[],
    criteria: EvaluationCriteria[]
  ): any[] {
    return options.map(option => {
      let totalScore = 0;
      const scores = option.scores || {};
      
      for (const criterion of criteria) {
        const score = scores[criterion.name] || 0;
        totalScore += score * (criterion.weight || 1);
      }

      return {
        ...option,
        scores,
        totalScore
      };
    });
  }

  private findBestOption(options: DesignOption[]): DesignOption {
    return options.reduce((best, current) => {
      const bestScore = best.totalScore || 0;
      const currentScore = current.totalScore || 0;
      return currentScore > bestScore ? current : best;
    });
  }

  private generateComparisonMatrix(
    options: DesignOption[],
    criteria: EvaluationCriteria[]
  ): any {
    const matrix: any = {
      criteria: criteria.map(c => c.name),
      options: {}
    };

    for (const option of options) {
      matrix.options[option.name] = {
        scores: option.scores || {},
        totalScore: option.totalScore || 0,
        pros: option.pros || [],
        cons: option.cons || []
      };
    }

    return matrix;
  }
}