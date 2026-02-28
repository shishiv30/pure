---
name: create-comp
description: Creates reusable server EJS components in the pure project. Use when the user wants to create a component, convert HTML to a component, or build reusable UI sections. Supports both global components (header/footer) and page sections (hero, points, gallery, etc.) used by the dynamic page system.
---

# Create Server EJS Component

Follow this workflow to create reusable server-rendered components (e.g. `comp_header`, `comp_footer`, `comp_hero`, `comp_timeline`, `comp_gallery`).

There are now **two patterns**:

- **Pattern A – Global components** (header/footer, special widgets): `.js` data/factory file **plus** `.ejs` template.
- **Pattern B – Page sections** (hero, scrollview, points, gallery, timeline): **EJS-only** templates driven by **page data** (`data/page/*.js` and CMS), mapped via `data/page/comp_template.js`.

## Workflow

### #1 Component name (from requirement)

- Derive a **single component name** (e.g. `hero`, `timeline`, `gallery`, `points`).
- Use camelCase. This name is used as:
  - `COMPONENT_NAME` constant
  - `COMPONENT_TEMPLATE` (prefixed with `comp_`, e.g. `'comp_hero'`)
  - Function name `createXComponent()` (e.g. `createHeroComponent()`)
  - EJS prop name (camelCase, e.g. `hero`, `timeline`)

## Pattern A – Global component with JS + EJS (header/footer-style)

Use this when you need a reusable component that is **not** just a CMS-driven page section (for example, header, footer, or a global widget).

### #2A Create data file `server/ejs/comp_<name>.js`

**Location:** `server/ejs/comp_<name>.js`

**Structure:**

```js
import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_HOST = config.appHost || '';
const CDN_HOST = config.cdnHost || '';

const COMPONENT_NAME = '<name>'; // camelCase, e.g. 'hero', 'timeline'
const COMPONENT_TEMPLATE = 'comp_<name>'; // e.g. 'comp_hero'

const <name>Data = {
  // All content hardcoded here
  // No function arguments; override via model later if needed
};

export function create<Name>Component() {
  return {
    name: COMPONENT_NAME,
    template: COMPONENT_TEMPLATE,
    data: <name>Data,
  };
}
```

**Key principles:**
- Import `config` for hosts (`APP_HOST`, `CDN_HOST`)
- Import `getImgCdnUrl` from `helpers/imgCdn.js` for image URLs
- Define `COMPONENT_NAME` (camelCase) and `COMPONENT_TEMPLATE` (with `comp_` prefix)
- Create a **data object** with all content hardcoded
- Export a factory function `createXComponent()` that returns `{ name, template, data }`

**Example (hero as global component):**

```js
import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_HOST = config.appHost || '';
const CDN_HOST = config.cdnHost || '';

const COMPONENT_NAME = 'hero';
const COMPONENT_TEMPLATE = 'comp_hero';

const heroData = {
  image: {
    src: getImgCdnUrl(CDN_HOST, 'welcome/point0.jpeg'),
    alt: 'Welcome Hero',
    loading: 'eager',
  },
  title: 'Pure UI',
  subtitle: 'client-side rendering framework.',
  desc: 'Pure UI is a lightweight UI framework...',
};

export function createHeroComponent() {
  return {
    name: COMPONENT_NAME,
    template: COMPONENT_TEMPLATE,
    data: heroData,
  };
}
```

### #3A Create template file `server/ejs/comp_<name>.ejs`

**Location:** `server/ejs/comp_<name>.ejs`

**Structure:**

```ejs
<%_ if (<propName>) { _%>
<!-- Component markup here -->
<!-- Use <%= <propName>.field %> for values -->
<!-- Use <%_ for (var i = 0; i < <propName>.items.length; i++) { _%> for loops -->
<%_ } _%>
```

**Key principles:**
- Guard with `<%_ if (<propName>) { _%> ... <%_ } _%>` (prop name = component name in camelCase)
- Output values with `<%= <propName>.field %>`
- Loops with `<%_ for (var i = 0; i < <propName>.items.length; i++) { _%> ... <%_ } _%>`
- Keep markup minimal; all copy and structure come from the `.js` data

**Example:**

```ejs
<%_ if (hero) { _%>
<section class="section-hero animation">
  <div class="picture">
    <img src="<%= hero.image.src %>" alt="<%= hero.image.alt %>" loading="<%= hero.image.loading %>">
  </div>
  <div class="content">
    <h1><strong><%= hero.title %></strong></h1>
    <p class="f5 major">
      <strong class="title"><%= hero.subtitle %></strong>
    </p>
    <p class="desc"><%= hero.desc %></p>
  </div>
</section>
<%_ } _%>
```

## Pattern B – Page section component (EJS-only, used by dynamic pages)

