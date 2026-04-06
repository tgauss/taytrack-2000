/**
 * Storage management for cached documentation
 *
 * MCP Best Practice: Filesystem-based organization for progressive disclosure
 * Structure: .claude/knowledge/external/{package}/v{version}/{topic}.md
 */
interface Registry {
    version: string;
    lastUpdated: string | null;
    packages: Record<string, {
        versions: string[];
        current: string;
        topics: string[];
        lastFetched: string;
        sizeTotal: string;
    }>;
    totalSize: string;
    mode: string;
    stats: {
        totalPackages: number;
        totalVersions: number;
        totalTopics: number;
        lastFetch: string | null;
    };
}
export declare function storeDocumentation(packageName: string, version: string, topic: string, content: string, source: {
    type: string;
    repo: string;
    branch: string;
}): Promise<string>;
export declare function getMetadata(packageName: string, version: string): Promise<any | null>;
export declare function listCached(): Promise<Registry>;
export declare function cleanupOldVersions(packageName: string, maxVersions: number): Promise<void>;
export {};
//# sourceMappingURL=storage.d.ts.map