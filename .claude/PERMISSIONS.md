# Claude Code Permissions Configuration

This document explains the permissions configured for Claude Code in this project.

## Configuration Location

Permissions are configured in [.claude/settings.json](settings.json)

This is the recommended location for **team/project settings** that are:

- ✅ Checked into source control
- ✅ Shared with your team
- ✅ Applied consistently across developers

For **personal preferences** that shouldn't be shared, use `.claude/settings.local.json` (git-ignored automatically).

## Allowed Tools

All core tools are enabled for Claude Code by default. The settings.json does not restrict tool access - instead, it uses permission rules to control specific operations within tools (like Bash commands).

## Denied Commands (Blocked)

These operations are **always blocked** by hard deny rules in settings.json. Most security checks are handled by bash hooks for smarter filtering:

### System-Level Dangers (Hard Blocked)

1. `rm -rf /*` - Root directory deletion would destroy the system
2. `sudo *` - Sudo commands require explicit approval for security
3. `npm publish *` - Publishing to npm requires explicit approval
4. `chmod 777 *` - Setting 777 permissions is a security risk
5. `curl * | bash` - Piping curl to bash is a security risk
6. `wget * | sh` - Piping wget to shell is a security risk

### Why Only 6 Deny Rules?

We keep deny rules minimal and let **bash hooks** handle most security:

**Deny Rules** = Hard blocks for absolute dangers
**Bash Hooks** = Smart filtering with context awareness

For example:

- ❌ Deny rule blocks ALL `sudo` commands (no exceptions)
- ✅ Hook allows `git push --force origin feature/fix` but blocks `git push --force origin main`
- ✅ Hook blocks reading `.env` but allows `.env.example`
- ✅ Hook blocks editing `package-lock.json` but allows reading it

See [hooks/README.md](hooks/README.md) for complete protection details including:

- Git operations (force push, hard reset, branch deletion, history rewriting)
- Credential files (.env, secrets, keys, certificates)
- Sensitive files (lock files, config directories)
- Dangerous bash commands (rm -rf, dd, mkfs, fork bombs)

## Auto-Approved Commands

These commands are configured in `settings.json` under `permissions.allow` and run without requiring approval each time:

### File Operations (Read-Only)

- `ls` - List directory contents
- `cat` - Display file contents
- `pwd` - Print working directory
- `head` - View file beginning
- `tail` - View file end
- `wc` - Count lines/words
- `find` - Find files
- `grep` - Search in files

### Directory Navigation

- `cd` - Change directory
- `mkdir` - Create directories

### Development Environment

- `node --version` - Check Node version
- `npm --version` - Check npm version
- `which` - Locate commands

### Git Operations (Read-Only)

- `git status` - Check repository status
- `git branch` - List branches
- `git log` - View commit history
- `git diff` - View changes

### Quality Checks

- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript checks
- `npm run prettier` - Format code
- `npm test` - Run tests

### Utility Commands

- `echo` - Print messages
- `test` - Test conditions

## Commands That Require Approval

The following operations still require manual approval for safety:

### Destructive Operations

- File deletion (`rm`, `rmdir`)
- File moving (`mv`)
- Git commits and pushes
- `npm install` / `npm uninstall`
- Force operations (`--force`, `-f`)

### System Changes

- Permission changes (`chmod`, `chown`)
- Environment modifications
- Process killing
- Network operations (except approved git reads)

### Build Operations

- `npm run build` (may take significant time)
- `npm run deploy`
- Custom build scripts

## Safety Features

### Defense in Depth

Claude Code uses multiple layers of security. Each layer serves a different purpose:

**Layer 1: Deny Rules** (`.claude/settings.json` - 6 rules)

- **Purpose**: Absolute hard blocks for system-level dangers
- **Strategy**: Minimal, no-exception rules
- **Examples**: `rm -rf /*`, `sudo`, `npm publish`, `chmod 777`
- Custom deny messages explain why commands are blocked

**Layer 2: Bash Hooks** (`.claude/hooks/` - 4 scripts)

- **Purpose**: Context-aware intelligent filtering
- **Strategy**: Allow safe variants, block dangerous ones
- **Benefits**:
  - No Python dependency (pure bash)
  - Conditional logic (e.g., allow force push to feature branches, not main)
  - Pattern detection (e.g., detect secrets in filenames)
  - Better error messages with safe alternatives

