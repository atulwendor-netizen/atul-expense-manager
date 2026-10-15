# ATUL EXPENSE MANAGER — DEPLOYMENT GUIDE

This document provides deployment guidelines, production build specifications, routing configurations, and operational considerations for **Atul Expense Manager**.

---

## 1. Build Specifications

| Parameter | Value |
| :--- | :--- |
| **Framework** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Build Command** | `npm run build` |
| **Production Output Directory** | `dist` |
| **Local Preview Command** | `npm run preview` |
| **Node.js Environment** | Node 18.x or Node 20.x+ |

---

## 2. Production Build Output

Running `npm run build` compiles TypeScript and creates the production bundle inside `dist/`:

```
dist/
├── assets/
│   ├── index-[hash].js        # Minified application bundle
│   └── index-[hash].css       # Minified Tailwind CSS styles
├── _redirects                 # SPA client routing rule for Netlify / Cloudflare / Render
├── 404.html                   # SPA client fallback for GitHub Pages
├── vite.svg                   # Brand SVG favicon
└── index.html                 # Production entrypoint
```

---

## 3. Local Production Preview

To test and verify the compiled production bundle locally before deployment:

```bash
# 1. Generate fresh production bundle
npm run build

# 2. Start Vite production preview server
npm run preview
```

The preview server will be available at `http://localhost:4173/`.

---

## 4. SPA Client-Side Routing & Fallback

Atul Expense Manager uses client-side SPA routing (`/expenses`, `/trips`, `/reimbursements`, `/analytics`, `/reports`, `/settings`). Direct requests or page refreshes on these routes require web server rewrites to `/index.html` to prevent 404 errors.

### A. Vercel
Configured via `vercel.json` in the project root:
```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### B. Netlify / Cloudflare Pages / Render
Configured via `public/_redirects` (automatically copied to `dist/_redirects` upon build):
```
/*    /index.html   200
```

### C. GitHub Pages
A `public/404.html` SPA redirect fallback is provided in `dist/404.html`. In addition, hash-based navigation (e.g., `/#expenses`, `/#trips`) is natively supported by the internal router.

### D. Nginx Server Configuration
```nginx
server {
    listen 80;
    server_name expenses.example.com;
    root /var/www/atul-expense-manager/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
    }
}
```

### E. Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Data Persistence Architecture & Limitations

> [!IMPORTANT]
> **Data Persistence Limitation**:
> Atul Expense Manager currently operates on a **client-side storage model** using browser `window.localStorage`:
> - `atul_expense_manager_expenses_v1`
> - `atul_expense_manager_trips_v1`
> - `atul_expense_manager_reimbursements_v1`
> - `atul_expense_manager_active_trip_v1`
> - `atul_expense_manager_dark_mode`
>
> **Implications**:
> 1. User expense records, edits, and receipts are stored locally within the user's specific browser and device.
> 2. Data is **not automatically synchronized** between different devices, mobile phones, or incognito browser sessions.
> 3. Clearing browser site data or cookies for the site will reset records back to the verified seed dataset.
> 4. To transfer data across devices or create off-site backups, users should use the **Backup & Restore** tool in the **Settings** page (`/settings`) to export and import complete JSON database snapshots.

---

## 6. Recommended Deployment Platforms & Commands

### Platform 1: Vercel (Recommended for instant automated CI/CD)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy production build
vercel --prod
```
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

### Platform 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy production folder
netlify deploy --prod --dir=dist
```
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

---

### Platform 3: Cloudflare Pages
```bash
# Deploy with Wrangler
npx wrangler pages deploy dist --project-name=atul-expense-manager
```
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`

---

### Platform 4: Docker Container Deployment
A lightweight multi-stage Dockerfile can be used for containerized hosting:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. Pre-Deployment Verification Checklist

- [x] TypeScript compiles without errors (`tsc`)
- [x] Vite production bundle builds successfully (`vite build`)
- [x] All 78 original expense records preserved (77 valid, 1 incomplete)
- [x] SPA redirects configured (`_redirects` & `vercel.json`)
- [x] Favicon (`vite.svg`) present in `dist/`
- [x] All routes load and refresh without 404 (`/expenses`, `/trips`, `/reimbursements`, `/analytics`, `/reports`, `/settings`)
- [x] Excel and CSV claim exports operational
- [x] Print audit view format configured for physical vouchers
