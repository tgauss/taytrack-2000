---
description: Execute approved plan, update progress in plan file, run quality checks
category: workflow
version: 1.0.0
---

# Build Command

## Purpose

Execute the implementation plan that was approved by the user. Update progress in the plan file as work is completed.

## Variables

- `PLAN_FILE`: Path to the plan file (e.g., `.claude/plans/003-feature.md`)
- `CURRENT_STEP`: Which step is currently being executed

## Instructions

1. Read the plan file to get implementation steps
2. Execute each step systematically
3. Update plan file with ✅ checkmarks as steps complete
4. Run quality checks after making changes
5. Test the implementation
6. Update plan status to "Completed" when done
7. Present summary of what was accomplished

## Workflow

1. **Find plan file**:
   - List files in `.claude/plans/` (root level only, exclude scout/)
   - Find highest NNN in filenames matching `NNN-*.md`
   - Read that file (e.g., `.claude/plans/003-feature.md`)
2. **Check knowledge base**:
   - Identify which feature area(s) the plan involves
   - Read relevant knowledge files from `.claude/knowledge/`
   - Reference existing utility functions before creating new ones
   - Follow established patterns from knowledge base
3. **Update status**:
   - Edit plan file: Change `**Status**: Planning` → `**Status**: In Progress`
4. **Execute each step**:
   - For each step in plan:
     - Execute the actions
     - Edit plan file: Update `- [ ]` → `- [x]` for completed actions
     - Report progress to user
5. **Run quality checks**:
   - Execute: `npm run prettier`
   - Execute: `npm run lint`
   - Execute: `npm run typecheck:prod`
   - Update quality checklist in plan file
6. **Update knowledge base**:
   - If modified files are part of a documented feature, update the relevant knowledge file
   - Add new utility functions to Quick Reference section
   - Update Change Log with date and description
   - If new feature area, consider creating new knowledge file
7. **Mark complete**:
   - Edit plan file: Change `**Status**: In Progress` → `**Status**: Completed`
   - Add completion date
8. **Present summary**: Display completion report with next steps

## Report

Update the plan file throughout execution:

```markdown
**Status**: In Progress → Completed
**Completed**: [Date]

## Implementation Steps

### Step 1: [Step Name]

- [x] Action item 1 ✅
- [x] Action item 2 ✅
      **Files**: `path/to/file.ts`
      **Why**: [Reasoning]

[etc...]

## Quality Checks

- [x] Prettier formatting ✅
- [x] ESLint validation ✅
- [x] TypeScript type checking ✅
- [x] Manual testing ✅

---

**Status**: Completed
```

Present completion summary:

### Build Complete ✅

**Plan**: `.claude/plans/NNN-description.md`

**Completed Steps**:

- ✅ Step 1: [name]
- ✅ Step 2: [name]
- ✅ Step 3: [name]

**Files Modified**:

- `path/to/file1.ts`
- `path/to/file2.tsx`

**Quality Checks**: All passed ✅

**Next Steps**:

- Review changes
- Test functionality
- Run `/commit` to commit changes
- Run `/pr` to create pull request
