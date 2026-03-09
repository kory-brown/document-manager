# Documents Viewer Site — Server Setup & Maintenance Guide

## Overview

This site displays a browsable card index of published documents. Each document
is a self-contained folder that can be opened in a browser without any backend.
The site requires only a standard static file server (Apache, Nginx, IIS, or any
CDN/static host such as Netlify, Vercel, or S3+CloudFront).

---

## Requirements

- A web server capable of serving static files over HTTPS
- No database, no server-side scripting, no build step required
- Chrome or Edge recommended for end users (the viewer uses modern HTML5 APIs)

---

## Initial Setup

### 1. Upload the base site files

Unzip `documents-site-[date].zip` and upload the contents to your desired
directory on the web server. The directory name becomes the URL path.

**Example:** to serve the site at `https://example.com/documents/`
upload the contents to `/var/www/html/documents/` (Apache/Nginx)
or your equivalent web root subdirectory.

After the initial upload the directory should look like this:

```
documents/
├── index.html          ← the card index page
├── manifest.json       ← list of published document IDs (starts empty)
├── images/
│   └── logo.svg
└── SERVER-GUIDE.md     ← this file
```

### 2. Verify the site loads

Navigate to the URL in a browser. You should see the Documents page with a
"No manifest found" or empty state message — this is expected until documents
are published.

---

## Publishing Documents

Documents are produced by the **Documentation Manager** application. Each
export creates two files:

| File | Description |
|------|-------------|
| `[doc-id].zip` | The document bundle (viewer + data + images) |

And separately via the **Generate Manifest** button:

| File | Description |
|------|-------------|
| `manifest.json` | Updated list of all document IDs to display |

### Steps to publish a new document

1. Export the document from Documentation Manager → download `[doc-id].zip`
2. Unzip the file. It will extract as a folder named `[doc-id]/`
3. Upload the entire `[doc-id]/` folder to the `documents/` directory on the server
4. Generate and download a new `manifest.json` from Documentation Manager
5. Upload the new `manifest.json` to the `documents/` directory, replacing the existing file

**After publishing, the directory structure should look like:**

```
documents/
├── index.html
├── manifest.json           ← updated to include the new document ID
├── images/
│   └── logo.svg
├── quick-start/            ← uploaded document folder
│   ├── viewer.html
│   ├── data/
│   │   └── data.json
│   └── images/
│       ├── card.svg
│       └── [section images...]
└── admin-guide/            ← another document
    ├── viewer.html
    ├── data/
    │   └── data.json
    └── images/
```

---

## Updating an Existing Document

When a document is revised and re-exported:

1. Export the updated document from Documentation Manager → download `[doc-id].zip`
2. Unzip the file
3. Upload the `[doc-id]/` folder to the server, **overwriting** the existing folder
4. No change to `manifest.json` is needed unless the document ID changed

> **Note:** Because browsers cache static files, users may need to do a
> hard refresh (Ctrl+Shift+R / Cmd+Shift+R) to see updated content immediately.
> You can mitigate this with cache-control headers (see Server Configuration below).

---

## Removing a Document

1. Delete the document's folder from the server (`documents/[doc-id]/`)
2. Generate a new `manifest.json` from Documentation Manager (uncheck the removed document)
3. Upload the new `manifest.json` to the server

---

## Updating the manifest.json Only

If only the manifest needs to change (reordering, adding/removing documents
without changing document content):

1. Open Documentation Manager and load the project
2. Click **Generate Manifest** in the sidebar
3. Select the documents to include and download `manifest.json`
4. Upload the new `manifest.json` to the `documents/` directory on the server

---

## manifest.json Format

The manifest is a plain JSON array of document ID strings, in the order you
want them to appear on the index page:

```json
[
  "quick-start",
  "admin-guide",
  "release-notes"
]
```

It can be edited manually in any text editor if needed.

---

## Server Configuration

### Nginx

No special configuration required for basic serving. To improve caching behavior:

```nginx
location /documents/ {
    # Cache static assets (images, viewer) for 1 day
    location ~* \.(png|jpg|svg|gif|css|js)$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    # Do not cache manifest or data files so updates appear immediately
    location ~* (manifest\.json|data\.json)$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### Apache

Add a `.htaccess` file in the `documents/` directory:

```apache
# Cache images and viewer for 1 day
<FilesMatch "\.(png|jpg|svg|gif|css|js)$">
    Header set Cache-Control "max-age=86400, public"
</FilesMatch>

# Never cache manifest or data files
<FilesMatch "(manifest\.json|data\.json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Expires "0"
</FilesMatch>
```

### Netlify / Vercel / Static Hosts

These hosts serve static files automatically. Upload the `documents/` directory
contents to your deployment. For cache headers, add a `netlify.toml` or
`vercel.json` as appropriate to the project.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "No manifest found" message | `manifest.json` missing or wrong location | Confirm `manifest.json` is in the same directory as `index.html` |
| Cards appear but images are broken | Images not uploaded or path mismatch | Confirm `[doc-id]/images/` folder was uploaded |
| Old content still showing after update | Browser cache | Hard refresh (Ctrl+Shift+R). Add cache-control headers to server config |
| Document card links to blank page | Viewer HTML missing | Re-upload the full `[doc-id]/` folder including `viewer.html` |
| CORS error in browser console | Files accessed via `file://` protocol | Must be served over `http://` or `https://` — cannot open `index.html` directly from disk |

---

## Quick Reference — Common Tasks

```
Publish new document:
  1. Upload [doc-id]/ folder
  2. Upload updated manifest.json

Update existing document:
  1. Overwrite [doc-id]/ folder with new export

Remove a document:
  1. Delete [doc-id]/ folder
  2. Upload updated manifest.json (with that ID removed)

Update logo or index page:
  1. Upload new images/logo.svg  OR  new index.html
```
