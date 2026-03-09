/**
 * File System Access API module
 * Replaces all window.electronAPI.* calls from the Electron version.
 * Stores a root DirectoryHandle pointing to the "Documentation Manager" folder.
 */

let rootHandle = null; // FileSystemDirectoryHandle for "Documentation Manager"

// ─── Compatibility check ─────────────────────────────────────────────────────

export function isSupported() {
    return typeof window.showDirectoryPicker !== 'undefined';
}

// ─── Root handle management ──────────────────────────────────────────────────

export function isConfigured() {
    return rootHandle !== null;
}

/**
 * Opens a directory picker so the user can select their "Documentation Manager" folder.
 * Stores the handle internally. Returns { success, error? }.
 */
export async function openFolder() {
    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        rootHandle = handle;
        // Ensure Projects/ subdirectory exists
        await handle.getDirectoryHandle('Projects', { create: true });
        return { success: true };
    } catch (err) {
        if (err.name === 'AbortError') return { success: false, cancelled: true };
        return { success: false, error: err.message };
    }
}

// ─── Helper: navigate/create a path of nested directories ───────────────────

async function getNestedDir(baseHandle, parts, create = false) {
    let current = baseHandle;
    for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create });
    }
    return current;
}

async function getNestedFile(baseHandle, parts, create = false) {
    const dirParts = parts.slice(0, -1);
    const fileName = parts[parts.length - 1];
    const dir = dirParts.length > 0
        ? await getNestedDir(baseHandle, dirParts, create)
        : baseHandle;
    return dir.getFileHandle(fileName, { create });
}

// Silently returns false if the entry doesn't exist
async function entryExists(baseHandle, parts, type = 'file') {
    try {
        if (type === 'directory') {
            await getNestedDir(baseHandle, parts, false);
        } else {
            await getNestedFile(baseHandle, parts, false);
        }
        return true;
    } catch {
        return false;
    }
}

// ─── Project operations ──────────────────────────────────────────────────────

