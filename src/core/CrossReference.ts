import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Config } from './Config.js';
import { CrossReference } from '../types/index.js';

interface ReferenceRegistry {
  references: CrossReference[];
  lastUpdated: string;
}

export class CrossReferenceSystem {
  private static instance: CrossReferenceSystem;
  private registry: ReferenceRegistry;
  private registryPath: string;

  private constructor() {
    this.registry = {
      references: [],
      lastUpdated: new Date().toISOString(),
    };
    this.registryPath = join(Config.getWorkflowStateDirectory(), 'references.json');
  }

  static getInstance(): CrossReferenceSystem {
    if (!CrossReferenceSystem.instance) {
      CrossReferenceSystem.instance = new CrossReferenceSystem();
      // Load will be called separately if needed
    }
    return CrossReferenceSystem.instance;
  }

  static async getInstanceAsync(): Promise<CrossReferenceSystem> {
    if (!CrossReferenceSystem.instance) {
      CrossReferenceSystem.instance = new CrossReferenceSystem();
      await CrossReferenceSystem.instance.load();
    }
    return CrossReferenceSystem.instance;
  }

  private async load(): Promise<void> {
    await Config.ensureWorkflowStateDirectory();
    
    if (existsSync(this.registryPath)) {
      try {
        const content = await readFile(this.registryPath, 'utf-8');
        this.registry = JSON.parse(content);
      } catch (error) {
        console.error('Failed to load reference registry:', error);
        this.registry = {
          references: [],
          lastUpdated: new Date().toISOString(),
        };
      }
    } else {
      await this.save();
    }
  }

  private async save(): Promise<void> {
    this.registry.lastUpdated = new Date().toISOString();
    const content = JSON.stringify(this.registry, null, 2);
    await writeFile(this.registryPath, content, 'utf-8');
  }

  async addReference(reference: CrossReference): Promise<void> {
    // Check if reference already exists
    const existing = this.registry.references.findIndex(
      (ref) => ref.from === reference.from && 
               ref.to === reference.to && 
               ref.type === reference.type
    );

    if (existing === -1) {
      this.registry.references.push(reference);
      await this.save();
    } else {
      // Update existing reference
      this.registry.references[existing] = reference;
      await this.save();
    }
  }

  async addRelationship(from: string, to: string, type: 'references' | 'supersedes' | 'implements' | 'relates_to', description?: string): Promise<void> {
    const reference: CrossReference = {
      from,
      to,
      type,
      description
    };
    await this.addReference(reference);
  }

  async getRelationships(documentId: string): Promise<CrossReference[]> {
    return await this.getReferences(documentId, 'both');
  }

  async removeReference(from: string, to: string, type?: string): Promise<void> {
    this.registry.references = this.registry.references.filter(
      (ref) => !(ref.from === from && ref.to === to && (!type || ref.type === type))
    );
    await this.save();
  }

  async getReferences(documentPath: string, direction: 'from' | 'to' | 'both' = 'both'): Promise<CrossReference[]> {
    const references: CrossReference[] = [];

    if (direction === 'from' || direction === 'both') {
      references.push(...this.registry.references.filter((ref) => ref.from === documentPath));
    }

    if (direction === 'to' || direction === 'both') {
      references.push(...this.registry.references.filter((ref) => ref.to === documentPath));
    }

    return references;
  }

  async getReferencesOfType(type: CrossReference['type']): Promise<CrossReference[]> {
    return this.registry.references.filter((ref) => ref.type === type);
  }

  async findBidirectionalReferences(documentPath: string): Promise<{
    incoming: CrossReference[];
    outgoing: CrossReference[];
  }> {
    return {
      incoming: await this.getReferences(documentPath, 'to'),
      outgoing: await this.getReferences(documentPath, 'from'),
    };
  }

  async updateDocumentPath(oldPath: string, newPath: string): Promise<void> {
    let updated = false;

    this.registry.references = this.registry.references.map((ref) => {
      if (ref.from === oldPath) {
        updated = true;
        return { ...ref, from: newPath };
      }
      if (ref.to === oldPath) {
        updated = true;
        return { ...ref, to: newPath };
      }
      return ref;
    });

    if (updated) {
      await this.save();
    }
  }

  async validateReferences(): Promise<{
    valid: CrossReference[];
    broken: CrossReference[];
  }> {
    const { existsSync } = await import('fs');
    const valid: CrossReference[] = [];
    const broken: CrossReference[] = [];

    for (const ref of this.registry.references) {
      const fromExists = existsSync(ref.from);
      const toExists = existsSync(ref.to);

      if (fromExists && toExists) {
        valid.push(ref);
      } else {
        broken.push(ref);
      }
    }

    return { valid, broken };
  }

  async cleanBrokenReferences(): Promise<number> {
    const { broken } = await this.validateReferences();
    
    if (broken.length > 0) {
      this.registry.references = this.registry.references.filter(
        (ref) => !broken.includes(ref)
      );
      await this.save();
    }

    return broken.length;
  }

  async getRelatedDocuments(documentPath: string, maxDepth: number = 2): Promise<Set<string>> {
    const related = new Set<string>();
    const queue: Array<{ path: string; depth: number }> = [{ path: documentPath, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.path) || current.depth >= maxDepth) {
        continue;
      }

      visited.add(current.path);
      const references = await this.getReferences(current.path);

      for (const ref of references) {
        const nextPath = ref.from === current.path ? ref.to : ref.from;
        
        if (!visited.has(nextPath)) {
          related.add(nextPath);
          queue.push({ path: nextPath, depth: current.depth + 1 });
        }
      }
    }

    return related;
  }

  async createSupersedingChain(documentPath: string): Promise<string[]> {
    const chain: string[] = [documentPath];
    let current = documentPath;

    while (true) {
      const superseding = this.registry.references.find(
        (ref) => ref.from === current && ref.type === 'supersedes'
      );

      if (!superseding) {
        break;
      }

      if (chain.includes(superseding.to)) {
        console.warn('Circular superseding reference detected');
        break;
      }

      chain.push(superseding.to);
      current = superseding.to;
    }

    return chain;
  }

  async getAllReferences(): Promise<CrossReference[]> {
    return [...this.registry.references];
  }

  async clear(): Promise<void> {
    this.registry = {
      references: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.save();
  }

  async exportToMarkdown(): Promise<string> {
    const references = await this.getAllReferences();
    
    if (references.length === 0) {
      return '# Cross References\n\nNo references found.';
    }

    let markdown = '# Cross References\n\n';
    markdown += `Last Updated: ${this.registry.lastUpdated}\n\n`;
    markdown += '| From | To | Type | Description |\n';
    markdown += '| --- | --- | --- | --- |\n';

    for (const ref of references) {
      markdown += `| ${ref.from} | ${ref.to} | ${ref.type} | ${ref.description || '-'} |\n`;
    }

    return markdown;
  }
}