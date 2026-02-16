---
name: create-comp
description: Creates reusable server EJS components in the pure project. Use when the user wants to create a component, convert HTML to a component, build comp_* files, or create reusable UI sections. Follows the comp_header pattern with .js data file and .ejs template.
---

# Create Server EJS Component

Follow this workflow to create reusable server-rendered components (e.g. `comp_hero`, `comp_timeline`, `comp_gallery`). Components consist of a `.js` file (data + factory) and an `.ejs` file (markup template).

## Workflow

### #1 Component name (from requirement)

- Derive a **single component name** (e.g. `hero`, `timeline`, `gallery`, `points`).
- Use camelCase. This name is used as:
  - `COMPONENT_NAME` constant
  - `COMPONENT_TEMPLATE` (prefixed with `comp_`, e.g. `'comp_hero'`)
  - Function name `createXComponent()` (e.g. `createHeroComponent()`)
  - EJS prop name (camelCase, e.g. `hero`, `timeline`)

### #2 Create data file `server/ejs/comp_<name>.js`

**Location:** `server/ejs/comp_<name>.js`

**Structure:**

```js
import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_URL = config.appUrl || '';
const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

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
- Import `config` for URLs (`APP_URL`, `CDN_URL`)
- Import `getImgCdnUrl` from `helpers/imgCdn.js` for image URLs
- Define `COMPONENT_NAME` (camelCase) and `COMPONENT_TEMPLATE` (with `comp_` prefix)
- Create a **data object** with all content hardcoded
- Export a factory function `createXComponent()` that returns `{ name, template, data }`

**Example:**

```js
import config from '../config.js';
import { getImgCdnUrl } from '../../helpers/imgCdn.js';

const APP_URL = config.appUrl || '';
const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

const COMPONENT_NAME = 'hero';
const COMPONENT_TEMPLATE = 'comp_hero';

const heroData = {
  image: {
    src: getImgCdnUrl(CDN_URL, 'welcome/point0.jpeg'),
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

### #3 Create template file `server/ejs/comp_<name>.ejs`

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
- Image paths → use `getImgCdnUrl(CDN_URL, 'path/to/image.jpeg')`
- Links → use `APP_URL` for internal links
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

const CDN_URL = (config.cdnUrl || '').replace(/\/$/, '');

// Use custom path relative to assets/images
const imageSrc = getImgCdnUrl(CDN_URL, 'welcome/point0.jpeg');
// Returns: ${CDN_URL}/images/welcome/point0.jpeg
```

**Step 4: Use in component data**

```js
const componentData = {
  image: {
    src: getImgCdnUrl(CDN_URL, 'welcome/point0.jpeg'),
    alt: 'Description',
    loading: 'lazy',
  },
};
```

**Image URL format:**
- **Source**: `client/assets/images/welcome/point0.jpeg`
- **Built output**: `dist/images/welcome/point0.jpeg`
- **CDN URL**: `${cdnUrl}/images/welcome/point0.jpeg`

**Note**: Webpack's image rule preserves folder structure, so paths relative to `assets/images` are maintained in `dist/images/`.

### #6 Use component in a page

**In page config (`server/configs/<page>.js`):**

```js
import { createHeroComponent } from '../ejs/comp_hero.js';

export default {
  name: '<pageName>',
  get: async function () {
    const heroComponent = createHeroComponent();
    return {
      heroComponent,
      // Other components or data
    };
  },
};
```

**In EJS view (`server/ejs/<page>.ejs`):**

```ejs
<%_ const heroComponent = data.heroComponent; _%>
<%_ if (heroComponent) { _%>
  <%- include(heroComponent.template, { hero: heroComponent.data }) %>
<%_ } _%>
```

**For multiple sections (loop rendering):**

In page config, return a `sections` array:

```js
const sections = [
  heroComponent,
  scrollviewComponent,
  pointsComponent,
  galleryComponent,
  timelineComponent,
];

return {
  headerComponent,
  footerComponent,
  sections,
};
```

In EJS template, loop through sections:

```ejs
<%_ if (data.sections && data.sections.length) { _%>
  <%_ for (var i = 0; i < data.sections.length; i++) { _%>
    <%_ const section = data.sections[i]; _%>
    <%_ if (section) { _%>
      <%_ const propName = section.name; _%>
      <%_ const propData = {}; _%>
      <%_ propData[propName] = section.data; _%>
      <%- include(section.template, propData) %>\
    <%_ } _%>
  <%_ } _%>
<%_ } _%>
```

## Checklist

- [ ] #1 Component name decided (camelCase, e.g. `hero`, `timeline`)
- [ ] #2 `server/ejs/comp_<name>.js` created with:
  - `COMPONENT_NAME` and `COMPONENT_TEMPLATE` constants
  - Data object with all content
  - `createXComponent()` factory function
- [ ] #3 `server/ejs/comp_<name>.ejs` created with:
  - Guard `<%_ if (<propName>) { _%>`
  - EJS expressions for dynamic values
  - Loops for arrays/lists
- [ ] #4 (If converting HTML) HTML extracted, dynamic content identified, data and template created
- [ ] #5 (If using images) Images placed in `client/assets/images/`, using `getImgCdnUrl()` in component data
- [ ] #6 Component imported and used in page config and EJS view

## Reference files

- **Component examples**: `server/ejs/comp_header.js`, `comp_header.ejs`, `comp_hero.js`, `comp_hero.ejs`, `comp_points.js`, `comp_points.ejs`, `comp_gallery.js`, `comp_gallery.ejs`, `comp_scrollview.js`, `comp_scrollview.ejs`, `comp_timeline.js`, `comp_timeline.ejs`
- **Image CDN helper**: `helpers/imgCdn.js` (`getImgCdnUrl()` function)
- **Config**: `server/config.js` (for `appUrl`, `cdnUrl`)
- **Page config examples**: `server/configs/page/index.js` (shows component usage and sections array)
- **EJS template examples**: `server/ejs/index.ejs` (shows component includes and section looping)