export async function listProjects() {
    try {
        const projectsDir = await getNestedDir(rootHandle, ['Projects'], true);
        const projects = [];
        for await (const [name, entry] of projectsDir.entries()) {
            if (entry.kind === 'directory') projects.push(name);
        }
        return { success: true, projects };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function createProject(projectName) {
    try {
        const projectDir = await getNestedDir(
            rootHandle, ['Projects', projectName], true
        );
        await projectDir.getDirectoryHandle('data', { create: true });
        await projectDir.getDirectoryHandle('images', { create: true });

        const emptyData = {
            theme: {
                colorBackground: '#f8f9fa',
                colorHighlight: '#1b78aa',
                colorLowLight: '#6c757d',
                colorTitleText: '#212529',
                colorSubTitleText: '#495057',
                colorBodyText: '#6c757d',
                colorCallout: '#0056b3'
            },
            homeContent: {
                introText: 'Welcome to AQUAS Blue Documentation. Browse our comprehensive guides to get started quickly or explore the full capabilities of the AQUAS Blue platform. Select a guide below to begin your journey.'
            },
            documents: []
        };

        await writeJSON(['Projects', projectName, 'data', 'data.json'], emptyData);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function loadProject(projectName) {
    try {
        const data = await readJSON(['Projects', projectName, 'data', 'data.json']);
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function saveProject(projectName, data) {
    try {
        await writeJSON(['Projects', projectName, 'data', 'data.json'], data);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ─── File operations ─────────────────────────────────────────────────────────

/**
 * Opens a file picker for images. Returns { success, file, name } where file is a File object.
 */
export async function selectFile(options = {}) {
    try {
        const types = options.filters
            ? [{ description: options.filters[0]?.name || 'Files', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.gif'] } }]
            : undefined;

        const [fileHandle] = await window.showOpenFilePicker({ types, multiple: false });
        const file = await fileHandle.getFile();
        return { success: true, file, name: file.name };
    } catch (err) {
        if (err.name === 'AbortError') return { success: false, cancelled: true };
        return { success: false, error: err.message };
    }
}

/**
 * Opens a directory picker. Returns { success, handle } where handle is a FileSystemDirectoryHandle.
 */
export async function selectDirectory(options = {}) {
    try {
        const handle = await window.showDirectoryPicker({
            mode: 'read',
            startIn: 'documents'
        });
        return { success: true, handle, path: handle.name };
    } catch (err) {
        if (err.name === 'AbortError') return { success: false, cancelled: true };
        return { success: false, error: err.message };
    }
}

/**
 * Copies a File object into the project at relativePath (e.g. "images/quick-start/card.png").
 */
export async function copyFileToProject(projectName, file, relativePath) {
    try {
        const parts = ['Projects', projectName, ...relativePath.split('/')];
        const fileHandle = await getNestedFile(rootHandle, parts, true);
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Reads a file from inside the project as an ArrayBuffer.
 * relativePath e.g. "images/quick-start/card.png"
 */
export async function readProjectFile(projectName, relativePath) {
    try {
        const parts = ['Projects', projectName, ...relativePath.split('/')];
        const fileHandle = await getNestedFile(rootHandle, parts, false);
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        return { success: true, buffer, name: file.name, type: file.type };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Lists all files and subdirectories under a project-relative path.
 * Returns { success, files: string[], directories: string[] }
 */
export async function listDirectory(projectName, relativePath) {
    try {
        const parts = ['Projects', projectName, ...relativePath.split('/').filter(Boolean)];
        const dirHandle = await getNestedDir(rootHandle, parts, false);
        const files = [];
        const directories = [];
        for await (const [name, entry] of dirHandle.entries()) {
            if (entry.kind === 'file') files.push(name);
            else directories.push(name);
        }
        return { success: true, files, directories };
    } catch (err) {
        return { success: false, error: err.message, files: [], directories: [] };
    }
}

/**
 * Lists all files and subdirectories from an external DirectoryHandle (for import).
 */
export async function listExternalDirectory(dirHandle) {
    try {
        const files = [];
        const directories = [];
        for await (const [name, entry] of dirHandle.entries()) {
            if (entry.kind === 'file') files.push(name);
            else directories.push(name);
        }
        return { success: true, files, directories };
    } catch (err) {
        return { success: false, error: err.message, files: [], directories: [] };
    }
}

/**
 * Reads a JSON file from an external DirectoryHandle (for import).
 * pathParts: ['data.json'] or ['data', 'data.json']
 */
export async function readExternalJSON(dirHandle, pathParts) {
    try {
        const fileHandle = await getNestedFile(dirHandle, pathParts, false);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return { success: true, data: JSON.parse(text) };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Recursively copies all files from an external DirectoryHandle into the project.
 * targetRelativePath: project-relative destination e.g. "images/quick-start"
 */
export async function copyExternalDirectoryToProject(projectName, sourceDirHandle, targetRelativePath) {
    try {
        const parts = ['Projects', projectName, ...targetRelativePath.split('/')];
        const destDir = await getNestedDir(rootHandle, parts, true);
        await _copyDirRecursive(sourceDirHandle, destDir);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function _copyDirRecursive(srcDirHandle, destDirHandle) {
    for await (const [name, entry] of srcDirHandle.entries()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            const destFile = await destDirHandle.getFileHandle(name, { create: true });
            const writable = await destFile.createWritable();
            await writable.write(await file.arrayBuffer());
            await writable.close();
        } else if (entry.kind === 'directory') {
            const subDest = await destDirHandle.getDirectoryHandle(name, { create: true });
            await _copyDirRecursive(entry, subDest);
        }
    }
}

/**
 * Returns the handle for the project's images subdirectory for a given docId.
 * Used by export/preview to iterate image files.
 */
export async function getProjectImagesDirHandle(projectName, docId) {
    try {
        const parts = ['Projects', projectName, 'images', docId];
        const handle = await getNestedDir(rootHandle, parts, false);
        return { success: true, handle };
    } catch {
        return { success: false };
    }
}

// ─── Internal JSON helpers ───────────────────────────────────────────────────

async function readJSON(parts) {
    const fileHandle = await getNestedFile(rootHandle, parts, false);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
}

async function writeJSON(parts, data) {
    const fileHandle = await getNestedFile(rootHandle, parts, true);
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}
