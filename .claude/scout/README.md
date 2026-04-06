# Scout Reports

This directory contains scout reports generated during the research phase of the workflow.

## Purpose

Scout reports are the first phase of the scout → plan → build workflow:

1. **Scout** - Research and understand the codebase (reports stored here)
2. **Plan** - Create implementation plan (stored in `.claude/plans/`)
3. **Build** - Execute the plan

## File Naming

Scout reports follow this naming convention:

```
YYYYMMDD-{number}-{initials}-scout-{feature}.md
```

Where:

- `YYYYMMDD` = Date of creation (e.g., 20251117)
- `{number}` = Sequential 3-digit number per day (001, 002, 003, etc.)
- `{initials}` = Developer initials (e.g., jr, ab, tk)
- `{feature}` = Kebab-case description of the objective

## Examples

```
20251117-001-jr-scout-dark-mode-support.md
20251117-002-ab-scout-authentication-system.md
20251118-001-jr-scout-data-export-feature.md
```

## Benefits

- **Chronological sorting** - Files sort by date naturally
- **Sequential context** - Number shows order within that day
- **Developer tracking** - See who created each scout
- **No collisions** - Multiple developers can work simultaneously
- **Human-readable** - Easy to reference and search

## Searching

```bash
# Find scouts by date
ls .claude/scout/20251117-*

# Find scouts by developer
ls .claude/scout/*-jr-scout-*

# Find scouts by feature
ls .claude/scout/*authentication*

# Search git history
git log --all --grep="authentication"
```

## Workflow Commands

Create scout reports using:

- `/scout` - Manual scout (using Task agent)
- `/auto_scout_plan_build` - Autonomous scout + plan

## Report Structure

Each scout report includes:

- **Objective** - What you're researching
- **Current State Analysis** - What exists today
- **Key Files & Patterns** - Relevant code and patterns found
- **Dependencies & Integrations** - What this touches
- **Recommendations** - Suggested approach and considerations