Use this when you are building **page sections** for the dynamic page system (hero, scrollview, points, gallery, timeline, or new sections).

- Section data lives in `data/page/<page>.js` (and in the CMS `pages.data` JSON).
- Each section object has a `template` key (e.g. `'comp_hero'`) that maps via `data/page/comp_template.js`.
- `server/ejs/page.ejs` includes the template with a **`section`** variable and helpers `{ section, getHref, getSrc }`.

### #2B Register template name

- **File**: `data/page/comp_template.js`
- Add a key → template name mapping:

```js
export const template = {
  hero: 'comp_hero',
  scrollview: 'comp_scrollview',
  points: 'comp_points',
  gallery: 'comp_gallery',
  timeline: 'comp_timeline',
  // newName: 'comp_new-name',
};
```

- Page section data (`data/page/index.js`, `data/page/ai-trend.js`, etc.) should set:

```js
{
  template: template.points,
  heading: '...',
  // other fields...
}
```

### #3B Create section template file `server/ejs/comp_<name>.ejs`

**Location:** `server/ejs/comp_<name>.ejs`

**Contract:**

- Receives:
  - `section` – section data object from page (`data/page/*.js` / CMS)
  - `getHref`, `getSrc` – helper functions passed from the main layout

**Structure:**

```ejs
<%_ if (section) { _%>
<!-- Component markup here -->
<!-- Use <%= section.field %> for values -->
<!-- Use <%_ for (var i = 0; i < section.items.length; i++) { _%> for loops -->
<%_ } _%>
```

**Example (hero section):**

```ejs
<%_ if (section) { _%>
<section class="section-hero animation">
  <div class="picture">
    <img src="<%= getSrc(section.image) %>" alt="<%= section.image.alt %>" loading="<%= section.image.loading %>">
  </div>
  <div class="content">
    <h1><strong><%= section.title %></strong></h1>
    <p class="f5 major">
      <strong class="title"><%= section.subtitle %></strong>
    </p>
    <p class="desc"><%= section.desc %></p>
  </div>
</section>
<%_ } _%>
```

**Example (points section):**

```ejs
<%_ if (section) { _%>
  <section class="section section-points animation">
    <div class="fixed fixed-max-xs large">
      <h2 class="f3 text-bold m-b-2"><%= section.heading %></h2>
      <div><%= section.intro %></div>
    </div>
    <ul class="fixed fixed-max-sm">
      <%_ if (section.items && section.items.length) { _%>
        <%_ for (var i = 0; i < section.items.length; i++) { _%>
          <%_ const item = section.items[i]; _%>
          <li>
            <div>
              <h3 class="f4 text-bold"><%= item.title %></h3>
              <p><%= item.body %></p>
              <%_ if (item.ctaText) { _%>
                <a href="<%= getHref(item) %>" class="btn regular"><%= item.ctaText %></a>
              <%_ } _%>
            </div>
            <%_ if (item.image) { _%>
              <img src="<%= getSrc(item.image) %>" alt="<%= item.image.alt %>" loading="<%= item.image.loading %>">
            <%_ } _%>
          </li>
        <%_ } _%>
      <%_ } _%>
    </ul>
  </section>
<%_ } _%>
```

### #4 Create component from partial HTML

When you have HTML markup that should be reusable, convert it to a server EJS component.

**Step 1: Extract the HTML**

Take the HTML block you want to componentize. For example:

```html
<section class="section-hero animation">
  <div class="picture">
    <img src="../../assets/images/welcome/point0.jpeg" alt="Welcome Hero" loading="eager">
  </div>
  <div class="content">
    <h1><strong>Pure UI</strong></h1>
    <p class="desc">Pure UI is a lightweight UI framework...</p>
  </div>
</section>
```

**Step 2: Identify dynamic content**

Extract all dynamic values (text, links, image paths, etc.) into the data object:
- Text content → strings in data
- Image paths → use `getImgCdnUrl(CDN_HOST, 'path/to/image.jpeg')`
- Links → use `APP_HOST` for internal links
- Lists/arrays → arrays in data

**Step 3: Create data file**

Follow #2 above to create `comp_<name>.js` with extracted data.

**Step 4: Create template file**

Follow #3 above to create `comp_<name>.ejs` replacing dynamic values with EJS expressions.

### #5 Add and use images

**Step 1: Place images in `client/assets/images/`**

Organize images by folder (e.g. `welcome/`, `bg/`). Example:
- `client/assets/images/welcome/point0.jpeg`
- `client/assets/images/bg/01.jpeg`

**Step 2: Webpack automatically copies images**

Webpack (via `CopyWebpackPlugin`) copies all images from `client/assets/images/` to `dist/images/` preserving folder structure:
- `client/assets/images/welcome/point0.jpeg` → `dist/images/welcome/point0.jpeg`

