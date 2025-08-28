import { WorkflowTool } from '../types/index.js';

export async function setupTools(): Promise<WorkflowTool[]> {
  return [
    // ADR Tools
    {
      name: 'adr_create',
      description: 'Create a new Architecture Decision Record',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the ADR' },
          status: { type: 'string', enum: ['proposed', 'accepted', 'rejected', 'deprecated'], default: 'proposed' },
          context: { type: 'string', description: 'Context and problem statement' },
          decision: { type: 'string', description: 'Decision made' },
          consequences: { type: 'string', description: 'Consequences of the decision' },
          deciders: { type: 'array', items: { type: 'string' }, description: 'List of decision makers' },
        },
        required: ['title', 'context', 'decision', 'consequences'],
      },
    },
    {
      name: 'adr_list',
      description: 'List all Architecture Decision Records',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status' },
        },
      },
    },
    {
      name: 'adr_update_status',
      description: 'Update the status of an ADR',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', description: 'ADR number' },
          status: { type: 'string', enum: ['proposed', 'accepted', 'rejected', 'deprecated', 'superseded'] },
          supersededBy: { type: 'string', description: 'ADR number that supersedes this one' },
        },
        required: ['number', 'status'],
      },
    },

    // Session Context Tools
    {
      name: 'session_save',
      description: 'Save the current session context',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Summary of work completed' },
          nextSteps: { type: 'array', items: { type: 'string' }, description: 'Next steps to take' },
          questions: { type: 'array', items: { type: 'string' }, description: 'Open questions' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['summary'],
      },
    },
    {
      name: 'session_restore',
      description: 'Restore a previous session context',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID or date (YYYYMMDD-HHMM)' },
        },
      },
    },

    // Planning Mode Tools
    {
      name: 'plan_create',
      description: 'Create a new implementation plan',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Plan title' },
          description: { type: 'string', description: 'Plan description' },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase: { type: 'string' },
                title: { type: 'string' },
                tasks: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        required: ['title', 'phases'],
      },
    },
    {
      name: 'plan_generate_checklist',
      description: 'Generate a checklist for a plan phase',
      inputSchema: {
        type: 'object',
        properties: {
          planId: { type: 'string', description: 'Plan ID or title' },
          phase: { type: 'string', description: 'Phase number or title' },
        },
        required: ['planId', 'phase'],
      },
    },

    // Design Discussion Tools
    {
      name: 'design_discussion_create',
      description: 'Create a design discussion document',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Discussion title' },
          options: { type: 'array', items: { type: 'string' }, description: 'Design options to compare' },
          criteria: { type: 'array', items: { type: 'string' }, description: 'Evaluation criteria' },
          weights: { type: 'array', items: { type: 'number' }, description: 'Weights for each criterion' },
        },
        required: ['title', 'options', 'criteria'],
      },
    },

    // Standards Tools
    {
      name: 'standards_init',
      description: 'Initialize project standards',
      inputSchema: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Project name' },
          language: { type: 'string', description: 'Primary programming language' },
          frameworks: { type: 'array', items: { type: 'string' }, description: 'Frameworks in use' },
          testingStrategy: { type: 'string', description: 'Testing approach' },
        },
        required: ['project'],
      },
    },

    // Refactoring Tools
    {
      name: 'refactor_analyze',
      description: 'Analyze code for refactoring opportunities',
      inputSchema: {
        type: 'object',
        properties: {
          targetFiles: { type: 'array', items: { type: 'string' }, description: 'Files to analyze' },
          problems: { type: 'array', items: { type: 'string' }, description: 'Identified problems' },
        },
        required: ['targetFiles'],
      },
    },
    {
      name: 'refactor_spec_create',
      description: 'Create a refactoring specification',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Refactoring title' },
          targetFiles: { type: 'array', items: { type: 'string' }, description: 'Files to refactor' },
          problems: { type: 'array', items: { type: 'string' }, description: 'Problems to solve' },
          solutions: { type: 'array', items: { type: 'string' }, description: 'Proposed solutions' },
        },
        required: ['title', 'targetFiles', 'problems', 'solutions'],
      },
    },

    // Navigation Tool
    {
      name: 'workflow_suggest',
      description: 'Suggest appropriate workflow for current task',
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Current task or situation' },
        },
        required: ['context'],
      },
    },
  ];
}