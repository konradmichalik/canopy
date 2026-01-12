#!/bin/bash

# Release Script for Canopy
# Creates a build tag in format: v2026.01.12-1430

set -e

# Generate tag from current date and time
TAG="v$(date +%Y.%m.%d-%H%M)"

echo "Creating release tag: $TAG"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "Warning: You have uncommitted changes."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Create the tag
git tag "$TAG"
echo "Tag $TAG created locally."

# Ask to push
read -p "Push tag to origin? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git push origin "$TAG"
    echo "Tag pushed. GitHub Action will now build the release."
    echo "Check: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
else
    echo "Tag not pushed. Run 'git push origin $TAG' when ready."
fi
