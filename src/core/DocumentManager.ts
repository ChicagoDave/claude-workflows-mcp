import { readFile, writeFile, mkdir, readdir, unlink, rename, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import matter from 'gray-matter';
import { glob } from 'glob';
import { Document, DocumentMetadata } from '../types/index.js';

export class DocumentManager {
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  private getFullPath(relativePath: string): string {
    return join(this.basePath, relativePath);
  }

  async read(path: string): Promise<Document> {
    const fullPath = this.getFullPath(path);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Document not found: ${path}`);
    }

    const content = await readFile(fullPath, 'utf-8');
    const parsed = matter(content);
    
    return {
      path,
      content: parsed.content,
      metadata: parsed.data as DocumentMetadata,
    };
  }

  async write(path: string, document: Document): Promise<void> {
    const fullPath = this.getFullPath(path);
    const dir = dirname(fullPath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Create backup if file exists
    if (existsSync(fullPath)) {
      await this.createBackup(path);
    }

    // Serialize document with frontmatter
    const content = matter.stringify(document.content, document.metadata);
    await writeFile(fullPath, content, 'utf-8');
  }

  async createBackup(path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${fullPath}.backup.${timestamp}`;
    
    await rename(fullPath, backupPath);
    return backupPath;
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Document not found: ${path}`);
    }

    await unlink(fullPath);
  }

  async list(pattern: string): Promise<string[]> {
    const fullPattern = this.getFullPath(pattern);
    const files = await glob(fullPattern, {
      nodir: true,
      ignore: ['**/*.backup.*'],
    });

    return files.map((file) => file.replace(this.basePath + '/', ''));
  }

  async listDocuments(pattern: string): Promise<Document[]> {
    const files = await this.list(pattern);
    const documents: Document[] = [];

    for (const file of files) {
      try {
        const doc = await this.read(file);
        documents.push(doc);
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }

    return documents;
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    return existsSync(fullPath);
  }

  async ensureDirectory(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    if (!existsSync(fullPath)) {
      await mkdir(fullPath, { recursive: true });
    }
  }

  async getMetadata(path: string): Promise<DocumentMetadata> {
    const document = await this.read(path);
    return document.metadata;
  }

  async updateMetadata(path: string, metadata: Partial<DocumentMetadata>): Promise<void> {
    const document = await this.read(path);
    document.metadata = { ...document.metadata, ...metadata };
    await this.write(path, document);
  }

  async search(pattern: string, query: string): Promise<Document[]> {
    const documents = await this.listDocuments(pattern);
    const searchRegex = new RegExp(query, 'i');

    return documents.filter((doc) => {
      const contentMatch = searchRegex.test(doc.content);
      const titleMatch = doc.metadata.title && searchRegex.test(doc.metadata.title);
      const tagsMatch = doc.metadata.tags && 
        doc.metadata.tags.some((tag) => searchRegex.test(tag));
      
      return contentMatch || titleMatch || tagsMatch;
    });
  }

  async getRecentDocuments(pattern: string, limit: number = 10): Promise<Document[]> {
    const files = await this.list(pattern);
    const documentsWithStats: Array<{ doc: Document; mtime: Date }> = [];

    for (const file of files) {
      try {
        const fullPath = this.getFullPath(file);
        const stats = await stat(fullPath);
        const doc = await this.read(file);
        documentsWithStats.push({ doc, mtime: stats.mtime });
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    // Sort by modification time (most recent first)
    documentsWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return documentsWithStats.slice(0, limit).map((item) => item.doc);
  }

  async createFromTemplate(
    templatePath: string,
    outputPath: string,
    data: Record<string, any>
  ): Promise<Document> {
    const template = await this.read(templatePath);
    
    // Simple template interpolation
    let content = template.content;
    let metadata = { ...template.metadata, ...data };
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value));
    }

    const document: Document = {
      path: outputPath,
      content,
      metadata,
    };

    await this.write(outputPath, document);
    return document;
  }

  async listDirectories(path: string): Promise<string[]> {
    const fullPath = this.getFullPath(path);
    
    if (!existsSync(fullPath)) {
      return [];
    }

    const entries = await readdir(fullPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(path, entry.name));
  }
}