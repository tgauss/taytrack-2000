#!/bin/bash
#
# PostToolUse Hook: Track File Changes
#
# Silently logs Edit/Write events to a change log and monitors
# edit count for maintenance threshold nudges.
#
# PostToolUse hooks receive JSON on stdin:
#   {"tool_name": "...", "tool_input": {...}, ...}
#
# Output text is shown to Claude (not the user) during its turn.
# Exit 0 always (PostToolUse exit codes are informational only).

INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"tool_name"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# Only track Edit and Write
if [[ "$TOOL_NAME" != "Edit" ]] && [[ "$TOOL_NAME" != "Write" ]]; then
    exit 0
fi

# Skip if no file path extracted
if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Skip tracking changes to maintenance files themselves
if [[ "$FILE_PATH" =~ \.claude/maintenance/ ]]; then
    exit 0
fi

# Determine project root (where .claude/ lives)
PROJECT_ROOT="$(pwd)"
MAINT_DIR="${PROJECT_ROOT}/.claude/maintenance"
CHANGE_LOG="${MAINT_DIR}/change-log.jsonl"
STATE_FILE="${MAINT_DIR}/state.json"

# Ensure maintenance directory exists
if [[ ! -d "$MAINT_DIR" ]]; then
    mkdir -p "$MAINT_DIR"
fi

# Get timestamp
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Determine event type
if [[ "$TOOL_NAME" == "Edit" ]]; then
    EVENT="file_edit"
else
    EVENT="file_write"
fi

# Append to change log
echo "{\"ts\":\"${TS}\",\"event\":\"${EVENT}\",\"path\":\"${FILE_PATH}\",\"tool\":\"${TOOL_NAME}\"}" >> "$CHANGE_LOG"

# Initialize state file if missing
if [[ ! -f "$STATE_FILE" ]]; then
    echo "{\"last_maintenance_ts\":\"\",\"last_knowledge_update_ts\":\"\",\"last_commit_ts\":\"\",\"edits_since_last_maintenance\":0,\"commits_since_last_maintenance\":0,\"maintenance_pending\":false}" > "$STATE_FILE"
fi

# Read current edit count
EDIT_COUNT=$(grep -o '"edits_since_last_maintenance"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | grep -o '[0-9]*$')
EDIT_COUNT=${EDIT_COUNT:-0}
NEW_COUNT=$((EDIT_COUNT + 1))

# Update edit count in state file (macOS sed, with Linux fallback)
sed -i '' "s/\"edits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"edits_since_last_maintenance\":${NEW_COUNT}/" "$STATE_FILE" 2>/dev/null || \
sed -i "s/\"edits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"edits_since_last_maintenance\":${NEW_COUNT}/" "$STATE_FILE" 2>/dev/null

# Throttled nudge: only at 25-edit intervals
THRESHOLD=25
if [[ $((NEW_COUNT % THRESHOLD)) -eq 0 ]] && [[ $NEW_COUNT -gt 0 ]]; then
    echo "[maintenance-hint] ${NEW_COUNT} file edits since last maintenance. Consider running maintenance at the next natural pause."
fi

exit 0
