# Kimi CLI Setup

This directory contains the Kimi CLI wrapper for Claude with Moonshot AI integration.

## Files

- `kimi.sh` - Main script that handles environment loading and Claude integration
- `.env` - Local environment variables (if needed)
- `README.md` - This documentation

## Usage

### Direct Usage

```bash
# Run the script directly
.kimi/kimi.sh "Your prompt here"

# With help
.kimi/kimi.sh --help

# With version info
.kimi/kimi.sh --version
```

### Using the Wrapper

```bash
# Use the wrapper script in project root
./kimi "Your prompt here"

# With help
./kimi --help
```

### Sourcing for Interactive Use

```bash
# Source the script to make kimi function available
source .kimi/kimi.sh

# Now you can use kimi directly
kimi "Your prompt here"
```

## Environment Setup

The script automatically sources environment files in this order:

1. `.env` in project root
2. `.env` in `.kimi` directory (if exists)

Required environment variables:

```bash
# Required
KIMI_API_KEY=your-moonshot-api-key-here
```

## Installation Requirements

- `claude` command must be installed: `npm install -g @anthropic-ai/claude`
- Valid Moonshot AI API key

## Features

- ✅ Colored logging with status messages
- ✅ Help and version flags
- ✅ Automatic environment file loading
- ✅ Error handling for missing dependencies
- ✅ Support for both direct execution and sourcing
- ✅ Proper argument passing to Claude 