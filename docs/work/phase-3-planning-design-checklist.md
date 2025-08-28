# Phase 3: Planning & Design Workflows - Implementation Checklist

**Duration**: 10-12 hours (1.5 days)
**Goal**: Implement complex workflows for planning mode and design discussions
**Prerequisites**: Phase 2 completed, core workflows functional

## Pre-Phase Setup
- [ ] Review planning and design workflow documentation
- [ ] Analyze checklist and comparison matrix requirements
- [ ] Set up test scenarios for complex workflows
- [ ] Review Phase 2 implementation patterns
- [ ] Prepare evaluation criteria examples

## Part A: Planning Mode Workflow (5-6 hours)

### Task 1: Planning Workflow Core
- [ ] Create `src/workflows/planning/PlanningWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define planning-specific types (Phase, Task, Checklist)
- [ ] Implement planning state machine
- [ ] Add phase relationship tracking
- [ ] **Checkpoint**: Planning workflow structure ready

### Task 2: Plan Creation Tool
- [ ] Implement `plan_create` tool
- [ ] Parse feature name and requirements
- [ ] Analyze requirements for complexity
- [ ] Generate phase breakdown
- [ ] Estimate time for each phase
- [ ] Identify dependencies between phases
- [ ] Create risk assessment
- [ ] Apply plan template
- [ ] Save to `docs/work/`
- [ ] **Checkpoint**: Plans generated from requirements

### Task 3: Phase Generation Logic
- [ ] Create `src/workflows/planning/PhaseGenerator.ts`
- [ ] Implement requirement parsing
- [ ] Define phase templates (design, implement, test, etc.)
- [ ] Add intelligent phase sequencing
- [ ] Calculate phase dependencies
- [ ] Estimate phase durations
- [ ] Add milestone identification
- [ ] Test with various project types
- [ ] **Checkpoint**: Phases generated intelligently

### Task 4: Checklist Generation
- [ ] Implement `plan_checklist` tool
- [ ] Create checklist item types (setup, task, validation)
- [ ] Generate pre-phase setup steps
- [ ] Create implementation tasks
- [ ] Add validation checkpoints
- [ ] Include documentation tasks
- [ ] Define commit boundaries
- [ ] Apply checklist template
- [ ] Save phase checklists
- [ ] **Checkpoint**: Detailed checklists created

### Task 5: Plan Status Tracking
- [ ] Implement `plan_status` tool
- [ ] Track checklist item completion
- [ ] Calculate phase progress
- [ ] Update time estimates
- [ ] Identify blockers
- [ ] Generate status summary
- [ ] Update plan metadata
- [ ] **Checkpoint**: Plan progress tracked

## Part B: Design Discussion Workflow (5-6 hours)

### Task 6: Design Discussion Core
- [ ] Create `src/workflows/design/DesignWorkflow.ts`
- [ ] Extend BaseWorkflow class
- [ ] Define design-specific types (Option, Criterion, Score)
- [ ] Implement comparison matrix logic
- [ ] Add scoring algorithms
- [ ] **Checkpoint**: Design workflow structure ready

### Task 7: Design Comparison Tool
- [ ] Implement `design_compare` tool
- [ ] Parse options and criteria
- [ ] Generate comparison matrix structure
- [ ] Apply design discussion template
- [ ] Initialize scoring placeholders
- [ ] Save to `docs/discussions/`
- [ ] **Checkpoint**: Comparison framework created

### Task 8: Harvey Ball Rating System
- [ ] Create `src/workflows/design/RatingSystem.ts`
- [ ] Define Harvey Ball symbols (⬤ ◕ ◑ ◔ ○)
- [ ] Map ratings to numeric values
- [ ] Implement visual representation
- [ ] Add rating validation
- [ ] Create rating helpers
- [ ] Test rating conversions
- [ ] **Checkpoint**: Harvey Ball ratings working

### Task 9: Weighted Scoring
- [ ] Implement `design_score` tool
- [ ] Parse scoring matrix
- [ ] Validate weight totals (100%)
- [ ] Calculate weighted scores
- [ ] Rank options by score
- [ ] Generate score breakdown
- [ ] Identify winner and runner-up
- [ ] Update design document
- [ ] **Checkpoint**: Scoring calculations accurate

### Task 10: SWOT Analysis
- [ ] Implement `design_swot` tool
- [ ] Define SWOT structure
- [ ] Generate SWOT template
- [ ] Parse SWOT inputs
- [ ] Format SWOT matrix
- [ ] Add to design document
- [ ] **Checkpoint**: SWOT analysis integrated

### Task 11: Scenario Analysis
- [ ] Implement `design_scenario` tool
- [ ] Define scenario types
- [ ] Generate scenario tables
- [ ] Evaluate options per scenario
- [ ] Calculate scenario scores
- [ ] Update recommendations
- [ ] **Checkpoint**: Scenario analysis complete

## Part C: Workflow Integration (2-3 hours)

### Task 12: Workflow Transitions
- [ ] Implement design → ADR transition
- [ ] Implement planning → implementation transition
- [ ] Create workflow state transfer
- [ ] Maintain context between workflows
- [ ] Test workflow chaining
- [ ] **Checkpoint**: Workflows connected

### Task 13: Workflow Suggestion
- [ ] Implement `workflow_suggest` tool
- [ ] Parse task description
- [ ] Identify keywords and patterns
- [ ] Apply workflow selection rules
- [ ] Return workflow recommendation
- [ ] Provide workflow initiation command
- [ ] Test with various scenarios
- [ ] **Checkpoint**: Workflow selection automated

### Task 14: Batch Operations
- [ ] Add bulk checklist updates
- [ ] Implement batch scoring
- [ ] Add multi-phase generation
- [ ] Create parallel comparisons
- [ ] Test performance with large sets
- [ ] **Checkpoint**: Batch operations efficient

## Validation & Testing

### Task 15: Complex Workflow Testing
- [ ] Test planning workflow with various project types
- [ ] Test phase generation accuracy
- [ ] Test checklist completeness
- [ ] Test design comparison with multiple options
- [ ] Test scoring calculations
- [ ] Test Harvey Ball conversions
- [ ] Test SWOT generation
- [ ] Verify template output formatting
- [ ] **Checkpoint**: All workflows tested

### Task 16: Performance Testing
- [ ] Benchmark plan generation time
- [ ] Test checklist generation speed
- [ ] Measure scoring calculation time
- [ ] Test with large comparison matrices
- [ ] Optimize slow operations
- [ ] **Checkpoint**: Performance targets met

## Commit Checkpoints

1. **Commit 1**: "Implement planning mode core and plan creation"
2. **Commit 2**: "Add phase and checklist generation"
3. **Commit 3**: "Implement design discussion framework"
4. **Commit 4**: "Add Harvey Ball ratings and weighted scoring"
5. **Commit 5**: "Implement SWOT and scenario analysis"
6. **Commit 6**: "Add workflow transitions and suggestions"
7. **Commit 7**: "Complete tests and optimizations"

## Success Criteria

- [ ] Plans generated from high-level requirements
- [ ] Phases logically sequenced with dependencies
- [ ] Checklists comprehensive and actionable
- [ ] Design comparisons use Harvey Ball ratings
- [ ] Weighted scoring calculates correctly
- [ ] SWOT analysis properly formatted
- [ ] Workflow suggestions accurate
- [ ] All operations under 500ms
- [ ] Templates produce valid markdown
- [ ] All tests passing

## Post-Phase Review

- [ ] Workflow complexity assessment
- [ ] Template quality review
- [ ] Performance analysis
- [ ] User experience evaluation
- [ ] Documentation updated
- [ ] Ready for Phase 4

## Notes

- Focus on intelligence in phase generation
- Ensure scoring math is transparent
- Make templates highly readable
- Consider workflow composability
- Test with real-world scenarios