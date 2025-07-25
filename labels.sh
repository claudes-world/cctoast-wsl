#!/bin/bash
# GitHub Labels Setup for cctoast-wsl project

set -e

echo "Creating GitHub labels for project..."


# Component Labels
gh label create "milestone" --description "Major milestone tracking" --color "0052cc"
gh label create "cli" --description "Command line interface components" --color "28a745"
gh label create "installer" --description "Installation system components" --color "17a2b8"
gh label create "runtime" --description "Runtime components (bash scripts)" --color "343a40"
gh label create "testing" --description "Testing infrastructure and test cases" --color "e83e8c"
gh label create "docs" --description "Documentation updates and improvements" --color "6f42c1"
gh label create "ci/cd" --description "CI/CD pipeline and automation" --color "6c757d"

# Type Labels
gh label create "feature" --description "New functionality" --color "28a745"
gh label create "enhancement" --description "Improvement to existing feature" --color "0052cc"
gh label create "bug" --description "Something isn't working" --color "d73a4a"
gh label create "documentation" --description "Documentation only changes" --color "f8f9fa"
gh label create "dependencies" --description "Dependency management and updates" --color "1f2937"
gh label create "security" --description "Security related improvements" --color "fd7e14"


# Architecture/System Labels
gh label create "architecture" --description "Architecture and design decisions" --color "6f42c1"
gh label create "powershell" --description "PowerShell integration related" --color "012456"
gh label create "burnttoast" --description "BurntToast module related" --color "ff8c00"
gh label create "wsl" --description "WSL specific functionality" --color "4caf50"

echo "All labels created successfully!"
echo "Run 'gh label list' to see all labels"