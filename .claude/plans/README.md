# Implementation Plans

This directory contains detailed implementation plans generated during the planning phase of the workflow.

## Purpose

Implementation plans are the second phase of the scout → plan → build workflow:

1. **Scout** - Research and understand the codebase (stored in `.claude/scout/`)
2. **Plan** - Create implementation plan (reports stored here)
3. **Build** - Execute the plan

## File Naming

Implementation plans follow this naming convention:

```
YYYYMMDD-{number}-{initials}-plan-{feature}.md
```

Where:

- `YYYYMMDD` = Date of creation (e.g., 20251117)
- `{number}` = Sequential 3-digit number per day (001, 002, 003, etc.)
- `{initials}` = Developer initials (e.g., jr, ab, tk)
- `{feature}` = Kebab-case description of the feature/task

## Examples

```
20251117-001-jr-plan-dark-mode-support.md
20251117-002-ab-plan-authentication-system.md
20251118-001-jr-plan-data-export-feature.md
```

## Benefits

- **Chronological sorting** - Files sort by date naturally
- **Sequential context** - Number shows order within that day
- **Developer tracking** - See who created each plan
- **No collisions** - Multiple developers can work simultaneously
- **Links to scout** - Matches corresponding scout report by date/number/initials

## Searching

```bash
# Find plans by date
ls .claude/plans/20251117-*

# Find plans by developer
ls .claude/plans/*-jr-plan-*

# Find plans by feature
ls .claude/plans/*authentication*

# Find matching scout and plan
ls .claude/scout/20251117-001-jr-scout-* .claude/plans/20251117-001-jr-plan-*
```

## Workflow Commands

Create implementation plans using:

- `/plan` - Manual plan (reads most recent scout report)
- `/scout_plan_build` - Full workflow with approval gates
- `/auto_scout_plan_build` - Autonomous scout + plan with single approval

## Plan Structure

Each implementation plan includes:

- **Objective** - Clear implementation statement
- **Scout Report Reference** - Links to corresponding scout report
- **Implementation Steps** - Phased, actionable steps with checkboxes
- **Files to Modify/Create** - Complete list of file changes
- **Testing Strategy** - How to test the implementation
- **Potential Issues** - Risks and mitigations
- **Quality Checks** - Linting, formatting, type checking tasks

## Plan Lifecycle

Plans track their status through the workflow:

- **Status: Planning** - Plan created, awaiting approval
- **Status: In Progress** - Build phase executing, checkboxes being marked
- **Status: Completed** - All steps complete, quality checks passed

## Usage

Plans are living documents that get updated during the build phase:

- `- [ ]` checkboxes become `- [x]` as steps complete
- Progress is tracked in real-time
- Final state shows what was accomplished
