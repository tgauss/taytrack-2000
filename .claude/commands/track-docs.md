---
name: track-docs
description: Add a new package to the external documentation tracking list
category: knowledge
version: 1.0.0
arguments:
  - name: package
    description: Package name to start tracking (e.g., "lodash", "axios")
    required: true
allowed-tools:
  - Read
  - Write
  - Bash
---

# Track Documentation Command

Add a new package to the curated list of tracked documentation sources.

## Usage

```bash
/track-docs <package-name>
```

## Examples

```bash
# Add lodash to tracking
/track-docs lodash

# Add axios to tracking
/track-docs axios

# Add a scoped package
/track-docs @tanstack/react-query
```

## Workflow

### 1. Validate Package Name

Check if package is already being tracked:

1. Read `.claude/config/external-docs.json`
2. Check if package exists in `trackedPackages`
3. If already tracked, show error and exit

### 2. Verify Package Exists in package.json

1. Read `package.json`
2. Check dependencies and devDependencies
3. If not found, warn user but allow continuation (might be adding preemptively)

### 3. Prompt for Configuration

Gather required information from user:

```
📦 Adding "{package}" to documentation tracking

1. What topics should be tracked?
   (e.g., "getting-started, api-reference, examples")
   Separate multiple topics with commas.

   Topics: ▊
```

```
2. What is the source repository?
   (e.g., "lodash/lodash", "axios/axios")

   GitHub repo: ▊
```

```
3. What branch should be used?
   (Usually "main" or "master")

   Branch [main]: ▊
```

```
4. What are the documentation file paths?
   For each topic, provide the relative path in the repository.

   Topic "getting-started" path: ▊
   (e.g., "docs/getting-started.md" or "README.md")

   Topic "api-reference" path: ▊
   (e.g., "docs/api.md")
```

### 4. Validate GitHub URLs

Before adding, verify that the source URLs are accessible:

```bash
# Test fetch from GitHub raw
curl -f -s -I "https://raw.githubusercontent.com/{repo}/{branch}/{path}"
```

If successful (HTTP 200), proceed. If failed (HTTP 404), warn:

```
⚠️ Warning: Could not verify path "{path}"

GitHub returned: 404 Not Found

This might be because:
- The path is incorrect
- The repository is private
- The branch name is wrong

Do you want to add it anyway? [y/n]
```

### 5. Update Configuration

Add the new package entry to `.claude/config/external-docs.json`:

```json
{
  "name": "lodash",
  "topics": ["getting-started", "api-reference"],
  "source": {
    "type": "github-raw",
    "repo": "lodash/lodash",
    "branch": "main",
    "paths": {
      "getting-started": "README.md",
      "api-reference": "docs/api.md"
    }
  }
}
```

Write the updated configuration file.

### 6. Offer Initial Fetch

```
✅ Successfully added "{package}" to tracking list

Configuration saved to:
.claude/config/external-docs.json

Would you like to fetch the documentation now? [y/n]
```

If yes:

- Determine version from package.json (or prompt if not found)
- Invoke `/fetch-docs {package} {version}`

If no:

- Show next steps

### 7. Report Success

```
✅ Package "{package}" is now tracked

📋 Configuration:
- Topics: {topic1}, {topic2}, {topic3}
- Source: https://github.com/{repo}
- Branch: {branch}

Next steps:
1. Fetch initial documentation:
   /fetch-docs {package}

2. Documentation will auto-update when package.json changes
   (if knowledge-maintainer is configured)

3. View all tracked packages:
   .claude/config/external-docs.json
```

## Advanced Options

### Interactive vs Quick Add

For quick addition with defaults:

```bash
# Not currently supported, but future enhancement:
/track-docs lodash --repo=lodash/lodash --topics=api,readme
```

### Editing Configuration

Users can also manually edit `.claude/config/external-docs.json`. The command provides a guided way to add packages, but direct editing is supported.

## Error Handling

### Package Already Tracked

```
❌ Package "{package}" is already being tracked

Current configuration:
- Topics: {topics}
- Source: {repo}
- Last fetched: {date}

To modify configuration:
1. Edit .claude/config/external-docs.json
2. Re-fetch documentation: /fetch-docs {package}
```

### Invalid Repository

```
❌ Repository "{repo}" could not be accessed

Verified URLs returned errors:
- https://raw.githubusercontent.com/{repo}/{branch}/{path1} (404)
- https://raw.githubusercontent.com/{repo}/{branch}/{path2} (404)

Please check:
- Repository name (owner/repo format)
- Branch name
- File paths
- Repository visibility (must be public)
```

### No Topics Provided

```
❌ At least one topic is required

Topics define what documentation to fetch (e.g., "api", "guide", "examples").

Please provide at least one topic name.
```

## Configuration Schema

Each tracked package requires:

**Required Fields:**

- `name` (string): Package name
- `topics` (array): List of topic names
- `source.type` (string): Currently only "github-raw" supported
- `source.repo` (string): GitHub repository (owner/repo)
- `source.branch` (string): Branch name
- `source.paths` (object): Map of topic → file path

**Optional Fields:**

- Future: `source.auth` for private repositories
- Future: `updateFrequency` override

## Related Commands

- `/fetch-docs <package>` - Fetch documentation for a tracked package
- `/update-docs` - Check all tracked packages for updates

## See Also

- Configuration: `.claude/config/external-docs.json` - Master list of tracked packages
- Knowledge: `.claude/knowledge/external-docs-management.md` - System documentation
