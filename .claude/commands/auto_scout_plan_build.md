---
description: Autonomous scout and plan with sub-agents, single approval gate, then manual build
category: workflow
version: 1.0.0
allowed-tools: Task, Read, Write, Edit, Bash, Grep, Glob
argument-hint: [objective description]
model: sonnet
---

# Auto Scout Plan Build

Fully autonomous scout and plan phases using throwaway sub-agents, then manual build execution in main context with your oversight. Scout and plan run back-to-back automatically with single approval gate before build.

## Variables

USER_OBJECTIVE: $1
SCOUT_REPORTS_DIR: .claude/scout
PLANS_DIR: .claude/plans

## Workflow

This command orchestrates three phases with **autonomous scout and plan** execution, followed by a **single approval gate** before manual build.

**Key Features**:

- Scout and plan run in throwaway sub-agent contexts (clean, no pollution)
- Fully autonomous execution (no approval between scout/plan)
- Single approval gate after both reports ready
- Risk-weighted complexity scoring for decision support
- Build executes in main context with your oversight

**IMPORTANT OUTPUT FORMATTING:**

- Present all summary outputs using clean markdown format
- Use headers, bold text, and bullet lists for scannable content
- Avoid ASCII art boxes or excessive decoration
- Keep output professional and terminal-friendly

### Phase 0: Initialize

1. **Present start message to user**:

```markdown
## 🚀 Starting Autonomous Scout & Plan

**Objective:** {USER_OBJECTIVE}

This will run two phases automatically:

1. **Scout** - Research codebase and gather context
2. **Plan** - Create detailed implementation plan

You'll review both reports together and approve before build starts.

_Starting scout phase..._
```

### Phase 1: Autonomous Scout (Sub-Agent)

1. **Read meta-index for context** (in main context before launching sub-agent):
   - Read `.claude/knowledge/meta-index.md`
   - Search for related topics in "By Topic" section
   - Identify related scouts, plans, and knowledge files
   - Extract list of relevant prior work to pass to sub-agent

2. **Generate filename**:
   - Get current date: `DATE=$(date +%Y%m%d)`
   - Get developer initials: `INITIALS="jr"` (from git config user.name)
   - Count today's scouts: List files matching `${DATE}-*-${INITIALS}-scout-*.md`
   - Calculate NUMBER: count + 1, pad to 3 digits (001, 002, 003)
   - Store DATE, NUMBER, INITIALS for both scout and plan

3. **Launch Explore sub-agent** with comprehensive research prompt using Task tool:
   - subagent_type: "Explore"
   - description: "Scout codebase for {USER_OBJECTIVE}"
   - Prompt (below):

```
Research the codebase for objective: {USER_OBJECTIVE}

IMPORTANT - PRIOR WORK CONTEXT:
The meta-index has identified related work that you should be aware of:
- Related Scouts: {list scout numbers and topics from meta-index}
- Related Plans: {list plan numbers and topics from meta-index}
- Related Knowledge: {list knowledge files from meta-index}

Your mission is to EXTEND this prior work, not duplicate it. Focus on:
- NEW information not covered in related scouts
- GAPS identified in related work
- DIFFERENCES in current implementation vs prior patterns
- UPDATED context since prior work was done

MISSION:
You are conducting autonomous reconnaissance for development.
Complete this research independently without waiting for approval or asking questions.

RESEARCH TASKS:
1. Review prior work context (listed above)
   - Understand what's already known
   - Identify gaps in prior research
   - Note any outdated information

2. Analyze current state related to the objective
   - What exists today in the codebase?
   - Current architecture and patterns
   - Relevant frameworks and tools in use

3. Identify key files and patterns
   - Use Grep to search for relevant code patterns
   - Use Glob to explore directory structures
   - Read key files to understand implementation
   - Examine similar existing features

4. Document dependencies and integrations
   - Internal: Other systems/modules this touches
   - External: Third-party libraries, frameworks
   - Data flow: How information moves through the system

5. Provide implementation recommendations
   - Recommended approach with rationale
   - How this differs from/builds upon related work
   - Challenges to consider
   - Resources needed
   - Complexity level (Low/Medium/High)

OUTPUT REQUIREMENTS:
Generate scout report at: {SCOUT_REPORTS_DIR}/{DATE}-{NUMBER}-{INITIALS}-scout-{brief-title}.md

Use this EXACT structure:

# Scout Report: {Objective Title}

**Created**: {YYYY-MM-DD}
**Task**: {Full description}
**Status**: Complete

## Related Work Reviewed
- **Scouts**: {List scout numbers and key learnings}
- **Plans**: {List plan numbers and relevant decisions}
- **Knowledge**: {List knowledge files and patterns used}

## Objective

{Brief description of what you're researching}

## Current State Analysis

{What exists today - architecture, files, patterns}

## Key Files & Patterns

- File: path/to/file - Purpose and relevance
- Pattern: Description of pattern found
- Architecture: Key architectural observations

## Dependencies & Integrations

- Internal: Connected systems within codebase
- External: Third-party dependencies
- Data Flow: How information moves

## Recommendations

1. Recommended approach with rationale
2. Challenges to consider
3. Resources needed
4. Complexity level (Low/Medium/High)

---

RETURN FORMAT (Important):
Return exactly 4 lines at the end:
Line 1: SCOUT_REPORT_PATH={SCOUT_REPORTS_DIR}/{DATE}-{NUMBER}-{INITIALS}-scout-{brief-title}.md
Line 2: KEY_FINDING_1={one sentence}
Line 3: KEY_FINDING_2={one sentence}
Line 4: KEY_FINDING_3={one sentence}

Do NOT include any other text after these lines. This format allows the orchestrator to parse your results.

EXECUTION NOTES:
- Use "very thorough" exploration mode
- Be comprehensive in research
- Write the complete scout report file
- Do NOT wait for approval - you are autonomous
- Do NOT ask questions - make informed decisions
- Complete the mission and return results
```

