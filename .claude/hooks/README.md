# Claude Code Safety Hooks

This directory contains validation hooks that protect against dangerous commands and operations before execution.

## Overview

Hooks run **before** Claude executes commands, allowing us to block potentially destructive operations. This provides a multi-layered safety system beyond basic permissions.

**Implementation**: All hooks are written in **bash** to avoid Python dependencies.

## Security Hooks (4 Total)

### 1. Bash Command Validator (`validate-bash-command.sh`)

**Purpose**: Blocks dangerous bash commands before execution
**Applies To**: All `Bash` tool usage
**Language**: Bash (no Python dependency)

**Protected Patterns**:

#### Destructive File Operations

- `rm -rf /` - Recursive force delete from root
- `rm -rf ~` - Recursive force delete from home
- `rm -rf *` - Recursive force delete with wildcard
- `rm --no-preserve-root` - Bypass root protection

#### Disk Operations

- `dd if=... of=/dev/...` - Direct disk writes
- `mkfs` - Format filesystem
- `fdisk` - Disk partitioning

#### System Modification

- `> /dev/sda` - Writing to disk device
- `:(){ }; :` - Fork bomb (DoS attack)
- `chmod -R 777 /` - Recursive 777 from root
- `chown -R ... /` - Recursive ownership change from root

#### Package Manager Dangers

- `apt-get remove ... linux-*` - Removing kernel packages
- `yum remove ... kernel` - Removing kernel packages

#### Network/Remote Dangers

- `curl ... | bash` - Piping remote script to bash
- `wget ... | sh` - Piping remote script to shell
- `curl ... | sudo bash` - Running remote script as root

#### Process/System Control

- `killall -9` - Force killing all processes
- `pkill -9` - Force killing processes by pattern
- `shutdown` - System shutdown
- `reboot` - System reboot
- `halt` - System halt

#### Suspicious Combinations

- `sudo rm -rf ...` - Sudo with force/recursive delete

---

### 2. Git Operations Protection (`protect-git-operations.sh`)

**Purpose**: Prevents destructive or irreversible git operations
**Applies To**: All `Bash` tool usage with git commands
**Language**: Bash (no Python dependency)

**Protected Operations**:

#### Force Push

- `git push --force` - Overwrites remote history
- `git push -f` - Force push shorthand
- `git push --force-with-lease` - Still rewrites history
- Force push to main/master/production - **EXTREMELY DANGEROUS**

#### Hard Reset

- `git reset --hard` - Discards uncommitted changes permanently
- `git reset HEAD~N` - Resetting multiple commits

#### Destructive Operations

- `git clean -fdx` - Removes untracked files permanently
- `git branch -D` - Force delete without merge check
- `git reflog delete/expire` - Removes recovery options
- `git prune` - Permanently deletes unreachable objects
- `git gc --aggressive` - Aggressive garbage collection

#### History Rewriting

- `git filter-branch` - Rewrites history (irreversible)
- `git rebase -i` of pushed commits
- `git rebase --onto` - Complex rebasing

#### Configuration

- `git config --global` - Affects all repositories
- Changing `core.hooksPath` - Could disable safety hooks

---

### 3. Sensitive File Protection (`protect-sensitive-files.sh`)

**Purpose**: Blocks Edit/Write operations on sensitive files
**Applies To**: `Edit` and `Write` tools
**Language**: Bash (no Python dependency)

**Protected Files**:

#### Environment Variables

- `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.test`
- Prevents accidental modification of environment configurations

#### Credentials

- `credentials.json`, `credentials.yml`, `credentials.yaml`
- `secrets.json`, `secrets.yml`, `secrets.yaml`
- `.npmrc`, `.yarnrc`, `.pypirc`
- `auth.json`, `token.json`

#### Lock Files (Package Manager)

- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `composer.lock`, `Gemfile.lock`, `poetry.lock`
- `Pipfile.lock`, `go.sum`, `Cargo.lock`

#### Certificates & Keys

- `.pem`, `.key`, `.crt`, `.cer`, `.p12`, `.pfx`
- `.jks`, `.keystore`
- `id_rsa`, `id_ed25519`, `id_ecdsa` (SSH keys)

#### Protected Directories

- `.git/` - Version control internals
- `.ssh/` - SSH keys and config
- `.aws/` - AWS credentials
- `.kube/` - Kubernetes config
- `node_modules/.bin/` - Executable scripts

#### Pattern Detection

Files with these patterns in name:

- `secret`, `password`, `passwd`
- `credential`, `token`, `api_key`
- `private`, `auth_`

---

### 4. Credential Exposure Prevention (`prevent-credential-exposure.sh`)

**Purpose**: Prevents READ access to credential files
**Applies To**: `Read` tool only
**Language**: Bash (no Python dependency)

**Why This Matters**: Even reading credential files can expose secrets in:

- Chat history
- Log files
- Screen recordings
- Clipboard
- Debugging output

**Protected From Reading**:

- All environment files (`.env`, `.env.*`)
- All credential files (`credentials.*`, `secrets.*`)
- AWS credentials (`.aws/credentials`, `.aws/config`)
- SSH private keys (`.ssh/id_*`)
- NPM/Yarn auth files (`.npmrc`, `.yarnrc`)
- Certificate/key files (`.pem`, `.key`, `.p12`, etc.)
- Files with sensitive patterns: `secret`, `password`, `token`, `api_key`

