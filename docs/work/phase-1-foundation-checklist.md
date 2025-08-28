# Phase 1: Foundation - Implementation Checklist

**Duration**: 12-15 hours (2 days)
**Goal**: Establish core infrastructure and basic MCP server setup

## Pre-Phase Setup
- [ ] Create new repository/directory for `claude-workflows-mcp`
- [ ] Initialize Node.js project with TypeScript
- [ ] Install MCP SDK and core dependencies
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint and Prettier
- [ ] Create initial directory structure
- [ ] Set up Git repository with .gitignore

## Part A: MCP Server Scaffold (3-4 hours)

### Task 1: Basic MCP Server
- [ ] Create `src/index.ts` with MCP server initialization
- [ ] Implement server lifecycle methods (initialize, shutdown)
- [ ] Set up logging infrastructure
- [ ] Create error handling middleware
- [ ] Test basic server startup/shutdown
- [ ] **Checkpoint**: Server runs and responds to MCP protocol

### Task 2: Configuration System
- [ ] Create `src/core/Config.ts` for configuration management
- [ ] Define configuration schema (paths, defaults, options)
- [ ] Implement configuration file loading (`.workflow-config.json`)
- [ ] Add environment variable support
- [ ] Create default configuration values
- [ ] Test configuration loading and validation
- [ ] **Checkpoint**: Configuration system working

### Task 3: Type Definitions
- [ ] Create `src/types/index.ts` with core types
- [ ] Define workflow types (ADR, Session, Plan, etc.)
- [ ] Create document metadata interfaces
- [ ] Define MCP tool/resource interfaces
- [ ] Add workflow state types
- [ ] **Checkpoint**: TypeScript types comprehensive

## Part B: Document Management (4-5 hours)

### Task 4: Document Manager Core
- [ ] Create `src/core/DocumentManager.ts`
- [ ] Implement file reading with error handling
- [ ] Implement file writing with backup
- [ ] Add directory creation (recursive)
- [ ] Implement file listing with glob patterns
- [ ] Add frontmatter parsing (gray-matter)
- [ ] Test with sample documents
- [ ] **Checkpoint**: Can read/write markdown files

### Task 5: Numbering System
- [ ] Create `src/core/NumberingSystem.ts`
- [ ] Implement auto-increment for document numbers
- [ ] Add number formatting (001, 002, etc.)
- [ ] Create number reservation to prevent conflicts
- [ ] Implement number parsing from filenames
- [ ] Add support for different numbering schemes
- [ ] Test concurrent number generation
- [ ] **Checkpoint**: Reliable document numbering

### Task 6: Template Engine
- [ ] Create `src/core/TemplateEngine.ts`
- [ ] Set up Handlebars engine
- [ ] Create template loading system
- [ ] Implement template compilation cache
- [ ] Add custom Handlebars helpers (date formatting, etc.)
- [ ] Create simple string interpolation fallback
- [ ] Test with sample templates
- [ ] **Checkpoint**: Templates render correctly

## Part C: Workflow Infrastructure (3-4 hours)

### Task 7: Workflow Base Class
- [ ] Create `src/workflows/BaseWorkflow.ts`
- [ ] Define abstract workflow interface
- [ ] Implement common workflow operations
- [ ] Add state management methods
- [ ] Create workflow registry system
- [ ] Implement workflow discovery
- [ ] Test workflow registration
- [ ] **Checkpoint**: Workflow framework ready

### Task 8: Cross-Reference System
- [ ] Create `src/core/CrossReference.ts`
- [ ] Design reference storage schema
- [ ] Implement reference tracking
- [ ] Add bidirectional linking
- [ ] Create reference querying
- [ ] Implement reference validation
- [ ] Test with mock documents
- [ ] **Checkpoint**: Document relationships tracked

### Task 9: Git Integration Basics
- [ ] Create `src/core/GitIntegration.ts`
- [ ] Implement git status checking
- [ ] Add current branch detection
- [ ] Implement recent commits listing
- [ ] Add modified files detection
- [ ] Create git-less fallback mode
- [ ] Test with and without git repo
- [ ] **Checkpoint**: Git status captured

## Part D: Initial Templates (2-3 hours)

### Task 10: Create Core Templates
- [ ] Create `src/templates/` directory
- [ ] Add `adr.hbs` template
- [ ] Add `session-context.hbs` template
- [ ] Add `design-discussion.hbs` template
- [ ] Add `plan.hbs` template
- [ ] Add `checklist.hbs` template
- [ ] Add `refactor-spec.hbs` template
- [ ] Test template rendering
- [ ] **Checkpoint**: All templates created

### Task 11: MCP Tool Definitions
- [ ] Define tool schemas in `src/tools/`
- [ ] Create tool registration system
- [ ] Implement parameter validation
- [ ] Add tool help/documentation
- [ ] Create tool discovery mechanism
- [ ] Test tool invocation
- [ ] **Checkpoint**: Tools discoverable via MCP

## Validation & Testing

### Task 12: Foundation Testing
- [ ] Create `tests/` directory structure
- [ ] Write unit tests for DocumentManager
- [ ] Write unit tests for NumberingSystem
- [ ] Write unit tests for TemplateEngine
- [ ] Write integration test for MCP server
- [ ] Test error scenarios
- [ ] Verify logging output
- [ ] **Checkpoint**: All tests passing

### Task 13: Documentation
- [ ] Create README.md with setup instructions
- [ ] Document configuration options
- [ ] Add API documentation for core modules
- [ ] Create CONTRIBUTING.md
- [ ] Add inline code comments
- [ ] Generate TypeDoc documentation
- [ ] **Checkpoint**: Documentation complete

## Commit Checkpoints

1. **Commit 1**: "Initial MCP server setup with TypeScript"
2. **Commit 2**: "Add document management and numbering system"
3. **Commit 3**: "Implement template engine and workflow base"
4. **Commit 4**: "Add cross-references and git integration"
5. **Commit 5**: "Create document templates"
6. **Commit 6**: "Add tests and documentation"

## Success Criteria

- [ ] MCP server starts and responds to protocol
- [ ] Can read/write files with proper error handling
- [ ] Document numbering works reliably
- [ ] Templates render with data
- [ ] Git status is captured accurately
- [ ] All unit tests passing
- [ ] Documentation is clear and complete

## Post-Phase Review

- [ ] Code review completed
- [ ] Performance benchmarks captured
- [ ] Technical debt documented
- [ ] Lessons learned recorded
- [ ] Ready for Phase 2

## Notes

- Focus on robustness over features in this phase
- Ensure proper error handling throughout
- Keep templates simple initially
- Document design decisions as you go
- Consider edge cases (missing git, permissions, etc.)