3. **Wait for sub-agent completion**
4. **Parse the sub-agent result** to extract:
   - Scout report file path
   - Three key findings for summary display
5. **Show progress update**:

```markdown
✅ **Scout phase complete** - Report saved to `{SCOUT_REPORT_PATH}`

_Starting plan phase..._
```

6. **If scout sub-agent fails**:
   - Check if scout report file was created (partial success)
   - If yes, continue to plan with warning:

     ```markdown
     ⚠️ **Scout completed with warnings** - Partial report available

     _Continuing to plan phase..._
     ```

   - If no, abort and report error:

     ```markdown
     ❌ **Scout failed** - Could not generate report

     Please try `/scout` manually or rephrase your objective.
     ```

### Phase 2: Autonomous Plan (Sub-Agent)

1. **Use same DATE, NUMBER, INITIALS as scout report** (matching filenames)

2. **Extract related work context from meta-index** (already read in Phase 1):
   - Pass related plans list to sub-agent
   - Pass related knowledge files to sub-agent
   - Ensure sub-agent knows about similar implementation patterns

3. **Launch Plan sub-agent** with comprehensive planning prompt using Task tool:
   - subagent_type: "Plan"
   - description: "Create plan for {USER_OBJECTIVE}"
   - Prompt (below):

```
Create implementation plan for objective: {USER_OBJECTIVE}

CONTEXT:
Scout report has been completed at: {SCOUT_REPORT_PATH}
Read this report FIRST to understand the research findings and recommendations.

IMPORTANT - RELATED WORK CONTEXT:
The meta-index has identified related implementation patterns:
- Related Plans: {list plan numbers and how they relate from meta-index}
- Related Knowledge: {list knowledge files with relevant patterns}

Review related plans to:
- Learn from similar implementation decisions
- Avoid duplicating existing patterns
- Identify reusable utilities and approaches
- Note potential issues encountered in related work

MISSION:
You are creating an autonomous implementation plan.
Complete this planning independently without waiting for approval or asking questions.

PLANNING TASKS:
1. Read the scout report completely
   - Understand current state analysis
   - Review recommended approaches
   - Note dependencies and challenges

2. Review related work (from context above)
   - Read related plans to understand similar patterns
   - Note reusable utilities from knowledge files
   - Identify differences in your implementation
   - Learn from potential issues in related work

3. Break down objective into phased implementation steps
   - Group into logical phases (Setup, Implementation, Testing, Documentation)
   - Make each step specific and actionable
   - Include file paths and exact changes
   - Add checkboxes [ ] for all steps
   - Reference reusable utilities instead of creating duplicates

4. Create file changes matrix
   - List files to create, modify, or delete
   - Specify priority (High/Medium/Low)
   - Note purpose of each change

5. Define testing strategy
   - Unit tests needed
   - Integration tests needed
   - Manual verification steps
   - Quality checks (linting, formatting, type checking)

6. Assess risks
   - Identify potential issues with mitigations
   - Flag high-risk changes (breaking changes, core files, new patterns)

OUTPUT REQUIREMENTS:
Generate plan at: {PLANS_DIR}/{DATE}-{NUMBER}-{INITIALS}-plan-{brief-title}.md

Use this EXACT structure:

# Plan: {Objective Title}

**Created**: {YYYY-MM-DD}
**Status**: Planning
**Task**: {Full description}
**Scout Report**: `.claude/scout/{DATE}-{NUMBER}-{INITIALS}-scout-{brief-title}.md`

## Related Work
- **Related Plans**: {List plan numbers and how they relate - similar patterns, dependencies, etc.}
- **Related Knowledge**: {List knowledge files used for patterns/utilities}
- **Differences**: {How this plan differs from or builds upon related plans}

## Implementation Steps

### Step 1: {Step Name}
- [ ] Action item 1
- [ ] Action item 2
**Files**: `path/to/file.ts`
**Why**: {Reasoning}

### Step 2: {Step Name}
- [ ] Action item 1
- [ ] Action item 2
**Files**: `path/to/file.ts`
**Why**: {Reasoning}

[Continue for all steps...]

## Files to Modify
- `path/to/file1.ts` - {changes needed}
- `path/to/file2.tsx` - {changes needed}

## Files to Create
- `path/to/newfile.ts` - {purpose}

## Testing Strategy
- {How to test the changes}
- {What to verify}

## Potential Issues
- {Issue 1 and mitigation}
- {Issue 2 and mitigation}

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

RETURN FORMAT (Important):
Return exactly 3 lines at the end:
Line 1: PLAN_PATH={PLANS_DIR}/{DATE}-{NUMBER}-{INITIALS}-plan-{brief-title}.md
Line 2: PHASE_COUNT={number of phases/steps}
Line 3: TOTAL_STEPS={number of action items}

Do NOT include any other text after these lines. This format allows the orchestrator to parse your results.

EXECUTION NOTES:
- Read scout report completely before planning
- Be specific with file paths and changes
- Include comprehensive testing strategy
- Do NOT wait for approval - you are autonomous
- Do NOT ask questions - design based on scout findings
- Complete the mission and return results
```

