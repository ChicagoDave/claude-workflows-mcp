# Claude Development Workflows Book

This directory contains the complete guide to development workflows with Claude.

## Structure

### Main Content

- **[workflows-overview.md](workflows-overview.md)** - Start here! Overview of all workflows and how they connect
- **[workflow-0-project-standards.md](workflow-0-project-standards.md)** - Establishing project standards and configuration
- **[workflow-design-mode-adr.md](workflow-design-mode-adr.md)** - Design mode and Architecture Decision Records (can be used anytime)
- **[workflow-design-discussion.md](workflow-design-discussion.md)** - Structured comparison of design options with scoring matrices
- **[workflow-refactoring.md](workflow-refactoring.md)** - Systematic refactoring of existing code (can be triggered anytime)
- **[workflow-1-planning-mode.md](workflow-1-planning-mode.md)** - Planning mode for creating implementation plans
- **[workflow-2-implementation.md](workflow-2-implementation.md)** - Implementation with comprehensive logging
- **[workflow-3-design-documentation.md](workflow-3-design-documentation.md)** - Documenting design after implementation
- **[workflow-4-design-review.md](workflow-4-design-review.md)** - Design review from multiple perspectives
- **[workflow-5-session-context.md](workflow-5-session-context.md)** - Session context for continuity between sessions

### Workflow Sequence

```
0. Project Standards (once at start)
   ↓
[Design Mode/ADRs] ← (anytime for architecture decisions)
   ↓                    ↓
[Design Discussions] ← (for comparing options)
   ↓
[Refactoring] ← (anytime for improving existing code)
   ↓
1. Planning Mode
   ↓
2. Implementation & Logging
   ↓
3. Design Documentation
   ↓
4. Design Review
   ↓
   If rating < 8: Trigger Refactoring Workflow
   If rating ≥ 8: Continue
   ↓
5. Session Context
   ↓
Next session → back to any workflow as needed
```

### Archive

The `archive/` directory contains older documentation and outlines that were used during the book's development but are no longer part of the main workflow system.

## How to Use This Book

1. **New Project**: Start with `workflows-overview.md`, then `workflow-0-project-standards.md`
2. **New Feature**: Begin with Design Mode (if architectural decisions needed) or Planning Mode
3. **Comparing Options**: Use `workflow-design-discussion.md` for systematic evaluation with scoring
4. **Improving Code**: Use `workflow-refactoring.md` when addressing technical debt or performance issues
5. **Continuing Work**: Start with `workflow-5-session-context.md` to understand context management
6. **Reference**: Each workflow document is self-contained and can be referenced individually

## Key Principles

- **Generic**: These workflows work with any language, framework, or domain
- **Systematic**: Each workflow builds on the previous ones
- **Quality-Focused**: Design reviews ensure high standards
- **Continuous**: Session contexts maintain continuity

## Implementation

These workflows are designed to be used with:
- Claude (via Claude.ai, API, or Claude Code)
- Any programming language
- Any project type or domain
- Teams of any size

For project-specific customization, create your own standards document following the template in `workflow-0-project-standards.md`.