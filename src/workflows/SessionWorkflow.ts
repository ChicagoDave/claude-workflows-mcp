import { BaseWorkflow } from './BaseWorkflow.js';
import { WorkflowResult } from '../types/index.js';
import { GitIntegration } from '../core/GitIntegration.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface SessionSaveOptions {
  summary?: string;
  workCompleted?: string[];
  decisions?: string[];
  nextSteps?: string[];
  questions?: string[];
  notes?: string;
  metrics?: {
    duration?: string;
    filesCreated?: number;
    filesModified?: number;
    linesAdded?: number;
    linesRemoved?: number;
    commitsCount?: number;
  };
}

export interface SessionRestoreOptions {
  id?: string;
  date?: string;
  latest?: boolean;
}

export class SessionWorkflow extends BaseWorkflow {
  private git: GitIntegration;

  constructor() {
    super('session', 'session-context.hbs');
    this.git = new GitIntegration();
  }

  async save(options: SessionSaveOptions = {}): Promise<WorkflowResult> {
    try {
      // Generate session ID
      const timestamp = new Date();
      const sessionId = timestamp.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '-')
        .slice(0, -5); // Remove milliseconds and Z

      // Generate filename
      const filename = `end-session-${timestamp.toISOString().split('T')[0].replace(/-/g, '')}-${timestamp.toTimeString().slice(0, 5).replace(':', '')}.md`;
      const filePath = path.join(this.getDocumentPath('context'), filename);

      // Capture git state
      const gitState = await this.git.captureState();

      // Get modified files
      const modifiedFiles = await this.getModifiedFiles(gitState);

      // Prepare template data
      const templateData = {
        sessionId,
        date: timestamp.toISOString().split('T')[0],
        time: timestamp.toTimeString().slice(0, 5),
        summary: options.summary || '',
        workCompleted: options.workCompleted || [],
        decisions: options.decisions || [],
        nextSteps: options.nextSteps || [],
        questions: options.questions || [],
        notes: options.notes || '',
        modifiedFiles,
        gitStatus: {
          branch: gitState.branch,
          status: gitState.status,
          commits: gitState.recentCommits?.slice(0, 5) || []
        },
        metrics: {
          duration: options.metrics?.duration || 'N/A',
          filesCreated: options.metrics?.filesCreated || modifiedFiles.created.length,
          filesModified: options.metrics?.filesModified || modifiedFiles.modified.length,
          linesAdded: options.metrics?.linesAdded || 0,
          linesRemoved: options.metrics?.linesRemoved || 0,
          commitsCount: options.metrics?.commitsCount || 0,
          buildStatus: 'Unknown'
        },
        currentState: {
          branch: gitState.branch,
          cleanWorkingTree: gitState.status?.includes('nothing to commit'),
          lastCommit: gitState.recentCommits?.[0]?.hash || 'N/A'
        }
      };

      // Render template
      const content = await this.templateEngine.render('session-context.hbs', templateData);

      // Save document
      await this.documentManager.create(filePath, content);

      // Save session index entry
      await this.updateSessionIndex(sessionId, filePath, timestamp, options.summary);

      return {
        success: true,
        message: `Session context saved: ${sessionId}`,
        data: {
          sessionId,
          path: filePath,
          filename
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save session: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async restore(options: SessionRestoreOptions = {}): Promise<WorkflowResult> {
    try {
      let sessionPath: string | null = null;

      if (options.latest) {
        sessionPath = await this.getLatestSession();
      } else if (options.id) {
        sessionPath = await this.findSessionById(options.id);
      } else if (options.date) {
        sessionPath = await this.findSessionByDate(options.date);
      } else {
        // Default to latest
        sessionPath = await this.getLatestSession();
      }

      if (!sessionPath) {
        return {
          success: false,
          error: 'No session found matching criteria'
        };
      }

      const session = await this.documentManager.read(sessionPath);

      return {
        success: true,
        message: 'Session restored successfully',
        data: {
          sessionId: session.frontmatter?.sessionId,
          path: sessionPath,
          content: session.content,
          frontmatter: session.frontmatter
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to restore session: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async list(limit: number = 10): Promise<WorkflowResult> {
    try {
      const contextPath = this.getDocumentPath('context');
      const documents = await this.documentManager.list(contextPath);

      // Filter for session documents
      const sessions = documents
        .filter(doc => doc.path.includes('end-session-'))
        .map(doc => ({
          sessionId: doc.frontmatter?.sessionId || 'unknown',
          date: doc.frontmatter?.date || '',
          time: doc.frontmatter?.time || '',
          summary: doc.frontmatter?.summary || 'No summary',
          path: doc.path
        }))
        .sort((a, b) => {
          // Sort by date and time descending
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      return {
        success: true,
        data: sessions
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async getCurrentContext(): Promise<WorkflowResult> {
    try {
      const gitState = await this.git.captureState();
      const modifiedFiles = await this.getModifiedFiles(gitState);

      const context = {
        branch: gitState.branch,
        isDirty: !gitState.status?.includes('nothing to commit'),
        modifiedFiles,
        recentCommits: gitState.recentCommits?.slice(0, 3) || [],
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: context
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get current context: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async getModifiedFiles(gitState: any): Promise<any> {
    const files = {
      created: [] as string[],
      modified: [] as string[],
      deleted: [] as string[]
    };

    if (gitState.status) {
      const lines = gitState.status.split('\n');
      for (const line of lines) {
        if (line.startsWith('??')) {
          files.created.push(line.substring(3));
        } else if (line.startsWith(' M') || line.startsWith('M ')) {
          files.modified.push(line.substring(3));
        } else if (line.startsWith(' D') || line.startsWith('D ')) {
          files.deleted.push(line.substring(3));
        }
      }
    }

    return files;
  }

  private async updateSessionIndex(
    sessionId: string,
    filePath: string,
    timestamp: Date,
    summary?: string
  ): Promise<void> {
    const indexPath = path.join(this.getDocumentPath('context'), '.session-index.json');
    
    let index: any[] = [];
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(content);
    } catch {
      // Index doesn't exist yet
    }

    index.push({
      sessionId,
      path: filePath,
      timestamp: timestamp.toISOString(),
      summary: summary || 'No summary'
    });

    // Keep only last 100 sessions
    if (index.length > 100) {
      index = index.slice(-100);
    }

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  private async getLatestSession(): Promise<string | null> {
    const contextPath = this.getDocumentPath('context');
    const documents = await this.documentManager.list(contextPath);

    const sessions = documents
      .filter(doc => doc.path.includes('end-session-'))
      .sort((a, b) => {
        const dateA = new Date(a.frontmatter?.date || 0);
        const dateB = new Date(b.frontmatter?.date || 0);
        return dateB.getTime() - dateA.getTime();
      });

    return sessions.length > 0 ? sessions[0].path : null;
  }

  private async findSessionById(sessionId: string): Promise<string | null> {
    const contextPath = this.getDocumentPath('context');
    const documents = await this.documentManager.list(contextPath);

    for (const doc of documents) {
      if (doc.frontmatter?.sessionId === sessionId) {
        return doc.path;
      }
    }

    return null;
  }

  private async findSessionByDate(date: string): Promise<string | null> {
    const contextPath = this.getDocumentPath('context');
    const documents = await this.documentManager.list(contextPath);

    const sessions = documents
      .filter(doc => doc.frontmatter?.date === date)
      .sort((a, b) => {
        const timeA = a.frontmatter?.time || '00:00';
        const timeB = b.frontmatter?.time || '00:00';
        return timeB.localeCompare(timeA);
      });

    return sessions.length > 0 ? sessions[0].path : null;
  }
}