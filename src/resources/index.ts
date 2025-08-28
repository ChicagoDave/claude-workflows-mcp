import { WorkflowResource } from '../types/index.js';

export async function setupResources(): Promise<WorkflowResource[]> {
  return [
    {
      uri: 'workflow://adrs',
      name: 'Architecture Decision Records',
      description: 'All ADRs in the project',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://sessions',
      name: 'Session Contexts',
      description: 'Saved session contexts',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://plans',
      name: 'Implementation Plans',
      description: 'Project implementation plans',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://discussions',
      name: 'Design Discussions',
      description: 'Design discussion documents',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://standards',
      name: 'Project Standards',
      description: 'Project standards and conventions',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://refactorings',
      name: 'Refactoring Specifications',
      description: 'Refactoring specifications and plans',
      mimeType: 'text/markdown',
    },
    {
      uri: 'workflow://templates',
      name: 'Workflow Templates',
      description: 'Available workflow templates',
      mimeType: 'text/markdown',
    },
  ];
}