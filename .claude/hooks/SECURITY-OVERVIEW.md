# Hooks System Overview

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Claude Code (AI Agent)                │
└─────────────────────┬───────────────────────────┘
                      │
                      │ Attempts operation
                      ▼
┌─────────────────────────────────────────────────┐
│              PreToolUse Hooks                   │
│          (Run BEFORE execution)                 │
├─────────────────────────────────────────────────┤
│  1. Bash Command Validator                      │
│     └─ Blocks: rm -rf, dd, fork bombs, curl|sh │
├─────────────────────────────────────────────────┤
│  2. Git Operations Protection                   │
│     └─ Blocks: force push, hard reset, clean   │
├─────────────────────────────────────────────────┤
│  3. Sensitive File Protection (Edit/Write)      │
│     └─ Blocks: .env, credentials, keys, locks  │
├─────────────────────────────────────────────────┤
│  4. Credential Exposure Prevention (Read)       │
│     └─ Blocks: reading .env, keys, AWS creds   │
└─────────────────────────────────────────────────┘
                      │
                      │ If allowed (exit 0)
                      ▼
┌─────────────────────────────────────────────────┐
│         Operation Executes                      │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│             PostToolUse Hooks                   │
│          (Run AFTER execution)                  │
├─────────────────────────────────────────────────┤
│  5. File Change Tracker (Edit/Write)            │
│     └─ Logs changes, nudges at 25-edit interval │
├─────────────────────────────────────────────────┤
│  6. Maintenance Event Detector (Bash)           │
│     └─ Detects commits, builds, quality checks  │
└─────────────────────────────────────────────────┘
                      │
                      │ When Claude stops
                      ▼
┌─────────────────────────────────────────────────┐
│                Stop Hook                        │
├─────────────────────────────────────────────────┤
│  7. Session End Maintenance Check               │
│     └─ Flags pending maintenance for next run   │
└─────────────────────────────────────────────────┘
```

## Protection Matrix

| Operation Type            | Bash Validator | Git Protection | File Protection | Read Protection |
| ------------------------- | -------------- | -------------- | --------------- | --------------- |
| `rm -rf /`                | BLOCKED        | -              | -               | -               |
| `git push --force`        | -              | BLOCKED        | -               | -               |
| Edit `.env`               | -              | -              | BLOCKED         | -               |
| Read `.env`               | -              | -              | -               | BLOCKED         |
| `curl \| bash`            | BLOCKED        | -              | -               | -               |
| `git reset --hard`        | -              | BLOCKED        | -               | -               |
| Write `package-lock.json` | -              | -              | BLOCKED         | -               |
| Read `credentials.json`   | -              | -              | -               | BLOCKED         |
| `npm run lint`            | ALLOWED        | -              | -               | -               |
| `git commit`              | -              | ALLOWED        | -               | -               |
| Edit `src/App.tsx`        | -              | -              | ALLOWED         | -               |
| Read `package.json`       | -              | -              | -               | ALLOWED         |

## Configuration

All hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": ["validate-bash-command.sh", "protect-git-operations.sh"] },
      { "matcher": "Read", "hooks": ["prevent-credential-exposure.sh"] },
      { "matcher": "Edit", "hooks": ["protect-sensitive-files.sh"] },
      { "matcher": "Write", "hooks": ["protect-sensitive-files.sh"] }
    ],
    "PostToolUse": [
      { "matcher": "Edit", "hooks": ["track-file-changes.sh"] },
      { "matcher": "Write", "hooks": ["track-file-changes.sh"] },
      { "matcher": "Bash", "hooks": ["detect-maintenance-events.sh"] }
    ],
    "Stop": [
      { "hooks": ["session-end-maintenance.sh"] }
    ]
  }
}
```

## Testing

```bash
# Run all tests
cd .claude/hooks && ./test-all-hooks.sh
```

## Auto-Maintenance Flow

The PostToolUse and Stop hooks enable transparent self-maintenance:

1. **Edit/Write** events are logged to `.claude/maintenance/change-log.jsonl`
2. **Git commits, builds, quality checks** trigger `[maintenance-hint]` nudges
3. Claude responds to nudges by invoking **knowledge-maintainer** agent and running **maintenance.sh**
4. At session end, the **Stop hook** flags pending maintenance for the next session
5. Next session reads the flag and runs cleanup automatically

All maintenance is invisible to the user unless errors occur.
