#!/bin/bash

# Script to create a document bundle from existing website project
# This makes it easy to import documents into Documentation Manager

echo "========================================="
echo "Create Document Bundle for Import"
echo "========================================="
echo ""

# Ask for website project path
echo "Enter the path to your website project:"
echo "Example: /Users/$(whoami)/Projects/application-user-guide"
read -p "Path: " WEBSITE_PATH

if [ -z "$WEBSITE_PATH" ]; then
    echo "No path provided. Exiting."
    exit 1
fi

# Check if path exists
if [ ! -d "$WEBSITE_PATH" ]; then
    echo "Error: Directory not found: $WEBSITE_PATH"
    exit 1
fi

# Check for data.json
DATA_JSON="$WEBSITE_PATH/assets/data/data.json"
if [ ! -f "$DATA_JSON" ]; then
    echo "Error: data.json not found at: $DATA_JSON"
    exit 1
fi

# Ask for document ID to export
echo ""
echo "Which document do you want to create a bundle for?"
echo "Enter the document ID (e.g., 'quick-start', 'full-guide'):"
read -p "Document ID: " DOC_ID

if [ -z "$DOC_ID" ]; then
    echo "No document ID provided. Exiting."
    exit 1
fi

# Check if images exist
IMAGES_PATH="$WEBSITE_PATH/assets/images/$DOC_ID"
if [ ! -d "$IMAGES_PATH" ]; then
    echo "Warning: Images folder not found at: $IMAGES_PATH"
    echo "Bundle will be created without images."
    HAS_IMAGES=false
else
    HAS_IMAGES=true
fi

# Ask for output location
echo ""
echo "Where should the bundle be created?"
echo "Default: ~/Desktop/${DOC_ID}-bundle"
read -p "Output path (press Enter for default): " OUTPUT_PATH

if [ -z "$OUTPUT_PATH" ]; then
    OUTPUT_PATH="$HOME/Desktop/${DOC_ID}-bundle"
fi

# Create bundle folder
echo ""
echo "Creating bundle at: $OUTPUT_PATH"
mkdir -p "$OUTPUT_PATH"

# Copy data.json
echo "Copying data.json..."
cp "$DATA_JSON" "$OUTPUT_PATH/"

# Copy images if they exist
if [ "$HAS_IMAGES" = true ]; then
    echo "Copying images..."
    mkdir -p "$OUTPUT_PATH/images"
    cp -r "$IMAGES_PATH" "$OUTPUT_PATH/images/"
    echo "✅ Images copied"
else
    echo "⚠️  No images copied (folder not found)"
fi

echo ""
echo "========================================="
echo "✅ Bundle created successfully!"
echo "========================================="
echo ""
echo "Location: $OUTPUT_PATH"
echo ""
echo "Bundle contains:"
echo "  - data.json (all documents)"
if [ "$HAS_IMAGES" = true ]; then
    echo "  - images/$DOC_ID/ (document images)"
fi
echo ""
echo "⚠️  IMPORTANT: Edit the data.json file to keep only the '$DOC_ID' document"
echo "    or the import will try to import all documents in the file."
echo ""
echo "Next steps:"
echo "1. Edit $OUTPUT_PATH/data.json (keep only '$DOC_ID' document)"
echo "2. Open Documentation Manager"
echo "3. Click 'Import Document'"
echo "4. Select folder: $OUTPUT_PATH"
echo ""

