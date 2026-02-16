# Pure UI

A lightweight, high-performance UI framework focused on delivering exceptional user experiences with pure JavaScript and CSS.

## Features

- ⚡ High Performance
- 🎨 Modern UI Components
- 🎯 Responsive Design
- 🔧 Easy to Customize
- 🛠️ Developer Friendly
- 🌐 Progressive Web App (PWA) Support
- 📊 Built-in Data Management
- 🗺️ Map Integration Support

## Components

Pure UI provides a set of ready-to-use components that can be easily integrated into your project. Here are some commonly used components:

### Understanding data-role

The `data-role` attribute is a core concept in Pure UI that connects HTML elements with their corresponding JavaScript behaviors. It serves as a declarative way to initialize components and their functionality.

#### Common data-role Values:

1. **tab**
   - Initializes tab functionality
   - Requires matching `data-target` attributes on tab buttons
   - Example:
   ```html
   <div data-role="tab">
       <button data-target="tab1">Tab 1</button>
   </div>
   ```

2. **collapse**
   - Creates collapsible content sections
   - Requires matching `data-target` attribute pointing to the content
   - Example:
   ```html
   <button data-role="collapse" data-target="#content">Toggle</button>
   <div id="content" class="collapse-panel">Content</div>
   ```

3. **dialog**
   - Initializes modal dialog functionality
   - Requires `data-target` pointing to the dialog template
   - Optional `data-theme` for different styles (default, fullscreen, dropdown)
   - Example:
   ```html
   <button data-role="dialog" data-target="#dialog1">Open Dialog</button>
   <script id="dialog1" type="text/template">Content</script>
   ```

4. **form**
   - Enables form validation and submission handling
   - Can include `data-onsubmit` for custom submission behavior
   - Example:
   ```html
   <form data-role="form" data-onsubmit="submit">
       <input data-role="validate" data-type="required">
   </form>
   ```

5. **player**
   - Initializes image player/slider
   - Requires `data-images` array of image paths
   - Example:
   ```html
   <div data-role="player" data-images='["img1.jpg", "img2.jpg"]'>
   ```

6. **album**
   - Creates image album/gallery
   - Similar to player but with different layout
   - Example:
   ```html
   <div data-role="album" data-images='["img1.jpg", "img2.jpg"]'>
   ```

7. **textbox**
   - Enhanced input field with validation
   - Can include `data-validate` for validation rules
   - Example:
   ```html
   <div data-role="textbox">
       <input data-validate="required,email">
   </div>
   ```

#### data-role Attributes and Modifiers:

1. **data-target**
   - Links elements together (e.g., tab buttons to content)
   - Can be an ID or a custom identifier
   ```html
   <button data-target="content1">Show Content 1</button>
   <div data-id="content1">Content</div>
   ```

2. **data-validate**
   - Specifies validation rules
   - Multiple rules can be comma-separated
   ```html
   <input data-validate="required,email,phone">
   ```

3. **data-type**
   - Specifies the type of validation or behavior
   - Common values: required, email, phone, number
   ```html
   <input data-type="required,email">
   ```

4. **data-theme**
   - Modifies the appearance of components
   - Common values: default, fullscreen, dropdown
   ```html
   <div data-role="dialog" data-theme="fullscreen">
   ```

5. **data-images**
   - JSON array of image paths for media components
   ```html
   <div data-role="player" data-images='["img1.jpg", "img2.jpg"]'>
   ```

#### Best Practices:

1. **Component Initialization**
   - Always include the appropriate `data-role` attribute
   - Ensure all required attributes are present
   - Follow the component's HTML structure

2. **Validation**
   - Use appropriate validation rules
   - Combine multiple rules with commas
   - Include required attributes for validation

3. **Event Handling**
   - Use `data-onsubmit` for form submission
   - Use `data-onclick` for custom click handlers
   - Follow the event naming convention

4. **Accessibility**
   - Include appropriate ARIA labels
   - Maintain proper HTML structure
   - Ensure keyboard navigation support

### Tab Component
```html
<div data-role="tab">
    <button type="button" class="tab default active" data-target="tab1">Tab1</button>
    <button type="button" class="tab default" data-target="tab2">Tab2</button>
    <button type="button" class="tab default" data-target="tab3">Tab3</button>
</div>
<div class="panel inline default tab-panel">
    <div data-id="tab1">Tab1 Content</div>
    <div data-id="tab2" class="hide">Tab2 Content</div>
    <div data-id="tab3" class="hide">Tab3 Content</div>
</div>
```

