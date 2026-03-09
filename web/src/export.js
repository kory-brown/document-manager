/**
 * Per-document ZIP export module.
 * Produces: docId.zip
 *   └── docId/
 *       ├── viewer.html
 *       ├── data/
 *       │   └── data.json
 *       └── images/
 *           └── (all images for this document)
 *
 * Image path conversion:
 *   Project format:  images/quick-start/card.svg
 *   Export format:   images/card.svg   (docId folder stripped)
 */

import JSZip from 'jszip';
import viewerTemplate from './viewer-template.html?raw';
import { getProjectImagesDirHandle } from './fs.js';

/**
 * Exports a single document as a downloadable ZIP file and updates manifest.json.
 * @param {string} projectName
 * @param {object} doc - document object from AppState.data.documents
 * @param {object} theme - AppState.data.theme
 * @param {Array}  allDocs - all documents in the project (for manifest)
 */
export async function exportDocument(projectName, doc, theme, allDocs = []) {
    const zip = new JSZip();
    const docFolder = zip.folder(doc.id);

    // ── 1. viewer.html ────────────────────────────────────────────────────────
    docFolder.file('viewer.html', viewerTemplate);

    // ── 2. data/data.json ─────────────────────────────────────────────────────
    const exportDoc = convertPathsForExport(JSON.parse(JSON.stringify(doc)));
    const exportData = {
        theme,
        documents: [exportDoc]
    };
    docFolder.folder('data').file('data.json', JSON.stringify(exportData, null, 2));

    // ── 3. images/ ────────────────────────────────────────────────────────────
    const imagesFolder = docFolder.folder('images');
    const imgDirResult = await getProjectImagesDirHandle(projectName, doc.id);

    if (imgDirResult.success) {
        await addDirectoryToZip(imgDirResult.handle, imagesFolder);
    }

    // ── 4. Generate and download ZIP ──────────────────────────────────────────
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, `${doc.id}.zip`);

    // ── 5. Download updated manifest.json ─────────────────────────────────────
    // Delayed to avoid browsers silently dropping the second simultaneous download.
    const manifestIds = allDocs.length > 0
        ? allDocs.map(d => d.id)
        : [doc.id];
    const manifestBlob = new Blob(
        [JSON.stringify(manifestIds, null, 2)],
        { type: 'application/json' }
    );
    await new Promise(resolve => setTimeout(resolve, 400));
    triggerDownload(manifestBlob, 'manifest.json');
}

/**
 * Converts image paths from project format to export format.
 * Project: images/quick-start/card.svg  →  Export: images/card.svg
 */
function convertPathsForExport(doc) {
    const prefix = `images/${doc.id}/`;

    if (doc.cardImage && doc.cardImage.startsWith(prefix)) {
        doc.cardImage = 'images/' + doc.cardImage.slice(prefix.length);
    }

    if (doc.sections) {
        doc.sections.forEach(section => {
            if (section.sectionImage && section.sectionImage.startsWith(prefix)) {
                section.sectionImage = 'images/' + section.sectionImage.slice(prefix.length);
            }
        });
    }

    return doc;
}

/**
 * Recursively adds all files from a FileSystemDirectoryHandle into a JSZip folder.
 */
async function addDirectoryToZip(dirHandle, zipFolder) {
    for await (const [name, entry] of dirHandle.entries()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            const buffer = await file.arrayBuffer();
            zipFolder.file(name, buffer);
        } else if (entry.kind === 'directory') {
            const subFolder = zipFolder.folder(name);
            await addDirectoryToZip(entry, subFolder);
        }
    }
}

/**
 * Triggers a browser file download for a Blob.
 */
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
