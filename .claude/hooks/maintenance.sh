#!/bin/bash
#
# Project Maintenance Script
#
# Called by Claude to clean up stale artifacts and reset tracking.
# Run at natural pause points (after commits, end of features).
#
# Actions:
#   1. Clean old scout reports (>30 days)
#   2. Clean completed plans (>30 days)
#   3. Rotate change log (archive if >500 lines)
#   4. Reset tracking counters
#   5. Check knowledge file freshness
#   6. Output summary
#
# Usage: bash .claude/hooks/maintenance.sh [--dry-run]

PROJECT_ROOT="$(pwd)"
MAINT_DIR="${PROJECT_ROOT}/.claude/maintenance"
STATE_FILE="${MAINT_DIR}/state.json"
CHANGE_LOG="${MAINT_DIR}/change-log.jsonl"
SCOUT_DIR="${PROJECT_ROOT}/.claude/scout"
PLANS_DIR="${PROJECT_ROOT}/.claude/plans"
KNOWLEDGE_DIR="${PROJECT_ROOT}/.claude/knowledge"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
fi

# Ensure directories exist
mkdir -p "$MAINT_DIR"

echo "=========================================="
echo "  Project Maintenance Report"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

CLEANED_SCOUTS=0
CLEANED_PLANS=0
LOG_ROTATED=false

# ---- 1. Clean old scout reports (>30 days) ----
echo "## Scout Reports Cleanup"
echo ""

if [[ -d "$SCOUT_DIR" ]]; then
    while IFS= read -r -d '' file; do
        BASENAME=$(basename "$file")
        if [[ "$BASENAME" == "README.md" ]]; then
            continue
        fi
        # macOS stat with Linux fallback
        FILE_MTIME=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)
        if [[ -z "$FILE_MTIME" ]]; then
            continue
        fi
        AGE_DAYS=$(( ( $(date +%s) - FILE_MTIME ) / 86400 ))
        if [[ $AGE_DAYS -gt 30 ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "  [DRY RUN] Would remove: $BASENAME (${AGE_DAYS} days old)"
            else
                rm "$file"
                echo "  Removed: $BASENAME (${AGE_DAYS} days old)"
            fi
            CLEANED_SCOUTS=$((CLEANED_SCOUTS + 1))
        fi
    done < <(find "$SCOUT_DIR" -name "*.md" -not -name "README.md" -print0 2>/dev/null)
fi

if [[ $CLEANED_SCOUTS -eq 0 ]]; then
    echo "  No stale scout reports found."
fi
echo ""

# ---- 2. Clean completed plans (>30 days) ----
echo "## Plans Cleanup"
echo ""

if [[ -d "$PLANS_DIR" ]]; then
    while IFS= read -r -d '' file; do
        BASENAME=$(basename "$file")
        if [[ "$BASENAME" == "README.md" ]]; then
            continue
        fi
        FILE_MTIME=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)
        if [[ -z "$FILE_MTIME" ]]; then
            continue
        fi
        AGE_DAYS=$(( ( $(date +%s) - FILE_MTIME ) / 86400 ))
        if [[ $AGE_DAYS -gt 30 ]]; then
            # Only clean plans marked as completed
            if grep -qi "Status.*Completed\|COMPLETED\|status:.*completed" "$file" 2>/dev/null; then
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo "  [DRY RUN] Would remove completed plan: $BASENAME (${AGE_DAYS} days old)"
                else
                    rm "$file"
                    echo "  Removed completed plan: $BASENAME (${AGE_DAYS} days old)"
                fi
                CLEANED_PLANS=$((CLEANED_PLANS + 1))
            else
                echo "  Keeping: $BASENAME (${AGE_DAYS} days old, not marked completed)"
            fi
        fi
    done < <(find "$PLANS_DIR" -name "*.md" -not -name "README.md" -print0 2>/dev/null)
fi

if [[ $CLEANED_PLANS -eq 0 ]]; then
    echo "  No stale completed plans found."
fi
echo ""

# ---- 3. Rotate change log ----
echo "## Change Log"
echo ""

if [[ -f "$CHANGE_LOG" ]]; then
    LOG_LINES=$(wc -l < "$CHANGE_LOG" | tr -d ' ')
    echo "  Current entries: ${LOG_LINES}"

    if [[ $LOG_LINES -gt 500 ]]; then
        ARCHIVE_FILE="${MAINT_DIR}/change-log-$(date +%Y%m%d).jsonl.old"
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "  [DRY RUN] Would archive to: $(basename "$ARCHIVE_FILE")"
            echo "  [DRY RUN] Would keep last 100 entries"
        else
            cp "$CHANGE_LOG" "$ARCHIVE_FILE"
            tail -100 "$CHANGE_LOG" > "${CHANGE_LOG}.tmp"
            mv "${CHANGE_LOG}.tmp" "$CHANGE_LOG"
            echo "  Archived to: $(basename "$ARCHIVE_FILE")"
            echo "  Kept last 100 entries"
        fi
        LOG_ROTATED=true
    else
        echo "  Under threshold (500), no rotation needed."
    fi

    # Activity summary
    if [[ $LOG_LINES -gt 0 ]]; then
        EDIT_EVENTS=$(grep -c '"file_edit"\|"file_write"' "$CHANGE_LOG" 2>/dev/null || echo 0)
        COMMIT_EVENTS=$(grep -c '"git_commit"' "$CHANGE_LOG" 2>/dev/null || echo 0)
        BUILD_EVENTS=$(grep -c '"build_success"' "$CHANGE_LOG" 2>/dev/null || echo 0)
        echo "  Activity: ${EDIT_EVENTS} edits, ${COMMIT_EVENTS} commits, ${BUILD_EVENTS} builds"
    fi
else
    echo "  No change log exists yet."
fi
echo ""

# ---- 4. Check knowledge files freshness ----
echo "## Knowledge Files Freshness"
echo ""

if [[ -d "$KNOWLEDGE_DIR" ]]; then
    STALE_COUNT=0
    while IFS= read -r -d '' file; do
        BASENAME=$(basename "$file")
        if [[ "$BASENAME" == "README.md" ]] || [[ "$BASENAME" == "meta-index.md" ]]; then
            continue
        fi
        FILE_MTIME=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)
        if [[ -z "$FILE_MTIME" ]]; then
            continue
        fi
        AGE_DAYS=$(( ( $(date +%s) - FILE_MTIME ) / 86400 ))
        if [[ $AGE_DAYS -gt 60 ]]; then
            echo "  STALE (${AGE_DAYS}d): $BASENAME"
            STALE_COUNT=$((STALE_COUNT + 1))
        fi
    done < <(find "$KNOWLEDGE_DIR" -maxdepth 1 -name "*.md" -print0 2>/dev/null)

    if [[ $STALE_COUNT -eq 0 ]]; then
        echo "  All knowledge files are current (updated within 60 days)."
    else
        echo "  ${STALE_COUNT} knowledge file(s) may need review."
    fi
