# Documentation Manager — Server Installation Guide

## Overview

The Documentation Manager is a **static web application** — it runs entirely
in the user's browser with no server-side code, no database, and no backend
services. The server's only job is to serve the pre-built HTML, CSS, and
JavaScript files over HTTPS.

All document data is stored on the **user's local machine** in a folder they
select. Nothing is stored on the server.

---

## System Requirements

### Server
| Requirement | Details |
|-------------|---------|
| Web server | Any static file server: Nginx, Apache, IIS, Netlify, Vercel, S3+CloudFront, GitHub Pages, etc. |
| Protocol | **HTTPS is required.** The File System Access API used by this app is restricted to secure contexts. HTTP will not work. |
| Node.js | Only needed to **build** the app (Node.js 18+). Not needed on the production server itself. |

### End Users (Editors)
| Requirement | Details |
|-------------|---------|
| Browser | **Google Chrome or Microsoft Edge only.** Firefox and Safari do not support the File System Access API that this app depends on. |
| Local storage | Users must have a "Documentation Manager" folder accessible on their local machine. This folder holds all project data. |

> **Important:** This is not a multi-user cloud application. Each user manages
> their own local project folder. The server only hosts the app interface — it
> does not store or sync any document data.

---

## Building the App

The build step is run **once** (or whenever the app is updated) on a developer
machine, not on the production server.

### Prerequisites

Install Node.js 18 or higher from https://nodejs.org

Verify installation:
```bash
node --version   # should show v18.x.x or higher
npm --version
```

### Build

From the root of the repository:

```bash
./deploy/build-doc-manager.sh
```

This will:
1. Install npm dependencies
2. Run the Vite production build
3. Output a dated ZIP file: `deploy/dist/doc-manager-[YYYY-MM-DD].zip`

The ZIP contains only static files (HTML, CSS, JS, assets) — no Node.js or
npm is needed on the server.

---

## Deploying to the Server

### 1. Upload the built files

Unzip `doc-manager-[date].zip` and upload the contents to the directory on
your web server where you want the app to live.

**Example:** to serve the app at `https://example.com/doc-manager/`
upload the contents to `/var/www/html/doc-manager/`

After upload the directory should look like this:

```
doc-manager/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── [other static assets]
```

### 2. Verify the deployment

Open `https://your-domain.com/doc-manager/` in **Chrome or Edge**.

You should see the Documentation Manager welcome screen prompting you to
select a folder. If you see a blank page or errors, check the
Troubleshooting section below.

---

## Server Configuration

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # SSL configuration (required)
    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /doc-manager/ {
        root /var/www/html;
        index index.html;

        # Required for single-page app routing
        try_files $uri $uri/ /doc-manager/index.html;

        # Cache hashed assets indefinitely
        location ~* \.[0-9a-f]{8}\.(js|css)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Do not cache index.html
        location = /doc-manager/index.html {
            expires -1;
            add_header Cache-Control "no-cache";
        }
    }
}
```

### Apache

Create a `.htaccess` file in the `doc-manager/` directory:

```apache
Options -Indexes

# Required for single-page app routing
FallbackResource /doc-manager/index.html

# Cache hashed asset files for 1 year
<FilesMatch "\.[0-9a-f]{8}\.(js|css)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

# Do not cache index.html
<Files "index.html">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</Files>
```

### IIS

In `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="/doc-manager/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### Netlify / Vercel

No special configuration required. Upload the ZIP contents through the
dashboard or connect the repository directly. Both platforms handle HTTPS
and SPA routing automatically.

---

## Updating the App

When a new version of the Documentation Manager is released:

1. Pull the latest code from the repository
2. Run the build script: `./deploy/build-doc-manager.sh`
3. Unzip the new `doc-manager-[date].zip`
4. Upload the contents to the server, **replacing** the existing files

> User data is stored locally on each user's machine and is never affected
> by app updates on the server.

---

## Security Considerations

| Topic | Notes |
|-------|-------|
| HTTPS | Required. The File System Access API will not function on plain HTTP. Use a valid SSL certificate. |
| Authentication | The app itself has no login. If access should be restricted, add authentication at the server/network level (e.g., SSO, IP allowlist, HTTP Basic Auth via Nginx/Apache). |
| Data storage | No user data is sent to or stored on the server. All document data lives on the user's local filesystem. |
| Content Security | Standard static file serving. No server-side script execution. No database exposure. |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Blank page on load | App served over HTTP instead of HTTPS | Ensure SSL is configured and redirect HTTP → HTTPS |
| "Open Folder" button disabled | Browser is not Chrome or Edge | Use Chrome or Edge; Firefox/Safari do not support File System Access API |
| 404 on page refresh | SPA routing not configured | Add `try_files` / `FallbackResource` / rewrite rule (see Server Configuration) |
| App loads but can't access local folder | Browser security prompt blocked | Click the "Open Projects Folder" button and allow folder access in the browser permission prompt |
| CSS/JS files not loading | Incorrect base path | Confirm files are uploaded to the correct directory and the URL path matches |
| Changes not appearing after update | Browser cache | Hard refresh (Ctrl+Shift+R). Ensure `index.html` has `no-cache` headers set |

---

## Quick Reference

```
Initial deployment:
  1. Run: ./deploy/build-doc-manager.sh
  2. Unzip deploy/dist/doc-manager-[date].zip
  3. Upload contents to web server directory
  4. Confirm HTTPS is active
  5. Open in Chrome or Edge to verify

Updating the app:
  1. Pull latest code from repository
  2. Run: ./deploy/build-doc-manager.sh
  3. Unzip and upload, replacing existing files

User requirements:
  - Chrome or Edge browser
  - Local "Documentation Manager" folder on their machine
  - No account or login required
```
