---
description: Research codebase using Task agent, save findings to numbered scout report
category: workflow
version: 1.0.0
---

# Scout Command

## Purpose

Gather context and understand the codebase before making changes. This is the research phase where you thoroughly explore relevant code, patterns, and conventions. Uses Task tool with general-purpose agent to offload heavy searching and keep main context clean.

## Variables

- `TASK_DESCRIPTION`: What needs to be accomplished
- `SEARCH_TERMS`: Keywords to search for in the codebase
- `DATE`: Current date in YYYYMMDD format
- `NUMBER`: Sequential number for today (001, 002, etc.)
- `INITIALS`: Developer initials from git config
- `SCOUT_REPORTS_DIR`: .claude/scout

## Instructions

1. Read the project's CLAUDE.md to understand conventions (do this in main context)
2. Find the highest numbered scout report in `.claude/scout/`
3. Determine next sequential number (e.g., if 003 exists, create 004)
4. Use Task tool with general-purpose agent to perform heavy searching:
   - Search for similar patterns or existing implementations
   - Find relevant files and components
   - Identify integration points
   - Research existing architecture approaches
5. Review the agent's findings
6. Save findings to `.claude/scout/NNN-scout-brief-description.md`
7. Present Scout Report to user

## Workflow

1. **Read conventions**: Read CLAUDE.md for project conventions (in main context)
2. **Check meta-index FIRST**:
   - Read `.claude/knowledge/meta-index.md` to find related work
   - Search for your topic in the "By Topic" section
   - Identify related scouts/plans/knowledge files
   - Note cross-references and patterns to avoid duplicating research
3. **Review related work**:
   - Read referenced scout reports for prior research
   - Read referenced knowledge files for established patterns
   - Note which questions have already been answered
   - Identify gaps where new research is needed
4. **Generate filename**:
   - Get current date: `DATE=$(date +%Y%m%d)`
   - Get developer initials: `INITIALS="jr"` (from git config user.name)
   - Find today's count: List files matching `${DATE}-*-${INITIALS}-scout-*.md`
   - Calculate next number for today: count + 1, pad with zeros (001, 002, 003, etc.)
   - Slug the feature: `FEATURE=$(echo "$TASK" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')`
   - Generate: `${DATE}-${NUMBER}-${INITIALS}-scout-${FEATURE}.md`
5. **Launch research agent**:

   ```
   Task(
     subagent_type: "general-purpose",
     description: "Research codebase for task",
     prompt: "Search the codebase for [TASK_DESCRIPTION].

     IMPORTANT: Before searching, I've already reviewed:
     - Related scouts: [list scout numbers/topics from meta-index]
     - Related knowledge: [list knowledge files from meta-index]
     - Known gaps: [what we still need to learn]

     Focus your research on:
     - Similar existing implementations
     - Relevant files and components
     - Integration points and dependencies
     - Architectural patterns being used
     - Existing utility functions in the feature area
     - NEW information not covered in related work above

     Provide a detailed report of findings."
   )
   ```

6. **Review findings**: Process the agent's research results
7. **Cross-reference with prior work**:
   - Note if findings match/extend documented patterns
   - Identify new patterns not in knowledge base
   - Call out differences from related scout findings
8. **Save report**: Write to `.claude/scout/YYYYMMDD-NNN-initials-scout-feature.md`
9. **Present to user**: Display Scout Report with file path and related work references

## Report

Save to `.claude/scout/YYYYMMDD-NNN-initials-scout-feature.md` and present:

```markdown
# Scout Report NNN: [Task Name]

**Created**: [Date]
**Task**: [Full description]
**Status**: Complete

## Related Work Reviewed

- **Scouts**: [List related scout numbers and what you learned from them]
- **Plans**: [List related plan numbers and relevant decisions]
- **Knowledge**: [List knowledge files and key patterns]

## Relevant Files Found

- `path/to/file1.ts` - [what it does, key functions/components]
- `path/to/file2.tsx` - [what it does, key functions/components]

## Existing Patterns

- **Pattern 1**: [Description of existing approach]
  - Used in: `file/path.ts`
  - How it works: [explanation]

## Dependencies

- [Library/component name] - [how it's used]
- [System/service] - [integration points]

## Architecture Notes

- [Current architecture approach]
- [Design patterns being used]
- [State management approach]

## Key Considerations

- [Important constraint or requirement]
- [Potential issue or edge case]
- [Performance/security consideration]

## Files to Modify/Create

- `path/to/existing.ts` - [what changes needed]
- `path/to/new-file.ts` - [what to create]

---

**Scout Report saved to**: `.claude/scout/YYYYMMDD-NNN-initials-scout-feature.md`
**Example**: `.claude/scout/20251117-001-jr-scout-authentication.md`

Ready to proceed to planning phase.
```

**Note**:

- The heavy searching is done by the Task agent to keep the main conversation context clean and focused.
- Scout reports are numbered sequentially (001, 002, etc.) and stored in `.claude/scout/`
