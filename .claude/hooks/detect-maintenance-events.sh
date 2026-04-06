#!/bin/bash
#
# PostToolUse Hook: Detect Maintenance Events
#
# Monitors Bash tool output for significant events (git commits,
# builds, tests) and outputs [maintenance-hint] signals for Claude.
#
# PostToolUse hooks receive JSON on stdin:
#   {"tool_name": "...", "tool_input": {...}, ...}
#
# Output text is shown to Claude (not the user) during its turn.
# Exit 0 always.

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"tool_name"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# Only process Bash tool
if [[ "$TOOL_NAME" != "Bash" ]]; then
    exit 0
fi

# Extract command from tool_input
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

PROJECT_ROOT="$(pwd)"
MAINT_DIR="${PROJECT_ROOT}/.claude/maintenance"
CHANGE_LOG="${MAINT_DIR}/change-log.jsonl"
STATE_FILE="${MAINT_DIR}/state.json"

# Ensure maintenance directory exists
if [[ ! -d "$MAINT_DIR" ]]; then
    mkdir -p "$MAINT_DIR"
fi

# Initialize state file if missing
if [[ ! -f "$STATE_FILE" ]]; then
    echo "{\"last_maintenance_ts\":\"\",\"last_knowledge_update_ts\":\"\",\"last_commit_ts\":\"\",\"edits_since_last_maintenance\":0,\"commits_since_last_maintenance\":0,\"maintenance_pending\":false}" > "$STATE_FILE"
fi

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Detect git commit ---
if [[ "$COMMAND" =~ git[[:space:]]+commit ]]; then
    COMMIT_MSG=$(echo "$COMMAND" | sed -n 's/.*-m[[:space:]]*"\([^"]*\)".*/\1/p' | head -c 100)

    echo "{\"ts\":\"${TS}\",\"event\":\"git_commit\",\"message\":\"${COMMIT_MSG}\"}" >> "$CHANGE_LOG"

    # Update commit counter
    COMMIT_COUNT=$(grep -o '"commits_since_last_maintenance"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | grep -o '[0-9]*$')
    COMMIT_COUNT=${COMMIT_COUNT:-0}
    NEW_COUNT=$((COMMIT_COUNT + 1))

    sed -i '' "s/\"commits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"commits_since_last_maintenance\":${NEW_COUNT}/" "$STATE_FILE" 2>/dev/null || \
    sed -i "s/\"commits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"commits_since_last_maintenance\":${NEW_COUNT}/" "$STATE_FILE" 2>/dev/null

    # Update last_commit_ts
    sed -i '' "s/\"last_commit_ts\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"last_commit_ts\":\"${TS}\"/" "$STATE_FILE" 2>/dev/null || \
    sed -i "s/\"last_commit_ts\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"last_commit_ts\":\"${TS}\"/" "$STATE_FILE" 2>/dev/null

    echo "[maintenance-hint] Git commit detected. If this concludes a feature or significant work, invoke the knowledge-maintainer agent to update .claude/knowledge/ files."
fi

# --- Detect successful build ---
if [[ "$COMMAND" =~ npm[[:space:]]+run[[:space:]]+build ]]; then
    echo "{\"ts\":\"${TS}\",\"event\":\"build_success\",\"command\":\"npm run build\"}" >> "$CHANGE_LOG"
    echo "[maintenance-hint] Build completed. Run maintenance (bash .claude/hooks/maintenance.sh) and update knowledge base if significant features were added."
fi

# --- Detect test run ---
if [[ "$COMMAND" =~ npm[[:space:]]+test ]] || [[ "$COMMAND" =~ npm[[:space:]]+run[[:space:]]+test ]]; then
    echo "{\"ts\":\"${TS}\",\"event\":\"test_run\",\"command\":\"${COMMAND}\"}" >> "$CHANGE_LOG"
fi

# --- Detect quality checks (end of build cycle signal) ---
if [[ "$COMMAND" =~ npm[[:space:]]+run[[:space:]]+typecheck ]]; then
    echo "{\"ts\":\"${TS}\",\"event\":\"quality_check\",\"command\":\"npm run typecheck\"}" >> "$CHANGE_LOG"
    echo "[maintenance-hint] Quality checks passed. If a /build command just completed, invoke the knowledge-maintainer agent now."
fi

exit 0
