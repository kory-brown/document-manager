# Migrating Existing Projects

If you have existing projects from before the storage location feature was added, follow these steps to migrate them to the new structure.

## Your Current Situation

**Old Location:** `~/Documents/current_documents/Aquas/`  
**New Structure:** `[chosen-location]/Document Manager/Projects/Aquas/`

## Migration Options

### Option 1: Automated Script (Recommended)

1. Launch the new app
2. When prompted, choose your desired storage location (e.g., `/Users/korybrown/Documents`)
3. Close the app
4. Run the migration script:
   ```bash
   cd /Users/korybrown/Projects/documentation-manager
   ./migrate-projects.sh
   ```
5. Follow the prompts
6. Relaunch the app

### Option 2: Manual Migration

1. Launch the new app
2. When prompted, choose your storage location (e.g., `/Users/korybrown/Documents`)
3. The app will create: `/Users/korybrown/Documents/Document Manager/Projects/`
4. Close the app
5. **Manually move your projects:**
   ```bash
   # Copy your existing project
   cp -r ~/Documents/current_documents/Aquas ~/Documents/Document Manager/Projects/
   ```
6. Relaunch the app
7. Your "Aquas" project should now appear in the project list

### Option 3: Use Default Location

If you want to keep using `~/Documents`:

1. Launch the app
2. Choose `/Users/korybrown/Documents` as your storage location
3. The app creates: `~/Documents/Document Manager/Projects/`
4. Move your project:
   ```bash
   mkdir -p ~/Documents/Document\ Manager/Projects
   mv ~/Documents/current_documents/Aquas ~/Documents/Document\ Manager/Projects/
   ```
5. Clean up (optional):
   ```bash
   rmdir ~/Documents/current_documents
   ```

## Verification

After migration:
1. Launch the app
2. Click the 🔄 button
3. You should see your "Aquas" project in the list
4. Open it to verify all documents and images are intact

## Troubleshooting

**Project doesn't appear?**
- Check the storage location shown in the project modal (📁 button)
- Verify your project folder is at: `[storage-location]/Document Manager/Projects/[project-name]/`
- Ensure the folder contains `data/` and `images/` subfolders

**Data missing?**
- Check that `data/data.json` exists in your project folder
- Verify images are in `images/[document-id]/` folders

