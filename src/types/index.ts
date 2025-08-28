export interface DocumentMetadata {
  title: string;
  number: string;
  date: string;
  author?: string;
  status?: string;
  tags?: string[];
  [key: string]: any;
}

export interface Document {
  path: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface ADRDocument extends Document {
  metadata: DocumentMetadata & {
    status: 'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded';
    deciders?: string[];
    supersededBy?: string;
  };
}

export interface SessionContext extends Document {
  metadata: DocumentMetadata & {
    sessionId: string;
    startTime: string;
    endTime?: string;
    gitBranch?: string;
    gitStatus?: string;
    modifiedFiles?: string[];
  };
}

export interface DesignDiscussion extends Document {
  metadata: DocumentMetadata & {
    options: string[];
    criteria: string[];
    decision?: string;
    rationale?: string;
  };
}

export interface PlanPhase {
  phase: string;
  title: string;
  tasks: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Plan extends Document {
  metadata: DocumentMetadata & {
    phases: PlanPhase[];
    currentPhase?: string;
    completedPhases?: string[];
  };
}

export interface RefactorSpec extends Document {
  metadata: DocumentMetadata & {
    targetFiles: string[];
    problems: string[];
    solutions: string[];
    impactedComponents?: string[];
  };
}

export interface WorkflowConfig {
  paths: {
    adrs: string;
    sessions: string;
    discussions: string;
    standards: string;
    work: string;
  };
  defaults: {
    author?: string;
    deciders?: string[];
  };
  templates: {
    [key: string]: string;
  };
}

export interface WorkflowState {
  currentWorkflow?: string;
  currentDocument?: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

export interface CrossReference {
  from: string;
  to: string;
  type: 'references' | 'supersedes' | 'implements' | 'relates_to';
  description?: string;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  untracked: string[];
  staged: string[];
}

export interface TemplateData {
  [key: string]: any;
}

export type WorkflowType = 'adr' | 'session' | 'planning' | 'design' | 'standards' | 'refactoring';

export interface WorkflowTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface WorkflowResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}