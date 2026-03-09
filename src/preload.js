const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Storage configuration
    checkStorageConfigured: () => ipcRenderer.invoke('check-storage-configured'),
    setStorageLocation: () => ipcRenderer.invoke('set-storage-location'),
    
    // Project management
    getProjectsDirectory: () => ipcRenderer.invoke('get-projects-directory'),
    listProjects: () => ipcRenderer.invoke('list-projects'),
    createProject: (projectName) => ipcRenderer.invoke('create-project', projectName),
    loadProject: (projectName) => ipcRenderer.invoke('load-project', projectName),
    saveProject: (projectName, data) => ipcRenderer.invoke('save-project', projectName, data),
    exportProject: (projectName) => ipcRenderer.invoke('export-project', projectName),
    previewDocument: (projectName, document, theme) => ipcRenderer.invoke('preview-document', projectName, document, theme),
    
    // File operations
    loadJSON: (filePath) => ipcRenderer.invoke('load-json', filePath),
    saveJSON: (filePath, data) => ipcRenderer.invoke('save-json', filePath, data),
    selectDirectory: (options) => ipcRenderer.invoke('select-directory', options),
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    copyFileToProject: (projectName, sourcePath, relativePath) => ipcRenderer.invoke('copy-file-to-project', projectName, sourcePath, relativePath),
    copyDirectoryToProject: (projectName, sourceDir, targetDir) => ipcRenderer.invoke('copy-directory-to-project', projectName, sourceDir, targetDir),
    createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
    pathExists: (targetPath) => ipcRenderer.invoke('path-exists', targetPath),
    listDirectory: (targetPath) => ipcRenderer.invoke('list-directory', targetPath)
});

