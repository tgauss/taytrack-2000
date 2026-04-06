/**
 * Documentation fetcher and content filter
 *
 * MCP Best Practice: Fetch large content, filter in execution environment,
 * return only processed/filtered results (not raw data)
 */
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import { constructGitHubRawUrl } from './sources.js';
const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
export async function fetchDocumentation(packageConfig, topic, version) {
    const path = packageConfig.source.paths[topic];
    if (!path) {
        throw new Error(`No path configured for topic "${topic}" in package "${packageConfig.name}"`);
    }
    const url = constructGitHubRawUrl(packageConfig.source.repo, packageConfig.source.branch, path, version);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        let content = await response.text();
        // If content is HTML, convert to markdown
        if (contentType.includes('text/html')) {
            content = turndown.turndown(content);
        }
        return content;
    }
    catch (error) {
        throw new Error(`Failed to fetch documentation from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Filter content to extract only relevant sections
 *
 * MCP Best Practice: Process large datasets in execution environment
 * Input: 500KB raw markdown with navigation, ads, comments, etc.
 * Output: 50KB focused documentation
 */
export async function filterContent(rawContent, packageName, topic, filteringConfig) {
    let filtered = rawContent;
    // Remove common noise patterns
    filtered = removeNoisePatterns(filtered, filteringConfig.removeElements);
    // Extract code examples (limited)
    filtered = limitCodeExamples(filtered, filteringConfig.maxExamplesPerSection);
    // Add metadata header
    const metadata = generateMetadataHeader(packageName, topic, rawContent.length, filtered.length);
    return `${metadata}\n\n${filtered}`;
}
function removeNoisePatterns(content, removeElements) {
    let filtered = content;
    // Remove HTML comments
    filtered = filtered.replace(/<!--[\s\S]*?-->/g, '');
    // Remove common navigation patterns
    if (removeElements.includes('nav')) {
        filtered = filtered.replace(/^#{1,6}\s*(Navigation|Menu|Table of Contents)[\s\S]*?(?=^#{1,6}\s|\n\n)/gim, '');
    }
    // Remove footer patterns
    if (removeElements.includes('footer')) {
        filtered = filtered.replace(/^#{1,6}\s*(Footer|Copyright|License)[\s\S]*$/gim, '');
    }
    // Remove "Related Articles" sections
    if (removeElements.includes('related-articles')) {
        filtered = filtered.replace(/^#{1,6}\s*(Related|See Also|Further Reading)[\s\S]*?(?=^#{1,6}\s|\n\n)/gim, '');
    }
    // Remove excessive blank lines (more than 2 consecutive)
    filtered = filtered.replace(/\n{3,}/g, '\n\n');
    return filtered.trim();
}
function limitCodeExamples(content, maxExamples) {
    // Find all code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex) || [];
    if (codeBlocks.length <= maxExamples) {
        return content;
    }
    // Keep only first N code examples per section
    // This is a simplified implementation - could be more sophisticated
    let filtered = content;
    const excessBlocks = codeBlocks.slice(maxExamples);
    for (const block of excessBlocks) {
        // Replace with a placeholder indicating more examples exist
        filtered = filtered.replace(block, '_[Additional code examples omitted for brevity]_');
    }
    return filtered;
}
function generateMetadataHeader(packageName, topic, rawSize, filteredSize) {
    const now = new Date().toISOString();
    const reduction = Math.round((1 - filteredSize / rawSize) * 100);
    return `---
package: ${packageName}
topic: ${topic}
fetched: ${now}
source: GitHub (processed and filtered)
size:
  raw: ${Math.round(rawSize / 1024)}KB
  filtered: ${Math.round(filteredSize / 1024)}KB
  reduction: ${reduction}%
---`;
}
//# sourceMappingURL=fetcher.js.map