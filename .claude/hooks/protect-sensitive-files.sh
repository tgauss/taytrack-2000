#!/bin/bash
#
# Sensitive File Protection Hook (Bash Version)
#
# This PreToolUse hook blocks Edit and Write operations on sensitive files
# to prevent accidental exposure or modification of credentials, environment
# variables, lock files, and critical configuration.
#
# Exit Codes:
#   0 - File is safe to modify
#   2 - File is protected, block modification
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
🔒 BLOCKED: Protected File

File: $FILE_PATH

Reason: $reason

This file is protected from modification for security. If you need to edit it:

1. Verify the change is necessary and safe
2. Edit the file manually in your editor
3. Consider if secrets should be in environment variables instead
4. Or modify the hook at .claude/hooks/protect-sensitive-files.sh

Common alternatives:
- Use .env.example with placeholder values for documentation
- Store secrets in a password manager or secret vault
- Use environment variables injected at runtime
EOF
    exit 2
}

# Check for environment and credential files
if [[ "$FILENAME" == ".env" ]] || \
   [[ "$FILENAME" == ".env.local" ]] || \
   [[ "$FILENAME" == ".env.production" ]] || \
   [[ "$FILENAME" == ".env.development" ]] || \
   [[ "$FILENAME" == ".env.test" ]] || \
   [[ "$FILENAME" == ".env.staging" ]] || \
   [[ "$FILENAME" == "credentials.json" ]] || \
   [[ "$FILENAME" == "credentials.yml" ]] || \
   [[ "$FILENAME" == "credentials.yaml" ]] || \
   [[ "$FILENAME" == "secrets.json" ]] || \
   [[ "$FILENAME" == "secrets.yml" ]] || \
   [[ "$FILENAME" == "secrets.yaml" ]] || \
   [[ "$FILENAME" == ".npmrc" ]] || \
   [[ "$FILENAME" == ".yarnrc" ]] || \
   [[ "$FILENAME" == ".pypirc" ]]; then
    block_operation "Protected credential/environment file: $FILENAME"
fi

# Check for lock files (should be managed by package managers)
if [[ "$FILENAME" == "package-lock.json" ]] || \
   [[ "$FILENAME" == "yarn.lock" ]] || \
   [[ "$FILENAME" == "pnpm-lock.yaml" ]] || \
   [[ "$FILENAME" == "composer.lock" ]] || \
   [[ "$FILENAME" == "Gemfile.lock" ]] || \
   [[ "$FILENAME" == "poetry.lock" ]] || \
   [[ "$FILENAME" == "Pipfile.lock" ]] || \
   [[ "$FILENAME" == "go.sum" ]] || \
   [[ "$FILENAME" == "Cargo.lock" ]]; then
    block_operation "Protected lock file (managed by package manager): $FILENAME"
fi

# Check for protected directories
if [[ "$FILE_PATH" =~ /.git/ ]] || \
   [[ "$FILE_PATH" =~ /.ssh/ ]] || \
   [[ "$FILE_PATH" =~ /.aws/ ]] || \
   [[ "$FILE_PATH" =~ /.kube/ ]] || \
   [[ "$FILE_PATH" =~ /node_modules/.bin/ ]]; then
    block_operation "Protected directory in path"
fi

# Check for certificate and key file extensions
if [[ "$FILENAME" =~ \.pem$ ]] || \
   [[ "$FILENAME" =~ \.key$ ]] || \
   [[ "$FILENAME" =~ \.crt$ ]] || \
   [[ "$FILENAME" =~ \.cer$ ]] || \
   [[ "$FILENAME" =~ \.p12$ ]] || \
   [[ "$FILENAME" =~ \.pfx$ ]] || \
   [[ "$FILENAME" =~ \.jks$ ]] || \
   [[ "$FILENAME" =~ \.keystore$ ]] || \
   [[ "$FILENAME" =~ ^id_rsa ]] || \
   [[ "$FILENAME" =~ ^id_ed25519 ]] || \
   [[ "$FILENAME" =~ ^id_ecdsa ]]; then
    block_operation "Protected certificate/key file"
fi

# Check for common secret patterns in filename
if [[ "$FILEPATH_LOWER" =~ secret ]] || \
   [[ "$FILEPATH_LOWER" =~ password ]] || \
   [[ "$FILEPATH_LOWER" =~ passwd ]] || \
   [[ "$FILEPATH_LOWER" =~ credential ]] || \
   [[ "$FILEPATH_LOWER" =~ api_key ]] || \
   [[ "$FILEPATH_LOWER" =~ apikey ]] || \
   [[ "$FILENAME" =~ ^\..*token ]] || \
   [[ "$FILEPATH_LOWER" =~ auth_token ]] || \
   [[ "$FILEPATH_LOWER" =~ access_token ]]; then
    block_operation "File contains sensitive pattern in name"
fi

# File is safe to modify
exit 0