3. **Wait for sub-agent completion**
4. **Parse the sub-agent result** to extract:
   - Plan file path
   - Phase count, step count
5. **Show progress update**:

```markdown
✅ **Plan phase complete** - Plan saved to `{PLAN_PATH}`

_Calculating complexity score..._
```

6. **If plan sub-agent fails**:
   - Retry ONCE with smaller scope: "Focus on Phase 1 only, create minimal viable plan"
   - If second attempt fails, check for partial plan file
   - If partial plan exists, continue to approval with warning
   - If no plan file, abort and show scout report only

### Phase 3: Calculate Complexity & Present Combined Summary

1. **Read the generated plan file** to calculate risk-weighted complexity

2. **Calculate complexity score**:

   **Base Complexity (0-10 scale)**:

   ```
   Files Changed Score:
   - Count files in "Files to Modify" + "Files to Create"
   - 1-5 files = 2 points
   - 6-10 files = 4 points
   - 11-20 files = 6 points
   - 21+ files = 8 points

   Dependencies Score:
   - Count dependencies in scout report
   - 1-3 deps = 1 point
   - 4-8 deps = 2 points
   - 9+ deps = 3 points

   Complexity Indicators:
   - New architecture/pattern mentioned = 2 points
   - Breaking changes mentioned = 2 points
   - Multiple subsystems affected = 1 point

   Base = Files + Dependencies + Indicators (max 13, normalized to 10)
   ```

   **Risk Multipliers**:

   ```
   Check plan for risk indicators:
   - "core" or "shared" in file paths → ×1.3 (affects multiple areas)
   - "breaking" in potential issues → ×1.4 (backward incompatibility)
   - "new pattern" or "new architecture" → ×1.2 (unproven approach)
   - "database" or "migration" → ×1.3 (data risk)

   Final Score = (Base / 13 × 10) × Risk Multipliers
   Capped at 10.0
   ```

   **Risk Level**:
   - 0-3.0: Low
   - 3.1-6.0: Moderate
   - 6.1-8.0: High
   - 8.1-10.0: Critical

3. **Extract first 3 steps from plan** for preview

4. **Present combined summary**:

```markdown
# ✅ Autonomous Scout & Plan Complete

## 📋 Scout Report #{NUMBER}: {TITLE}

**Key Findings:**

- {KEY_FINDING_1}
- {KEY_FINDING_2}
- {KEY_FINDING_3}

**Recommended Approach:** {One sentence from recommendations}

---

## 📋 Implementation Plan #{NUMBER}: {TITLE}

### Complexity Assessment

**Score:** {SCORE}/10 ({RISK_LEVEL})

{If score > 6.0, include:}
**Risk Factors:**

- {Risk factor 1}
- {Risk factor 2}

### Plan Overview

- **Phases:** {PHASE_COUNT} phases
- **Action Items:** {TOTAL_STEPS} total actions
- **Files:** {X} to create, {Y} to modify

### Top Risks

- {Risk 1 from potential issues}
- {Risk 2 from potential issues}

### First Steps

1. {Step 1 from plan}
2. {Step 2 from plan}
3. {Step 3 from plan}

{If TOTAL*STEPS > 3: *...and {TOTAL*STEPS - 3} more action items*}

---

## 📁 Detailed Reports

- **Scout:** `{SCOUT_REPORT_PATH}`
- **Plan:** `{PLAN_PATH}`

---

## ❓ Ready to Build?

Type **'yes'** or **'y'** to proceed with implementation
Type **'n'** to review reports first
```

