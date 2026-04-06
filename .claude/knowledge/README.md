# Knowledge Base

This directory contains documentation about specific feature areas, patterns, and utilities in the codebase.

## Purpose

The knowledge base serves as:

1. **Reference documentation** - How specific features work
2. **Pattern library** - Established patterns and best practices
3. **Utility catalog** - Reusable functions and components
4. **Change log** - Evolution of features over time

## Why Knowledge Files?

When working on features repeatedly, knowledge files help:

- **Avoid duplication** - Reference existing utilities before creating new ones
- **Maintain consistency** - Follow established patterns
- **Speed up development** - Quick reference for how things work
- **Document decisions** - Why things are implemented certain ways

## File Organization

Organize by feature area or domain:

```
authentication.md         # Auth system patterns and utilities
form-handling.md         # Form patterns, validation, hooks
state-management.md      # State patterns, context, stores
api-integration.md       # API patterns, error handling
styling-theming.md       # Styling patterns, theme usage
testing.md               # Testing patterns and utilities
```

## Knowledge File Structure

Each knowledge file should include:

```markdown
# Feature Area Name

**Last Updated**: YYYY-MM-DD
**Maintainer**: Team/Person

## Overview

Brief description of this feature area

## Architecture

How this feature is structured

## Key Files

- `path/to/file.ts` - Purpose
- `path/to/component.tsx` - Purpose

## Utility Functions

### functionName()

**Location**: `path/to/file.ts`
**Purpose**: What it does
**Usage**: Code example

## Patterns

### Pattern Name

Description and when to use

## Quick Reference

Common tasks and how to do them

## Change Log

- YYYY-MM-DD: What changed and why
```

## Integration with Workflow

Knowledge files are referenced in the workflow commands:

- **Scout** - Checks knowledge base for existing utilities and patterns
- **Plan** - References patterns and utilities when planning implementation
- **Build** - Updates knowledge files when adding new features

## Best Practices

1. **Keep it current** - Update when features change
2. **Be specific** - Include code examples and file paths
3. **Explain why** - Document decisions and tradeoffs
4. **Link related** - Cross-reference related knowledge files
5. **Track changes** - Maintain a change log

## When to Create a Knowledge File

Create a knowledge file when:

- A feature area is worked on multiple times
- Patterns emerge that should be reused
- Complex utilities need documentation
- New developers would benefit from context

## Current Knowledge Files

### Architecture & System Design

- **[3-layer-architecture-implementation.md](./3-layer-architecture-implementation.md)** - Branding → Theme → Layout architecture (v2.0.0 - UPDATED 2025-11-14)
- **[dynamic-layout-system.md](./dynamic-layout-system.md)** - TypeScript-based vertical layout system (v2.0 - UPDATED 2025-11-18)
- **[adding-new-verticals.md](./adding-new-verticals.md)** - Step-by-step guide for adding theme & layout verticals (v1.0.1 - UPDATED 2025-11-18)
- **[routing-architecture.md](./routing-architecture.md)** - Route structure, navigation patterns, and SEO
- **[state-management.md](./state-management.md)** - DataProvider, React Context, and data fetching patterns (NEW 2025-11-14)

### Component & Code Patterns

- **[component-patterns.md](./component-patterns.md)** - Reusable component patterns and best practices (UPDATED 2025-11-18)

### Theme & Styling

- **[theme-system.md](./theme-system.md)** - Dynamic MUI theming, shared utilities, dark mode (NEW 2025-11-14)

### Utilities & Helpers

- **[utilities.md](./utilities.md)** - Complete utility function catalog (formatting, validation, mortgage calcs) (NEW 2025-11-14)
- **[error-handling.md](./error-handling.md)** - Error boundaries, logging, user-friendly errors (NEW 2025-11-14)

### SEO & Accessibility

- **[seo-patterns.md](./seo-patterns.md)** - SEO component, structured data, semantic HTML (NEW 2025-11-14)

### Testing

- **[testing.md](./testing.md)** - E2E testing patterns and utilities
- **[theming-tests.md](./theming-tests.md)** - Theme testing strategies

### Tools & Integration

- **[mcp-server-patterns.md](./mcp-server-patterns.md)** - MCP server integration patterns
- **[external-docs-management.md](./external-docs-management.md)** - External documentation management

## Example Knowledge Files

Good candidates for knowledge files:

- Form handling patterns (react-hook-form, validation)
- API integration patterns (GraphQL, REST, error handling)
- Component patterns (compound components, render props)
- Testing utilities (custom hooks, test helpers)
- Build/deployment processes
- Configuration patterns
