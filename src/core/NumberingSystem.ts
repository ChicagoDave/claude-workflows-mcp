import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Config } from './Config.js';

interface NumberRegistry {
  [key: string]: number;
}

export class NumberingSystem {
  private static instance: NumberingSystem;
  private registry: NumberRegistry;
  private registryPath: string;
  private locked: Set<string> = new Set();

  private constructor() {
    this.registry = {};
    this.registryPath = join(Config.getWorkflowStateDirectory(), 'numbering.json');
  }

  static async getInstance(): Promise<NumberingSystem> {
    if (!NumberingSystem.instance) {
      NumberingSystem.instance = new NumberingSystem();
      await NumberingSystem.instance.load();
    }
    return NumberingSystem.instance;
  }

  private async load(): Promise<void> {
    await Config.ensureWorkflowStateDirectory();
    
    if (existsSync(this.registryPath)) {
      try {
        const content = await readFile(this.registryPath, 'utf-8');
        this.registry = JSON.parse(content);
      } catch (error) {
        console.error('Failed to load numbering registry:', error);
        this.registry = {};
      }
    } else {
      this.registry = {};
      await this.save();
    }
  }

  private async save(): Promise<void> {
    const content = JSON.stringify(this.registry, null, 2);
    await writeFile(this.registryPath, content, 'utf-8');
  }

  async getNextNumber(prefix: string): Promise<string> {
    // Wait if this prefix is currently locked
    while (this.locked.has(prefix)) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.locked.add(prefix);
    
    try {
      const currentNumber = this.registry[prefix] || 0;
      const nextNumber = currentNumber + 1;
      
      this.registry[prefix] = nextNumber;
      await this.save();
      
      return this.formatNumber(nextNumber);
    } finally {
      this.locked.delete(prefix);
    }
  }

  async reserveNumber(prefix: string, number: number): Promise<void> {
    // Wait if this prefix is currently locked
    while (this.locked.has(prefix)) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.locked.add(prefix);
    
    try {
      const currentNumber = this.registry[prefix] || 0;
      
      if (number > currentNumber) {
        this.registry[prefix] = number;
        await this.save();
      }
    } finally {
      this.locked.delete(prefix);
    }
  }

  formatNumber(number: number, digits: number = 3): string {
    return String(number).padStart(digits, '0');
  }

  parseNumber(filename: string): number | null {
    const match = filename.match(/(\d{3,})/);
    return match ? parseInt(match[1], 10) : null;
  }

  async getCurrentNumber(prefix: string): Promise<number> {
    return this.registry[prefix] || 0;
  }

  async scanAndUpdate(prefix: string, files: string[]): Promise<void> {
    let maxNumber = 0;
    
    for (const file of files) {
      const number = this.parseNumber(file);
      if (number && number > maxNumber) {
        maxNumber = number;
      }
    }

    if (maxNumber > 0) {
      await this.reserveNumber(prefix, maxNumber);
    }
  }

  generateFilename(prefix: string, number: string, title: string, extension: string = '.md'): string {
    // Convert title to kebab-case
    const kebabTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${prefix}-${number}-${kebabTitle}${extension}`;
  }

  extractComponents(filename: string): { prefix: string; number: string; title: string } | null {
    const match = filename.match(/^([a-z]+)-(\d{3,})-(.+)\.\w+$/);
    
    if (!match) {
      return null;
    }

    return {
      prefix: match[1],
      number: match[2],
      title: match[3].replace(/-/g, ' '),
    };
  }

  async reset(prefix?: string): Promise<void> {
    if (prefix) {
      delete this.registry[prefix];
    } else {
      this.registry = {};
    }
    await this.save();
  }

  async getRegistry(): Promise<NumberRegistry> {
    return { ...this.registry };
  }
}