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

// Placeholder functions - will be implemented properly later
async function executeToolFunction(name: string, args: any): Promise<any> {
  // This will be replaced with actual tool execution logic
  console.log(`Executing tool: ${name}`, args);
  return { success: true, message: `Tool ${name} executed` };
}

async function readResourceContent(uri: string): Promise<string> {
  // This will be replaced with actual resource reading logic
  console.log(`Reading resource: ${uri}`);
  return `Content of ${uri}`;
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