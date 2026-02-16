---
name: create-static-page
description: Creates a new static page in the pure project. Use when the user wants to add a static page, create a new page, or scaffold a page under client/pages. Covers page name, content, webpack config, index.html/index.js, and header nav link.
---

# Create Static Page

Follow this workflow to add a new static page. Reuse existing CSS and components; every page must include the header and footer comps. After creating the page, add its link to the header menu.

## Workflow

### #0 Page name (from requirement)

- Derive a **single folder name** (e.g. `about`, `survey`, `war-system`).
- Use lowercase; hyphens for multi-word names. This name is used as:
  - Folder under `client/pages/<name>/`
  - `pageConfig.pages[].name`
  - Output filename `<name>.html`
  - Optional body class `page-<name>`.

### #1 Prepare content

- Decide title, meta description, and body content.
- Reuse existing CSS from `client/scss/` (e.g. `index.scss`) and existing component patterns from other pages.

**Content generation rule (recommended page structure):** When generating page content, use at least these sections. Titles should be **bold** (e.g. `<strong>`) and sections should use **big gaps** (e.g. class `large`).

| # | Section | Structure |
|---|---------|-----------|
| 1 | **Hero** | Title, slogan, short description. Full-screen image behind content; content centered over image. Use `section-hero section large`, `.img-bg` with hero image, then `.fixed` + `.panel` for copy. Hero styling (image behind, mask overlay, centered content) is in `client/scss/_section.scss`. |
| 2 | **Main points** | 3–6 key points. Responsive grid: `grid grid-xs-1 grid-md-2 grid-lg-3` (1 col small, 2 medium, 3 large). Each point: optional image, `<h3>` bold, paragraph. |
| 3 | **Metrics / stats** | Key–value layout. Use `grid` with panels; each row: label (key) + value. Optional small images per block. |
| 4 | **History / timeline** | Ordered sequence with dates. `<ol>` or list of items; each: date + title (bold) + short description. |
| 5 | **Reviews / voices** | Conversational or chat style. Quote blocks or panels; optional speaker label and `icon-quote-left` / `icon-quote-right`. |
| 6 | **Summary** | Short recap and bullet list. |
| 7 | **FAQ** | Questions (bold) + answers. `grid grid-xs-1` or stacked blocks. |

**Images:** If assets exist under `client/assets/images/welcome/`, use them: `point0` for hero full-screen image, `point1`–`point6` for main points (one per point), `point7`–`point9` for metrics or other sections. Path from page: `../../assets/images/welcome/pointN.jpeg` (or `.png`/`.jpg` as appropriate).

**Icons:** Reuse the icon library (`client/scss/_icon.scss`). Use classes like `icon-ship`, `icon-anchor`, `icon-shield`, `icon-users`, `icon-calendar`, `icon-question-circle`, etc. Add `<i class="icon-*"></i>` next to headings, list items, or labels to enrich the page.

### #2 Update static page config

In **`webpack.config.base.page.js`**, add an entry to the `pages` array (same shape as existing static pages):

```js
{
	name: '<name>',   // folder name, no .html
	static: true,
},
```

Insert in logical order (e.g. alphabetically or by feature). The config will set `entry`, `template`, `chunks`, `favicon`, and `filename` from `name` automatically.

### #3 Create page files under `client/pages/<name>/`

**`client/pages/<name>/index.html`**

- **Head**: Full head with `<title>`, `<meta name="Description">`, viewport, charset, theme-color, etc. Match `client/pages/about/index.html` or `client/pages/index/index.html`.
- **Body**: `id="body"` and class `page-<name>`.
- **Required includes** (build replaces these with component markup):
  - After `<body>`: `<!-- include:header.html -->`
  - Before `</body>`: `<!-- include:footer.html -->`
- Includes are resolved from `client/components/` (e.g. `header.html`, `footer.html`). Do not change the include comment format.
- Put page content between header and footer. Reuse existing layout classes (e.g. `section`, `panel`, `grid`, `flex`) and components.

**`client/pages/<name>/index.js`**

- Entry for webpack. Reuse the same pattern as other static pages:

```js
import { main } from '../../js/index.js';
import scss from '../../scss/index.scss';

export default (function (win) {
	main(win);
})(window);
```

- If the page needs a different SCSS entry (e.g. `animation.scss`), import that instead of `index.scss`; still call `main(win)` if the app’s core behavior is required.

### #4 Add page link to headers

Update both the EJS header config and the static HTML header so navigation stays in sync.

- **Server/EJS header** (`server/ejs/comp_header.js`):
  - Add an item in `headerData.menu` or in a `children` array:

