#!/usr/bin/env node

// Simple test to verify the MCP server starts and responds to basic requests
import { spawn } from 'child_process';

console.log('Testing Claude Workflows MCP Server...\n');

// Start the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('Server:', data.toString().trim());
});

// Send a list tools request after a short delay
setTimeout(() => {
  console.log('\nSending list tools request...');
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Send a test ADR creation request
setTimeout(() => {
  console.log('\nSending create ADR request...');
  const request = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'adr_create',
      arguments: {
        title: 'Test ADR',
        context: 'Testing the MCP server',
        decision: 'Use MCP for workflow automation',
        consequences: 'Improved workflow automation',
        status: 'proposed'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}, 2000);

// Kill server after 3 seconds
setTimeout(() => {
  console.log('\nTest complete. Shutting down server...');
  server.kill();
  
  if (output) {
    console.log('\nServer output:');
    console.log(output);
  }
  
  process.exit(0);
}, 3000);

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Server exited with code ${code}`);
    if (errorOutput) {
      console.error('Error output:', errorOutput);
    }
  }
});