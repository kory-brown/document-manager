const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let mainWindow;
let appSettings = {
    projectsBasePath: null
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(async () => {
    await loadSettings();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Helper: Get settings file path
function getSettingsPath() {
    return path.join(app.getPath('userData'), 'settings.json');
}

// Helper: Load settings
async function loadSettings() {
    try {
        const settingsPath = getSettingsPath();
        const data = await fs.readFile(settingsPath, 'utf-8');
        appSettings = JSON.parse(data);
    } catch (error) {
        // Settings file doesn't exist yet, use defaults
        appSettings = {
            projectsBasePath: null
        };
    }
}

// Helper: Save settings
async function saveSettings() {
    try {
        const settingsPath = getSettingsPath();
        const settingsDir = path.dirname(settingsPath);
        await fs.mkdir(settingsDir, { recursive: true });
        await fs.writeFile(settingsPath, JSON.stringify(appSettings, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Helper: Get projects directory
function getProjectsDirectory() {
    if (!appSettings.projectsBasePath) {
        return null;
    }
    return path.join(appSettings.projectsBasePath, 'Document Manager', 'Projects');
}

// IPC Handlers

// Check if storage location is configured
ipcMain.handle('check-storage-configured', async () => {
    return { 
        success: true, 
        isConfigured: appSettings.projectsBasePath !== null,
        path: appSettings.projectsBasePath
    };
});

// Set storage location
ipcMain.handle('set-storage-location', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Storage Location for Projects',
        message: 'Choose where to store your Documentation Manager projects',
        buttonLabel: 'Select Location'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, cancelled: true };
    }
    
    const selectedPath = result.filePaths[0];
    appSettings.projectsBasePath = selectedPath;
    await saveSettings();
    
    // Create the folder structure
    const projectsDir = getProjectsDirectory();
    await fs.mkdir(projectsDir, { recursive: true });
    
    return { 
        success: true, 
        path: selectedPath,
        projectsDirectory: projectsDir
    };
});

// Get projects directory path
ipcMain.handle('get-projects-directory', async () => {
    const projectsDir = getProjectsDirectory();
    return { success: true, path: projectsDir };
});

// List existing projects
ipcMain.handle('list-projects', async () => {
    try {
        const projectsDir = getProjectsDirectory();
        
        // Check if storage location is configured
        if (!projectsDir) {
            return { success: true, projects: [] };
        }
        
        // Check if directory exists
        try {
            await fs.access(projectsDir);
        } catch {
            // Directory doesn't exist yet
            return { success: true, projects: [] };
        }
        
        const entries = await fs.readdir(projectsDir, { withFileTypes: true });
        const projects = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
        
        return { success: true, projects };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Create new project
ipcMain.handle('create-project', async (event, projectName) => {
    try {
        const projectsDir = getProjectsDirectory();
        const projectPath = path.join(projectsDir, projectName);
        
        // Create project folders
        await fs.mkdir(path.join(projectPath, 'data'), { recursive: true });
        await fs.mkdir(path.join(projectPath, 'images'), { recursive: true });
        
        // Create empty data.json
        const emptyData = {
            theme: {
                colorBackground: "#f8f9fa",
                colorHighlight: "#1b78aa",
                colorLowLight: "#6c757d",
                colorTitleText: "#212529",
                colorSubTitleText: "#495057",
                colorBodyText: "#6c757d",
                colorCallout: "#0056b3"
            },
            homeContent: {
                introText: "Welcome to AQUAS Blue Documentation. Browse our comprehensive guides to get started quickly or explore the full capabilities of the AQUAS Blue platform. Select a guide below to begin your journey."
            },
            documents: []
        };
        
        const dataPath = path.join(projectPath, 'data', 'data.json');
        await fs.writeFile(dataPath, JSON.stringify(emptyData, null, 2), 'utf-8');
        
        return { success: true, path: projectPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Load project
ipcMain.handle('load-project', async (event, projectName) => {
    try {
        const projectsDir = getProjectsDirectory();
        const dataPath = path.join(projectsDir, projectName, 'data', 'data.json');
        
        const data = await fs.readFile(dataPath, 'utf-8');
        return { 
            success: true, 
            data: JSON.parse(data),
            projectPath: path.join(projectsDir, projectName)
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save project data
ipcMain.handle('save-project', async (event, projectName, data) => {
    try {
        const projectsDir = getProjectsDirectory();
        const dataPath = path.join(projectsDir, projectName, 'data', 'data.json');
        
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Load JSON data (legacy - for importing external files)
ipcMain.handle('load-json', async (event, filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save JSON data (legacy)
ipcMain.handle('save-json', async (event, filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Select directory
ipcMain.handle('select-directory', async (event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: options.title || 'Select Directory',
        message: options.message || '',
        buttonLabel: options.buttonLabel || 'Select'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
});

// Select file
ipcMain.handle('select-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options.filters || []
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
});

// Copy file to project
ipcMain.handle('copy-file-to-project', async (event, projectName, sourcePath, relativePath) => {
    try {
        const projectsDir = getProjectsDirectory();
        const destPath = path.join(projectsDir, projectName, relativePath);
        
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });
        
        // Copy file
        await fs.copyFile(sourcePath, destPath);
        return { success: true, path: relativePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Copy directory recursively to project
ipcMain.handle('copy-directory-to-project', async (event, projectName, sourceDir, targetDir) => {
    try {
        const projectsDir = getProjectsDirectory();
        const destPath = path.join(projectsDir, projectName, targetDir);
        
        // Ensure destination directory exists
        await fs.mkdir(destPath, { recursive: true });
        
        // Copy directory contents
        await copyDirectory(sourceDir, destPath);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Check if path exists
ipcMain.handle('path-exists', async (event, targetPath) => {
    try {
        await fs.access(targetPath);
        return { success: true, exists: true };
    } catch {
        return { success: true, exists: false };
    }
});

// List directory contents
ipcMain.handle('list-directory', async (event, targetPath) => {
    try {
        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        const files = entries
            .filter(entry => entry.isFile())
            .map(entry => entry.name);
        const directories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
        
        return { success: true, files, directories };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Create directory
ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Export project (create a package ready for web deployment)
ipcMain.handle('export-project', async (event, projectName) => {
    try {
        const projectsDir = getProjectsDirectory();
        const projectPath = path.join(projectsDir, projectName);
        
        // Ask user where to export
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Export Location'
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, error: 'Export cancelled' };
        }
        
        const exportPath = result.filePaths[0];
        
        // Load data.json and convert paths for website
        const sourceDataPath = path.join(projectPath, 'data', 'data.json');
        const dataContent = await fs.readFile(sourceDataPath, 'utf-8');
        let data = JSON.parse(dataContent);
        
        // Convert image paths from project format (images/) to website format (assets/images/)
        if (data.documents && Array.isArray(data.documents)) {
            data.documents.forEach(doc => {
                // Convert card image path
                if (doc.cardImage && doc.cardImage.startsWith('images/')) {
                    doc.cardImage = doc.cardImage.replace('images/', 'assets/images/');
                }
                
                // Convert section image paths
                if (doc.sections && Array.isArray(doc.sections)) {
                    doc.sections.forEach(section => {
                        if (section.sectionImage && section.sectionImage.startsWith('images/')) {
                            section.sectionImage = section.sectionImage.replace('images/', 'assets/images/');
                        }
                    });
                }
            });
        }
        
        // Write converted data.json to export location
        const destDataPath = path.join(exportPath, 'data.json');
        await fs.writeFile(destDataPath, JSON.stringify(data, null, 2), 'utf-8');
        
        // Copy images folder to assets/images
        const sourceImagesPath = path.join(projectPath, 'images');
        const destImagesPath = path.join(exportPath, 'assets', 'images');
        
        // Check if images folder exists and has content
        try {
            await fs.access(sourceImagesPath);
            await copyDirectory(sourceImagesPath, destImagesPath);
        } catch {
            // Images folder doesn't exist or is empty, that's okay
            await fs.mkdir(destImagesPath, { recursive: true });
        }
        
        return { success: true, path: exportPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Generate and open preview
ipcMain.handle('preview-document', async (event, projectName, document, theme) => {
    try {
        const projectsDir = getProjectsDirectory();
        const projectPath = path.join(projectsDir, projectName);
        const imagesPath = path.join(projectPath, 'images');
        
        // Generate HTML
        const html = generatePreviewHTML(document, theme, imagesPath);
        
        // Save to temp file
        const tempDir = os.tmpdir();
        const previewPath = path.join(tempDir, `doc-preview-${Date.now()}.html`);
        await fs.writeFile(previewPath, html, 'utf-8');
        
        // Open in default browser
        await shell.openExternal(`file://${previewPath}`);
        
        return { success: true, path: previewPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Helper function to generate preview HTML
function generatePreviewHTML(doc, theme, imagesBasePath) {
    const css = getPreviewCSS(theme);
    
    const sectionsHTML = doc.sections.map((section, index) => {
        const hasSubtitle = section.sectionSubTitle && section.sectionSubTitle.trim();
        const hasImage = section.sectionImage && section.sectionImage.trim();
        
        // Convert relative image path to absolute file path
        let imagePath = '';
        if (hasImage) {
            // Remove 'images/' prefix if present
            const relativePath = section.sectionImage.replace(/^images\//, '');
            imagePath = path.join(imagesBasePath, relativePath);
        }
        
        return `
        <div class="section" id="section-${index}">
            <h2 class="section-title">${section.sectionTitle}</h2>
            ${hasSubtitle ? `<h3 class="section-subtitle">${section.sectionSubTitle}</h3>` : ''}
            <div class="section-body">${section.sectionBody}</div>
            ${hasImage ? `
                <div class="section-image-container">
                    <img src="file://${imagePath}" alt="${section.sectionTitle}" class="section-image">
                </div>
            ` : ''}
        </div>`;
    }).join('');
    
    const tocHTML = doc.sections.map((section, index) => {
        const hasSubtitle = section.sectionSubTitle && section.sectionSubTitle.trim();
        return `
        <div class="toc-item" data-index="${index}" tabindex="0" role="button">
            <div class="toc-item-header">
                <span class="toc-item-number">${index + 1}.</span>
                <span class="toc-item-title">${section.sectionTitle}</span>
            </div>
            ${hasSubtitle ? `<div class="toc-item-subtitle">${section.sectionSubTitle}</div>` : ''}
        </div>`;
    }).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title} - Preview</title>
    <style>${css}</style>
</head>
<body class="viewing-document">
    <header id="main-header">
        <div class="header-container">
            <div class="logo-container">
                <div style="height: 50px; width: 120px; background: ${theme.colorHighlight}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">PREVIEW</div>
            </div>
            <h1 class="header-title">${doc.title}</h1>
            <div class="header-actions"></div>
        </div>
    </header>

    <main id="main-content">
        <div id="document-page" class="page-content">
            <button id="toc-toggle" class="toc-toggle-btn">
                <span class="toc-toggle-icon">📑</span>
                <span class="toc-toggle-text">Table of Contents</span>
            </button>
            
            <div class="sections-container">${sectionsHTML}</div>
        </div>
    </main>

    <div id="toc-sidebar" class="toc-sidebar" style="display: none;">
        <div class="toc-sidebar-overlay" id="toc-overlay"></div>
        <div class="toc-sidebar-content">
            <div class="toc-sidebar-header">
                <h3 class="toc-sidebar-title">Table of Contents</h3>
                <button id="toc-close" class="toc-close-btn">✕</button>
            </div>
            
            <div class="toc-search-container">
                <input type="text" id="toc-search" class="toc-search-input" placeholder="Search sections..." />
            </div>
            
            <div class="toc-list-container">
                <div class="toc-list">${tocHTML}</div>
                <div id="toc-no-results" class="toc-no-results" style="display: none;">No sections found</div>
            </div>
        </div>
    </div>

    <div id="document-footer" class="document-footer">
        <div class="document-footer-container">
            <span class="document-footer-title">${doc.title}</span>
            <span class="document-footer-version">Version ${doc.version}</span>
            <span class="document-footer-updated">Last Updated: ${doc.lastUpdated}</span>
        </div>
    </div>

    <footer id="main-footer">
        <div class="footer-container">
            <p>&copy; 2025 AQUAS Blue. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // TOC functionality
        const tocToggle = document.getElementById('toc-toggle');
        const tocSidebar = document.getElementById('toc-sidebar');
        const tocClose = document.getElementById('toc-close');
        const tocOverlay = document.getElementById('toc-overlay');
        const tocSearch = document.getElementById('toc-search');
        const tocItems = document.querySelectorAll('.toc-item');

        function openTOC() {
            tocSidebar.style.display = 'block';
            document.body.classList.add('toc-open');
            setTimeout(() => tocSidebar.classList.add('active'), 10);
            setTimeout(() => tocSearch.focus(), 350);
        }

        function closeTOC() {
            tocSidebar.classList.remove('active');
            document.body.classList.remove('toc-open');
            setTimeout(() => {
                tocSidebar.style.display = 'none';
                tocSearch.value = '';
                filterTOC('');
            }, 300);
        }

        function filterTOC(query) {
            const searchQuery = query.toLowerCase().trim();
            let visibleCount = 0;
            tocItems.forEach(item => {
                const title = item.querySelector('.toc-item-title').textContent.toLowerCase();
                const subtitle = item.querySelector('.toc-item-subtitle');
                const subtitleText = subtitle ? subtitle.textContent.toLowerCase() : '';
                
                if (!searchQuery || title.includes(searchQuery) || subtitleText.includes(searchQuery)) {
                    item.style.display = 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            document.getElementById('toc-no-results').style.display = (visibleCount === 0 && searchQuery) ? 'block' : 'none';
        }

        tocToggle.addEventListener('click', openTOC);
        tocClose.addEventListener('click', closeTOC);
        tocOverlay.addEventListener('click', closeTOC);
        tocSearch.addEventListener('input', (e) => filterTOC(e.target.value));

        // TOC item clicks
        tocItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const section = document.getElementById('section-' + index);
                if (section) {
                    closeTOC();
                    setTimeout(() => section.scrollIntoView({ behavior: 'smooth' }), 300);
                }
            });
        });

        // ESC key closes TOC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && tocSidebar.classList.contains('active')) {
                closeTOC();
            }
        });
    </script>
</body>
</html>`;
}

// Get preview CSS with theme applied
function getPreviewCSS(theme) {
    return `
/* CSS Variables for Theme */
:root {
    --color-background: ${theme.colorBackground};
    --color-highlight: ${theme.colorHighlight};
    --color-lowlight: ${theme.colorLowLight};
    --color-title-text: ${theme.colorTitleText};
    --color-subtitle-text: ${theme.colorSubTitleText};
    --color-body-text: ${theme.colorBodyText};
    --color-callout: ${theme.colorCallout};
    --color-card-bg: #ffffff;
    --color-border: #dee2e6;
    --color-hover: #e9ecef;
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
    --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.1);
    --transition-speed: 0.3s;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background-color: var(--color-background);
    color: var(--color-body-text);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
body.toc-open { overflow: hidden; }
#main-header {
    background-color: var(--color-card-bg);
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 0;
    z-index: 1000;
}
.header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    display: grid;
    grid-template-columns: 200px 1fr 200px;
    align-items: center;
    gap: 2rem;
}
.header-title {
    color: var(--color-title-text);
    font-size: 1.75rem;
    font-weight: 600;
    text-align: center;
}
#main-content {
    flex: 1;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 3rem 2rem;
}
.toc-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: var(--color-highlight);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    margin-bottom: 2rem;
    transition: all 0.3s ease;
}
.toc-toggle-btn:hover {
    background: var(--color-callout);
    transform: translateY(-2px);
}
.toc-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
}
.toc-sidebar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.3s ease;
}
.toc-sidebar.active .toc-sidebar-overlay { opacity: 1; }
.toc-sidebar-content {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    max-width: 90vw;
    background: var(--color-card-bg);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}
.toc-sidebar.active .toc-sidebar-content { transform: translateX(0); }
.toc-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border);
    background: var(--color-background);
}
.toc-sidebar-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-title-text);
}
.toc-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--color-lowlight);
    cursor: pointer;
    padding: 0.5rem;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    transition: all 0.3s ease;
}
.toc-close-btn:hover {
    background: var(--color-hover);
    color: var(--color-title-text);
}
.toc-search-container {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
}
.toc-search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
}
.toc-search-input:focus {
    border-color: var(--color-highlight);
    box-shadow: 0 0 0 3px rgba(27, 120, 170, 0.1);
}
.toc-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
}
.toc-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.toc-item {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}
.toc-item:hover {
    background: var(--color-highlight);
    border-color: var(--color-highlight);
    transform: translateX(4px);
}
.toc-item-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.toc-item-number {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-highlight);
    min-width: 30px;
}
.toc-item:hover .toc-item-number { color: white; }
.toc-item-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-title-text);
}
.toc-item:hover .toc-item-title { color: white; }
.toc-item-subtitle {
    font-size: 0.875rem;
    color: var(--color-subtitle-text);
    margin-top: 0.25rem;
    padding-left: 38px;
}
.toc-item:hover .toc-item-subtitle { color: rgba(255, 255, 255, 0.9); }
.toc-no-results {
    text-align: center;
    padding: 2rem;
    color: var(--color-lowlight);
}
.sections-container {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    padding-bottom: 5rem;
}
.section {
    background: var(--color-card-bg);
    border-radius: 12px;
    padding: 3rem;
    box-shadow: var(--shadow-md);
    scroll-margin-top: 100px;
}
.section:hover { box-shadow: var(--shadow-lg); }
.section-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-highlight);
    margin-bottom: 0.75rem;
}
.section-subtitle {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--color-highlight);
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);
}
.section-body {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--color-body-text);
    margin-bottom: 2rem;
}
.section-body strong {
    color: var(--color-highlight);
    font-weight: 600;
}
.section-body em {
    color: var(--color-highlight);
    font-style: italic;
}
.section-body a {
    color: var(--color-highlight);
    text-decoration: underline;
}
.section-image-container {
    width: 100%;
    margin-top: 2rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
}
.section-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
}
.document-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-card-bg);
    border-top: 2px solid var(--color-highlight);
    box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
    z-index: 999;
    padding: 0.75rem 2rem;
}
.document-footer-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 2rem;
}
.document-footer-title {
    font-weight: 600;
    color: var(--color-title-text);
    font-size: 0.95rem;
    text-align: left;
}
.document-footer-version {
    font-weight: 600;
    color: var(--color-highlight);
    font-size: 0.9rem;
    text-align: center;
}
.document-footer-updated {
    color: var(--color-lowlight);
    font-size: 0.9rem;
    text-align: right;
}
#main-footer {
    background-color: var(--color-card-bg);
    border-top: 1px solid var(--color-border);
    margin-top: 4rem;
}
body.viewing-document #main-footer { padding-bottom: 60px; }
.footer-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: var(--color-lowlight);
    font-size: 0.9rem;
}
html { scroll-behavior: smooth; }
`;
}

// Helper function to copy directory recursively
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

