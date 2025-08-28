import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { WorkflowConfig } from '../types/index.js';

export class Config {
  private static instance: Config;
  private config: WorkflowConfig;

  private constructor(config: WorkflowConfig) {
    this.config = config;
  }

  static getDefault(): Config {
    const defaultConfig: WorkflowConfig = {
      paths: {
        adrs: 'docs/architecture/adrs',
        sessions: 'docs/context',
        discussions: 'docs/discussions',
        standards: 'docs/standards',
        work: 'docs/work',
      },
      defaults: {
        author: process.env.USER || 'Unknown',
        deciders: [],
      },
      templates: {},
    };

    return new Config(defaultConfig);
  }

  static async load(configPath: string = '.workflow-config.json'): Promise<Config> {
    if (Config.instance) {
      return Config.instance;
    }

    try {
      const configFile = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configFile) as WorkflowConfig;
      
      // Merge with defaults for any missing values
      const defaultConfig = Config.getDefault().getConfig();
      const mergedConfig: WorkflowConfig = {
        paths: { ...defaultConfig.paths, ...config.paths },
        defaults: { ...defaultConfig.defaults, ...config.defaults },
        templates: { ...defaultConfig.templates, ...config.templates },
      };

      Config.instance = new Config(mergedConfig);
      return Config.instance;
    } catch (error) {
      // If config file doesn't exist, create it with defaults
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const defaultInstance = Config.getDefault();
        await defaultInstance.save(configPath);
        Config.instance = defaultInstance;
        return defaultInstance;
      }
      throw error;
    }
  }

  async save(configPath: string = '.workflow-config.json'): Promise<void> {
    const configContent = JSON.stringify(this.config, null, 2);
    await writeFile(configPath, configContent, 'utf-8');
  }

  getConfig(): WorkflowConfig {
    return { ...this.config };
  }

  getPath(type: keyof WorkflowConfig['paths']): string {
    return this.config.paths[type];
  }

  getFullPath(type: keyof WorkflowConfig['paths'], filename?: string): string {
    const basePath = this.getPath(type);
    return filename ? join(basePath, filename) : basePath;
  }

  async ensurePaths(): Promise<void> {
    for (const path of Object.values(this.config.paths)) {
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true });
      }
    }
  }

  getDefault(key: keyof WorkflowConfig['defaults']): any {
    return this.config.defaults[key];
  }

  setDefault(key: keyof WorkflowConfig['defaults'], value: any): void {
    this.config.defaults[key] = value;
  }

  getTemplate(name: string): string | undefined {
    return this.config.templates[name];
  }

  setTemplate(name: string, path: string): void {
    this.config.templates[name] = path;
  }

  // Environment-specific helpers
  static getWorkingDirectory(): string {
    return process.cwd();
  }

  static getWorkflowStateDirectory(): string {
    return join(Config.getWorkingDirectory(), '.workflow');
  }

  static async ensureWorkflowStateDirectory(): Promise<void> {
    const stateDir = Config.getWorkflowStateDirectory();
    if (!existsSync(stateDir)) {
      await mkdir(stateDir, { recursive: true });
    }
  }
}