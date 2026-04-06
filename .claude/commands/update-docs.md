---
name: update-docs
description: Check for and update external documentation based on package.json changes
category: knowledge
version: 1.0.0
arguments:
  - name: mode
    description: 'Update mode: --auto (autonomous updates) or --prompt (ask for each, default)'
    required: false
allowed-tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
---

# Update Documentation Command

Check for documentation updates by comparing package.json versions against cached documentation. Prompts for updates (or runs autonomously with `--auto` flag).

## Usage

```bash
/update-docs [--auto]
```

## Examples

```bash
# Check for updates and prompt for each
/update-docs

# Automatically update all stale documentation
/update-docs --auto
```

## Workflow

### 1. Read Configuration

Load curated packages from `.claude/config/external-docs.json`

### 2. Read package.json

Extract all dependencies and devDependencies with their versions.

### 3. Compare Versions

For each tracked package:

1. Check if package exists in package.json
2. If not, skip (package not used in this project)
3. If yes, extract version from package.json
4. Read cached metadata from `.claude/knowledge/external/{package}/_registry.json`
5. Compare versions:
   - **Match**: No action needed
   - **Mismatch**: Update available
   - **Missing**: First-time fetch needed

### 4. Report Findings

Present summary table:

```
📦 External Documentation Status

| Package       | Cached    | package.json | Status         |
|---------------|-----------|--------------|----------------|
| react         | 18.2.0    | 18.3.0       | ⚠️ Update      |
| @mui/material | 5.15.0    | 5.15.0       | ✅ Up-to-date  |
| typescript    | 5.2.0     | 5.3.0        | ⚠️ Update      |
| vite          | -         | 5.0.0        | 📥 New fetch   |

Total: 2 updates available, 1 new fetch needed, 1 up-to-date
```

### 5. Prompt or Auto-Update

**Prompt Mode (default):**

```
⚠️ Updates available for 2 packages

Update react (18.2.0 → 18.3.0)?
Topics: hooks, context, components
[y/n/skip]
```

User can respond:

- `y` or `yes` - Update this package
- `n` or `no` - Skip this package
- `skip` - Skip all remaining updates
- `auto` - Switch to autonomous mode for remaining updates

**Auto Mode (--auto flag or user selects 'auto'):**

```
🤖 Autonomous update mode

Updating react (18.2.0 → 18.3.0)...
✓ Fetched hooks.md (45KB)
✓ Fetched context.md (30KB)
✓ Fetched components.md (38KB)

Updating typescript (5.2.0 → 5.3.0)...
✓ Fetched handbook.md (95KB)
✓ Fetched utility-types.md (42KB)

📊 Summary:
- 2 packages updated
- 5 topics fetched
- Total size: 250KB (filtered from 2.1MB)
```

### 6. Delegate to doc-fetcher Agent

For each package to update, use Task tool to invoke doc-fetcher agent with the package name and new version.

### 7. Update Mode Preference

If user types `auto` during prompts, ask if they want to save this preference:

```
💾 Save autonomous mode as default?

This will update .claude/config/external-docs.json to set mode: "auto"
Future updates will run automatically without prompting.

[y/n]
```

If yes:

1. Read `.claude/config/external-docs.json`
2. Update `mode` field to `"auto"`
3. Write file back
4. Confirm to user

### 8. Final Report

```
✅ Documentation update complete

📊 Summary:
- Packages updated: {count}
- Topics fetched: {count}
- Size: {filteredSize} (from {rawSize}, {reduction}% reduction)
- Failed: {failedCount}

📁 Updated documentation:
- {package1}: v{version1}
- {package2}: v{version2}

Retained versions (2-version policy):
- {package1}: v{oldVersion1} (previous)
- {package2}: v{oldVersion2} (previous)

All documentation is now in sync with your package.json!
```

## Error Handling

### No Tracked Packages in package.json

```
ℹ️ No tracked packages found in package.json

Currently tracking:
- react ❌ (not in package.json)
- @mui/material ❌ (not in package.json)
- typescript ✅ (found)
- vite ❌ (not in package.json)

Only typescript will be checked for updates.
```

### All Documentation Up-to-Date

```
✅ All external documentation is up-to-date!

| Package       | Version | Last Updated        |
|---------------|---------|---------------------|
| react         | 18.3.0  | 2025-11-09 21:00:00 |
| @mui/material | 5.15.0  | 2025-11-09 21:00:00 |
| typescript    | 5.3.0   | 2025-11-09 21:00:00 |

No action needed.
```

### Partial Failures

```
⚠️ Update completed with some failures

✅ Successfully updated:
- react (18.2.0 → 18.3.0)
- typescript (5.2.0 → 5.3.0)

❌ Failed:
- vite (5.0.0)
  Error: Network timeout fetching from GitHub

Recommendation: Try again later or check network connectivity.
```

## Integration

### Called By

- Users (manual command)
- `knowledge-maintainer` agent (automatic after builds)

### Calls

- `doc-fetcher` agent (via Task tool)
- `.claude/config/external-docs.json` (configuration)
- `package.json` (version source of truth)
- `.claude/knowledge/external/_registry.json` (cached versions)

## Mode Configuration

The update mode can be configured in `.claude/config/external-docs.json`:

```json
{
  "mode": "prompt",  // Options: "prompt", "auto", "manual-only"
  ...
}
```

- **prompt**: Ask for each update (default, safest)
- **auto**: Update automatically without prompting
- **manual-only**: Never auto-update, only via `/update-docs` command

## Related Commands

- `/fetch-docs <package>` - Manually fetch documentation for a specific package
- `/track-docs <package>` - Add a new package to tracking list

## See Also

- Agent: `knowledge-maintainer` - Calls this automatically after builds
- Knowledge: `.claude/knowledge/external-docs-management.md` - System documentation
