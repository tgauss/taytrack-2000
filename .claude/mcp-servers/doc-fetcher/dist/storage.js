/**
 * Storage management for cached documentation
 *
 * MCP Best Practice: Filesystem-based organization for progressive disclosure
 * Structure: .claude/knowledge/external/{package}/v{version}/{topic}.md
 */
import { readFile, writeFile, mkdir, readdir, rm, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KNOWLEDGE_BASE_PATH = join(__dirname, '..', '..', '..', 'knowledge', 'external');
const REGISTRY_PATH = join(KNOWLEDGE_BASE_PATH, '_registry.json');
function normalizePackageName(packageName) {
    // Convert @mui/material → @mui-material
    return packageName.replace(/\//g, '-');
}
export async function storeDocumentation(packageName, version, topic, content, source) {
    const normalized = normalizePackageName(packageName);
    const packagePath = join(KNOWLEDGE_BASE_PATH, normalized, `v${version}`);
    // Ensure directory exists
    await mkdir(packagePath, { recursive: true });
    // Write topic documentation
    const topicPath = join(packagePath, `${topic}.md`);
    await writeFile(topicPath, content, 'utf-8');
    // Update metadata
    await updateMetadata(packageName, normalized, version, topic, content.length, source);
    // Update registry
    await updateRegistry(packageName, version, topic, content.length);
    // Return relative path from project root
    return `.claude/knowledge/external/${normalized}/v${version}/${topic}.md`;
}
async function updateMetadata(packageName, normalizedName, version, topic, size, source) {
    const packagePath = join(KNOWLEDGE_BASE_PATH, normalizedName, `v${version}`);
    const metadataPath = join(packagePath, '_metadata.json');
    let metadata = {
        package: packageName,
        version,
        topics: [],
        fetchedAt: new Date().toISOString(),
        source,
        sizes: {},
    };
    // Load existing metadata if it exists
    if (existsSync(metadataPath)) {
        const existing = await readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(existing);
    }
    // Update topics and sizes
    if (!metadata.topics.includes(topic)) {
        metadata.topics.push(topic);
    }
    metadata.sizes[topic] = `${Math.round(size / 1024)}KB`;
    metadata.fetchedAt = new Date().toISOString();
    // Write metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}
async function updateRegistry(packageName, version, topic, size) {
    let registry;
    // Load existing registry
    if (existsSync(REGISTRY_PATH)) {
        const content = await readFile(REGISTRY_PATH, 'utf-8');
        registry = JSON.parse(content);
    }
    else {
        // Initialize new registry
        registry = {
            version: '1.0.0',
            lastUpdated: null,
            packages: {},
            totalSize: '0KB',
            mode: 'prompt',
            stats: {
                totalPackages: 0,
                totalVersions: 0,
                totalTopics: 0,
                lastFetch: null,
            },
        };
    }
    // Update package entry
    if (!registry.packages[packageName]) {
        registry.packages[packageName] = {
            versions: [],
            current: version,
            topics: [],
            lastFetched: new Date().toISOString(),
            sizeTotal: '0KB',
        };
    }
    const pkgEntry = registry.packages[packageName];
    // Add version if new
    if (!pkgEntry.versions.includes(version)) {
        pkgEntry.versions.push(version);
    }
    // Update current version
    pkgEntry.current = version;
    // Add topic if new
    if (!pkgEntry.topics.includes(topic)) {
        pkgEntry.topics.push(topic);
    }
    // Update timestamp
    pkgEntry.lastFetched = new Date().toISOString();
    // Update stats
    registry.lastUpdated = new Date().toISOString();
    registry.stats.lastFetch = new Date().toISOString();
    registry.stats.totalPackages = Object.keys(registry.packages).length;
    registry.stats.totalVersions = Object.values(registry.packages).reduce((sum, pkg) => sum + pkg.versions.length, 0);
    registry.stats.totalTopics = Object.values(registry.packages).reduce((sum, pkg) => sum + pkg.topics.length, 0);
    // Calculate total size
    const totalSizeBytes = await calculateTotalSize();
    registry.totalSize = `${Math.round(totalSizeBytes / 1024)}KB`;
    // Calculate package size
    const packageSizeBytes = await calculatePackageSize(packageName);
    pkgEntry.sizeTotal = `${Math.round(packageSizeBytes / 1024)}KB`;
    // Write registry
    await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}
async function calculateTotalSize() {
    let totalSize = 0;
    try {
        const packages = await readdir(KNOWLEDGE_BASE_PATH);
        for (const pkg of packages) {
            if (pkg === '_registry.json')
                continue;
            const pkgPath = join(KNOWLEDGE_BASE_PATH, pkg);
            const pkgStat = await stat(pkgPath);
            if (!pkgStat.isDirectory())
                continue;
            const versions = await readdir(pkgPath);
            for (const version of versions) {
                const versionPath = join(pkgPath, version);
                const versionStat = await stat(versionPath);
                if (!versionStat.isDirectory())
                    continue;
                const files = await readdir(versionPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const filePath = join(versionPath, file);
                        const fileStat = await stat(filePath);
                        totalSize += fileStat.size;
                    }
                }
            }
        }
    }
    catch (error) {
        // Return 0 if directory doesn't exist yet
        return 0;
    }
    return totalSize;
}
async function calculatePackageSize(packageName) {
    let packageSize = 0;
    const normalized = normalizePackageName(packageName);
    const pkgPath = join(KNOWLEDGE_BASE_PATH, normalized);
    try {
        const versions = await readdir(pkgPath);
        for (const version of versions) {
            const versionPath = join(pkgPath, version);
            const versionStat = await stat(versionPath);
            if (!versionStat.isDirectory())
                continue;
            const files = await readdir(versionPath);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = join(versionPath, file);
                    const fileStat = await stat(filePath);
                    packageSize += fileStat.size;
                }
            }
        }
    }
    catch (error) {
        return 0;
    }
    return packageSize;
}
export async function getMetadata(packageName, version) {
    const normalized = normalizePackageName(packageName);
    const metadataPath = join(KNOWLEDGE_BASE_PATH, normalized, `v${version}`, '_metadata.json');
    if (!existsSync(metadataPath)) {
        return null;
    }
    const content = await readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
}
export async function listCached() {
    if (!existsSync(REGISTRY_PATH)) {
        return {
            version: '1.0.0',
            lastUpdated: null,
            packages: {},
            totalSize: '0KB',
            mode: 'prompt',
            stats: {
                totalPackages: 0,
                totalVersions: 0,
                totalTopics: 0,
                lastFetch: null,
            },
        };
    }
    const content = await readFile(REGISTRY_PATH, 'utf-8');
    return JSON.parse(content);
}
export async function cleanupOldVersions(packageName, maxVersions) {
    const normalized = normalizePackageName(packageName);
    const pkgPath = join(KNOWLEDGE_BASE_PATH, normalized);
    if (!existsSync(pkgPath)) {
        return;
    }
    try {
        // Get all version directories
        const versions = await readdir(pkgPath);
        const versionDirs = versions.filter((v) => v.startsWith('v'));
        if (versionDirs.length <= maxVersions) {
            return; // Nothing to cleanup
        }
        // Sort versions (simple lexicographic sort - could be improved with semver)
        versionDirs.sort();
        // Keep only the latest N versions
        const toDelete = versionDirs.slice(0, versionDirs.length - maxVersions);
        for (const version of toDelete) {
            const versionPath = join(pkgPath, version);
            await rm(versionPath, { recursive: true, force: true });
        }
        // Update registry to reflect deleted versions
        const registry = await listCached();
        if (registry.packages[packageName]) {
            const kept = versionDirs.slice(versionDirs.length - maxVersions).map((v) => v.slice(1)); // Remove 'v' prefix
            registry.packages[packageName].versions = kept;
            await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
        }
    }
    catch (error) {
        console.error(`Failed to cleanup old versions for ${packageName}:`, error);
    }
}
//# sourceMappingURL=storage.js.map