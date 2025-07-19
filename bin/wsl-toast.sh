#!/bin/bash

# WSL Toast - Send toast notifications from WSL using PowerShell BurntToast
# Usage: ./wsl-toast.sh "Your message" [title] [duration]

MESSAGE="${1:-'Hello from WSL!'}"
TITLE="${2:-'WSL Notification'}"
DURATION="${3:-5}"

# Check if message is provided
if [ -z "$1" ]; then
    echo "Usage: $0 \"message\" [title] [duration]"
    echo "Example: $0 \"Build completed!\" \"Build Status\" 10"
    exit 1
fi

# Send the toast notification using PowerShell
powershell.exe -Command "New-BurntToastNotification -Text '$MESSAGE' -Header '$TITLE' -Duration $DURATION"

if [ $? -eq 0 ]; then
    echo "✅ Toast notification sent successfully!"
else
    echo "❌ Failed to send toast notification"
    echo "💡 Make sure BurntToast module is installed: wsl-toast install"
    exit 1
fi 