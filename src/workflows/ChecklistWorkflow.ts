import { BaseWorkflow } from './BaseWorkflow.js';
import { WorkflowResult, ChecklistItem } from '../types/index.js';
import * as path from 'path';

export interface ChecklistCreateOptions {
  title: string;
  category: 'phase' | 'review' | 'deployment' | 'testing' | 'custom';
  description?: string;
  items: ChecklistItem[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ChecklistUpdateOptions {
  filePath: string;
  itemId: string;
  completed: boolean;
  notes?: string;
  completedBy?: string;
}

export interface ChecklistBulkUpdateOptions {
  filePath: string;
  items: Array<{
    itemId: string;
    completed: boolean;
    notes?: string;
  }>;
}

export class ChecklistWorkflow extends BaseWorkflow {
  constructor() {
    super('checklist', 'checklist.hbs');
  }

  async create(options: ChecklistCreateOptions): Promise<WorkflowResult> {
    try {
      // Generate document number
      const docNumber = await this.numberingSystem.getNextNumber('checklist');
      
      // Generate filename
      const sanitizedTitle = options.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `checklist-${docNumber.toString().padStart(3, '0')}-${sanitizedTitle}.md`;
      const filePath = path.join(this.getDocumentPath('checklist'), filename);

      // Prepare items with IDs and initial state
      const items = options.items.map((item, index) => ({
        ...item,
        id: `item-${index + 1}`,
        completed: false,
        completedAt: null,
        completedBy: null,
        notes: item.notes || ''
      }));

      // Calculate initial metrics
      const metrics = this.calculateMetrics(items);

      // Prepare template data
      const templateData = {
        number: docNumber,
        title: options.title,
        category: options.category,
        description: options.description || '',
        date: new Date().toISOString().split('T')[0],
        items,
        priority: options.priority || 'medium',
        dueDate: options.dueDate || '',
        assignee: options.assignee || '',
        tags: options.tags || [],
        metadata: options.metadata || {},
        status: 'pending',
        metrics
      };

      // Render template
      const content = await this.templateEngine.render('checklist.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      return {
        success: true,
        message: `Checklist ${docNumber} created successfully`,
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
        error: `Failed to create checklist: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateItem(options: ChecklistUpdateOptions): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(options.filePath);
      
      // Find the item to update
      const itemIndex = doc.frontmatter?.items?.findIndex(
        (item: ChecklistItem) => item.id === options.itemId
      );

      if (itemIndex === undefined || itemIndex < 0) {
        return {
          success: false,
          error: `Item "${options.itemId}" not found in checklist`
        };
      }

      // Update item
      const updatedItems = [...(doc.frontmatter?.items || [])];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        completed: options.completed,
        completedAt: options.completed ? new Date().toISOString() : null,
        completedBy: options.completed ? (options.completedBy || 'unknown') : null,
        notes: options.notes || updatedItems[itemIndex].notes
      };

      // Recalculate metrics
      const metrics = this.calculateMetrics(updatedItems);

      // Update status based on completion
      let status = 'in-progress';
      if (metrics.progress === 0) {
        status = 'pending';
      } else if (metrics.progress === 100) {
        status = 'completed';
      }

      // Update frontmatter
      const updatedFrontmatter = {
        ...doc.frontmatter,
        items: updatedItems,
        metrics,
        status,
        lastModified: new Date().toISOString().split('T')[0]
      };

      if (status === 'completed') {
        updatedFrontmatter.completedDate = new Date().toISOString().split('T')[0];
      }

      await this.documentManager.update(options.filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `Item "${options.itemId}" updated successfully`,
        data: {
          item: updatedItems[itemIndex],
          metrics,
          status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update item: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async bulkUpdate(options: ChecklistBulkUpdateOptions): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(options.filePath);
      const updatedItems = [...(doc.frontmatter?.items || [])];

      // Apply all updates
      for (const update of options.items) {
        const itemIndex = updatedItems.findIndex(
          (item: ChecklistItem) => item.id === update.itemId
        );

        if (itemIndex >= 0) {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            completed: update.completed,
            completedAt: update.completed ? new Date().toISOString() : null,
            notes: update.notes || updatedItems[itemIndex].notes
          };
        }
      }

      // Recalculate metrics
      const metrics = this.calculateMetrics(updatedItems);

      // Update status
      let status = 'in-progress';
      if (metrics.progress === 0) {
        status = 'pending';
      } else if (metrics.progress === 100) {
        status = 'completed';
      }

      // Update frontmatter
      const updatedFrontmatter = {
        ...doc.frontmatter,
        items: updatedItems,
        metrics,
        status,
        lastModified: new Date().toISOString().split('T')[0]
      };

      if (status === 'completed') {
        updatedFrontmatter.completedDate = new Date().toISOString().split('T')[0];
      }

      await this.documentManager.update(options.filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `${options.items.length} items updated successfully`,
        data: {
          updatedCount: options.items.length,
          metrics,
          status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to bulk update items: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getProgress(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      const items = doc.frontmatter?.items || [];
      const metrics = this.calculateMetrics(items);

      // Group items by category if they have one
      const categorizedItems: Record<string, ChecklistItem[]> = {};
      const uncategorized: ChecklistItem[] = [];

      for (const item of items) {
        if (item.category) {
          if (!categorizedItems[item.category]) {
            categorizedItems[item.category] = [];
          }
          categorizedItems[item.category].push(item);
        } else {
          uncategorized.push(item);
        }
      }

      // Calculate category progress
      const categoryProgress: Record<string, number> = {};
      for (const [category, categoryItems] of Object.entries(categorizedItems)) {
        const completed = categoryItems.filter(item => item.completed).length;
        categoryProgress[category] = Math.round((completed / categoryItems.length) * 100);
      }

      return {
        success: true,
        data: {
          title: doc.frontmatter?.title,
          status: doc.frontmatter?.status,
          metrics,
          categoryProgress,
          categorizedItems,
          uncategorized,
          priority: doc.frontmatter?.priority,
          dueDate: doc.frontmatter?.dueDate,
          assignee: doc.frontmatter?.assignee
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get progress: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateReport(filePath: string): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      const items = doc.frontmatter?.items || [];
      const metrics = this.calculateMetrics(items);

      // Generate report
      const report = {
        title: doc.frontmatter?.title,
        category: doc.frontmatter?.category,
        status: doc.frontmatter?.status,
        created: doc.frontmatter?.date,
        lastModified: doc.frontmatter?.lastModified,
        completedDate: doc.frontmatter?.completedDate,
        metrics,
        completedItems: items.filter((item: ChecklistItem) => item.completed),
        pendingItems: items.filter((item: ChecklistItem) => !item.completed),
        itemsWithNotes: items.filter((item: ChecklistItem) => item.notes),
        priority: doc.frontmatter?.priority,
        dueDate: doc.frontmatter?.dueDate,
        assignee: doc.frontmatter?.assignee,
        tags: doc.frontmatter?.tags || []
      };

      // Generate markdown report
      const reportContent = this.generateMarkdownReport(report);
      
      const reportPath = path.join(
        this.getDocumentPath('checklist'),
        `report-${path.basename(filePath, '.md')}.md`
      );

      await this.documentManager.create(reportPath, reportContent);

      return {
        success: true,
        message: 'Report generated successfully',
        data: {
          reportPath,
          report
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate report: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private calculateMetrics(items: ChecklistItem[]): any {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate completion rate over time if we have timestamps
    const completedWithTime = items
      .filter(item => item.completed && item.completedAt)
      .map(item => item.completedAt as string)
      .sort();

    return {
      total,
      completed,
      pending,
      progress,
      completionTimeline: completedWithTime
    };
  }

  private generateMarkdownReport(report: any): string {
    const lines: string[] = [
      `# Checklist Report: ${report.title}`,
      '',
      `**Category**: ${report.category}`,
      `**Status**: ${report.status}`,
      `**Priority**: ${report.priority || 'N/A'}`,
      `**Due Date**: ${report.dueDate || 'N/A'}`,
      `**Assignee**: ${report.assignee || 'N/A'}`,
      '',
      '## Summary',
      `- Total Items: ${report.metrics.total}`,
      `- Completed: ${report.metrics.completed} (${report.metrics.progress}%)`,
      `- Pending: ${report.metrics.pending}`,
      '',
      '## Completed Items',
      ''
    ];

    if (report.completedItems.length > 0) {
      report.completedItems.forEach((item: ChecklistItem) => {
        lines.push(`- ✅ ${item.text}`);
        if (item.notes) {
          lines.push(`  - Notes: ${item.notes}`);
        }
        if (item.completedAt) {
          lines.push(`  - Completed: ${item.completedAt}`);
        }
      });
    } else {
      lines.push('_No completed items_');
    }

    lines.push('', '## Pending Items', '');

    if (report.pendingItems.length > 0) {
      report.pendingItems.forEach((item: ChecklistItem) => {
        lines.push(`- ⬜ ${item.text}`);
        if (item.notes) {
          lines.push(`  - Notes: ${item.notes}`);
        }
      });
    } else {
      lines.push('_No pending items_');
    }

    if (report.tags && report.tags.length > 0) {
      lines.push('', '## Tags', '', report.tags.join(', '));
    }

    return lines.join('\n');
  }
}