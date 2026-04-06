#!/bin/bash
#
# Git Operations Protection Hook (Bash Version)
#
# This PreToolUse hook prevents dangerous or irreversible git operations
# that could cause data loss or repository corruption.
#
# Exit Codes:
#   0 - Git operation is safe
#   2 - Git operation is dangerous, block
#
# Author: Project Safety Hook (Bash Version)

# Read JSON input from stdin
INPUT=$(cat)

# Extract command from JSON input
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# If no command or not a git command, allow
if [[ -z "$COMMAND" ]] || [[ ! "$COMMAND" =~ git ]]; then
    exit 0
fi

# Function to block operation with message
block_operation() {
    local reason="$1"
    cat << EOF
🚫 BLOCKED: Dangerous Git Operation

Command: $COMMAND

Reason: $reason

This git operation is blocked because it could cause data loss or
repository corruption. Hooks handle this more intelligently than
deny rules - they allow safe operations while blocking dangerous ones.

Safe alternatives:
1. For force push:
   - Review changes carefully first
   - Only force push to feature branches (not main/master/production)
   - Use 'git push --force-with-lease' after confirmation

2. For hard reset:
   - Use 'git reset --soft' to preserve changes
   - Or 'git stash' before resetting

3. For branch deletion:
   - Use 'git branch -d' (without -D) to check merge status first

To override this protection, run the command directly in your terminal.
EOF
    exit 2
}

# Check for force push (including --force-with-lease) to protected branches
# More robust pattern that catches all force variants
if [[ "$COMMAND" =~ git[[:space:]]+push.*(--force-with-lease|--force|-f([[:space:]]|$)) ]]; then
    # Extract branch name from push command
    BRANCH=$(echo "$COMMAND" | sed -n 's/.*origin[[:space:]]\+\([^[:space:]]\+\).*/\1/p')

    # Block force operations on protected branches
    if [[ "$BRANCH" =~ ^(main|master|production|prod|develop|development)$ ]] || [[ "$COMMAND" =~ (main|master|production|prod|develop|development) ]]; then
        block_operation "Force push to protected branch (main/master/development/production) - EXTREMELY DANGEROUS"
    fi
fi

# Check for hard reset
if [[ "$COMMAND" =~ git[[:space:]]+reset[[:space:]]+--hard ]]; then
    block_operation "Hard reset discards uncommitted changes permanently"
fi

# Check for git clean with force
if [[ "$COMMAND" =~ git[[:space:]]+clean.*-f ]]; then
    block_operation "Git clean removes untracked files permanently"
fi

# Check for force branch deletion
if [[ "$COMMAND" =~ git[[:space:]]+branch[[:space:]]+-D ]]; then
    block_operation "Force delete branch (-D) without merge check"
fi

# Check for reflog operations
if [[ "$COMMAND" =~ git[[:space:]]+reflog[[:space:]]+delete ]] || [[ "$COMMAND" =~ git[[:space:]]+reflog[[:space:]]+expire ]]; then
    block_operation "Deleting/expiring reflog removes recovery options"
fi

# Check for git prune
if [[ "$COMMAND" =~ git[[:space:]]+prune ]]; then
    block_operation "Git prune permanently deletes unreachable objects"
fi

# Check for filter-branch
if [[ "$COMMAND" =~ git[[:space:]]+filter-branch ]]; then
    block_operation "Filter-branch rewrites history irreversibly"
fi

# Check for global config changes
if [[ "$COMMAND" =~ git[[:space:]]+config[[:space:]]+--global ]]; then
    block_operation "Modifying global git config affects all repositories"
fi

# Check for hooks path changes
if [[ "$COMMAND" =~ git[[:space:]]+config.*core\.hooksPath ]]; then
    block_operation "Changing hooks path could disable safety hooks"
fi

# Check for force submodule deinit
if [[ "$COMMAND" =~ git[[:space:]]+submodule[[:space:]]+deinit[[:space:]]+-f ]]; then
    block_operation "Force deinit submodule loses uncommitted changes"
fi

# Operation is safe
exit 0
