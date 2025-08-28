import { BaseWorkflow } from './BaseWorkflow.js';
import { ADRStatus, WorkflowResult } from '../types/index.js';
import { CrossReferenceSystem } from '../core/CrossReference.js';
import * as path from 'path';

export interface ADRCreateOptions {
  title: string;
  status?: ADRStatus;
  deciders?: string[];
  context?: string;
  decision?: string;
  consequences?: string;
  alternatives?: Array<{
    title: string;
    description: string;
    pros?: string[];
    cons?: string[];
  }>;
  references?: Array<{
    title: string;
    url?: string;
    description?: string;
  }>;
  supersedes?: string[];
  amendments?: Array<{
    date: string;
    description: string;
  }>;
}

export interface ADRListOptions {
  status?: ADRStatus;
  tag?: string;
  search?: string;
  limit?: number;
}

export class ADRWorkflow extends BaseWorkflow {
  private crossRef: CrossReferenceSystem;

  constructor() {
    super('adr', 'adr.hbs');
    this.crossRef = CrossReferenceSystem.getInstance();
  }

  async create(options: ADRCreateOptions): Promise<WorkflowResult> {
    try {
      // Generate document number
      const docNumber = await this.numberingSystem.getNextNumber('adr');
      
      // Generate filename
      const sanitizedTitle = options.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `${docNumber.toString().padStart(4, '0')}-${sanitizedTitle}.md`;
      const filePath = path.join(this.getDocumentPath('adr'), filename);

      // Prepare template data
      const templateData = {
        number: docNumber,
        title: options.title,
        date: new Date().toISOString().split('T')[0],
        status: options.status || 'proposed',
        deciders: options.deciders || [],
        context: options.context || '',
        decision: options.decision || '',
        consequences: options.consequences || '',
        alternatives: options.alternatives || [],
        references: options.references || [],
        supersedes: options.supersedes || [],
        amendments: options.amendments || [],
        tags: []
      };

      // Render template
      const content = await this.templateEngine.render('adr.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      // Handle supersession relationships
      if (options.supersedes && options.supersedes.length > 0) {
        for (const supersededId of options.supersedes) {
          await this.crossRef.addRelationship(
            `adr-${docNumber}`,
            supersededId,
            'supersedes'
          );
          
          // Update superseded ADR status
          const supersededPath = await this.findADRById(supersededId);
          if (supersededPath) {
            await this.updateStatus(supersededPath, 'superseded');
          }
        }
      }

      return {
        success: true,
        message: `ADR ${docNumber} created successfully`,
        data: {
          number: docNumber,
          path: filePath,
          filename
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create ADR: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async list(options: ADRListOptions = {}): Promise<WorkflowResult> {
    try {
      const adrPath = this.getDocumentPath('adr');
      const documents = await this.documentManager.list(adrPath);
      
      let filtered = documents;

      // Filter by status
      if (options.status) {
        filtered = filtered.filter(doc => 
          doc.frontmatter?.status === options.status
        );
      }

      // Filter by tag
      if (options.tag) {
        filtered = filtered.filter(doc => 
          doc.frontmatter?.tags?.includes(options.tag)
        );
      }

      // Search in content
      if (options.search) {
        const searchResults = await this.documentManager.search(
          adrPath,
          options.search
        );
        const searchPaths = searchResults.map(r => r.path);
        filtered = filtered.filter(doc => searchPaths.includes(doc.path));
      }

      // Apply limit
      if (options.limit && options.limit > 0) {
        filtered = filtered.slice(0, options.limit);
      }

      // Format results
      const adrs = filtered.map(doc => ({
        number: doc.frontmatter?.number || 0,
        title: doc.frontmatter?.title || path.basename(doc.path),
        status: doc.frontmatter?.status || 'unknown',
        date: doc.frontmatter?.date || '',
        path: doc.path,
        tags: doc.frontmatter?.tags || []
      }));

      // Sort by number descending
      adrs.sort((a, b) => b.number - a.number);

      return {
        success: true,
        data: adrs
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list ADRs: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateStatus(filePath: string, status: ADRStatus): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      // Update status in frontmatter
      const updatedFrontmatter = {
        ...doc.frontmatter,
        status,
        lastModified: new Date().toISOString().split('T')[0]
      };

      // Update the document
      await this.documentManager.update(filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: `ADR status updated to ${status}`,
        data: { path: filePath, status }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update ADR status: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getRelated(adrId: string): Promise<WorkflowResult> {
    try {
      const relationships = await this.crossRef.getRelationships(adrId);
      
      return {
        success: true,
        data: relationships
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get related ADRs: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async findADRById(adrId: string): Promise<string | null> {
    // Extract number from ID (e.g., "adr-0001" -> 1)
    const match = adrId.match(/adr-(\d+)/);
    if (!match) return null;

    const number = parseInt(match[1], 10);
    const adrPath = this.getDocumentPath('adr');
    const documents = await this.documentManager.list(adrPath);

    for (const doc of documents) {
      if (doc.frontmatter?.number === number) {
        return doc.path;
      }
    }

    return null;
  }

  async addAmendment(
    filePath: string, 
    amendment: { date: string; description: string }
  ): Promise<WorkflowResult> {
    try {
      const doc = await this.documentManager.read(filePath);
      
      const amendments = doc.frontmatter?.amendments || [];
      amendments.push(amendment);

      const updatedFrontmatter = {
        ...doc.frontmatter,
        amendments,
        lastModified: new Date().toISOString().split('T')[0]
      };

      await this.documentManager.update(filePath, {
        frontmatter: updatedFrontmatter,
        content: doc.content
      });

      return {
        success: true,
        message: 'Amendment added successfully',
        data: { path: filePath, amendment }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add amendment: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}