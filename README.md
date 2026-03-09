# Documentation Manager

A desktop application for managing AQUAS Blue documentation content. This app allows you to create, edit, and organize documentation, then export it as a `data.json` file for use with the AQUAS Blue Documentation website.

## Features

- ✅ Create and manage multiple documents
- ✅ Add, edit, reorder, and delete sections
- ✅ Import existing `data.json` files
- ✅ Export projects to `data.json`
- ✅ Clean, modern UI with AQUAS Blue branding
- ✅ Cross-platform support (macOS & Windows)

## Installation

### For Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the app:**
   ```bash
   npm start
   ```

### Building Installers

**For macOS (.dmg):**
```bash
npm run build:mac
```

**For Windows (.exe):**
```bash
npm run build:win
```

**For both platforms:**
```bash
npm run build:all
```

Built installers will be in the `dist/` folder.

## Usage

### Getting Started

#### 1. First Launch - Choose Storage Location

On **first launch**, you'll be asked to select where you want to store your projects:
- Choose any location (e.g., Documents, Dropbox, external drive)
- A folder structure will be created: `[chosen-location]/Document Manager/Projects/`
- This location is remembered for future launches

**You can change the storage location later** from the project selection modal.

#### 2. Create or Open a Project

After configuring storage, you can:
- **Create New Project:** Enter a name and click "Create Project"
- **Open Existing Project:** Select from the list of available projects

#### 3. Project Structure

Each project has this structure:
```
[Your Chosen Location]/
└── Document Manager/
    └── Projects/
        └── [your-project-name]/
            ├── data/
            │   └── data.json          # Document content
            └── images/
                ├── [document-id]/     # Images for each document
                │   ├── card.svg
                │   ├── section1.png
                │   └── section2.png
                └── [another-doc-id]/
                    └── images...
```

**Example:** If you chose `/Users/you/Documents` as storage location:
```
/Users/you/Documents/Document Manager/Projects/Aquas/
```

#### 3. Working with Documents

1. **Add a Document**
   - Click the ➕ button in the Documents sidebar
   - Fill in document details (Title, ID, Version, Description)
   - Add images using the "Browse" button (automatically copied to project)

2. **Add Sections**
   - Click "+ Add Section" in the document editor
   - Enter section title, subtitle (optional), body content
   - Add images using the "Browse" button (automatically copied to project)
   - Use HTML markup in body content (`<strong>`, `<em>`, `<br>`, etc.)
   - Click "Save Section"

3. **Organize Sections**
   - Use ⬆️ and ⬇️ buttons to reorder sections
   - Click ✏️ to edit a section
   - Click 🗑️ to delete a section

4. **Save Your Work**
   - All changes are **automatically saved** to the project
   - Click "💾 Export" when ready to deploy to your website

### Image Management

**Images are automatically managed!** 

When you click "Browse" for an image:
1. Select the image file
2. It's automatically copied to: `[storage]/Document Manager/Projects/[project]/images/[document-id]/`
3. The path is set in the JSON: `images/[document-id]/filename.png`

**Path Formats:**
- **In Project:** `images/[document-id]/image.png` (for preview/editing)
- **On Export:** `assets/images/[document-id]/image.png` (for website)

The app automatically converts paths when exporting for website deployment!

### Importing Document Bundles

The app supports importing complete document packages (data + images):

1. **Prepare a bundle folder** containing:
   - `data.json` (with document data)
   - `images/[document-id]/` (all images for the document)

2. **Import process:**
   - Click "📥 Import Document"
   - Select the bundle folder
   - App validates structure and fixes any path issues
   - Handles duplicates (overwrite or rename)
   - Copies images automatically

3. **See IMPORT-GUIDE.md** for detailed instructions

**Quick Example:**
```bash
my-bundle/
├── data.json
└── images/
    └── quick-start/
        ├── card.svg
        └── section1.png
```

### Tips

- **Document IDs** are auto-generated from titles (e.g., "Quick Start Guide" → "quick-start-guide")
- **Version numbers** help track documentation updates
- **Last Updated** dates are automatically set but can be customized
- **HTML markup** in section bodies is supported (keep it simple: `<strong>`, `<em>`, `<br>`, `<a>`)

## Project Structure

```
documentation-manager/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Security bridge
│   └── renderer/
│       ├── index.html       # UI layout
│       ├── styles.css       # Styling
│       └── app.js           # Application logic
├── assets/
│   └── icons/               # App icons (for building)
├── package.json
└── README.md
```

## Building for Distribution

### Prerequisites for Building

**For macOS builds (on Mac):**
- Xcode Command Line Tools

**For Windows builds:**
- On macOS: Install Wine (`brew install wine`)
- On Windows: No additional requirements

### Creating App Icons

Before building, you should add proper app icons:

1. **macOS:** Add `icon.icns` to `assets/icons/`
2. **Windows:** Add `icon.ico` to `assets/icons/`

You can use online tools to convert PNG images to these formats.

## Workflow

The new project-based workflow is simple and organized:

1. **Create a Project** (one-time setup)
   - Launch app → Create project → Name it

2. **Build Your Documentation**
   - Add documents
   - Add sections
   - Upload images (automatically organized)
   - Everything auto-saves to the project

3. **Export for Website**
   - Click "💾 Export"
   - Choose destination folder
   - App creates a complete package:
     ```
     export-folder/
     ├── data.json
     └── assets/
         └── images/
             ├── quick-start/
             │   └── all images...
             └── full-guide/
                 └── all images...
     ```

4. **Deploy to Website**
   - Upload `data.json` to `assets/data/`
   - Upload `assets/images/` folder
   - Website automatically updates!

### Switching Projects

- Click the 🔄 button next to the project name
- Select a different project or create a new one
- Perfect for managing multiple documentation sites

### Changing Storage Location

If you need to change where your projects are stored:

1. Click the 🔄 button (Switch Project)
2. Click the 📁 button next to "Storage Location"
3. Choose a new location
4. **Important:** Manually move the `Document Manager` folder from the old location to the new one

### Where Settings Are Stored

The app remembers your storage location in:
- **macOS:** `~/Library/Application Support/documentation-manager/settings.json`
- **Windows:** `%APPDATA%\documentation-manager\settings.json`

This is separate from your projects, so your project data is always safe.

## Theme Colors

The app uses AQUAS Blue branding:
- Primary: `#1b78aa`
- Background: `#f8f9fa`
- Text: `#212529`

## License

© 2025 AQUAS Financial, LLC. All rights reserved.

## Support

For issues or questions, contact AQUAS Financial support.