### Button Component
```html
<button type="button" class="btn default small active">
    <i class="icon-plus"></i> Apply
</button>
<button type="button" class="btn gray active">Gray Button</button>
<button type="button" class="btn danger active">Danger Button</button>
<button type="button" class="btn minor active">Minor Button</button>
<button type="button" class="btn major active">Major Button</button>
<button type="button" class="btn safe active">Safe Button</button>
```

### Tag Component
```html
<button type="button" class="tag default"><i class="icon-plus"></i> Tag</button>
<button type="button" class="tag gray">Gray Tag</button>
<button type="button" class="tag danger">Danger Tag</button>
<button type="button" class="tag minor">Minor Tag</button>
<button type="button" class="tag major">Major Tag</button>
<button type="button" class="tag safe">Safe Tag</button>
```

### Collapse Component
```html
<button type="button" data-role="collapse" data-target="#collapsePanel">
    <span>Show Content</span>
    <i class="icon-angle-left"></i>
</button>
<div id="collapsePanel" class="collapse-panel">
    Collapsible content goes here...
</div>
```

### Dialog Component
```html
<a class="btn default small" href="javascript:;" data-role="dialog" data-target="#dialogPanel">
    Open Dialog
</a>
<script id="dialogPanel" type="text/template">
    <div class="grid grid-xs-1 large">
        <div class="h4">Dialog Title</div>
        <div>Dialog content goes here...</div>
    </div>
</script>
```

### Form Components
```html
<form class="grid grid-xs-1" data-role="form" data-onsubmit="submit">
    <!-- Text Input -->
    <div class="input left">
        <i class="icon-user"></i>
        <input name="username" placeholder="Username" data-role="validate" data-type="required" />
    </div>
    
    <!-- Select Box -->
    <div class="selectbox">
        <select name="option" data-validate="required">
            <option value="" selected disabled>Select an option</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
        </select>
        <i class="icon-angle-down"></i>
    </div>
    
    <!-- Radio Buttons -->
    <div class="radio">
        <label>
            <input type="radio" name="gender" value="male" />
            <span>Male</span>
        </label>
        <label>
            <input type="radio" name="gender" value="female" />
            <span>Female</span>
        </label>
    </div>
    
    <!-- Checkboxes -->
    <div class="checkbox">
        <label>
            <input type="checkbox" name="hobby" value="reading" />
            <span>Reading</span>
        </label>
        <label>
            <input type="checkbox" name="hobby" value="sports" />
            <span>Sports</span>
        </label>
    </div>
</form>
```

### Player Component
```html
<div class="player" data-role="player" data-index="0"
    data-images='["img1.jpg", "img2.jpg", "img3.jpg"]'>
    <img src="img1.jpg" alt="Player Image One">
    <img src="img2.jpg" alt="Player Image Two">
</div>
```

### Album Component
```html
<div class="album" data-role="album" data-index="0"
    data-images='["img1.jpg", "img2.jpg", "img3.jpg"]'>
    <div class="album-list">
        <img src="img1.jpg" loading="lazy" alt="album photos">
    </div>
</div>
```

## Installation

```bash
npm install
```

## Development

### Full Development Environment
Start both client and server with hot-reload and auto-restart:
```bash
npm run dev
```
This runs:
- Webpack dev server (port 8080) with hot-reload
- Node server (port 3000) with nodemon auto-restart

### Client-Side Only
Start only the webpack dev server:
```bash
npm run dev:client
```

### Server-Side Only
Start only the Node server:
```bash
npm run dev:server
```

### Development Build
Build and serve static files:
```bash
npm run build:dev
```
This runs:
- Webpack build process
- Node server serving static files

### API Documentation
After starting the server, you can access:
- API Documentation: `http://localhost:3000/api-docs` (or `http://localhost:3002/api-docs` for Docker)
- Search Page: `http://localhost:3000/demo/ca/san-jose` (or `http://localhost:3002/demo/ca/san-jose` for Docker)

## Building

### Local Development Build
Build and serve with hot reload:
```bash
npm run build:dev
```
This runs:
- Webpack build process (development mode)
- Node server serving static files
- Concurrent execution for faster development

### Production Build
```bash
npm run build:prod
```
Creates optimized production build with:
- Minified assets
- Optimized bundles
- Production configuration

### Docker Development (local)
Build and run the **development** image (uses `.env` only, not `.env.production`). Rebuilds with no cache.
```bash
npm run build-docker:dev
```
Access at: `http://localhost:3002`

