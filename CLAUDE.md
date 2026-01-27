# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

s3sh is a shell-like CLI tool for testing AWS S3-compatible storage operations. It provides an interactive shell interface for navigating and reading S3 bucket contents. This is a testing/development utility, not intended for production file transfers.

## Commands

```bash
# Run the application
npm start

# Build standalone binaries
npm run build          # Current platform
npm run build:win      # Windows x64
npm run build:linux    # Linux x64
npm run build:mac      # macOS x64
```

There are no test or lint scripts configured.

## Architecture

The codebase consists of three main files with clear separation of concerns:

- **main.js** - Entry point and command orchestration. Parses CLI arguments, loads environment configuration from `.env`/`.env.defaults`, registers all shell commands, and manages the interactive command loop. Maintains state for current S3 prefix path, credentials, region, and bucket.

- **cli.js** - CLI framework wrapper around the `arg` package. Provides readline-based interactive shell, command registration with aliases, and async command execution with error handling.

- **s3api.js** - AWS S3 SDK wrapper. Handles credential management (access keys, IAM profiles), provides `docList()` for listing objects with folder/file distinction using Delimiter, and `docGet()` for retrieving text content.

## Key Patterns

- All S3 operations are async; command handlers support async execution
- S3 "folder" navigation uses `ListObjectsCommand` with `Delimiter='/'` and CommonPrefixes
- Credentials can come from direct keys, IAM profiles, or environment variables
- Path normalization removes leading/trailing slashes and handles `~` for root

## Environment Variables

Configuration loaded from `.env`/`.env.defaults`:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_PROFILE`, `AWS_REGION_ID`, `AWS_BUCKET`

## Limitations

- Read-only operations (no upload/delete)
- Text files only (no binary support in cat/read commands)
- Designed for testing S3 connectivity, not production use
