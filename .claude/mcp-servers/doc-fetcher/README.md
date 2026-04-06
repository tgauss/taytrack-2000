# Documentation Fetcher MCP Server

Custom MCP server for fetching, filtering, and caching external documentation with progressive disclosure.

## Overview

This MCP server follows [Anthropic's MCP best practices](https://www.anthropic.com/engineering/code-execution-with-mcp):

1. **Progressive Tool Loading**: 3 simple tools instead of 200+ topic-specific tools → 98% token reduction
2. **Data Filtering**: Process large HTML pages (500KB) in execution environment, store only filtered markdown (50KB)
3. **Filesystem Organization**: Hierarchical structure in `.claude/knowledge/external/` for on-demand loading
4. **Skill Persistence**: Reusable pattern for future MCP servers

## Architecture

```
User Request
     ↓
doc-fetcher agent (uses MCP tools)
     ↓
MCP Server Tools:
  - search_docs(query)
  - fetch_documentation(package, version, topics)
  - list_cached(package?)
     ↓
Execution Environment:
  1. Fetch from GitHub (500KB raw)
  2. Filter content (remove nav, ads, etc.)
  3. Convert to markdown
  4. Store locally (50KB filtered)
  5. Return summary (not full content!)
     ↓
.claude/knowledge/external/{package}/v{version}/{topic}.md
```

## Tools

### search_docs

Search for available documentation topics across tracked packages.

**Input:**

```json
{
  "query": "react hooks"
}
```

**Output:**

```json
{
  "results": [
    {
      "package": "react",
      "topic": "hooks",
      "cached": true,
      "version": "18.3.0"
    }
  ],
  "total": 1
}
```

### fetch_documentation

Fetch and cache documentation for a specific package and version.

**Input:**

```json
{
  "package": "react",
  "version": "18.3.0",
  "topics": ["hooks", "context"]
}
```

**Output:**

```json
{
  "package": "react",
  "version": "18.3.0",
  "results": [
    {
      "topic": "hooks",
      "success": true,
      "path": ".claude/knowledge/external/react/v18.3.0/hooks.md",
      "size": "45KB",
      "rawSize": "520KB",
      "reduction": "91%"
    }
  ]
}
```

### list_cached

List all cached documentation with versions and sizes.

**Input:**

```json
{
  "package": "react" // optional filter
}
```

**Output:**

```json
{
  "packages": {
    "react": {
      "versions": ["18.2.0", "18.3.0"],
      "current": "18.3.0",
      "topics": ["hooks", "context", "components"],
      "lastFetched": "2025-11-09T21:00:00Z",
      "sizeTotal": "145KB"
    }
  },
  "totalSize": "255KB",
  "stats": {
    "totalPackages": 4,
    "totalVersions": 8,
    "totalTopics": 12
  }
}
```

## Installation

```bash
cd .claude/mcp-servers/doc-fetcher
npm install
npm run build
```

## Configuration

Edit `.claude/config/external-docs.json` to configure tracked packages:

```json
{
  "trackedPackages": [
    {
      "name": "react",
      "topics": ["hooks", "context", "components"],
      "source": {
        "type": "github-raw",
        "repo": "reactjs/react.dev",
        "branch": "main",
        "paths": {
          "hooks": "src/content/reference/react/hooks.md"
        }
      }
    }
  ]
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type checking
npm run typecheck
```

## Usage with Claude Code

Register in Claude Code's MCP settings, then use via doc-fetcher agent or commands:

```bash
# Search for docs
/fetch-docs react

# Update docs based on package.json
/update-docs

# Add new package to track
/track-docs <package-name>
```

## File Structure

```
.claude/knowledge/external/
├── _registry.json                    # Master index
├── react/
│   ├── v18.2.0/
│   │   ├── hooks.md
│   │   └── _metadata.json
│   └── v18.3.0/
│       ├── hooks.md
│       ├── context.md
│       └── _metadata.json
└── @mui-material/
    └── v5.15.0/
        ├── components.md
        └── _metadata.json
```

## MCP Best Practices Applied

1. **Progressive Disclosure**: Search before fetching, load only what's needed
2. **Data Filtering**: 500KB → 50KB reduction via intelligent filtering
3. **Filesystem Organization**: Hierarchical structure enables on-demand loading
4. **Execution Processing**: Filter/transform in MCP server, not in Claude's context
5. **Metadata Tracking**: Track versions, sizes, fetch dates for maintenance

## Extending

To add support for new documentation sources:

1. Add source type in `sources.ts`
2. Implement fetcher in `fetcher.ts`
3. Update configuration schema in `.claude/config/external-docs.json`

See `.claude/knowledge/mcp-server-patterns.md` for detailed guidance.
