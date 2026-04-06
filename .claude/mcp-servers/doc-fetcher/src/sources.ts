/**
 * Source configuration loader
 * Reads from .claude/config/external-docs.json
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface SourceConfig {
  version: string;
  mode: 'prompt' | 'auto' | 'manual-only';
  trackedPackages: Array<{
    name: string;
    topics: string[];
    source: {
      type: 'github-raw';
      repo: string;
      branch: string;
      paths: Record<string, string>;
    };
  }>;
  retention: {
    maxVersions: number;
    cleanupStrategy: string;
    minAgeBeforeCleanup: string;
  };
  updateTriggers: {
    onPackageJsonChange: boolean;
    onKnowledgeMaintainerRun: boolean;
    manualCommand: boolean;
  };
  filtering: {
    maxTopicSize: string;
    removeElements: string[];
    maxExamplesPerSection: number;
  };
}

let cachedConfig: SourceConfig | null = null;

export async function loadSources(): Promise<SourceConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Navigate from .claude/mcp-servers/doc-fetcher/src to .claude/config
  const configPath = join(__dirname, '..', '..', '..', 'config', 'external-docs.json');

  try {
    const content = await readFile(configPath, 'utf-8');
    cachedConfig = JSON.parse(content) as SourceConfig;
    return cachedConfig;
  } catch (error) {
    throw new Error(
      `Failed to load source configuration from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function constructGitHubRawUrl(
  repo: string,
  branch: string,
  path: string,
  version?: string
): string {
  // If version is provided and path contains {VERSION}, replace it
  const resolvedPath = version ? path.replace('{VERSION}', version) : path;

  // Construct GitHub raw URL
  return `https://raw.githubusercontent.com/${repo}/${branch}/${resolvedPath}`;
}
