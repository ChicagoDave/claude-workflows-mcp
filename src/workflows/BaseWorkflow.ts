import { DocumentManager } from '../core/DocumentManager.js';
import { TemplateEngine } from '../core/TemplateEngine.js';
import { NumberingSystem } from '../core/NumberingSystem.js';
import { Config } from '../core/Config.js';
import { Document, WorkflowState } from '../types/index.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export abstract class BaseWorkflow {
  protected documentManager: DocumentManager;
  protected templateEngine: TemplateEngine;
  protected numberingSystem: NumberingSystem;
  protected config: Config;
  protected workflowType: string;
  protected templateName: string;
  protected state: WorkflowState | null = null;

  constructor(workflowType: string, templateName: string) {
    this.workflowType = workflowType;
    this.templateName = templateName;
    this.documentManager = new DocumentManager();
    this.templateEngine = TemplateEngine.getInstance();
    this.config = Config.getDefault();
    this.numberingSystem = NumberingSystem.getInstance();
  }

  async initialize(): Promise<void> {
    // Load configuration
    this.config = await Config.load();
    
    // Ensure necessary directories exist
    await this.config.ensurePaths();
    
    // Load workflow state if exists
    await this.loadState();
  }

  protected getDocumentPath(type: string): string {
    // Get document path from config based on type
    const paths = this.config.getConfig().paths;
    switch (type) {
      case 'adr':
        return paths.adrs;
      case 'session':
      case 'context':
        return paths.sessions;
      case 'design':
        return paths.discussions;
      case 'plan':
      case 'checklist':
      case 'refactor':
        return paths.work;
      default:
        return paths.work;
    }
  }

  protected async loadState(): Promise<void> {
    const statePath = this.getStatePath();
    
    if (existsSync(statePath)) {
      try {
        const content = await readFile(statePath, 'utf-8');
        this.state = JSON.parse(content);
      } catch (error) {
        console.error('Failed to load workflow state:', error);
        this.state = null;
      }
    }
  }

  protected async saveState(state: Partial<WorkflowState>): Promise<void> {
    await Config.ensureWorkflowStateDirectory();
    
    this.state = {
      currentWorkflow: this.workflowType,
      currentDocument: state.currentDocument || this.state?.currentDocument,
      lastUpdated: new Date().toISOString(),
      metadata: { ...this.state?.metadata, ...state.metadata },
    };

    const statePath = this.getStatePath();
    await writeFile(statePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  protected getStatePath(): string {
    return join(Config.getWorkflowStateDirectory(), `${this.workflowType}.state.json`);
  }

  protected async generateDocumentNumber(type: string): Promise<number> {
    return await this.numberingSystem.getNextNumber(type);
  }

  protected generateFilename(number: number, title: string, prefix: string): string {
    return this.numberingSystem.generateFilename(prefix, number.toString(), title);
  }

  protected async createDocument(
    templateName: string,
    data: Record<string, any>,
    filename?: string
  ): Promise<Document> {
    // Generate content from template
    const content = await this.templateEngine.render(templateName, data);
    
    // Determine file path
    const path = filename || this.generateFilename(data.number, data.title, this.workflowType);
    const fullPath = join(this.getDocumentPath(this.workflowType), path);

    // Create document
    const document: Document = {
      path: fullPath,
      content,
      metadata: {
        title: data.title,
        number: data.number,
        date: new Date().toISOString().split('T')[0],
        ...data,
      },
    };

    // Save document
    await this.documentManager.write(fullPath, document);
    
    // Update state
    await this.saveState({
      currentDocument: fullPath,
      metadata: { lastCreated: path },
    });

    return document;
  }

  protected async listDocuments(pattern?: string): Promise<Document[]> {
    const searchPattern = pattern || join(this.getDocumentPath(this.workflowType), '*.md');
    return await this.documentManager.listDocuments(searchPattern);
  }

  protected async getDocument(identifier: string): Promise<Document | null> {
    // Try direct path first
    if (await this.documentManager.exists(identifier)) {
      return await this.documentManager.read(identifier);
    }

    // Try searching by number or title
    const documents = await this.listDocuments();
    
    for (const doc of documents) {
      if (doc.metadata.number === identifier || 
          doc.metadata.title === identifier ||
          doc.path.includes(identifier)) {
        return doc;
      }
    }

    return null;
  }

  protected async updateDocument(
    identifier: string,
    updates: Partial<Document>
  ): Promise<Document> {
    const document = await this.getDocument(identifier);
    
    if (!document) {
      throw new Error(`Document not found: ${identifier}`);
    }

    const updatedDocument: Document = {
      path: document.path,
      content: updates.content ?? document.content,
      metadata: {
        ...document.metadata,
        ...updates.metadata,
        lastModified: new Date().toISOString(),
      },
    };

    await this.documentManager.write(document.path, updatedDocument);
    return updatedDocument;
  }

  protected async deleteDocument(identifier: string): Promise<void> {
    const document = await this.getDocument(identifier);
    
    if (!document) {
      throw new Error(`Document not found: ${identifier}`);
    }

    await this.documentManager.delete(document.path);
  }

  protected formatOutput(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  }
}