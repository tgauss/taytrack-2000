#!/bin/bash
#
# Dangerous Command Protection Hook (Bash Version)
#
# This PreToolUse hook blocks potentially dangerous bash commands before execution.
# It validates commands against patterns known to be destructive or risky.
#
# Exit Codes:
#   0 - Command is safe, allow execution
#   2 - Command is blocked, show error to Claude
#
# Author: Project Safety Hook (Bash Version)

# Read JSON input from stdin
INPUT=$(cat)

# Extract command from JSON input
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# If no command or not a bash-related tool, allow
if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Function to block operation with message
block_operation() {
    local reason="$1"
    cat << EOF
🛑 BLOCKED: Dangerous Command Detected

Command: $COMMAND

Reason: $reason

This command has been blocked for safety. If you need to perform this operation:
1. Verify the command is correct and necessary
2. Consider safer alternatives
3. Run it manually with appropriate caution
4. Or modify the hook at .claude/hooks/validate-bash-command.sh
EOF
    exit 2
}

# Destructive file operations
if [[ "$COMMAND" =~ rm[[:space:]]+-rf[[:space:]]+/ ]]; then
    block_operation "Recursive force delete from root - EXTREMELY DANGEROUS"
fi

if [[ "$COMMAND" =~ rm[[:space:]]+-rf[[:space:]]+~ ]]; then
    block_operation "Recursive force delete from home directory"
fi

if [[ "$COMMAND" =~ rm[[:space:]]+-rf[[:space:]]+\* ]]; then
    block_operation "Recursive force delete with wildcard"
fi

if [[ "$COMMAND" =~ rm[[:space:]]+-[rf]*f[rf]*[[:space:]]+/ ]]; then
    block_operation "Force delete from root directory"
fi

if [[ "$COMMAND" =~ rm[[:space:]]+--no-preserve-root ]]; then
    block_operation "Bypass root protection on rm command"
fi

# Disk operations
if [[ "$COMMAND" =~ dd[[:space:]]+if=.*of=/dev/ ]] || [[ "$COMMAND" =~ dd[[:space:]]+of=/dev/ ]]; then
    block_operation "Direct disk write - can destroy data"
fi

if [[ "$COMMAND" =~ mkfs[[:space:]] ]]; then
    block_operation "Format filesystem - data loss"
fi

if [[ "$COMMAND" =~ fdisk[[:space:]] ]]; then
    block_operation "Disk partitioning - potential data loss"
fi

# System modification
if [[ "$COMMAND" =~ \>[[:space:]]*/dev/sd ]]; then
    block_operation "Writing to disk device"
fi

if [[ "$COMMAND" =~ :\(\)[[:space:]]*\{ ]] && [[ "$COMMAND" =~ \}[[:space:]]*\; ]]; then
    block_operation "Fork bomb - system DoS"
fi

if [[ "$COMMAND" =~ chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/ ]]; then
    block_operation "Recursive 777 permissions from root"
fi

if [[ "$COMMAND" =~ chown[[:space:]]+-R.*/ ]]; then
    block_operation "Recursive ownership change from root"
fi

# Package manager dangers
if [[ "$COMMAND" =~ apt-get[[:space:]]+remove.*linux- ]]; then
    block_operation "Removing Linux kernel packages"
fi

if [[ "$COMMAND" =~ yum[[:space:]]+remove.*kernel ]]; then
    block_operation "Removing kernel packages"
fi

# Network/remote dangers
if [[ "$COMMAND" =~ curl.*\|[[:space:]]*bash ]] || [[ "$COMMAND" =~ curl.*\|[[:space:]]*sh ]]; then
    block_operation "Piping untrusted remote script to bash"
fi

if [[ "$COMMAND" =~ wget.*\|[[:space:]]*sh ]] || [[ "$COMMAND" =~ wget.*\|[[:space:]]*bash ]]; then
    block_operation "Piping untrusted remote script to shell"
fi

if [[ "$COMMAND" =~ curl.*\|[[:space:]]*sudo[[:space:]]+bash ]]; then
    block_operation "Running remote script as root"
fi

# Process/system control
if [[ "$COMMAND" =~ killall[[:space:]]+-9 ]]; then
    block_operation "Force killing all processes by name"
fi

if [[ "$COMMAND" =~ pkill[[:space:]]+-9 ]]; then
    block_operation "Force killing processes by pattern"
fi

if [[ "$COMMAND" =~ (^|[[:space:]])shutdown([[:space:]]|$) ]]; then
    block_operation "System shutdown command"
fi

if [[ "$COMMAND" =~ (^|[[:space:]])reboot([[:space:]]|$) ]]; then
    block_operation "System reboot command"
fi

if [[ "$COMMAND" =~ (^|[[:space:]])halt([[:space:]]|$) ]]; then
    block_operation "System halt command"
fi

# Check for suspicious sudo + rm combinations
if [[ "$COMMAND" =~ sudo ]] && [[ "$COMMAND" =~ rm ]]; then
    if [[ "$COMMAND" =~ -[rf]+|--force|--recursive ]]; then
        block_operation "Sudo with force/recursive delete - HIGH RISK"
    fi
fi

# Command is safe, allow execution
exit 0
