# GitHub Pages Deployment Guide

## Minification Results

The code has been minified and optimized for production:

- **HTML**: 9.9KB → 6.4KB (35% reduction)
- **CSS**: 11KB → 7.5KB (32% reduction)
- **JavaScript**: 49KB → 25KB (49% reduction)
- **Total**: 69.9KB → 38.9KB (44% overall reduction)

## Deployment Files

The production-ready files are located in the `docs/` folder:
- `docs/index.html` (minified HTML)
- `docs/styles.min.css` (minified CSS)
- `docs/app.min.js` (minified JavaScript)

## How to Deploy to GitHub Pages

### Step 1: Create GitHub Repository
```bash
# If you haven't already, create a new repository on GitHub
# Then add it as remote:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Step 2: Commit Your Changes
```bash
git add .
git commit -m "Initial commit with minified production files"
```

### Step 3: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select the "main" branch and "/docs" folder
6. Click "Save"

### Step 5: Access Your Site
After a few minutes, your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Development vs Production

- **Development files** (not minified): `index.html`, `styles.css`, `app.js`
- **Production files** (minified): `docs/index.html`, `docs/styles.min.css`, `docs/app.min.js`

## Updating the Site

To update your site:
1. Make changes to the original files (`index.html`, `styles.css`, `app.js`)
2. Run the minification scripts:
   ```bash
   npm run minify
   ```
3. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Update site"
   git push
   ```

## Notes
- The `docs/` folder is configured for GitHub Pages deployment
- Original development files are preserved in the root directory
- Node modules are excluded via `.gitignore`