**Active Hooks:**

- **prevent-credential-exposure.sh** - Blocks reading credential files
- **protect-git-operations.sh** - Controls destructive git operations
- **protect-sensitive-files.sh** - Protects lock files and sensitive files
- **validate-bash-command.sh** - Validates bash commands for dangerous patterns

**Layer 3: Manual Approval**

- **Purpose**: Human review for destructive operations
- **Strategy**: Require explicit approval for:
  - Git commits and pushes
  - File deletion/moving
  - Package installations
  - Build and deployment commands

### Pattern Matching

Auto-approval and deny rules use pattern matching:

- `Bash(ls:*)` - Matches any `ls` command with arguments
- `Bash(npm run lint)` - Matches exact command only
- `Read(.env*)` - Matches all .env files
- Wildcards allow flexibility while maintaining safety

## Customizing Permissions

### Adding Auto-Approved Commands

Edit `.claude/settings.json` and add to the `permissions.allow` array:

```json
"permissions": {
  "allow": [
    "Bash(ls:*)",
    "Bash(git status)",
    "Bash(your-command)",        // Exact command
    "Bash(your-command:*)"        // With wildcard for arguments
  ],
  "deny": [...]
}
```

### Removing Auto-Approval

Remove the command from the `permissions.allow` array, or move it to a comment:

```json
"permissions": {
  "allow": [
    "Bash(git status)",
    // "Bash(npm test)"  // Removed - will now require approval
  ]
}
```

### Adding Deny Rules

Edit `.claude/settings.json` and add to the `permissions.deny` array:

```json
"permissions": {
  "allow": [...],
  "deny": [
    "Bash(rm -rf /*)",
    "Bash(your-dangerous-command *)",
    "Read(.env)"
  ]
}
```

**Note:** Deny rules block commands completely. For context-aware filtering (e.g., allow `.env.example` but block `.env`), use bash hooks instead.

**When to use deny rules:**

- Commands that could cause data loss
- Operations that expose credentials
- System-level changes
- Irreversible operations

### Personal vs Team Settings

- **Team settings**: `.claude/settings.json` (committed to repo)
- **Personal settings**: `.claude/settings.local.json` (git-ignored)
- **Global settings**: `~/.claude/settings.json` (applies to all projects)

## Best Practices

### ✅ Safe to Auto-Approve

- Read-only operations
- Status/information commands
- Quality checks (lint, typecheck)
- Safe git read operations

### ⚠️ Require Approval

- Write/delete operations
- Git commits and pushes
- Package installations
- Build/deployment commands
- System modifications

### 🔒 Additional Security

- Review git hooks configuration
- Use specific patterns, not broad wildcards
- Test new auto-approvals carefully
- Keep destructive operations manual

## Testing Permissions

Test that permissions work correctly:

```bash
# Should auto-approve
/test Run git status and show me the output

# Should require approval
/test Commit these changes with message "test"

# Should auto-approve
/test Run npm run lint and fix any issues

# Should require approval
/test Run npm install express
```

## Troubleshooting

### Command Requires Approval Unexpectedly

1. Check if pattern matches exactly in `autoApproveTools`
2. Verify wildcards are used correctly (`:*` for arguments)
3. Ensure command is in `allowedTools` list

### Command Not Working at All

1. Verify tool is in `allowedTools`
2. Check for git hooks blocking the operation
3. Review error message for security warnings

### Git Hooks Blocking Operations

1. Check `.claude/hooks/` for relevant hooks
2. Review hook configuration
3. Hooks may require specific conditions to be met

## Security Notes

- **Review regularly** - Audit auto-approvals periodically
- **Start conservative** - Add auto-approvals as needed
- **Test thoroughly** - Verify new patterns work as expected
- **Use git hooks** - Add additional protection layers
- **Monitor usage** - Watch for unexpected behavior

## Related Documentation

- [Main README](README.md) - Overview of .claude directory
- [Security Overview](hooks/SECURITY-OVERVIEW.md) - Git hooks security
- [Settings File](settings.json) - Project settings

## Support

For issues with permissions:

- Claude Code Docs: https://docs.claude.com/en/docs/claude-code
- Settings Reference: https://docs.claude.com/en/docs/claude-code/settings
- Issues: https://github.com/anthropics/claude-code/issues
