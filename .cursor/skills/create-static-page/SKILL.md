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

### #5 Build server EJS component (comp_*)

To add a reusable server-rendered component (e.g. `comp_timeline`, `comp_sectionhero`), follow the **comp_header** pattern.

**Location:** `server/ejs/` — one `.js` (data + factory) and one `.ejs` (markup).

**1. Data file `comp_<name>.js`**

- `import config from '../config.js';` and `const APP_URL = config.appUrl || '';`
- `COMPONENT_NAME` (camelCase, e.g. `'sectionHero'`, `'timeline'`)
- `COMPONENT_TEMPLATE` (e.g. `'comp_sectionhero'`, `'comp_timeline'`)
- One **data object** with all content hardcoded (no args; override via model later if needed)
- Export **`createXComponent()`** that returns `{ name: COMPONENT_NAME, template: COMPONENT_TEMPLATE, data: yourData }`
- Use `APP_URL` for any links or asset URLs in the data

**2. Template file `comp_<name>.ejs`**

- Guard with a single main prop: `<%_ if (timeline) { _%> ... <%_ } _%>` (prop name = component name in camelCase, e.g. `timeline`, `sectionHero`)
- Output values with `<%= timeline.heading %>`, loops with `<%_ for (var i = 0; i < timeline.entries.length; i++) { _%> ... <%_ } _%>`
- Keep markup minimal; all copy and structure come from the `.js` data

**3. Using the component in a server-rendered page**

- In the page config (e.g. `server/configs/demo.js`): create the component and add to the model, e.g. `timelineComponent: createTimelineComponent()`
- In the EJS view:  
  `<%_ const timelineComponent = data.timelineComponent; _%>`  
  `<%_ if (timelineComponent) { _%>`  
  `<%- include(timelineComponent.template, { timeline: timelineComponent.data }) %>`  
  `<%_ } _%>`

**Reference components:** `server/ejs/comp_header.js`, `comp_header.ejs`, `comp_sectionhero.js`, `comp_sectionphotos.ejs`, `comp_scrollview.js`, `comp_timeline.js`.

## Checklist

- [ ] #0 Page name decided (folder name, lowercase, hyphens).
- [ ] #1 Content prepared (title, description, layout).
- [ ] #2 Entry added in `webpack.config.base.page.js` with `name` and `static: true`.
- [ ] #3 `client/pages/<name>/index.html` created with header/footer includes and full head/body.
- [ ] #3 `client/pages/<name>/index.js` created with `main` and scss import.
- [ ] #4 Links added in both `server/ejs/comp_header.js` and `client/components/header.html`.
- [ ] #5 (Optional) New server EJS comp: `server/ejs/comp_<name>.js` + `comp_<name>.ejs` with data and `createXComponent()`.

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
- Server EJS components (comp_* pattern): `server/ejs/comp_header.js`, `comp_sectionhero.js`, `comp_sectionphotos.js`, `comp_scrollview.js`, `comp_timeline.js` (+ corresponding `.ejs` templates)
