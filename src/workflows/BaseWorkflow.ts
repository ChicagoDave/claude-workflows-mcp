import { DocumentManager } from '../core/DocumentManager.js';
import { TemplateEngine } from '../core/TemplateEngine.js';
import { NumberingSystem } from '../core/NumberingSystem.js';
import { Config } from '../core/Config.js';
import { Document, WorkflowType, WorkflowState } from '../types/index.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export abstract class BaseWorkflow {
  protected documentManager: DocumentManager;
  protected templateEngine: TemplateEngine;
  protected numberingSystem: NumberingSystem | null = null;
  protected config: Config;
  protected workflowType: WorkflowType;
  protected state: WorkflowState | null = null;

  constructor(workflowType: WorkflowType) {
    this.workflowType = workflowType;
    this.documentManager = new DocumentManager();
    this.templateEngine = TemplateEngine.getInstance();
    this.config = Config.getDefault();
  }

  async initialize(): Promise<void> {
    // Load configuration
    this.config = await Config.load();
    
    // Ensure necessary directories exist
    await this.config.ensurePaths();
    
    // Initialize numbering system
    this.numberingSystem = await NumberingSystem.getInstance();
    
    // Load workflow state if exists
    await this.loadState();
  }

  protected abstract getDefaultPath(): string;
  protected abstract getTemplatePrefix(): string;
  protected abstract validateInput(input: any): void;

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

  protected async generateDocumentNumber(): Promise<string> {
    if (!this.numberingSystem) {
      throw new Error('Numbering system not initialized');
    }
    
    const prefix = this.getTemplatePrefix();
    return await this.numberingSystem.getNextNumber(prefix);
  }

  protected generateFilename(number: string, title: string): string {
    if (!this.numberingSystem) {
      throw new Error('Numbering system not initialized');
    }
    
    const prefix = this.getTemplatePrefix();
    return this.numberingSystem.generateFilename(prefix, number, title);
  }

  protected async createDocument(
    templateName: string,
    data: Record<string, any>,
    filename?: string
  ): Promise<Document> {
    // Generate content from template
    const content = await this.templateEngine.render(templateName, data);
    
    // Determine file path
    const path = filename || this.generateFilename(data.number, data.title);
    const fullPath = join(this.getDefaultPath(), path);

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
    const searchPattern = pattern || join(this.getDefaultPath(), '*.md');
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

  abstract execute(action: string, params: any): Promise<any>;
}