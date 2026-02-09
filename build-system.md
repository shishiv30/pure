# Build System Documentation

## Overview

This project uses a webpack-based build system with multiple environments (development, staging, and production) and supports multiple page entries. The build system is designed to be lightweight and performance-focused.

## Architecture

### Core Components

1. **Base Configuration** (`webpack.config.base.js`)
   - Defines common webpack rules and plugins
   - Handles multiple page entries
   - Configures asset loaders (fonts, images, SCSS, JS, HTML)

2. **Page Configuration** (`webpack.config.base.page.js`)
   - Defines multiple page entries
   - Each page has its own entry point and HTML template
   - Supports custom configurations per page

3. **Environment-Specific Configurations**
   - Development: `webpack.config.dev.js`
   - Build (Staging): `webpack.config.build.js`
   - Production: Uses build config with production flags

## Page Structure

### Current Pages
- `animation` - Animation demonstrations
- `demo` - Demo page
- `index` - Main landing page
- `3d` - 3D content page

### Page Configuration
Each page is automatically configured with:
- Entry point: `./client/pages/{pageName}/index.js`
- Template: `./client/pages/{pageName}/index.html`
- Output: `{pageName}.html`
- Favicon: `./client/assets/img/logo.png`

## Build Scripts

### Development (local)
```bash
npm run dev
```
- Uses `webpack-dev-server` with `webpack.config.dev.js`
- Opens browser automatically, hot reloading, source maps

### Build: dev (local)
```bash
npm run build:dev
```
- `NODE_ENV=development` → loads `.env`
- Uses `webpack.config.build.js`; runs webpack and server together
- Outputs to `dist/`, includes PWA manifest and service worker

### Build: stage (GitHub Pages)
```bash
npm run build:stage
```
- `NODE_ENV=stage` → loads `.env.stage`
- Uses `webpack.config.build.js`; CDN for GitHub Pages
- Optimized bundles; then run `npm run deploy-gh` to publish

### Build: production (AWS)
```bash
npm run build:prod
```
- `NODE_ENV=production` → loads `.env.production`
- Full production optimizations; same-origin or CDN from `.env.production`
- For Docker: `npm run build-docker:prod`

### Deployment (stage → GitHub Pages)
```bash
npm run deploy-gh
```
- Publishes `dist/` to `gh-pages` branch
- Run after `npm run build:stage`; workflow runs both on merge to main

## Webpack Configuration Details

### Base Configuration Features
- **Asset Management**: Handles fonts, images, and other static assets
- **CSS Processing**: SCSS compilation with MiniCssExtractPlugin
- **JavaScript Processing**: Babel transpilation for modern JS features
- **HTML Processing**: HTML loader with custom source handling
- **Multiple Entries**: Dynamic entry point generation for each page

### Development Features
- Source maps for debugging
- Development mode optimizations
- Webpack dev server with hot reloading

### Production Features
- Bundle optimization and minification
- PWA manifest generation
- Service worker integration (Workbox)
- CDN path configuration
- Bundle analyzer support (commented out)

## File Structure

```
├── webpack.config.base.js          # Base webpack configuration
├── webpack.config.base.page.js     # Page-specific configurations
├── webpack.config.dev.js           # Development configuration
├── webpack.config.build.js         # Build/production configuration
├── deploy.js                       # GitHub Pages deployment script
├── client/
│   ├── pages/                      # Page-specific code
│   │   ├── animation/
│   │   ├── demo/
│   │   ├── index/
│   │   └── 3d/
│   └── assets/                     # Static assets
└── dist/                           # Build output directory
```

## Environment Variables

### Development
- No specific environment variables required
- Uses local development server

### Production
- `serverConfig.cdnUrl` - CDN URL for assets
- GitHub Pages URL: `https://shishiv30.github.io/pure/`

## Build Process Flow

1. **Development**: `npm run dev` → Webpack dev server → Hot reloading
2. **Staging**: `npm run build` → Production build → `dist/` output
3. **Production**: `npm run prod` → Optimized build → `dist/` output
4. **Deployment**: `npm run deploy-gh` → GitHub Pages upload

## Performance Optimizations

- **Code Splitting**: Each page has its own bundle
- **Asset Optimization**: Images and fonts are optimized
- **CSS Extraction**: Styles are extracted to separate files
- **PWA Support**: Service worker and manifest for offline support
- **Bundle Analysis**: Webpack bundle analyzer (available but disabled)

## Customization

### Adding New Pages
1. Create new directory in `client/pages/{pageName}/`
2. Add `index.js` and `index.html` files
3. Update `webpack.config.base.page.js` if custom configuration needed

### Modifying Build Process
- Development: Edit `webpack.config.dev.js`
- Production: Edit `webpack.config.build.js`
- Base configuration: Edit `webpack.config.base.js`

### Deployment Configuration
- Edit `deploy.js` for deployment settings
- Modify `webpack.config.build.js` for CDN/public path changes

## Troubleshooting

### Common Issues
1. **Port conflicts**: Webpack dev server uses default port 8080
2. **Build failures**: Check for syntax errors in entry files
3. **Asset loading**: Verify file paths in HTML templates
4. **Deployment issues**: Ensure GitHub Pages branch is configured correctly

### Debug Tools
- Webpack bundle analyzer (uncomment in build config)
- Source maps in development
- Console logging in build process 