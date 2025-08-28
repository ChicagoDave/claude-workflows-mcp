# Phase 4: Standards & Refactoring Workflows - Implementation Checklist

**Duration**: 8-10 hours (1 day)
**Goal**: Complete remaining workflows for project standards and refactoring
**Prerequisites**: Phase 3 completed, complex workflows functional

## Pre-Phase Setup
- [ ] Review standards and refactoring documentation
- [ ] Analyze CLAUDE.md requirements
- [ ] Prepare project type templates
- [ ] Set up refactoring test scenarios
- [ ] Review existing workflow patterns

## Part A: Project Standards Workflow (4-5 hours)

### Task 1: Standards Workflow Core
- [ ] Create `src/workflows/standards/StandardsWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define standards-specific types
- [ ] Create project type definitions
- [ ] Implement standards state management
- [ ] **Checkpoint**: Standards workflow structure ready

### Task 2: Standards Initialization
- [ ] Implement `standards_init` tool
- [ ] Create project type selector
- [ ] Define project templates (enterprise, startup, OSS, gaming)
- [ ] Generate technology stack section
- [ ] Create principles section
- [ ] Add build tool configuration
- [ ] Include testing standards
- [ ] Apply standards template
- [ ] Save to project root
- [ ] **Checkpoint**: Standards document generated

### Task 3: CLAUDE.md Generation
- [ ] Implement `standards_claude_md` tool
- [ ] Extract key standards for Claude
- [ ] Generate DO/DON'T lists
- [ ] Add project-specific context
- [ ] Include testing commands
- [ ] Add common patterns
- [ ] Create error handling examples
- [ ] Apply CLAUDE.md template
- [ ] **Checkpoint**: CLAUDE.md created

### Task 4: Technology Stack Documentation
- [ ] Implement `standards_tech_stack` tool
- [ ] Create language configuration
- [ ] Add framework selections
- [ ] Document database choices
- [ ] Include infrastructure decisions
- [ ] Add version specifications
- [ ] Generate dependency list
- [ ] **Checkpoint**: Tech stack documented

### Task 5: Standards Validation
- [ ] Implement `standards_check` tool
- [ ] Parse existing standards document
- [ ] Validate against templates
- [ ] Check for missing sections
- [ ] Identify outdated information
- [ ] Generate validation report
- [ ] Suggest updates
- [ ] **Checkpoint**: Standards validated

## Part B: Refactoring Workflow (4-5 hours)

### Task 6: Refactoring Workflow Core
- [ ] Create `src/workflows/refactoring/RefactoringWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define refactoring-specific types
- [ ] Create analysis structures
- [ ] Implement refactoring state
- [ ] **Checkpoint**: Refactoring workflow ready

### Task 7: Current State Analysis
- [ ] Implement `refactor_analyze` tool
- [ ] Parse target files/modules
- [ ] Analyze code structure
- [ ] Identify dependencies
- [ ] Calculate complexity metrics
- [ ] Detect code smells
- [ ] Generate analysis report
- [ ] **Checkpoint**: Analysis complete

### Task 8: Code Metrics Collection
- [ ] Create `src/workflows/refactoring/MetricsCollector.ts`
- [ ] Count lines of code
- [ ] Calculate cyclomatic complexity
- [ ] Measure coupling metrics
- [ ] Identify duplicate code
- [ ] Track test coverage
- [ ] Generate metrics summary
- [ ] **Checkpoint**: Metrics collected

### Task 9: Refactoring Specification
- [ ] Implement `refactor_spec` tool
- [ ] Parse problem descriptions
- [ ] Generate solution approach
- [ ] Create before/after comparisons
- [ ] Define success criteria
- [ ] Identify risks
- [ ] Apply refactor spec template
- [ ] Save to `docs/work/`
- [ ] **Checkpoint**: Spec documented

### Task 10: Refactoring Phases
- [ ] Implement `refactor_phases` tool
- [ ] Break refactoring into safe steps
- [ ] Ensure behavior preservation
- [ ] Add test requirements per phase
- [ ] Create rollback points
- [ ] Generate phase checklists
- [ ] **Checkpoint**: Phases planned

### Task 11: Validation Planning
- [ ] Implement `refactor_validate` tool
- [ ] Generate test scenarios
- [ ] Create validation checklist
- [ ] Add performance benchmarks
- [ ] Include regression tests
- [ ] Define acceptance criteria
- [ ] **Checkpoint**: Validation ready

## Part C: Workflow Navigation (1-2 hours)

### Task 12: Workflow Navigator
- [ ] Create `src/workflows/Navigator.ts`
- [ ] Implement workflow discovery
- [ ] Create workflow metadata
- [ ] Add workflow descriptions
- [ ] Implement selection logic
- [ ] Generate help text
- [ ] **Checkpoint**: Navigation working

### Task 13: Workflow Status Dashboard
- [ ] Implement `workflow_status` tool
- [ ] Show active workflows
- [ ] Display recent documents
- [ ] Track workflow metrics
- [ ] Show completion rates
- [ ] Generate status summary
- [ ] **Checkpoint**: Dashboard functional

### Task 14: Quick Commands
- [ ] Add workflow shortcuts
- [ ] Implement command aliases
- [ ] Create command completion
- [ ] Add help system
- [ ] Test command discovery
- [ ] **Checkpoint**: Commands streamlined

## Validation & Testing

### Task 15: Workflow Testing
- [ ] Test standards initialization for each project type
- [ ] Test CLAUDE.md generation
- [ ] Test standards validation
- [ ] Test refactoring analysis
- [ ] Test metrics collection
- [ ] Test specification generation
- [ ] Test phase planning
- [ ] Verify all templates
- [ ] **Checkpoint**: All workflows tested

### Task 16: Integration Testing
- [ ] Test standards → planning workflow
- [ ] Test refactoring → ADR workflow
- [ ] Test navigation accuracy
- [ ] Test with multiple project types
- [ ] Verify cross-workflow references
- [ ] **Checkpoint**: Integration verified

## Commit Checkpoints

1. **Commit 1**: "Implement project standards workflow"
2. **Commit 2**: "Add CLAUDE.md generation"
3. **Commit 3**: "Implement refactoring analysis"
4. **Commit 4**: "Add refactoring specification and phases"
5. **Commit 5**: "Implement workflow navigation"
6. **Commit 6**: "Complete tests and integration"

## Success Criteria

- [ ] Standards document comprehensive
- [ ] CLAUDE.md properly formatted
- [ ] Tech stack clearly documented
- [ ] Refactoring analysis accurate
- [ ] Metrics calculated correctly
- [ ] Specifications well-structured
- [ ] Phases logically sequenced
- [ ] Navigation suggestions helpful
- [ ] All templates valid markdown
- [ ] All tests passing

## Post-Phase Review

- [ ] Workflow completeness check
- [ ] Template quality assessment
- [ ] Performance verification
- [ ] Documentation review
- [ ] Ready for Phase 5

## Notes

- Make standards templates comprehensive but not overwhelming
- Ensure CLAUDE.md is immediately useful
- Focus on actionable refactoring insights
- Keep metrics simple and relevant
- Test with various codebases