**Note**: `.env.example` files are allowed (they should contain placeholders)

---

---

## Auto-Maintenance Hooks (3 Total)

### 5. File Change Tracker (`track-file-changes.sh`)

**Purpose**: Silently logs Edit/Write events and nudges at thresholds
**Type**: PostToolUse hook
**Applies To**: `Edit` and `Write` tools
**Behavior**:

- Appends each file change to `.claude/maintenance/change-log.jsonl`
- Increments edit counter in `.claude/maintenance/state.json`
- Outputs `[maintenance-hint]` every 25 edits (throttled)
- Skips changes to `.claude/maintenance/` itself

### 6. Maintenance Event Detector (`detect-maintenance-events.sh`)

**Purpose**: Detects git commits, builds, and tests to trigger maintenance
**Type**: PostToolUse hook
**Applies To**: `Bash` tool
**Detected Events**:

- `git commit` - Nudges for knowledge base update
- `npm run build` - Nudges for cleanup + knowledge update
- `npm test` / `npm run test` - Logs test runs
- `npm run typecheck` - Signals end of build cycle

### 7. Session End Check (`session-end-maintenance.sh`)

**Purpose**: Flags pending maintenance for the next session
**Type**: Stop hook
**Behavior**:

- Checks if 10+ edits or 2+ commits happened without maintenance
- Sets `maintenance_pending: true` in state file
- Next session picks this up via CLAUDE.md startup instructions

### Maintenance Script (`maintenance.sh`)

**Purpose**: Callable cleanup script (not a hook)
**Usage**: `bash .claude/hooks/maintenance.sh [--dry-run]`
**Actions**:

- Cleans scout reports older than 30 days
- Cleans completed plans older than 30 days
- Rotates change log at 500+ entries
- Reports stale knowledge files (60+ days)
- Resets tracking counters

---

## How It Works

### PreToolUse Hooks (Security)
1. Runs before Claude executes a tool
2. Pattern matches against dangerous operations
3. Exit code 2 blocks execution with error message
4. Exit code 0 allows safe commands to proceed

### PostToolUse Hooks (Maintenance)
1. Runs after Claude executes a tool
2. Logs events and checks thresholds
3. Output text with `[maintenance-hint]` prefix is shown to Claude
4. Claude acts on hints per CLAUDE.md instructions

## Testing the Hooks

Test individual hooks with sample JSON input:

```bash
# Test git operations protection
echo '{"tool_input": {"command": "git push --force origin main"}}' | .claude/hooks/protect-git-operations.sh

# Test credential exposure prevention
echo '{"tool_input": {"file_path": ".env"}}' | .claude/hooks/prevent-credential-exposure.sh

# Test sensitive file protection
echo '{"tool_input": {"file_path": "package-lock.json"}}' | .claude/hooks/protect-sensitive-files.sh

# Test bash command validation
echo '{"tool_input": {"command": "rm -rf /"}}' | .claude/hooks/validate-bash-command.sh
```

## Bypassing the Hook

If you need to run a blocked command:

1. **Verify** the command is correct and necessary
2. **Consider** safer alternatives first
3. **Run manually** in your terminal (outside Claude)
4. **Or temporarily disable** the hook in settings.local.json

### Disable Hook Temporarily

Edit `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [] // Empty array disables all PreToolUse hooks
  }
}
```

### Modify Hook Rules

Edit the bash scripts (e.g., [validate-bash-command.sh](./validate-bash-command.sh)) to adjust patterns or add exceptions.

## Adding New Patterns

To block additional dangerous patterns:

1. Open the appropriate bash script (e.g., `validate-bash-command.sh`)
2. Add a new pattern check using bash regex matching
3. Use the `block_operation` function with a descriptive reason
4. Test the pattern with sample commands

Example:

```bash
# Check for custom dangerous patterns
if [[ "$COMMAND" =~ npx[[:space:]]+create-react-app ]]; then
    block_operation "Use Vite instead of CRA"
fi

if [[ "$COMMAND" =~ yarn[[:space:]]+add ]]; then
    block_operation "This project uses npm, not yarn"
fi
```

## Security Notes

- Hooks run with your current credentials
- Review hook code before trusting it
- Hooks can access stdin/stdout/stderr
- Keep hook execution time fast (timeout: 5 seconds)

## Troubleshooting

### Hook Not Running

1. Check settings.local.json has hooks configuration
2. Verify script is executable: `chmod +x validate-bash-command.sh`
3. Test script directly: `echo '{"tool_input":{"command":"rm -rf /"}}' | .claude/hooks/validate-bash-command.sh`

### False Positives

If the hook blocks legitimate commands:

1. Review the command pattern in the bash script
2. Add exception logic using bash conditionals
3. Or use more specific regex patterns

### Hook Errors

Check stderr output for bash errors:

- JSON parsing errors (grep/sed issues)
- Regex pattern errors
- Permission errors (file not executable)

## Further Reading

- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks.md)
- [Hooks Guide](https://docs.claude.com/en/docs/claude-code/hooks-guide.md)