**Step 3: Use CDN URL helper in components**

In server EJS components, use `helpers/imgCdn.js`:

```js
import { getImgCdnUrl } from '../../helpers/imgCdn.js';
import config from '../config.js';

const CDN_HOST = config.cdnHost || '';

// Use custom path relative to assets/images
const imageSrc = getImgCdnUrl(CDN_HOST, 'welcome/point0.jpeg');
// Returns: ${CDN_HOST}/images/welcome/point0.jpeg
```

**Step 4: Use in component data**

```js
const componentData = {
  image: {
    src: getImgCdnUrl(CDN_HOST, 'welcome/point0.jpeg'),
    alt: 'Description',
    loading: 'lazy',
  },
};
```

**Image URL format:**
- **Source**: `client/assets/images/welcome/point0.jpeg`
- **Built output**: `dist/images/welcome/point0.jpeg`
- **CDN URL**: `${cdnHost}/images/welcome/point0.jpeg`

**Note**: Webpack's image rule preserves folder structure, so paths relative to `assets/images` are maintained in `dist/images/`.

### #6 Use components in a page

There are two usage patterns that match Pattern A and Pattern B above.

#### 6.1 Global components (header/footer) – Pattern A

**In page config (`server/configs/<page>.js`):**

```js
import { createHeaderComponent } from '../ejs/comp_header.js';
import { createFooterComponent } from '../ejs/comp_footer.js';

export default {
  name: '<pageName>',
  get: async function () {
    const headerComponent = createHeaderComponent();
    const footerComponent = createFooterComponent();
    return {
      headerComponent,
      footerComponent,
    };
  },
};
```

**In EJS view (`server/ejs/<page>.ejs`):**

```ejs
<%_ const headerComponent = data.headerComponent; _%>
<%_ if (headerComponent) { _%>
  <%- include(headerComponent.template, { header: headerComponent.data, getHref, getSrc }) %>
<%_ } _%>

<!-- page body -->

<%_ const footerComponent = data.footerComponent; _%>
<%_ if (footerComponent) { _%>
  <%- include(footerComponent.template, { footer: footerComponent.data, getHref, getSrc }) %>
<%_ } _%>
```

#### 6.2 Page sections (hero/points/…) – Pattern B

Dynamic pages use **section data** + **template mapping** instead of per-component JS factories.

- Section data comes from `data/page/<page>.js` (and CMS).
- `server/configs/page.js` loads the sections and passes them to `server/ejs/page.ejs`.

In `page.ejs`, sections are rendered like this:

```ejs
<%_ if (data.sections && data.sections.length) { _%>
  <%_ for (var i = 0; i < data.sections.length; i++) { _%>
    <%_ const section = data.sections[i]; _%>
    <%_ if (section) { _%>
      <%- include(section.template, { section, getHref, getSrc }) %>
    <%_ } _%>
  <%_ } _%>
<%_ } _%>
```

## Checklist

- [ ] #1 Component name decided (camelCase, e.g. `hero`, `timeline`)
- [ ] #2A (Global comp) `server/ejs/comp_<name>.js` created with:
  - `COMPONENT_NAME` and `COMPONENT_TEMPLATE` constants
  - Data object with all content
  - `createXComponent()` factory function
- [ ] #2B (Page section) `data/page/comp_template.js` updated with new mapping
- [ ] #3A/3B `server/ejs/comp_<name>.ejs` created with:
  - Guard `<%_ if (section) { _%>` (for page sections) or `<%_ if (<propName>) { _%>` (for global comps)
  - EJS expressions for dynamic values
  - Loops for arrays/lists
- [ ] #4 (If converting HTML) HTML extracted, dynamic content identified, data and template created
- [ ] #5 (If using images) Images placed in `client/assets/images/`, using `getImgCdnUrl()` in component data or referenced via `getSrc()` in templates
- [ ] #6 Component wired into page config and EJS view (Pattern A or Pattern B)

## Reference files

- **Global component examples**: `server/ejs/comp_header.js`, `server/ejs/comp_header.ejs`, `server/ejs/comp_footer.js`, `server/ejs/comp_footer.ejs`
- **Page section templates**: `server/ejs/comp_hero.ejs`, `comp_scrollview.ejs`, `comp_points.ejs`, `comp_gallery.ejs`, `comp_timeline.ejs`
- **Section → template mapping**: `data/page/comp_template.js`
- **Page data examples**: `data/page/index.js`, `data/page/ai-trend.js`, `data/page/human.js`
- **Dynamic page config**: `server/configs/page.js`
- **Dynamic page view**: `server/ejs/page.ejs` (shows section looping and template includes)
- **Image CDN helper**: `helpers/imgCdn.js` (`getImgCdnUrl()` function)
- **Config**: `server/config.js` (for `appHost`, `cdnHost`)
