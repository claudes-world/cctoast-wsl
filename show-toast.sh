#!/bin/bash

# Default values
TITLE="Claude Code"
MESSAGE="DONE"
IMAGE_PATH="$HOME/Documents/Windows Terminal/claude-code.png"
ATTRIBUTION="From PowerShell"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title|-t)
      TITLE="$2"
      shift 2
      ;;
    --message|-m)
      MESSAGE="$2"
      shift 2
      ;;
    --image|-i)
      IMAGE_PATH="$2"
      shift 2
      ;;
    --attribution|-a)
      ATTRIBUTION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--title <title>] [--message <message>] [--image <image_path>] [--attribution <text>]"
      exit 1
      ;;
  esac
done

# Convert WSL path to Windows path
WIN_IMAGE_PATH=$(wslpath -w "$IMAGE_PATH")

# PowerShell command
powershell.exe -Command "
  \$img = '$WIN_IMAGE_PATH';
  Import-Module BurntToast;
  New-BurntToastNotification -Text '$TITLE', '$MESSAGE' -AppLogo \$img -AttributionText '$ATTRIBUTION';
"