```js
{
	text: 'Page Label',
	href: `${APP_URL}/<name>.html`,
},
```

- **Static HTML header** (`client/components/header.html`):
  - Add a matching `<li><a href="./<name>.html">Page Label</a></li>` in the appropriate `<ul>` (e.g. under the Demo submenu).

Use the same label and `.html` suffix pattern as existing items (e.g. `about.html`, `survey.html`).

### #5 (Optional) Create reusable components

If you need reusable components for server-rendered pages, see the **create-comp** skill for:
- Creating server EJS components (`comp_*` pattern)
- Converting HTML to components
- Adding and using images in components

**Reference**: `.cursor/skills/create-comp/SKILL.md`

### #6 Create server-rendered EJS page

To create a server-rendered page (like the index page), follow this pattern:

**Step 1: Create page config**

Create `server/configs/<pageName>.js`:

```js
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';
// Import any components you need (see create-comp skill for component creation)
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
    // Create components
    const headerComponent = createHeaderComponent();
    const footerComponent = createFooterComponent();
    const heroComponent = createHeroComponent();

    // Return model with components
    return {
      headerComponent,
      footerComponent,
      heroComponent,
      // Add any other data needed
    };
  },
};
```

**Note**: To create new components, see `.cursor/skills/create-comp/SKILL.md`.

**Step 2: Register config**

Add to `server/configs/index.js`:

```js
import <pageName> from './<pageName>.js';
export default [geo, demo, indexPage, <pageName>];
```

**Step 3: Create EJS template**

Create `server/ejs/<pageName>.ejs`:

```ejs
<%- include('html_above') %>

<%_ const headerComponent = data.headerComponent; _%>
<%_ if (headerComponent) { _%>
  <%- include(headerComponent.template, { header: headerComponent.data }) %>
<%_ } else { _%>
  <%- include('comp_header') %>
<%_ } _%>

<%_ const sectionHeroComponent = data.sectionHeroComponent; _%>
<%_ if (sectionHeroComponent) { _%>
  <%- include(sectionHeroComponent.template, { sectionHero: sectionHeroComponent.data }) %>
<%_ } _%>

<!-- Add more sections/components here -->

<%_ const footerComponent = data.footerComponent; _%>
<%_ if (footerComponent) { _%>
  <%- include(footerComponent.template, { footer: footerComponent.data }) %>
<%_ } else { _%>
  <%- include('html_footer') %>
<%_ } _%>

<%- include('html_below') %>
```

**Step 4: Add route**

In `server/routes/page.js`:

```js
router.get('/<pageName>', async (req, res) => {
  const controller = new BaseController(req, res, '<pageName>');
  const model = await controller.get();
  controller.toPage(model);
});
```

**Step 5: Update webpack config (if needed)**

If the page needs its own CSS/JS bundle, ensure `webpack.config.base.page.js` has an entry (even if not static):

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

**Example**: See `server/configs/page/index.js` and `server/ejs/index.ejs` for the index page implementation.

## Checklist

- [ ] #0 Page name decided (folder name, lowercase, hyphens).
- [ ] #1 Content prepared (title, description, layout).
- [ ] #2 Entry added in `webpack.config.base.page.js` with `name` and `static: true`.
- [ ] #3 `client/pages/<name>/index.html` created with header/footer includes and full head/body.
- [ ] #3 `client/pages/<name>/index.js` created with `main` and scss import.
- [ ] #4 Links added in both `server/ejs/comp_header.js` and `client/components/header.html`.
- [ ] #5 (Optional) Components created: see `.cursor/skills/create-comp/SKILL.md` for component creation workflow.
- [ ] #6 (Optional) Server-rendered page: config created, registered, EJS template, route added.

## Reference files

- Config: `webpack.config.base.page.js`
- Header data (nav links): `server/ejs/comp_header.js`
- Include behavior: `webpack.config.base.js` (preprocessor for `<!-- include:... -->`)
- Template examples: `client/pages/about/index.html`, `client/pages/index/index.html`, `client/pages/ai-trend/index.html`
- Entry examples: `client/pages/about/index.js`
- Shared components: `client/components/header.html`, `client/components/footer.html`
- Hero section (image behind, mask, centered content): `client/scss/_section.scss` (`.section-hero`)
- Icons: `client/scss/_icon.scss` (use `icon-*` classes)
- Welcome images: `client/assets/images/welcome/` (point0–point9)
- Server EJS components: See `.cursor/skills/create-comp/SKILL.md` for component creation guide
- Server-rendered page examples: `server/configs/page/index.js`, `server/ejs/index.ejs`, `server/routes/page.js` (index route)
