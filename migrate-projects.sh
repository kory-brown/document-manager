#!/bin/bash

# Migration script to move projects from old location to new structure
# Run this after you've chosen your storage location in the app

echo "========================================="
echo "Documentation Manager - Project Migration"
echo "========================================="
echo ""

# Check if old projects exist
OLD_LOCATION="$HOME/Documents/current_documents"

if [ ! -d "$OLD_LOCATION" ]; then
    echo "No old projects found at: $OLD_LOCATION"
    echo "Nothing to migrate."
    exit 0
fi

echo "Found existing projects at: $OLD_LOCATION"
echo ""

# Ask for new storage location
echo "Enter your new storage location (the path you chose in the app):"
echo "Example: /Users/$(whoami)/Documents"
read -p "Path: " NEW_STORAGE_BASE

if [ -z "$NEW_STORAGE_BASE" ]; then
    echo "No path provided. Exiting."
    exit 1
fi

# Create new structure
NEW_LOCATION="$NEW_STORAGE_BASE/Document Manager/Projects"
echo ""
echo "Creating new folder structure at: $NEW_LOCATION"
mkdir -p "$NEW_LOCATION"

# Copy projects
echo ""
echo "Copying projects..."
cp -r "$OLD_LOCATION"/* "$NEW_LOCATION/"

echo ""
echo "✅ Migration complete!"
echo ""
echo "Projects copied to: $NEW_LOCATION"
echo ""
echo "Your old projects are still at: $OLD_LOCATION"
echo "You can safely delete them after verifying the migration."
echo ""
echo "Old project structure (current_documents) → New structure (Document Manager/Projects)"

