import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { TemplateData } from '../types/index.js';

export class TemplateEngine {
  private static instance: TemplateEngine;
  private handlebars: typeof Handlebars;
  private templateCache: Map<string, HandlebarsTemplateDelegate>;
  private templatesPath: string;

  private constructor() {
    this.handlebars = Handlebars.create();
    this.templateCache = new Map();
    this.templatesPath = join(process.cwd(), 'src', 'templates');
    this.registerHelpers();
  }

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  private registerHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    });

    // Date time formatting helper
    this.handlebars.registerHelper('formatDateTime', (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().replace('T', ' ').split('.')[0];
    });

    // Join array helper
    this.handlebars.registerHelper('join', (array: any[], separator: string) => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Conditional equality helper
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Harvey Ball rating helper
    this.handlebars.registerHelper('harveyBall', (score: number) => {
      if (score >= 0.875) return '⬤';  // Full
      if (score >= 0.625) return '◕';  // Three quarters
      if (score >= 0.375) return '◑';  // Half
      if (score >= 0.125) return '◔';  // Quarter
      return '○';                      // Empty
    });

    // Markdown list helper
    this.handlebars.registerHelper('mdList', (items: string[], indent: number = 0) => {
      const prefix = ' '.repeat(indent);
      return items.map((item) => `${prefix}- ${item}`).join('\n');
    });

    // Markdown numbered list helper
    this.handlebars.registerHelper('mdNumberedList', (items: string[], indent: number = 0) => {
      const prefix = ' '.repeat(indent);
      return items.map((item, i) => `${prefix}${i + 1}. ${item}`).join('\n');
    });

    // Kebab case helper
    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    });

    // Title case helper
    this.handlebars.registerHelper('titleCase', (str: string) => {
      return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    });

    // JSON stringify helper
    this.handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // Table helper for markdown
    this.handlebars.registerHelper('mdTable', (headers: string[], rows: any[][]) => {
      const headerRow = `| ${headers.join(' | ')} |`;
      const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
      const dataRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
      return `${headerRow}\n${separatorRow}\n${dataRows}`;
    });
  }

  async loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name)!;
    }

    // Try to load from templates directory
    const templatePath = join(this.templatesPath, `${name}.hbs`);
    
    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${name}`);
    }

    const templateContent = await readFile(templatePath, 'utf-8');
    const compiled = this.handlebars.compile(templateContent);
    
    // Cache the compiled template
    this.templateCache.set(name, compiled);
    
    return compiled;
  }

  async render(templateName: string, data: TemplateData): Promise<string> {
    const template = await this.loadTemplate(templateName);
    
    // Add common data
    const enrichedData = {
      ...data,
      currentDate: new Date().toISOString().split('T')[0],
      currentDateTime: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    return template(enrichedData);
  }

  renderString(template: string, data: TemplateData): string {
    const compiled = this.handlebars.compile(template);
    return compiled(data);
  }

  async loadAndRenderPartial(name: string, data: TemplateData): Promise<string> {
    const partialPath = join(this.templatesPath, 'partials', `${name}.hbs`);
    
    if (!existsSync(partialPath)) {
      return '';
    }

    const partialContent = await readFile(partialPath, 'utf-8');
    return this.renderString(partialContent, data);
  }

  registerPartial(name: string, content: string): void {
    this.handlebars.registerPartial(name, content);
  }

  clearCache(): void {
    this.templateCache.clear();
  }

  // Simple string interpolation for basic templates
  interpolate(template: string, data: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    
    return result;
  }
}