### Docker Production
Build and run the **production** image (uses `.env.production`).
```bash
npm run build-docker:prod
```
Access at: `http://localhost:3002`

### Build Docker image
This project uses **Docker Compose**; image name is **pure**.

- **Production:** `npm run build-docker:prod` — builds production stage and starts container.
- **Local / dev:** `npm run build-docker:dev` — builds development stage (no cache) and starts container.

From repo root you can also build only (no run): `docker compose build`, or `docker compose build --no-cache` for a clean dev rebuild. Do not use raw `docker build --target ...`.

**Docker image security:** The Dockerfile upgrades Alpine packages (`apk upgrade`) and uses `npm ci` for reproducible installs. To fix reported npm vulnerabilities (e.g. in Docker Scout), run `npm audit fix` (or `npm audit fix --force` for major upgrades) in the repo, commit the updated `package-lock.json`, then rebuild the image.

**Ports:** Host 3002 (DOCKER_PORT), Node listener 3000 (PORT). Config from `.env` / `.env.stage` / `.env.production` / `.env.local`.

### Environments (dev, stage, production)

| Env | File | Use case |
|-----|------|----------|
| **dev** | `.env` | Local and Docker dev (`build-docker:dev`). |
| **stage** | `.env.stage` | GitHub Pages: `npm run deploy-gh` (builds with `.env.stage` and publishes to gh-pages). Auto-runs on merge to main. |
| **production** | `.env.production` | AWS (Docker): `build-docker:prod` or CI. CDN_URL empty = same-origin. No AWS deploy script yet. |

### Docker Quick Start
Simple Docker setup:
```bash
./run-docker.sh
```

## Available Scripts

| Command | Description | Port | Cache |
|---------|-------------|------|-------|
| `npm run dev` | Development with hot reload | 3000 | - |
| `npm run build:dev` | Local development build | 3000 | - |
| `npm run build:prod` | Production build (AWS) | - | - |
| `npm run build:stage` | Stage build (GitHub Pages, uses .env.stage) | - | - |
| `npm run build-docker:dev` | Docker local/dev (uses .env, no cache) | 3002 | No cache |
| `npm run build-docker:prod` | Docker production (uses .env.production) | 3002 | - |
| `npm run deploy-gh` | Publish dist to GitHub Pages (gh-pages); run after build:stage | - | - |
| `npm run clean` | Clean dist folder | - | - |
| `npm run start` | Start production server | 3000 | - |
| `npm run review` | Review uncommitted changes with Cursor CLI | - | - |
| `npm run review:staged` | Review staged changes with Cursor CLI | - | - |

## Code Review

This project supports automated code reviews using Cursor CLI. The review system focuses on code quality, best practices, potential bugs, and adherence to project standards.

**Note**: Code review is different from `npm run test`:
- `npm run test`: Runs automated tests (pass/fail)
- `npm run review`: AI-powered code review (actionable feedback, suggestions, quality checks)

### Local Code Review

**Before running**, make sure you have:
1. `CURSOR_API_KEY` set in your environment:
   ```bash
   export CURSOR_API_KEY=your_api_key_here
   ```
2. Cursor CLI installed (check with `which cursor-agent`)

**Review uncommitted changes:**
```bash
npm run review
```
This reviews all modified files that haven't been committed yet.

**Review only staged changes:**
```bash
npm run review:staged
```
This reviews only files that are staged with `git add`.

**Testing tips:**
- Make a test change (e.g., add a typo) in a file
- Run `npm run review` to see if it catches the issue
- The review will analyze code quality, typos, bugs, and adherence to `.cursor/rules/` and `.cursor/background.json`

### Automated PR Reviews

The project includes a GitHub Actions workflow (`.github/workflows/cursor-code-review.yml`) that automatically reviews pull requests. The workflow:

- Runs on PR events (opened, synchronized, reopened, ready for review)
- Reviews code changes and provides **inline comments directly on the PR**
- Uses GitHub Reviews API to post comments on specific lines
- Focuses on critical issues with concise, actionable comments
- Uses emojis to categorize feedback (🚨 Critical, 🔒 Security, ⚡ Performance, ⚠️ Logic, ✨ Improvement)

**Key difference from `npm run test`**:
- `test` → Automated pass/fail checks
- `review` → AI analyzes code quality and posts feedback as PR comments

### Configuration

The code review behavior is configured in `.cursor/cli.json`:
- Limits agent permissions to prevent unwanted repository changes
- Configures review settings (max comments, focus on critical issues)
- Ensures reviews follow project coding standards

