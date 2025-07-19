# WSL Toast

A bash utility to send toast notifications from WSL using PowerShell's BurntToast module.

## Prerequisites

- Windows 10/11 with WSL2
- PowerShell 5.1 or later
- Node.js 16.0.0 or later

## Installation

### Quick Start (Recommended)

```bash
npx wsl-toast install
```

This will install the utility and the required BurntToast module.

### Manual Installation

1. Install the npm package:
```bash
npm install -g wsl-toast
```

2. Install the BurntToast PowerShell module (requires admin privileges):
```bash
wsl-toast install
```

## Usage

### Basic Usage

Send a simple toast notification:
```bash
wsl-toast send "Your message here"
```

### Advanced Usage

Send a toast with custom title and duration:
```bash
wsl-toast send "Task completed successfully!" --title "Build Status" --duration 10
```

Send a toast with a custom icon:
```bash
wsl-toast send "File uploaded!" --icon "C:\path\to\icon.png"
```

### Available Commands

- `wsl-toast send <message>` - Send a toast notification
- `wsl-toast install` - Install BurntToast module
- `wsl-toast check` - Check if BurntToast is installed
- `wsl-toast --help` - Show help information

### Options

- `-t, --title <title>` - Set the toast title (default: "WSL Notification")
- `-i, --icon <icon>` - Path to icon file (optional)
- `-d, --duration <duration>` - Duration in seconds (default: 5)

## Examples

```bash
# Simple notification
wsl-toast send "Build completed!"

# Notification with custom title
wsl-toast send "Database backup finished" --title "Backup Status"

# Long-lasting notification
wsl-toast send "Important: Check your email" --duration 30

# Notification with icon
wsl-toast send "New message received" --icon "C:\icons\message.png"
```

## Troubleshooting

### BurntToast Installation Issues

If you encounter issues installing BurntToast:

1. Run PowerShell as Administrator
2. Execute: `Set-ExecutionPolicy RemoteSigned`
3. Then run: `Install-Module -Name BurntToast -Force -AllowClobber`

### Permission Issues

If you get permission errors:
- Ensure you're running the install command with administrator privileges
- Check that PowerShell execution policy allows script execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
