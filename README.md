# Claude Workflows MCP Server

A Model Context Protocol (MCP) server that automates Claude development workflows, providing tools for ADR management, session contexts, planning mode, design discussions, project standards, and refactoring workflows.

## Features

- **Architecture Decision Records (ADRs)**: Create, manage, and track architectural decisions
- **Session Context Management**: Save and restore work session contexts
- **Planning Mode**: Create structured implementation plans with phases and checklists
- **Design Discussions**: Document and evaluate design options with weighted scoring
- **Project Standards**: Initialize and maintain project standards documentation
- **Refactoring Workflows**: Analyze and document refactoring specifications
- **Cross-References**: Track relationships between documents
- **Git Integration**: Capture git status and history in workflows

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git (optional, for git integration features)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/claude-workflows-mcp.git
cd claude-workflows-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Configure Claude to use the MCP server by adding to your Claude configuration:
```json
{
  "mcpServers": {
    "claude-workflows": {
      "command": "node",
      "args": ["/path/to/claude-workflows-mcp/dist/index.js"]
    }
  }
}
```

## Configuration

The server uses a configuration file `.workflow-config.json` in your project root. If not present, it will be created with defaults:

```json
{
  "paths": {
    "adrs": "docs/architecture/adrs",
    "sessions": "docs/context",
    "discussions": "docs/discussions",
    "standards": "docs/standards",
    "work": "docs/work"
  },
  "defaults": {
    "author": "Your Name",
    "deciders": ["Team Lead", "Tech Lead"]
  },
  "templates": {}
}
```

## Available Tools

### ADR Tools
- `adr_create`: Create a new Architecture Decision Record
- `adr_list`: List all ADRs with optional status filter
- `adr_update_status`: Update the status of an ADR

### Session Context Tools
- `session_save`: Save the current work session context
- `session_restore`: Restore a previous session context

### Planning Tools
- `plan_create`: Create a new implementation plan
- `plan_generate_checklist`: Generate a checklist for a plan phase

### Design Discussion Tools
- `design_discussion_create`: Create a design discussion with weighted scoring

### Standards Tools
- `standards_init`: Initialize project standards documentation

### Refactoring Tools
- `refactor_analyze`: Analyze code for refactoring opportunities
- `refactor_spec_create`: Create a refactoring specification

### Navigation Tool
- `workflow_suggest`: Get workflow suggestions for current task

## Usage Examples

### Creating an ADR
```
Use tool: adr_create
Parameters:
  title: "Use React for Frontend"
  status: "proposed"
  context: "We need to choose a frontend framework"
  decision: "We will use React"
  consequences: "Team will need React training"
```

### Saving Session Context
```
Use tool: session_save
Parameters:
  summary: "Implemented user authentication"
  nextSteps: ["Add password reset", "Implement 2FA"]
  questions: ["Should we use OAuth?"]
```

### Creating a Plan
```
Use tool: plan_create
Parameters:
  title: "API Refactoring"
  phases: [
    {
      phase: "1",
      title: "Analysis",
      tasks: ["Review current API", "Identify issues"]
    }
  ]
```

## Development

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Watch mode for development
- `npm start`: Run the compiled server
- `npm test`: Run tests
- `npm run lint`: Lint the code
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Type check without building

### Project Structure

```
claude-workflows-mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── workflows/               # Workflow implementations
│   ├── core/                   # Core infrastructure
│   ├── templates/              # Document templates
│   ├── types/                  # TypeScript definitions
│   └── tools/                  # Tool definitions
├── tests/                      # Test files
├── docs/                       # Documentation
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.