### Setup Requirements

For automated PR reviews to work, you need to:

1. **Get your CURSOR_API_KEY**:
   - Log in to your Cursor account at [cursor.com](https://cursor.com)
   - Navigate to **Settings** → **Integrations** (or Account Settings)
   - Go to **User API Keys** section
   - Click **Generate New API Key** (or create one if you don't have any)
   - Copy the generated API key

2. **Set up for local use** (optional):
   ```bash
   export CURSOR_API_KEY=your_api_key_here
   ```
   Or add it to your `~/.zshrc` or `~/.bashrc` for persistence:
   ```bash
   echo 'export CURSOR_API_KEY=your_api_key_here' >> ~/.zshrc
   ```

3. **Set up for GitHub Actions**:
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CURSOR_API_KEY`
   - Value: Paste your API key
   - Click **Add secret**

4. **Enable GitHub Actions permissions**:
   - Ensure the repository has pull request write permissions enabled for GitHub Actions
   - Go to **Settings** → **Actions** → **General** → **Workflow permissions**
   - Select **Read and write permissions**

## Deployment

- **Stage (GitHub Pages):** `npm run build:stage` then `npm run deploy-gh` — or use the workflow that runs on merge to main. Publishes `dist` to `gh-pages`.
- **Production (AWS):** No deploy script yet. Use the Docker image from `build-docker:prod` or CI; `.env.production` has CDN_URL empty for same-origin.

## Project Structure

```
├── client/         # Frontend source code
│   ├── js/        # JavaScript source files
│   ├── pages/     # Page templates
│   └── assets/    # Static assets
├── server/         # Backend source code
│   ├── routes/    # API routes
│   ├── models/    # Data models
│   └── config/    # Server configuration
├── dist/          # Build output
├── helpers/       # Utility functions
└── data/          # Data files
```

## Development Guide

### Creating Server EJS Components

To create a reusable server-rendered component from partial HTML:

**1. Extract HTML and create data file** (`server/ejs/comp_<name>.js`):

```js
import config from '../config.js';
import { getImgCdnUrl, WELCOME_IMG } from '../../helpers/imgCdn.js';

const APP_URL = config.appUrl || '';
const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

const COMPONENT_NAME = 'hero';
const COMPONENT_TEMPLATE = 'comp_hero';

const heroData = {
  image: {
    src: getImgCdnUrl(CDN_URL, WELCOME_IMG.point0),
    alt: 'Welcome Hero',
    loading: 'eager',
  },
  title: 'Pure UI',
  subtitle: 'client-side rendering framework.',
  desc: 'Description text...',
};

export function createHeroComponent() {
  return {
    name: COMPONENT_NAME,
    template: COMPONENT_TEMPLATE,
    data: heroData,
  };
}
```

**2. Create EJS template** (`server/ejs/comp_<name>.ejs`):

```ejs
<%_ if (hero) { _%>
<section class="section-hero animation">
  <div class="picture">
    <img src="<%= hero.image.src %>" alt="<%= hero.image.alt %>">
  </div>
  <div class="content">
    <h1><strong><%= hero.title %></strong></h1>
    <p><%= hero.subtitle %></p>
    <p class="desc"><%= hero.desc %></p>
  </div>
</section>
<%_ } _%>
```

**3. Use in page config** (`server/configs/<page>.js`):

```js
import { createHeroComponent } from '../ejs/comp_hero.js';

export default {
  name: 'index',
  get: async function () {
    return {
      heroComponent: createHeroComponent(),
    };
  },
};
```

**4. Include in EJS view** (`server/ejs/<page>.ejs`):

```ejs
<%_ const sectionHeroComponent = data.sectionHeroComponent; _%>
<%_ if (sectionHeroComponent) { _%>
  <%- include(sectionHeroComponent.template, { sectionHero: sectionHeroComponent.data }) %>
<%_ } _%>
```

**Key principles:**
- All content hardcoded in `.js` data object
- Template is pure markup with `<%= %>` output
- Single prop name (camelCase matching component name)
- Always guard with `<%_ if (propName) { _%>`

**Reference:** `server/ejs/comp_header.js`, `comp_hero.js`, `comp_points.js`, `comp_timeline.js`

### Adding and Using Images

**1. Place images in `client/assets/images/`**

Organize by folder (e.g. `welcome/`, `icons/`):
- `client/assets/images/welcome/point0.jpeg`
- `client/assets/images/welcome/point1.jpeg`

**2. Webpack automatically copies images**

All images from `client/assets/images/` are copied to `dist/images/` preserving folder structure:
- `client/assets/images/welcome/point0.jpeg` → `dist/images/welcome/point0.jpeg`

**3. Use CDN URL helper in components**

```js
import { getImgCdnUrl, WELCOME_IMG } from '../../helpers/imgCdn.js';
import config from '../config.js';

const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

// Use predefined mapping
const imageSrc = getImgCdnUrl(CDN_URL, WELCOME_IMG.point0);
// Returns: ${CDN_URL}/images/welcome/point0.jpeg

// Or use custom path
const imageSrc = getImgCdnUrl(CDN_URL, 'custom/folder/image.png');
// Returns: ${CDN_URL}/images/custom/folder/image.png
```

**4. Add to WELCOME_IMG mapping** (optional, in `helpers/imgCdn.js`):

```js
export const WELCOME_IMG = {
  point0: 'welcome/point0.jpeg',
  point1: 'welcome/point1.jpeg',
  point4: 'welcome/point4.jpeg', // Add new entry
};
```

**Image URL format:**
- **Source**: `client/assets/images/welcome/point0.jpeg`
- **Built**: `dist/images/welcome/point0.jpeg`
- **CDN URL**: `${cdnUrl}/images/welcome/point0.jpeg`

### Creating Server-Rendered EJS Pages

To create a server-rendered page (like the index page):

**1. Create page config** (`server/configs/<pageName>.js`):

```js
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
import { createHeroComponent } from '../ejs/comp_hero.js';

export default {
  name: '<pageName>', // Must match route name
  seo: function () {
    return {
      title: 'Page Title',
      desc: 'Page description',
      keywords: '',
    };
  },
  get: async function () {
    const headerComponent = createHeaderComponent();
    const footerComponent = createFooterComponent();
    const heroComponent = createHeroComponent();

    return {
      headerComponent,
      footerComponent,
      heroComponent,
    };
  },
};
```

**2. Register config** (`server/configs/index.js`):

```js
import <pageName> from './<pageName>.js';
export default [geo, demo, indexPage, <pageName>];
```

**3. Create EJS template** (`server/ejs/<pageName>.ejs`):

```ejs
<%- include('html_above') %>

<%_ const headerComponent = data.headerComponent; _%>
<%_ if (headerComponent) { _%>
  <%- include(headerComponent.template, { header: headerComponent.data }) %>
<%_ } else { _%>
  <%- include('comp_header') %>
<%_ } _%>

<%_ const heroComponent = data.heroComponent; _%>
<%_ if (heroComponent) { _%>
  <%- include(heroComponent.template, { hero: heroComponent.data }) %>
<%_ } _%>

<%_ const footerComponent = data.footerComponent; _%>
<%_ if (footerComponent) { _%>
  <%- include(footerComponent.template, { footer: footerComponent.data }) %>
<%_ } else { _%>
  <%- include('html_footer') %>
<%_ } _%>

<%- include('html_below') %>
```

**4. Add route** (`server/routes/page.js`):

```js
router.get('/<pageName>', async (req, res) => {
  const controller = new BaseController(req, res, '<pageName>');
  const model = await controller.get();
  controller.toPage(model);
});
```

**5. Update webpack config** (`webpack.config.base.page.js`):

```js
{
  name: '<pageName>', // No static: true for server-rendered pages
},
```

**How it works:**
1. Route matches → creates `BaseController` with config name
2. Controller calls `config.get()` → returns model with components
3. Controller adds `meta`, `seo`, `breadcrumb` to model
4. Controller calls `toPage(model)` → renders `<pageName>.ejs` with model
5. EJS includes components → components render their data

**Example:** See `server/configs/page/index.js` and `server/ejs/index.ejs` for the index page implementation.

## Core Concepts

The framework uses a simple but powerful set of concepts:

- **Layout System**:
  - `flex`: For single-item layouts (object with fields)
  - `grid`: For multiple-item layouts (arrays)
  - `horizontal/vertical`: Direction settings
  - `gap`: Spacing between elements

- **Responsive Design**:
  - `xs`: Phone devices
  - `sm`: Tablet devices
  - `md`: Desktop devices
  - `lg`: Large desktop devices

- **Spacing**:
  - `large`: Preset large gap
  - `small`: Preset small gap
  - `normal`: Default gap size

- **Color System**:
  - Scale from 0-9 (lowest to highest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [conjee zou](https://github.com/shishiv30)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/shishiv30/pure/issues).
