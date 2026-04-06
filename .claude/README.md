# Claude Code Configuration

This directory contains all configuration and documentation for working with Claude Code in this project.

## Directory Structure

```
.claude/
├── README.md              # This file - overview of .claude directory
├── PERMISSIONS.md         # Tool permissions and security configuration
├── settings.json          # Team settings (committed to repo)
├── settings.local.json    # Personal settings (git-ignored)
├── agents/                # Sub-agents for specialized tasks
├── commands/              # Custom slash commands
├── config/                # Configuration files (external-docs.json)
├── hooks/                 # Security hooks + auto-maintenance hooks
├── knowledge/             # Feature documentation and patterns
│   └── external/          # Cached external documentation
├── maintenance/           # Runtime state for auto-maintenance (gitignored)
├── mcp-servers/           # MCP server implementations
│   └── doc-fetcher/       # Documentation fetching server
├── plans/                 # Implementation plans
└── scout/                 # Scout reports (research phase)
```

## Workflow Overview

### Scout → Plan → Build

This project uses a three-phase workflow:

1. **🔍 Scout** - Research and understand the codebase
   - Output: `.claude/scout/NNN-scout-description.md`
   - Command: `/scout` or `/auto_scout_plan_build`

2. **📋 Plan** - Create detailed implementation plan
   - Output: `.claude/plans/NNN-description.md`
   - Command: `/plan` or `/auto_scout_plan_build`

3. **🔨 Build** - Execute the plan with quality checks
   - Updates: Plan file with ✅ checkmarks
   - Command: `/build` or `/auto_scout_plan_build`

## Directory Details

### 📁 agents/

Sub-agents that handle specialized tasks autonomously:

- **agent-architect.md** - Design and build new AI agents (Ruby Scaffold methodology)
- **code-reviewer.md** - Elite code review with security and performance analysis
- **doc-fetcher.md** - Fetch and cache external documentation
- **git-wizard.md** - Git operations (branches, commits, PRs, rebasing)
- **knowledge-maintainer.md** - Updates knowledge base after builds
- **meta_agent.md** - Creates new sub-agent configurations

### 📁 commands/

Custom slash commands for common workflows:

**Workflow Commands:**

- **scout.md** - Research codebase using Task agent
- **plan.md** - Create implementation plan from scout findings
- **build.md** - Execute approved plan with progress tracking
- **scout_plan_build.md** - Full workflow with approval gates
- **auto_scout_plan_build.md** - Autonomous scout+plan, single approval

**Quality Commands:**

- **review.md** - Comprehensive code review using Pragmatic Quality framework
- **security-review.md** - Security-focused review of code changes

**Documentation Commands:**

- **fetch-docs.md** - Fetch external documentation for tracked packages
- **update-docs.md** - Check for and update external documentation
- **track-docs.md** - Add new package to documentation tracking

**Brainstorming:**

- **brainstorm.md** - Interactive brainstorming for exploring ideas and approaches

**Meta Commands:**

- **meta_command.md** - Create new slash commands

### 📁 config/

Configuration files for Claude Code features:

- **external-docs.json** - Tracks packages and versions for documentation fetching

### 📁 hooks/

**Security hooks** (PreToolUse — run before operations):

- **validate-bash-command.sh** - Blocks dangerous bash commands
- **protect-git-operations.sh** - Prevents destructive git operations
- **protect-sensitive-files.sh** - Protects critical files from modification
- **prevent-credential-exposure.sh** - Blocks reading credential files

**Auto-maintenance hooks** (PostToolUse/Stop — run after operations):

- **track-file-changes.sh** - Logs Edit/Write events, nudges at thresholds
- **detect-maintenance-events.sh** - Detects commits/builds, triggers knowledge updates
- **session-end-maintenance.sh** - Flags pending maintenance for next session
- **maintenance.sh** - Callable cleanup script (stale scouts, old plans, log rotation)

**Testing:**

- **test-all-hooks.sh** - Comprehensive test suite for all hooks

See [hooks/README.md](hooks/README.md) for detailed documentation.

### 📁 knowledge/

Feature area documentation and patterns:

