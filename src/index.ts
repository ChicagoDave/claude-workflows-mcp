#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Config } from './core/Config.js';
import { setupTools } from './tools/index.js';
import { setupResources } from './resources/index.js';
import { ADRWorkflow } from './workflows/ADRWorkflow.js';
import { SessionWorkflow } from './workflows/SessionWorkflow.js';
import { DesignWorkflow } from './workflows/DesignWorkflow.js';
import { PlanWorkflow } from './workflows/PlanWorkflow.js';
import { ChecklistWorkflow } from './workflows/ChecklistWorkflow.js';
import { RefactorWorkflow } from './workflows/RefactorWorkflow.js';

const server = new Server(
  {
    name: 'claude-workflows-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: await setupTools(),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const tools = await setupTools();
    const tool = tools.find((t) => t.name === name);
    
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Tool execution will be implemented in the tools module
    const result = await executeToolFunction(name, args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: await setupResources(),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    // Resource reading will be implemented in the resources module
    const content = await readResourceContent(uri);
    
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: content,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read resource ${uri}: ${errorMessage}`);
  }
});

// Initialize workflow instances
const workflows = {
  adr: new ADRWorkflow(),
  session: new SessionWorkflow(),
  design: new DesignWorkflow(),
  plan: new PlanWorkflow(),
  checklist: new ChecklistWorkflow(),
  refactor: new RefactorWorkflow(),
};

async function executeToolFunction(name: string, args: any): Promise<any> {
  console.error(`Executing tool: ${name}`);
  
  try {
    switch (name) {
      // ADR Tools
      case 'adr_create':
        return await workflows.adr.create(args);
      case 'adr_list':
        return await workflows.adr.list(args);
      case 'adr_update_status':
        return await workflows.adr.updateStatus(args.filePath || args.number, args.status);
      case 'get_adr_relationships':
        return await workflows.adr.getRelated(args.adrId);

      // Session Tools
      case 'session_save':
        return await workflows.session.save(args);
      case 'session_restore':
        return await workflows.session.restore(args);
      case 'list_sessions':
        return await workflows.session.list(args.limit || 10);
      case 'get_current_context':
        return await workflows.session.getCurrentContext();

      // Design Tools
      case 'design_discussion_create':
        return await workflows.design.create(args);
      case 'evaluate_design_option':
        return await workflows.design.evaluate(args);
      case 'compare_design_options':
        return await workflows.design.compare(args.filePath);
      case 'finalize_design_decision':
        return await workflows.design.finalize(args.filePath, args.decision, args.rationale);

      // Plan Tools
      case 'plan_create':
        return await workflows.plan.create(args);
      case 'plan_generate_checklist':
        return await workflows.plan.generateChecklist(args.planId, args.phase);
      case 'update_plan_phase':
        return await workflows.plan.updatePhase(args);
      case 'get_plan_progress':
        return await workflows.plan.getProgress(args.filePath);
      case 'update_milestone':
        return await workflows.plan.updateMilestone(args.filePath, args.milestoneName, args.status);

      // Checklist Tools
      case 'create_checklist':
        return await workflows.checklist.create(args);
      case 'update_checklist_item':
        return await workflows.checklist.updateItem(args);
      case 'bulk_update_checklist':
        return await workflows.checklist.bulkUpdate(args);
      case 'get_checklist_progress':
        return await workflows.checklist.getProgress(args.filePath);
      case 'generate_checklist_report':
        return await workflows.checklist.generateReport(args.filePath);

      // Refactor Tools
      case 'refactor_spec_create':
        return await workflows.refactor.create(args);
      case 'refactor_analyze':
        // This is simplified analysis for now
        return { 
          success: true, 
          data: { 
            targetFiles: args.targetFiles,
            message: 'Analysis complete'
          }
        };
      case 'update_refactor_status':
        return await workflows.refactor.updateStatus(args.filePath, args.status);
      case 'update_refactor_progress':
        return await workflows.refactor.updateProgress(args);
      case 'analyze_refactor_impact':
        return await workflows.refactor.analyzeImpact(args.filePath);
      case 'validate_refactor_completion':
        return await workflows.refactor.validateCompletion(args.filePath);
      case 'generate_refactor_checklist':
        return await workflows.refactor.generateChecklist(args.filePath);
        
      // Other tools
      case 'standards_init':
        // Placeholder for standards initialization
        return { 
          success: true, 
          message: 'Standards initialized',
          data: args
        };
        
      case 'workflow_suggest':
        // Simple workflow suggestion
        return {
          success: true,
          data: {
            suggestion: 'Based on your context, consider using ADR workflow for architectural decisions',
            workflows: ['adr', 'design', 'plan']
          }
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function readResourceContent(uri: string): Promise<string> {
  console.error(`Reading resource: ${uri}`);
  
  // Parse the URI to determine resource type
  const match = uri.match(/^workflow:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const [, type, path] = match;
  
  // TODO: Implement actual resource reading
  // This will read documents from the filesystem based on type and path
  return `Resource content for ${type}/${path}`;
}

async function main() {
  console.error('Starting claude-workflows-mcp server...');
  
  try {
    await Config.load();
    console.error('Configuration loaded successfully');
  } catch (error) {
    console.error('Warning: Could not load configuration, using defaults', error);
    Config.getDefault();
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Server connected and ready');
  
  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.error('Shutting down...');
    await server.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.error('Shutting down...');
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});