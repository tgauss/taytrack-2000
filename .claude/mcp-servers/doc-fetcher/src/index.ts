#!/usr/bin/env node

/**
 * Custom MCP Server: Documentation Fetcher
 *
 * Follows MCP best practices from https://www.anthropic.com/engineering/code-execution-with-mcp:
 * 1. Progressive tool loading (3 simple tools vs 200+ topic-specific tools)
 * 2. Data filtering in execution environment (500KB → 50KB before storage)
 * 3. Filesystem-based organization for on-demand loading
 * 4. Skill persistence (reusable pattern for future MCP servers)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { loadSources } from './sources.js';
import { fetchDocumentation, filterContent } from './fetcher.js';
import { listCached, storeDocumentation, getMetadata, cleanupOldVersions } from './storage.js';

const server = new Server(
  {
    name: 'doc-fetcher',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool 1: search_docs
 * Search for available documentation topics
 * MCP Principle: Progressive disclosure - find what's available before fetching
 */
const SearchDocsSchema = z.object({
  query: z.string().describe('Search query (e.g., "react hooks", "mui theming")'),
});

/**
 * Tool 2: fetch_documentation
 * Fetch and cache documentation for a package
 * MCP Principle: Data filtering - fetch large, filter in execution, store small
 */
const FetchDocumentationSchema = z.object({
  package: z.string().describe('Package name (e.g., "react", "@mui/material")'),
  version: z.string().describe('Package version (e.g., "18.3.0")'),
  topics: z
    .array(z.string())
    .optional()
    .describe('Specific topics to fetch (optional, fetches all if omitted)'),
});

/**
 * Tool 3: list_cached
 * List all cached documentation
 * MCP Principle: Filesystem organization - inspect what's stored locally
 */
const ListCachedSchema = z.object({
  package: z.string().optional().describe('Filter by package name (optional)'),
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_docs',
        description:
          'Search for available documentation topics across tracked packages. Returns matching topics with their cache status.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "react hooks", "mui theming")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_documentation',
        description:
          'Fetch and cache documentation for a specific package and version. Fetches from GitHub, filters content (500KB→50KB), and stores locally. Returns summary, not full content (MCP best practice).',
        inputSchema: {
          type: 'object',
          properties: {
            package: {
              type: 'string',
              description: 'Package name (e.g., "react", "@mui/material")',
            },
            version: {
              type: 'string',
              description: 'Package version (e.g., "18.3.0")',
            },
            topics: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Specific topics to fetch (optional, fetches all configured topics if omitted)',
            },
          },
          required: ['package', 'version'],
        },
      },
      {
        name: 'list_cached',
        description:
          "List all cached documentation with versions, topics, and sizes. Shows what's available offline.",
        inputSchema: {
          type: 'object',
          properties: {
            package: {
              type: 'string',
              description: 'Filter by package name (optional)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_docs': {
        const { query } = SearchDocsSchema.parse(args);
        const sources = await loadSources();
        const cached = await listCached();

        // Search across all packages and topics
        const results = [];
        for (const pkg of sources.trackedPackages) {
          for (const topic of pkg.topics) {
            if (
              pkg.name.toLowerCase().includes(query.toLowerCase()) ||
              topic.toLowerCase().includes(query.toLowerCase())
            ) {
              const isCached = cached.packages[pkg.name]?.topics?.includes(topic) ?? false;
              results.push({
                package: pkg.name,
                topic,
                cached: isCached,
                version: cached.packages[pkg.name]?.current,
              });
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  results,
                  total: results.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'fetch_documentation': {
        const { package: packageName, version, topics } = FetchDocumentationSchema.parse(args);

        // Load source configuration
        const sources = await loadSources();
        const packageConfig = sources.trackedPackages.find((p) => p.name === packageName);

        if (!packageConfig) {
          throw new Error(
            `Package "${packageName}" not in curated list. Available: ${sources.trackedPackages.map((p) => p.name).join(', ')}`
          );
        }

        // Determine which topics to fetch
        const topicsToFetch = topics && topics.length > 0 ? topics : packageConfig.topics;

        // Validate topics exist in configuration
        const invalidTopics = topicsToFetch.filter((t) => !packageConfig.topics.includes(t));
        if (invalidTopics.length > 0) {
          throw new Error(
            `Invalid topics for ${packageName}: ${invalidTopics.join(', ')}. Available: ${packageConfig.topics.join(', ')}`
          );
        }

        // Fetch and store each topic
        const results = [];
        for (const topic of topicsToFetch) {
          try {
            // Fetch raw content from GitHub
            const rawContent = await fetchDocumentation(packageConfig, topic, version);

            // Filter content (MCP best practice: process in execution environment)
            const filtered = await filterContent(rawContent, packageName, topic, sources.filtering);

            // Store locally
            const storagePath = await storeDocumentation(
              packageName,
              version,
              topic,
              filtered,
              packageConfig.source
            );

            results.push({
              topic,
              success: true,
              path: storagePath,
              size: `${Math.round(filtered.length / 1024)}KB`,
              rawSize: `${Math.round(rawContent.length / 1024)}KB`,
              reduction: `${Math.round((1 - filtered.length / rawContent.length) * 100)}%`,
            });
          } catch (error) {
            results.push({
              topic,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Cleanup old versions (keep only 2 most recent)
        await cleanupOldVersions(packageName, sources.retention.maxVersions);

        // Return summary (not full content - MCP best practice!)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  package: packageName,
                  version,
                  results,
                  totalTopics: results.length,
                  successful: results.filter((r) => r.success).length,
                  failed: results.filter((r) => !r.success).length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_cached': {
        const { package: packageFilter } = ListCachedSchema.parse(args);
        const cached = await listCached();

        let packages = cached.packages;
        if (packageFilter) {
          packages = Object.keys(packages)
            .filter((name) => name === packageFilter)
            .reduce(
              (obj, key) => {
                obj[key] = packages[key];
                return obj;
              },
              {} as typeof packages
            );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  packages,
                  totalSize: cached.totalSize,
                  mode: cached.mode,
                  stats: cached.stats,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Documentation Fetcher MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
