---
description: Create detailed implementation plan from scout findings, save to numbered plan file
category: workflow
version: 1.0.0
---

# Plan Command

## Purpose

Create a detailed, step-by-step implementation plan based on the scout findings. Save the plan to a numbered file for reference and tracking.

## Variables

- `TASK_DESCRIPTION`: What needs to be accomplished
- `SCOUT_FILE`: Path to scout report file (e.g., `.claude/scout/20251117-001-jr-scout-feature.md`)
- `DATE`: Current date in YYYYMMDD format (should match scout date)
- `NUMBER`: Sequential number for today (should match scout number)
- `INITIALS`: Developer initials from git config (should match scout initials)

## Instructions

1. Find the most recent scout report from `.claude/scout/` (highest numbered)
2. Read that scout report to get context
3. Find the highest numbered plan in `.claude/plans/` (files matching `NNN-*.md`, not in subdirectories)
4. Generate plan filename to match scout report naming
5. Create plan filename: `YYYYMMDD-NNN-initials-plan-feature.md` (matching scout)
6. Write detailed implementation plan based on scout findings
7. Save to `.claude/plans/YYYYMMDD-NNN-initials-plan-feature.md`
8. Present plan to user for approval
9. WAIT for user approval before proceeding

## Workflow

1. **Find scout report**:
   - List files in `.claude/scout/`
   - Find most recent file matching current date or latest date
   - Read that file (e.g., `.claude/scout/20251117-001-jr-scout-feature.md`)
2. **Check meta-index for context**:
   - Read `.claude/knowledge/meta-index.md`
   - Search for related plans in "By Topic" and "Scout → Plan → Knowledge Mapping"
   - Identify similar implementation patterns from related plans
   - Note cross-references to avoid duplicating planning work
3. **Load scout context**:
   - Read scout report file completely
   - Extract relevant files, patterns, and considerations
   - Review "Related Work Reviewed" section from scout
4. **Review related plans** (from meta-index):
   - Read related plans to understand similar implementation patterns
   - Note reusable approaches and decisions
   - Identify differences in your implementation
   - Learn from potential issues encountered in related plans
5. **Check knowledge base**:
   - Read relevant knowledge files identified in meta-index
   - Note existing utility functions to use instead of creating new ones
   - Reference established patterns in implementation steps
6. **Generate plan filename** (to match scout):
   - Extract DATE, NUMBER, INITIALS from scout filename
   - Use same values for plan filename
   - Slug the feature name same as scout
   - Generate: `${DATE}-${NUMBER}-${INITIALS}-plan-${FEATURE}.md`
   - Example: Scout `20251117-001-jr-scout-auth.md` → Plan `20251117-001-jr-plan-auth.md`
7. **Create plan**:
   - Write detailed implementation plan using scout findings
   - Reference existing utilities from knowledge base instead of creating duplicates
   - Call out related plans and how this plan differs/builds upon them
   - Include steps to update knowledge base if modifying documented features
   - Include step to update meta-index.md with new plan
8. **Save plan**: Write to `.claude/plans/YYYYMMDD-NNN-initials-plan-feature.md`
9. **Present to user**: Display plan with file path and related work context
10. **Request approval**: Ask "Does this plan look good? Should I proceed with building?"
11. **Wait**: STOP and wait for explicit user approval

## Report

Save plan to `.claude/plans/YYYYMMDD-NNN-initials-plan-feature.md` with this structure:

```markdown
# Plan NNN: [Brief Title]

**Created**: [Date]
**Status**: Planning
**Task**: [Full description]
**Scout Report**: `.claude/scout/YYYYMMDD-NNN-initials-scout-feature.md`

## Related Work

- **Related Plans**: [List plan numbers and how they relate - similar patterns, dependencies, etc.]
- **Related Knowledge**: [List knowledge files used for patterns/utilities]
- **Differences**: [How this plan differs from or builds upon related plans]

## Implementation Steps

### Step 1: [Step Name]

- [ ] Action item 1
- [ ] Action item 2
      **Files**: `path/to/file.ts`
      **Why**: [Reasoning]

### Step 2: [Step Name]

- [ ] Action item 1
- [ ] Action item 2
      **Files**: `path/to/file.ts`
      **Why**: [Reasoning]

[Continue for all steps...]

## Files to Modify

- `path/to/file1.ts` - [changes needed]
- `path/to/file2.tsx` - [changes needed]

## Files to Create

- `path/to/newfile.ts` - [purpose]

## Testing Strategy

- [How to test the changes]
- [What to verify]

## Potential Issues

- [Issue 1 and mitigation]
- [Issue 2 and mitigation]

## Quality Checks

- [ ] Prettier formatting
- [ ] ESLint validation
- [ ] TypeScript type checking
- [ ] Manual testing

## Post-Implementation

- [ ] Update `.claude/knowledge/meta-index.md` with new plan entry
- [ ] Update related knowledge files if patterns discovered
- [ ] Cross-reference with related scouts/plans

---

**Next**: Awaiting approval to proceed with build phase.
```

