/**
 * Source configuration loader
 * Reads from .claude/config/external-docs.json
 */
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let cachedConfig = null;
export async function loadSources() {
    if (cachedConfig) {
        return cachedConfig;
    }
    // Navigate from .claude/mcp-servers/doc-fetcher/src to .claude/config
    const configPath = join(__dirname, '..', '..', '..', 'config', 'external-docs.json');
    try {
        const content = await readFile(configPath, 'utf-8');
        cachedConfig = JSON.parse(content);
        return cachedConfig;
    }
    catch (error) {
        throw new Error(`Failed to load source configuration from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
export function constructGitHubRawUrl(repo, branch, path, version) {
    // If version is provided and path contains {VERSION}, replace it
    const resolvedPath = version ? path.replace('{VERSION}', version) : path;
    // Construct GitHub raw URL
    return `https://raw.githubusercontent.com/${repo}/${branch}/${resolvedPath}`;
}
//# sourceMappingURL=sources.js.map