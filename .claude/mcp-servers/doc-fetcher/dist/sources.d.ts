/**
 * Source configuration loader
 * Reads from .claude/config/external-docs.json
 */
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
export declare function loadSources(): Promise<SourceConfig>;
export declare function constructGitHubRawUrl(repo: string, branch: string, path: string, version?: string): string;
//# sourceMappingURL=sources.d.ts.map