Present the plan to user and show them the file path where it's saved.

## Example Usage

**User Input:**

```
/plan
```

**Agent Behavior:**

1. Finds most recent scout report: `.claude/scout/003-scout-dark-mode.md`
2. Reads scout findings about theme context and MUI integration
3. Checks knowledge base for theme-system.md patterns
4. Determines next plan number: `004`
5. Creates detailed plan at `.claude/plans/004-implement-dark-mode-toggle.md`

**Example Output:**

```markdown
# Plan 004: Implement Dark Mode Toggle in Settings

**Created**: 2025-11-14
**Status**: Planning
**Task**: Add user-controlled dark mode toggle to settings page with localStorage persistence
**Scout Report**: `.claude/scout/003-scout-dark-mode.md`

## Implementation Steps

### Step 1: Extend Theme Context

- [ ] Add `mode` state ('light' | 'dark') to useVerticalLayout hook
- [ ] Add `toggleMode` function to context
- [ ] Persist mode preference to localStorage
      **Files**: `src/hooks/useVerticalLayout.tsx`
      **Why**: Theme mode needs to be accessible app-wide and persist across sessions

### Step 2: Create Toggle Component

- [ ] Create DarkModeToggle.tsx in src/components/common/
- [ ] Use MUI Switch with moon/sun icons
- [ ] Connect to theme context toggleMode function
      **Files**: `src/components/common/DarkModeToggle.tsx`
      **Why**: Reusable component follows project patterns for common UI elements

### Step 3: Add to Settings Page

- [ ] Import DarkModeToggle component
- [ ] Add section for appearance settings
- [ ] Include description text for accessibility
      **Files**: `src/pages/Settings/Settings.tsx` (or create if doesn't exist)
      **Why**: Settings page is logical location for user preferences

### Step 4: Update Tests

- [ ] Add Cypress test for toggle interaction
- [ ] Verify localStorage persistence
- [ ] Test mode change reflects in theme
      **Files**: `cypress/e2e/dark-mode.cy.ts`
      **Why**: Critical user-facing feature requires E2E coverage

## Files to Modify

- `src/hooks/useVerticalLayout.tsx` - Add mode state and toggle function
- `src/pages/Settings/Settings.tsx` - Add toggle component

## Files to Create

- `src/components/common/DarkModeToggle.tsx` - Toggle component
- `cypress/e2e/dark-mode.cy.ts` - E2E tests

## Testing Strategy

- Manual: Toggle switch and verify theme changes immediately
- Manual: Reload page and verify mode persists from localStorage
- Automated: Cypress test for toggle interaction and persistence

## Potential Issues

- MUI theme recreation on every toggle could be expensive
  → Mitigation: useMemo in useDynamicMuiTheme already handles this
- localStorage might be disabled in private browsing
  → Mitigation: Graceful fallback to session-only mode

## Quality Checks

- [ ] Prettier formatting
- [ ] ESLint validation
- [ ] TypeScript type checking
- [ ] Manual testing (light → dark → reload)
- [ ] Cypress E2E test passes

---

**Next**: Awaiting approval to proceed with build phase.
```

**User sees:**

```
✅ Implementation plan created: .claude/plans/004-implement-dark-mode-toggle.md

I've analyzed the scout findings and created a detailed 4-step implementation plan.
The plan includes:
- Extending theme context for mode state
- Creating a reusable DarkModeToggle component
- Integrating into Settings page
- Comprehensive E2E testing

Does this plan look good? Should I proceed with building?
```
