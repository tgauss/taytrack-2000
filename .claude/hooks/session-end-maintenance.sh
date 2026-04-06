#!/bin/bash
#
# Stop Hook: Session End Maintenance Check
#
# Runs after Claude finishes its response. Output goes to the user.
# Checks if significant work happened without maintenance and
# writes a flag for the next session to pick up.
#
# Exit 0 always.

PROJECT_ROOT="$(pwd)"
MAINT_DIR="${PROJECT_ROOT}/.claude/maintenance"
STATE_FILE="${MAINT_DIR}/state.json"

# Exit silently if no maintenance directory or state file
if [[ ! -d "$MAINT_DIR" ]] || [[ ! -f "$STATE_FILE" ]]; then
    exit 0
fi

# Read counters
EDIT_COUNT=$(grep -o '"edits_since_last_maintenance"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | grep -o '[0-9]*$')
COMMIT_COUNT=$(grep -o '"commits_since_last_maintenance"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | grep -o '[0-9]*$')

EDIT_COUNT=${EDIT_COUNT:-0}
COMMIT_COUNT=${COMMIT_COUNT:-0}

# Only flag if there's been meaningful work without maintenance
if [[ $EDIT_COUNT -ge 10 ]] || [[ $COMMIT_COUNT -ge 2 ]]; then
    # Set maintenance_pending flag
    sed -i '' "s/\"maintenance_pending\"[[:space:]]*:[[:space:]]*false/\"maintenance_pending\":true/" "$STATE_FILE" 2>/dev/null || \
    sed -i "s/\"maintenance_pending\"[[:space:]]*:[[:space:]]*false/\"maintenance_pending\":true/" "$STATE_FILE" 2>/dev/null
fi

exit 0
