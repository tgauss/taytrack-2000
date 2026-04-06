/**
 * Documentation fetcher and content filter
 *
 * MCP Best Practice: Fetch large content, filter in execution environment,
 * return only processed/filtered results (not raw data)
 */
export declare function fetchDocumentation(packageConfig: {
    name: string;
    source: {
        type: 'github-raw';
        repo: string;
        branch: string;
        paths: Record<string, string>;
    };
}, topic: string, version: string): Promise<string>;
/**
 * Filter content to extract only relevant sections
 *
 * MCP Best Practice: Process large datasets in execution environment
 * Input: 500KB raw markdown with navigation, ads, comments, etc.
 * Output: 50KB focused documentation
 */
export declare function filterContent(rawContent: string, packageName: string, topic: string, filteringConfig: {
    maxTopicSize: string;
    removeElements: string[];
    maxExamplesPerSection: number;
}): Promise<string>;
//# sourceMappingURL=fetcher.d.ts.map