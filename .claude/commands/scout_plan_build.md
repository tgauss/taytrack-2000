---
description: Complete agentic workflow - scout, plan, and build with approval gates
category: workflow
version: 1.0.0
---

# Scout Plan Build Command

## Purpose

Complete agentic workflow that scouts the codebase, creates a detailed plan, and executes it with approval. This orchestrates the three-phase workflow.

## Variables

- `TASK_DESCRIPTION`: What the user wants to accomplish

## Instructions

Execute the three commands in sequence with explicit data flow:

1. Invoke SlashCommand('/scout') -> produces scout report file path
2. Invoke SlashCommand('/plan') -> reads scout report, produces plan file path
3. WAIT for user approval
4. Invoke SlashCommand('/build') -> reads plan file, executes and updates it

## Workflow

### Phase 1: Scout

```
SlashCommand(command: "/scout")
```

**Outputs:**

- Scout report file: `.claude/scout/NNN-scout-description.md`
- Scout report number (NNN) displayed to user

**Data Flow:**

- Takes task description from user's original prompt
- Produces scout report file that plan command will read

### Phase 2: Plan

```
SlashCommand(command: "/plan")
```

**Inputs:**

- Reads most recent scout report from `.claude/scout/`

**Outputs:**

- Plan file: `.claude/plans/NNN-description.md`
- Plan number (NNN) displayed to user

**Data Flow:**

- Reads scout report file (not conversation history)
- Produces plan file that build command will read

**STOP HERE and WAIT for explicit user approval before proceeding**

### Phase 3: Build (only after approval)

```
SlashCommand(command: "/build")
```

**Inputs:**

- Reads most recent plan from `.claude/plans/` (root level, not scout/)

**Outputs:**

- Updates plan file with ✅ checkmarks
- Updates status to "Completed"
- Completion summary

**Data Flow:**

- Reads plan file for steps to execute
- Updates same plan file with progress

## Report

This command orchestrates the workflow and doesn't have its own report. Each sub-command (scout, plan, build) produces its own report.

---

**Important**:

- Think hard about the user's request before starting
- ALWAYS wait for explicit user approval before running `/build`
- Follow all project conventions in CLAUDE.md
- Each phase uses the structured commands for consistency