5. **Wait for user input**
6. **If user approves** (types 'yes', 'y', 'Y', or just presses enter):
   - Proceed to Phase 4 (Build)
7. **If user declines**:
   - Output: "Reports saved. Use /build command when ready to implement."
   - Exit gracefully

### Phase 4: Build Execution (Main Context - Your Oversight)

**Only executes if user approved in Phase 3**

1. **Read the plan file** at {PLAN_PATH} completely
2. **Execute implementation steps in order**:
   - For each step:
     - Announce: "Executing: {step description}"
     - Perform the actions (Create/Modify/Delete files)
     - Update plan file: change `- [ ]` to `- [x]`
     - Show progress: "✅ Step X/Y complete"
3. **After all steps complete**:
   - Run quality checks from plan
   - Show completion summary
   - If quality checks fail, report issues
4. **Update plan file**:
   - Change `**Status**: Planning` to `**Status**: Completed`
   - Add `**Completed**: {YYYY-MM-DD}`
5. **Present completion summary**:
   - Total steps completed
   - Quality check results
   - Files changed summary
   - Suggested next steps

## Report

### Combined Scout & Plan Report (After Phase 2)

Show the approval gate format above with:

- Scout key findings (3 bullets)
- Plan complexity score with risk factors
- Plan overview (phases, steps, file changes)
- First 3 steps preview
- File paths for detailed review
- Single yes/no approval prompt

### Build Progress (During Phase 4)

```markdown
## 🔨 Building: Plan #{NUMBER}: {TITLE}

### Current: {CURRENT_PHASE_NAME}

- ✅ {description of completed action 1}
- ✅ {description of completed action 2}
- 🔄 {description of in-progress action} _(in progress)_

**Progress:** {X}/{TOTAL_STEPS} actions complete ({PERCENT}%)
```

### Build Completion (After Phase 4)

```markdown
# ✅ Implementation Complete!

## 📊 Summary

- **Steps Completed:** {X}/{X}
- **Files Created:** {N}
- **Files Modified:** {M}

## ✓ Quality Validation

- **Prettier:** ✅ Passed
- **ESLint:** ✅ Passed
- **TypeScript:** ✅ Passed
- **Testing:** {status with details}

## 📝 Next Steps

1. Review the changes in your editor
2. Test the implementation manually
3. Run tests: `npm test` (if applicable)
4. Commit: `git add . && git commit -m "feat: {brief description}"`
5. Create PR: `gh pr create` (if using branches)

---

**Updated Plan:** `{PLAN_PATH}`
```

## Error Handling

### Scout Sub-Agent Failures

- **If scout crashes**: Check for partial scout report file
- **If partial report exists**: Show warning, continue to plan with partial findings
- **If no report exists**: Abort workflow, show error, suggest manual /scout

### Plan Sub-Agent Failures

- **First failure**: Retry automatically with simpler scope ("Focus on Phase 1 only")
- **Second failure**: Check for partial plan file
- **If partial exists**: Continue to approval with warning about incomplete plan
- **If no plan exists**: Abort, show scout report only, suggest manual /plan

### Build Execution Issues

- **Step fails**: Report error, ask whether to continue or abort
- **Quality checks fail**: Show failures, ask whether to fix or continue
- **User cancels**: Save progress in plan file (mark completed steps), exit gracefully

### Directory Issues

- **If {SCOUT_REPORTS_DIR} doesn't exist**: Create automatically
- **If {PLANS_DIR} doesn't exist**: Create automatically
- **If file write fails**: Report permission error, suggest resolution

## Usage Examples

```bash
# Autonomous scout + plan with single approval
/auto_scout_plan_build Add dark mode support to the component library

# System will:
# 1. Scout sub-agent researches (autonomous)
# 2. Plan sub-agent designs (autonomous)
# 3. Shows combined summary with complexity score
# 4. Waits for your approval
# 5. If approved, executes build in main context with your oversight
```

## Notes

- Scout and plan run in **throwaway contexts** (no pollution of main context)
- **No approvals** between scout and plan (fully automatic)
- **Single approval gate** after both reports ready
- **Complexity score** helps you decide (risk-weighted, 0-10 scale)
- **Build in main context** so you can guide, debug, and intervene
- **Graceful degradation** if sub-agents fail (retry, partial reports, fallback)
- Compatible with existing /scout, /plan, and /build commands

---

**Comparison to /scout_plan_build**:

- Old: Manual execution in main context, approval after each phase
- New: Sub-agents for scout/plan (automatic), single approval, build in main
- Benefit: Faster, cleaner context, better oversight where it matters