else
    echo "  No knowledge directory found."
fi
echo ""

# ---- 5. Reset state ----
echo "## State Reset"
echo ""

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would reset counters and update last_maintenance_ts"
else
    if [[ -f "$STATE_FILE" ]]; then
        sed -i '' "s/\"edits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"edits_since_last_maintenance\":0/" "$STATE_FILE" 2>/dev/null || \
        sed -i "s/\"edits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"edits_since_last_maintenance\":0/" "$STATE_FILE" 2>/dev/null

        sed -i '' "s/\"commits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"commits_since_last_maintenance\":0/" "$STATE_FILE" 2>/dev/null || \
        sed -i "s/\"commits_since_last_maintenance\"[[:space:]]*:[[:space:]]*[0-9]*/\"commits_since_last_maintenance\":0/" "$STATE_FILE" 2>/dev/null

        sed -i '' "s/\"last_maintenance_ts\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"last_maintenance_ts\":\"${TS}\"/" "$STATE_FILE" 2>/dev/null || \
        sed -i "s/\"last_maintenance_ts\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"last_maintenance_ts\":\"${TS}\"/" "$STATE_FILE" 2>/dev/null

        sed -i '' "s/\"maintenance_pending\"[[:space:]]*:[[:space:]]*true/\"maintenance_pending\":false/" "$STATE_FILE" 2>/dev/null || \
        sed -i "s/\"maintenance_pending\"[[:space:]]*:[[:space:]]*true/\"maintenance_pending\":false/" "$STATE_FILE" 2>/dev/null
    else
        echo "{\"last_maintenance_ts\":\"${TS}\",\"last_knowledge_update_ts\":\"\",\"last_commit_ts\":\"\",\"edits_since_last_maintenance\":0,\"commits_since_last_maintenance\":0,\"maintenance_pending\":false}" > "$STATE_FILE"
    fi
    echo "  Counters reset. Last maintenance: ${TS}"
fi
echo ""

# ---- Summary ----
echo "=========================================="
echo "  Summary"
echo "=========================================="
echo "  Scout reports cleaned:  ${CLEANED_SCOUTS}"
echo "  Plans cleaned:          ${CLEANED_PLANS}"
echo "  Change log rotated:     ${LOG_ROTATED}"
echo "  Counters reset:         $([ "$DRY_RUN" = "true" ] && echo "no (dry run)" || echo "yes")"
echo "=========================================="