- **agent-methodology/** - V2 agent architecture (Ruby Scaffold's Builder's Creed)
- **external/** - Cached external documentation (populated via `/fetch-docs`)
- Project-specific patterns and documentation (created as you build)

See [knowledge/README.md](knowledge/README.md) for details.

### 📁 mcp-servers/

Model Context Protocol (MCP) server implementations:

- **doc-fetcher/** - Fetches and caches external documentation from web sources
  - Used by `/fetch-docs`, `/update-docs`, `/track-docs` commands
  - Integrates with doc-fetcher agent for intelligent documentation management

### 📁 plans/

Implementation plans with detailed steps:

- Numbered sequentially (001, 002, 003...)
- Track progress with checkboxes
- Link to corresponding scout reports
- Updated during build phase

See [plans/README.md](plans/README.md) for details.

### 📁 scout/

Scout reports from research phase:

- Numbered sequentially (001, 002, 003...)
- Document existing code and patterns
- Provide recommendations
- Feed into implementation plans

See [scout/README.md](scout/README.md) for details.

## Quick Start

### Running a Full Workflow

**Fastest (Recommended):**

```bash
/auto_scout_plan_build [Your objective description]
# Example: /auto_scout_plan_build Add dark mode toggle to settings
```

- Autonomous scout + plan phases
- Single approval gate before build
- Most efficient for well-defined tasks

**Traditional (More Control):**

```bash
/scout_plan_build [Your objective description]
# Approval at each phase: scout → approval → plan → approval → build
```

**Manual (Maximum Control):**

```bash
/scout              # Research first, creates scout report
/plan               # Review scout report, create plan
/build              # Review plan, execute implementation
```

### Code Review & Quality

```bash
/review              # Comprehensive code review (Pragmatic Quality framework)
/security-review     # Security-focused review of pending changes
```

### Managing External Documentation

```bash
/fetch-docs [package]    # Fetch docs for specific package (e.g., react, vite)
/update-docs             # Check for updates based on package.json changes
/track-docs [package]    # Add new package to documentation tracking
```

External documentation is automatically checked by **knowledge-maintainer** agent after builds.
See [knowledge/external-docs-management.md](knowledge/external-docs-management.md) for details.

### Brainstorming & Planning

```bash
/brainstorm [Topic or feature to explore]
# Interactive session for exploring ideas and architectural approaches
```

### Creating Custom Commands

```bash
/meta_command [Description of what the command should do]
# Example: /meta_command Create a command that runs tests and generates coverage
```

### Git Operations

The **git-wizard** agent is automatically invoked for:

- Creating branches (follows naming convention: TICKET-NUMBER-description)
- Making commits (conventional commits, co-authored by Claude)
- Creating pull requests (auto-generates PR description)
- Rebasing and branch management

## File Versioning

All commands and agents follow semantic versioning:

```yaml
version: 1.0.0
```

Update versions when making breaking changes to command interfaces.

## Best Practices

### When to Use Each Workflow

| Command                       | Use When                                        | Approval Gates              | Speed             |
| ----------------------------- | ----------------------------------------------- | --------------------------- | ----------------- |
| `/auto_scout_plan_build`      | Well-defined task, trust Claude to scout & plan | 1 (before build)            | ⚡️⚡️⚡️ Fastest |
| `/scout_plan_build`           | Want to review scout findings before planning   | 2 (after scout, after plan) | ⚡️⚡️ Medium     |
| `/scout` → `/plan` → `/build` | Maximum control, complex/uncertain tasks        | 3 (manual at each step)     | ⚡️ Slowest       |

### Knowledge Base Guidelines

✅ **Do:**

- Reference knowledge files **before** creating new utilities (avoid duplication)
- Update knowledge files when adding new patterns or utilities
- Create knowledge files for frequently-worked feature areas
- Keep knowledge files current as features evolve

❌ **Don't:**

- Skip checking knowledge base (leads to duplicate utilities)
- Let knowledge files become stale
- Create knowledge files for one-off features

### Workflow Report Guidelines

**Scout Reports** answer:

- "What exists and how does it work?"
- "What patterns are already in place?"
- "What dependencies and integrations exist?"

**Implementation Plans** answer:

- "How should we implement this?"
- "What steps are required?"
- "What are the risks and mitigations?"

**Keep reports updated** as implementation evolves (living documents)

## Configuration

### Command Frontmatter

All commands use standardized frontmatter:

```yaml
---
description: Brief description of what this command does
category: workflow | meta | code-review
version: 1.0.0
allowed-tools: Task, Read, Write, Edit, Bash, Grep, Glob
argument-hint: [description of arguments]
model: sonnet | opus | haiku
---
```

### Permissions

Tool permissions are configured in `.claude/settings.json`:

- **Allowed Tools** - Which tools Claude can access
- **Auto-Approved Commands** - Commands that run without approval
- **Team Settings** - Shared with repository (`.claude/settings.json`)
- **Personal Settings** - Git-ignored (`.claude/settings.local.json`)

See [PERMISSIONS.md](PERMISSIONS.md) for detailed configuration guide.

## Agents Overview

Claude Code uses specialized sub-agents for complex tasks:

| Agent                    | Purpose                                  | When Used                                    |
| ------------------------ | ---------------------------------------- | -------------------------------------------- |
| **agent-architect**      | Design and build new AI agents           | When designing agents (Ruby Scaffold method) |
| **code-reviewer**        | Elite code review, security, performance | Proactively after significant code changes   |
| **doc-fetcher**          | Fetch external documentation             | `/fetch-docs`, `/update-docs`, `/track-docs` |
| **git-wizard**           | Git operations (commits, PRs, branches)  | Automatically for all git workflows          |
| **knowledge-maintainer** | Updates knowledge base after builds      | Proactively after `/build` completes         |
| **meta_agent**           | Creates new sub-agent configs            | `/meta_agent` or when creating agents        |

**Proactive agents** (automatically invoked):

- `code-reviewer` - After writing significant code
- `knowledge-maintainer` - After build phase completes
- `git-wizard` - For all git operations (commits, PRs, branches)

## Security Features

The `.claude/hooks/` directory contains security scripts that protect:

- **Git operations** - Prevents destructive commands (force push to main, hard reset)
- **Credentials** - Blocks reading API keys, tokens, passwords
- **Sensitive files** - Protects critical files from accidental modification
- **Bash commands** - Validates commands before execution

All hooks run automatically when Claude Code executes operations.
See [hooks/README.md](hooks/README.md) and [hooks/SECURITY-OVERVIEW.md](hooks/SECURITY-OVERVIEW.md).

## Auto-Maintenance System

The project self-maintains as you work:

- **PostToolUse hooks** track file changes and detect commits/builds
- **`[maintenance-hint]` signals** prompt Claude to update knowledge and clean artifacts
- **Stop hook** flags pending maintenance for the next session
- **CLAUDE.md instructions** tell Claude when to invoke the knowledge-maintainer agent

Maintenance is invisible — Claude handles cleanup, knowledge updates, and artifact rotation automatically between tasks. See the Self-Maintenance section in [CLAUDE.md](/CLAUDE.md).

## Common Workflows

### 1. Feature Development

```bash
/auto_scout_plan_build Implement user authentication system
# Scout → Plan → Approve → Build
# Auto-invokes: git-wizard (branch), code-reviewer (review), knowledge-maintainer (docs)
```

### 2. Bug Fix

```bash
/scout_plan_build Fix login redirect issue
# More control with approval after scout phase
```

### 3. Code Review

```bash
/review               # Before committing
/security-review      # Before deploying
```

### 4. Documentation Update

```bash
/update-docs          # Check for package updates
/fetch-docs react     # Fetch specific package docs
```

### 5. Brainstorming Architecture

```bash
/brainstorm State management approach for multi-tenant theming
```

## Contributing

When adding new commands or agents:

1. **Follow naming conventions**
   - Commands: `kebab-case.md`
   - Agents: `kebab-case.md`
   - Plans/Scouts: `NNN-description.md` (3-digit sequential)

2. **Include proper frontmatter**

   ```yaml
   ---
   description: Brief description
   category: workflow | meta | code-review
   version: 1.0.0
   allowed-tools: Task, Read, Write, Edit, Bash, Grep, Glob
   ---
   ```

3. **Add clear documentation**
   - Purpose and use cases
   - Input parameters
   - Expected outputs
   - Examples

4. **Update this README** if adding new:
   - Directories
   - Commands
   - Agents
   - Workflows

5. **Test thoroughly**
   - Run the command/agent
   - Verify expected behavior
   - Check error handling

## Troubleshooting

### Command not found

- Check available commands with `/help`
- Verify command file exists in `.claude/commands/`
- Check frontmatter is valid YAML

### Permission denied

- Check `.claude/PERMISSIONS.md`
- Update `.claude/settings.json` or `.claude/settings.local.json`
- Verify tool is in `allowed-tools` frontmatter

### Agent not working

- Verify agent file exists in `.claude/agents/`
- Check agent is properly configured
- Review agent logs in conversation

### Hook blocking operation

- Review error message from hook
- Check [hooks/README.md](hooks/README.md) for hook details
- Update code to pass hook validation
- If needed, temporarily disable in `.claude/settings.local.json` (not recommended)

## Support & Resources

**Claude Code Documentation:**

- Official Docs: https://docs.claude.com/en/docs/claude-code
- Issues: https://github.com/anthropics/claude-code/issues

**Project-Specific:**

- [CLAUDE.md](/CLAUDE.md) - Project coding guidelines
- [PERMISSIONS.md](PERMISSIONS.md) - Security and permissions
- [knowledge/](knowledge/) - Feature area documentation
- [hooks/README.md](hooks/README.md) - Security hooks documentation

---

**Last Updated:** December 2025
