#!/bin/bash

# Test script for WSL Toast utility

echo "🧪 Testing WSL Toast utility..."

# Test basic notification
echo "Sending basic notification..."
wsl-toast send "This is a test notification from WSL!"

# Wait 2 seconds
sleep 2

# Test notification with custom title
echo "Sending notification with custom title..."
wsl-toast send "Test completed successfully!" --title "Test Results"

# Wait 2 seconds
sleep 2

# Test notification with longer duration
echo "Sending notification with longer duration..."
wsl-toast send "This notification will stay longer" --duration 10

echo "✅ Test completed! Check your Windows notifications." 