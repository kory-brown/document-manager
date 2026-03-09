# Document Bundle Import Guide

The **Import Document** feature allows you to import a complete document package (data + images) into your project.

## What is a Document Bundle?

A document bundle is a folder containing:
- `data.json` - Contains one or more documents with sections
- `images/[document-id]/` - Images for the document(s)

OR

- `data.json` - Contains one or more documents
- `[document-id]/` - Images folder named with the document ID

## Bundle Structure Examples

### Structure 1: With images parent folder
```
my-document-bundle/
├── data.json
└── images/
    └── quick-start/
        ├── card.svg
        ├── 01_getting_started.png
        ├── 02_workspaces.png
        └── ...
```

### Structure 2: Direct document folder
```
my-document-bundle/
├── data.json
└── quick-start/
    ├── card.svg
    ├── 01_getting_started.png
    ├── 02_workspaces.png
    └── ...
```

## Import Process

### Step 1: Select Bundle Folder
1. Click **"📥 Import Document"**
2. Select the folder containing your bundle
3. The app validates the bundle structure

### Step 2: Validation
The app automatically checks:
- ✅ `data.json` exists
- ✅ Image folder exists
- ✅ Document ID matches image folder name
- ⚠️ If mismatch: Prompts to correct document ID

### Step 3: Duplicate Detection
If a document with the same ID or title exists:

**Prompt Options:**
- **overwrite** - Replace existing document (⚠️ destructive)
- **rename** - Import with a new ID
- **cancel** - Cancel the import

#### If you choose "rename":
1. Enter a new document ID (e.g., `quick-start-v2`)
2. App automatically updates:
   - Document ID
   - All image paths in `cardImage`
   - All image paths in `sectionImage`
   - Image folder name in project

### Step 4: Path Correction
The app automatically fixes all image paths to match the **project structure** (for preview and editing):

**In Bundle (any format works):**
```json
"sectionImage": "images/quick-start/01_getting_started.png"
// OR
"sectionImage": "assets/images/quick-start/01_getting_started.png"  
// OR
"sectionImage": "01_getting_started.png"
```

**In Project (normalized):**
```json
"sectionImage": "images/quick-start/01_getting_started.png"
```

**On Export (for website):**
```json
"sectionImage": "assets/images/quick-start/01_getting_started.png"
```

This allows the app to preview images locally while ensuring correct paths for website deployment!

### Step 5: Import Complete
- ✅ Document added to project
- ✅ Images copied to `projects/[project-name]/images/[document-id]/`
- ✅ All paths corrected
- ✅ Project auto-saved

## Creating a Bundle for Import

### Option 1: Export from Website
If you have an existing documentation website:

```bash
# Create bundle folder
mkdir my-document-bundle
cd my-document-bundle

# Copy data.json (edit to keep only one document)
cp /path/to/website/assets/data/data.json .

# Copy images for that document
mkdir -p images
cp -r /path/to/website/assets/images/[document-id] images/
```

### Option 2: Manual Creation
1. Create a folder for your bundle
2. Create `data.json` - **Two formats supported:**

**Format 1: Single Document Object (Simpler)**
```json
{
  "id": "my-document",
  "title": "My Document Title",
  "version": "1.0",
  "lastUpdated": "2025-11-19",
  "description": "Description here",
  "cardImage": "images/my-document/card.svg",
  "sections": [
    {
      "sectionTitle": "Section 1",
      "sectionSubTitle": "",
      "sectionBody": "Content here",
      "sectionImage": "images/my-document/section1.png"
    }
  ]
}
```

**Format 2: Full Structure with Documents Array**
```json
{
  "theme": { ... },
  "homeContent": { ... },
  "documents": [
    {
      "id": "my-document",
      "title": "My Document Title",
      "version": "1.0",
      "lastUpdated": "2025-11-19",
      "description": "Description here",
      "cardImage": "assets/images/my-document/card.svg",
      "sections": [
        {
          "sectionTitle": "Section 1",
          "sectionSubTitle": "",
          "sectionBody": "Content here",
          "sectionImage": "assets/images/my-document/section1.png"
        }
      ]
    }
  ]
}
```

3. Create image folder (either `my-document/` or `images/my-document/`)
4. Add your images

**Note:** Image paths in data.json are automatically corrected during import, so both `images/...` and `assets/images/...` formats work!

## Example: Importing from Your Website

You have an existing website project at `/Users/you/Projects/application-user-guide/`

**Create a bundle:**
```bash
# Create bundle folder
mkdir ~/Desktop/quick-start-bundle
cd ~/Desktop/quick-start-bundle

# Copy the full data.json
cp ~/Projects/application-user-guide/assets/data/data.json .

# Edit data.json to keep only the "quick-start" document
# (or leave all documents - each will be imported separately)

# Copy the images
mkdir -p images
cp -r ~/Projects/application-user-guide/assets/images/quick-start images/
```

**Import to Documentation Manager:**
1. Open Documentation Manager
2. Open your project (or create one)
3. Click **"📥 Import Document"**
4. Select `~/Desktop/quick-start-bundle`
5. Follow prompts if duplicates exist

## Troubleshooting

### "Invalid bundle: data.json not found"
- Ensure `data.json` is in the root of the selected folder
- Check file name (case-sensitive)

### "Invalid bundle: No image folder found"
- Create an `images/[document-id]/` folder
- OR create a `[document-id]/` folder in the bundle root
- Ensure folder name matches document ID

### "Document ID doesn't match image folder"
- Choose to correct the document ID when prompted
- OR rename your image folder to match the document ID

### Import succeeds but images don't show
- Check that image filenames in `data.json` match actual files
- Verify paths use forward slashes `/` not backslashes `\`
- Ensure no special characters in filenames

## Best Practices

1. **Keep one document per bundle** - Easier to manage and import
2. **Match IDs and folders** - Use same name for document ID and image folder
3. **Test locally** - Import to a test project first
4. **Backup first** - Export your project before importing new documents
5. **Use descriptive IDs** - Like `quick-start-v2` instead of `doc-copy`

