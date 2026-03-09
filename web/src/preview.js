/**
 * In-browser document preview module.
 * Reads images from the local project folder, converts them to Object URLs,
 * generates viewer HTML, and opens it in a new tab via a Blob URL.
 */

import viewerTemplate from './viewer-template.html?raw';
import { getProjectImagesDirHandle } from './fs.js';

/**
 * Opens a preview of the document in a new browser tab.
 * @param {string} projectName
 * @param {object} doc
 * @param {object} theme
 */
export async function previewDocument(projectName, doc, theme) {
    // Build a map of filename → object URL for all project images
    const imageURLs = await buildImageURLMap(projectName, doc.id);

    // Generate the preview HTML with blob URLs substituted for image paths
    const previewHTML = buildPreviewHTML(doc, theme, imageURLs);

    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Clean up after a delay (the new tab will have loaded by then)
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Reads all image files from the project's images/docId/ folder and
 * returns a map of filename → object URL.
 */
async function buildImageURLMap(projectName, docId) {
    const map = {};
    const result = await getProjectImagesDirHandle(projectName, docId);
    if (!result.success) return map;

    for await (const [name, entry] of result.handle.entries()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            map[name] = URL.createObjectURL(file);
        }
    }
    return map;
}

/**
 * Builds the preview HTML string.
 * Replaces relative image paths (images/docId/filename) with blob object URLs.
 */
function buildPreviewHTML(doc, theme, imageURLs) {
    // Deep clone so we don't mutate AppState
    const previewDoc = JSON.parse(JSON.stringify(doc));
    const prefix = `images/${doc.id}/`;

    // Substitute card image
    if (previewDoc.cardImage && previewDoc.cardImage.startsWith(prefix)) {
        const filename = previewDoc.cardImage.slice(prefix.length);
        if (imageURLs[filename]) previewDoc.cardImage = imageURLs[filename];
    }

    // Substitute section images
    previewDoc.sections.forEach(section => {
        if (section.sectionImage && section.sectionImage.startsWith(prefix)) {
            const filename = section.sectionImage.slice(prefix.length);
            if (imageURLs[filename]) section.sectionImage = imageURLs[filename];
        }
    });

    // The viewer template fetches ./data/data.json at runtime.
    // For preview we inline the data directly instead.
    const inlineData = {
        theme,
        documents: [previewDoc]
    };

    // Replace the fetch() call with inline data injection
    return viewerTemplate.replace(
        "fetch('./data/data.json')\n            .then(r => r.json())\n            .then(data => renderDocument(data.documents[0]))",
        `Promise.resolve(${JSON.stringify(inlineData)})\n            .then(data => renderDocument(data.documents[0]))`
    ).replace(
        `const res = await fetch('./data/data.json');
            if (!res.ok) throw new Error('Failed to load data.json: ' + res.status);
            const data = await res.json();`,
        `const data = ${JSON.stringify(inlineData)};`
    );
}
