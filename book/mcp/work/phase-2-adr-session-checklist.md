# Phase 2: ADR & Session Workflows - Implementation Checklist

**Duration**: 10-12 hours (1.5 days)
**Goal**: Implement the most frequently used workflows - ADRs and Session Contexts
**Prerequisites**: Phase 1 completed successfully

## Pre-Phase Setup
- [ ] Review Phase 1 implementation
- [ ] Ensure all foundation components tested
- [ ] Create workflow test harness
- [ ] Set up sample project for testing
- [ ] Review ADR and Session Context templates from docs/book

## Part A: ADR Workflow Implementation (5-6 hours)

### Task 1: ADR Workflow Core
- [ ] Create `src/workflows/adr/ADRWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define ADR-specific types and interfaces
- [ ] Implement workflow state management
- [ ] Add ADR metadata structure
- [ ] **Checkpoint**: ADR workflow skeleton ready

### Task 2: ADR Creation Tool
- [ ] Implement `adr_create` tool
- [ ] Parse title and context parameters
- [ ] Generate ADR number (auto-increment)
- [ ] Apply ADR template with data
- [ ] Handle optional fields gracefully
- [ ] Save to `docs/architecture/adrs/`
- [ ] Update ADR index/registry
- [ ] Test with various inputs
- [ ] **Checkpoint**: Can create new ADRs

### Task 3: ADR Listing Tool
- [ ] Implement `adr_list` tool
- [ ] Add status filtering (proposed, accepted, etc.)
- [ ] Parse existing ADR files for metadata
- [ ] Format list output (table or structured)
- [ ] Include relationships (supersedes, related)
- [ ] Add sorting options (number, date, status)
- [ ] Handle missing/malformed ADRs
- [ ] **Checkpoint**: Can list all ADRs with filters

### Task 4: ADR Status Management
- [ ] Implement `adr_update_status` tool
- [ ] Validate status transitions
- [ ] Update ADR frontmatter
- [ ] Preserve document content
- [ ] Add status change history
- [ ] Handle superseding relationships
- [ ] Update cross-references
- [ ] Test status workflow
- [ ] **Checkpoint**: ADR lifecycle managed

### Task 5: ADR Cross-Referencing
- [ ] Implement `adr_link` tool
- [ ] Add relationship types (supersedes, implements, relates)
- [ ] Update both ADRs in relationship
- [ ] Validate ADR existence
- [ ] Prevent circular references
- [ ] Update reference index
- [ ] Test complex relationships
- [ ] **Checkpoint**: ADRs properly linked

## Part B: Session Context Workflow (5-6 hours)

### Task 6: Session Workflow Core
- [ ] Create `src/workflows/session/SessionWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define session-specific types
- [ ] Design session metadata structure
- [ ] Implement session state tracking
- [ ] **Checkpoint**: Session workflow skeleton ready

### Task 7: Session Save Tool
- [ ] Implement `session_save` tool
- [ ] Capture git status (branch, changes, commits)
- [ ] Detect and run test commands
- [ ] Capture build status
- [ ] Identify modified files with context
- [ ] Extract active problems/blockers
- [ ] Generate session timestamp
- [ ] Apply session template
- [ ] Save to `docs/context/`
- [ ] **Checkpoint**: Complete context captured

### Task 8: Enhanced Git Integration
- [ ] Extend GitIntegration for session needs
- [ ] Capture uncommitted changes
- [ ] Get diff statistics
- [ ] List recent commits with messages
- [ ] Detect merge conflicts
- [ ] Track branch relationships
- [ ] Handle various git states
- [ ] **Checkpoint**: Rich git context available

### Task 9: Test/Build Status Integration
- [ ] Create `src/core/TestRunner.ts`
- [ ] Detect test framework (npm, jest, vitest, etc.)
- [ ] Run tests and capture output
- [ ] Parse test results (pass/fail counts)
- [ ] Capture coverage metrics if available
- [ ] Detect build commands
- [ ] Run build and capture status
- [ ] Handle missing test/build scripts
- [ ] **Checkpoint**: Test/build status captured

### Task 10: Session Restore Tool
- [ ] Implement `session_restore` tool
- [ ] Find most recent session by default
- [ ] Allow specific date selection
- [ ] Parse session document
- [ ] Extract key information
- [ ] Format restoration summary
- [ ] Highlight blockers and next steps
- [ ] Provide quick action commands
- [ ] **Checkpoint**: Sessions restored effectively

### Task 11: Session Chaining
- [ ] Implement session relationship tracking
- [ ] Link related sessions automatically
- [ ] Track work continuity
- [ ] Generate session timeline
- [ ] Calculate cumulative metrics
- [ ] Identify patterns across sessions
- [ ] **Checkpoint**: Session history connected

## Part C: MCP Resources (1-2 hours)

### Task 12: ADR Resources
- [ ] Implement ADR list resource
- [ ] Implement ADR read resource
- [ ] Add resource metadata
- [ ] Enable resource discovery
- [ ] Test resource access
- [ ] **Checkpoint**: ADRs accessible as resources

### Task 13: Session Resources
- [ ] Implement session list resource
- [ ] Implement session read resource
- [ ] Add temporal navigation
- [ ] Enable session search
- [ ] Test resource access
- [ ] **Checkpoint**: Sessions accessible as resources

## Validation & Testing

### Task 14: Workflow Testing
- [ ] Create ADR workflow tests
- [ ] Test ADR creation variations
- [ ] Test ADR status transitions
- [ ] Test ADR relationships
- [ ] Create session workflow tests
- [ ] Test session save completeness
- [ ] Test session restore accuracy
- [ ] Test edge cases (no git, no tests)
- [ ] **Checkpoint**: All tests passing

### Task 15: Integration Testing
- [ ] Test ADR workflow end-to-end
- [ ] Test session workflow end-to-end
- [ ] Test cross-workflow interactions
- [ ] Test with real project
- [ ] Verify file formatting
- [ ] Check performance metrics
- [ ] **Checkpoint**: Workflows work in practice

## Commit Checkpoints

1. **Commit 1**: "Implement ADR creation and listing"
2. **Commit 2**: "Add ADR status and relationship management"
3. **Commit 3**: "Implement session save with git integration"
4. **Commit 4**: "Add test/build status capture"
5. **Commit 5**: "Implement session restore and chaining"
6. **Commit 6**: "Add MCP resources for ADRs and sessions"
7. **Commit 7**: "Complete workflow tests"

## Success Criteria

- [ ] Can create ADRs with auto-numbering
- [ ] Can list ADRs with status filtering
- [ ] Can update ADR status and relationships
- [ ] Can save comprehensive session context
- [ ] Git status accurately captured
- [ ] Test/build results included
- [ ] Can restore from previous session
- [ ] Session continuity maintained
- [ ] All tests passing
- [ ] Performance under 500ms per operation

## Post-Phase Review

- [ ] Workflow usability assessment
- [ ] Performance benchmarks captured
- [ ] User feedback incorporated
- [ ] Documentation updated
- [ ] Ready for Phase 3

## Notes

- Prioritize data completeness over formatting
- Ensure graceful degradation without git
- Make templates customizable
- Consider async operations for performance
- Test with various project types