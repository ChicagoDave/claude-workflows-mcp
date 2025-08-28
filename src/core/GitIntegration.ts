import { simpleGit, SimpleGit } from 'simple-git';
import { GitStatus } from '../types/index.js';

export class GitIntegration {
  private git: SimpleGit;
  private isGitRepo: boolean = false;

  constructor(basePath: string = process.cwd()) {
    this.git = simpleGit(basePath);
  }

  async initialize(): Promise<void> {
    try {
      await this.git.status();
      this.isGitRepo = true;
    } catch (error) {
      console.warn('Not a git repository, git features will be limited');
      this.isGitRepo = false;
    }
  }

  async getStatus(): Promise<GitStatus | null> {
    if (!this.isGitRepo) {
      return null;
    }

    try {
      const status = await this.git.status();
      const branch = await this.git.branch();
      
      return {
        branch: branch.current,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        untracked: status.not_added,
        staged: status.staged,
      };
    } catch (error) {
      console.error('Failed to get git status:', error);
      return null;
    }
  }

  async getCurrentBranch(): Promise<string | null> {
    if (!this.isGitRepo) {
      return null;
    }

    try {
      const branch = await this.git.branch();
      return branch.current;
    } catch (error) {
      console.error('Failed to get current branch:', error);
      return null;
    }
  }

  async getRecentCommits(limit: number = 10): Promise<string[]> {
    if (!this.isGitRepo) {
      return [];
    }

    try {
      const log = await this.git.log({ maxCount: limit });
      return log.all.map((commit) => {
        const date = new Date(commit.date).toISOString().split('T')[0];
        return `${commit.hash.substring(0, 7)} - ${date} - ${commit.message}`;
      });
    } catch (error) {
      console.error('Failed to get commit history:', error);
      return [];
    }
  }

  async getModifiedFiles(): Promise<string[]> {
    if (!this.isGitRepo) {
      return [];
    }

    try {
      const status = await this.git.status();
      return [...status.modified, ...status.not_added];
    } catch (error) {
      console.error('Failed to get modified files:', error);
      return [];
    }
  }

  async getStagedFiles(): Promise<string[]> {
    if (!this.isGitRepo) {
      return [];
    }

    try {
      const status = await this.git.status();
      return status.staged;
    } catch (error) {
      console.error('Failed to get staged files:', error);
      return [];
    }
  }

  async getDiff(file?: string): Promise<string> {
    if (!this.isGitRepo) {
      return '';
    }

    try {
      if (file) {
        return await this.git.diff([file]);
      }
      return await this.git.diff();
    } catch (error) {
      console.error('Failed to get diff:', error);
      return '';
    }
  }

  async getFilesChangedSince(date: Date): Promise<string[]> {
    if (!this.isGitRepo) {
      return [];
    }

    try {
      const since = date.toISOString();
      const log = await this.git.log({ since });
      const files = new Set<string>();

      for (const commit of log.all) {
        const diff = await this.git.diff([`${commit.hash}^`, commit.hash, '--name-only']);
        diff.split('\n').filter(Boolean).forEach((file) => files.add(file));
      }

      return Array.from(files);
    } catch (error) {
      console.error('Failed to get changed files:', error);
      return [];
    }
  }

  async getLastCommitMessage(): Promise<string | null> {
    if (!this.isGitRepo) {
      return null;
    }

    try {
      const log = await this.git.log({ maxCount: 1 });
      return log.latest ? log.latest.message : null;
    } catch (error) {
      console.error('Failed to get last commit message:', error);
      return null;
    }
  }

  async getRemoteUrl(remoteName: string = 'origin'): Promise<string | null> {
    if (!this.isGitRepo) {
      return null;
    }

    try {
      const remotes = await this.git.getRemotes(true);
      const remote = remotes.find((r) => r.name === remoteName);
      return remote ? remote.refs.fetch : null;
    } catch (error) {
      console.error('Failed to get remote URL:', error);
      return null;
    }
  }

  async isClean(): Promise<boolean> {
    if (!this.isGitRepo) {
      return true;
    }

    try {
      const status = await this.git.status();
      return status.isClean();
    } catch (error) {
      console.error('Failed to check if repository is clean:', error);
      return false;
    }
  }

  async getFileHistory(filePath: string, limit: number = 10): Promise<string[]> {
    if (!this.isGitRepo) {
      return [];
    }

    try {
      const log = await this.git.log({
        file: filePath,
        maxCount: limit,
      });

      return log.all.map((commit) => {
        const date = new Date(commit.date).toISOString().split('T')[0];
        return `${commit.hash.substring(0, 7)} - ${date} - ${commit.message}`;
      });
    } catch (error) {
      console.error(`Failed to get history for ${filePath}:`, error);
      return [];
    }
  }

  async createSnapshot(): Promise<{
    branch: string | null;
    status: GitStatus | null;
    recentCommits: string[];
    lastCommitMessage: string | null;
  }> {
    return {
      branch: await this.getCurrentBranch(),
      status: await this.getStatus(),
      recentCommits: await this.getRecentCommits(5),
      lastCommitMessage: await this.getLastCommitMessage(),
    };
  }

  isAvailable(): boolean {
    return this.isGitRepo;
  }
}