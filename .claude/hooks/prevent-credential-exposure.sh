#!/bin/bash
#
# Credential Exposure Prevention Hook (Bash Version)
#
# This PreToolUse hook prevents Claude from reading or exposing sensitive
# credential files that might contain secrets, API keys, or passwords.
#
# Exit Codes:
#   0 - File is safe to read
#   2 - File contains credentials, block read access
#
# Author: Project Safety Hook (Bash Version)

# Read JSON input from stdin
INPUT=$(cat)

# Extract file_path from JSON input
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# If no file path, allow
if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get filename and lowercase version for matching
FILENAME=$(basename "$FILE_PATH")
FILEPATH_LOWER=$(echo "$FILE_PATH" | tr '[:upper:]' '[:lower:]')

# Function to block operation with message
block_operation() {
    local reason="$1"
    cat << EOF
🚫 BLOCKED: Credential File Access

File: $FILE_PATH

Reason: $reason

This file may contain sensitive credentials, API keys, or secrets.
The hook blocks access to prevent accidental exposure.

If you need to work with this file:
1. Review it manually in your editor
2. Ensure no secrets will be exposed
3. Use environment variables instead of committing secrets

To override, access the file directly in your terminal.
EOF
    exit 2
}

# Check for environment files
if [[ "$FILENAME" =~ ^\.env ]] || [[ "$FILEPATH_LOWER" =~ \.env ]]; then
    block_operation "Environment file may contain API keys and secrets"
fi

# Check for credential patterns in filename
if [[ "$FILEPATH_LOWER" =~ credential ]] || \
   [[ "$FILEPATH_LOWER" =~ secret ]] || \
   [[ "$FILEPATH_LOWER" =~ password ]] || \
   [[ "$FILEPATH_LOWER" =~ api[_-]?key ]] || \
   [[ "$FILEPATH_LOWER" =~ auth[_-]?token ]]; then
    block_operation "Filename suggests it contains credentials or secrets"
fi

# Check for private key files
if [[ "$FILENAME" =~ \.pem$ ]] || \
   [[ "$FILENAME" =~ \.key$ ]] || \
   [[ "$FILENAME" =~ ^id_rsa ]] || \
   [[ "$FILENAME" =~ \.ppk$ ]] || \
   [[ "$FILENAME" =~ \.p12$ ]] || \
   [[ "$FILENAME" =~ \.pfx$ ]]; then
    block_operation "Private key file should not be read"
fi

# Check for AWS credentials
if [[ "$FILEPATH_LOWER" =~ \.aws/credentials ]] || \
   [[ "$FILEPATH_LOWER" =~ \.aws/config ]]; then
    block_operation "AWS credentials file"
fi

# Check for GCP credentials
if [[ "$FILEPATH_LOWER" =~ gcp.*credentials ]] || \
   [[ "$FILEPATH_LOWER" =~ google.*credentials ]] || \
   [[ "$FILENAME" =~ .*-credentials\.json$ ]]; then
    block_operation "GCP/Google credentials file"
fi

# Check for Docker/Kubernetes secrets
if [[ "$FILEPATH_LOWER" =~ \.docker/config\.json ]] || \
   [[ "$FILEPATH_LOWER" =~ \.kube/config ]]; then
    block_operation "Docker/Kubernetes config may contain credentials"
fi

# Check for database connection strings
if [[ "$FILEPATH_LOWER" =~ database ]] && [[ "$FILEPATH_LOWER" =~ (config|credentials|connection) ]]; then
    block_operation "Database configuration may contain connection strings"
fi

# File is safe to read
exit 0
