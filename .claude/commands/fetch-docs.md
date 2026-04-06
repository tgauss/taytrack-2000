---
name: fetch-docs
description: Manually fetch external documentation for a package
category: knowledge
version: 1.0.0
arguments:
  - name: package
    description: Package name (e.g., "react", "@mui/material")
    required: true
  - name: version
    description: Package version (optional, reads from package.json if omitted)
    required: false
allowed-tools:
  - Task
  - Read
  - Bash
  - Glob
---

# Fetch Documentation Command

Manually fetch and cache external documentation for a curated package.

## Usage

```bash
/fetch-docs <package> [version]
```

## Examples

```bash
# Fetch React docs (version from package.json)
/fetch-docs react

# Fetch MUI docs for specific version
/fetch-docs @mui/material 5.15.0

# Fetch TypeScript docs
/fetch-docs typescript
```

## Workflow

### 1. Parse Arguments

Extract package name and optional version from command arguments.

### 2. Determine Version

If version not provided:

1. Read `package.json`
2. Find package in dependencies or devDependencies
3. Extract version number (remove ^ or ~ prefix)
4. If package not found in package.json, prompt user for version

### 3. Validate Package

1. Read `.claude/config/external-docs.json`
2. Check if package is in `trackedPackages` list
3. If not found, show error with available packages
4. If found, proceed to fetch

### 4. Delegate to doc-fetcher Agent

Use the Task tool to invoke the doc-fetcher agent:

```
Task:
- Agent: doc-fetcher
- Input: package name, version, topics (all configured topics)
- Mode: autonomous (no further user interaction needed)
```

The doc-fetcher agent will:

- Call the MCP server to fetch documentation
- Filter content (500KB → 50KB)
- Store in `.claude/knowledge/external/{package}/v{version}/`
- Update registry
- Return summary

### 5. Report Results

Present user-friendly summary:

```
✅ Successfully fetched {package} v{version} documentation

📁 Stored in:
- .claude/knowledge/external/{package}/v{version}/

📊 Topics fetched:
- {topic1}: {size1}
- {topic2}: {size2}

💾 Total size: {totalSize} (filtered from {rawSize})
📉 Size reduction: {reduction}%

You can now use this documentation in your development work.
It will be available offline and loaded on-demand.
```

## Error Handling

### Package Not in Curated List

```
❌ Package "{package}" is not tracked

Currently tracked packages:
- react
- @mui/material
- typescript
- vite

To add a new package, use:
/track-docs {package}

Or manually edit:
.claude/config/external-docs.json
```

### Package Not in package.json

```
⚠️ Package "{package}" not found in package.json

Please specify a version:
/fetch-docs {package} <version>

Example:
/fetch-docs react 18.3.0
```

### Network or Fetch Failure

```
❌ Failed to fetch documentation for {package}

Error: {error message}

Possible causes:
- Network connectivity issues
- GitHub rate limiting
- Invalid source URL in configuration

Your existing cached documentation (if any) remains available.
```

## Integration with MCP Server

This command relies on the custom doc-fetcher MCP server running at:
`.claude/mcp-servers/doc-fetcher/`

The MCP server must be built and functional. To verify:

```bash
cd .claude/mcp-servers/doc-fetcher
npm run build
npm run typecheck
```

## Related Commands

- `/update-docs` - Check for documentation updates based on package.json changes
- `/track-docs <package>` - Add a new package to the curated tracking list

## See Also

- Agent: `doc-fetcher` - The agent that performs the actual fetching
- Knowledge: `.claude/knowledge/external-docs-management.md` - System documentation
- Configuration: `.claude/config/external-docs.json` - Tracked packages
