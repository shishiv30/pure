# Pure UI Framework: Automated Page Migration & Updates

## Table of Contents

1. [Project Overview](#project-overview)
2. [Automated Component Creation](#automated-component-creation)
3. [Automated Page Creation](#automated-page-creation)
4. [Automated Theme Switching](#automated-theme-switching)
5. [Migration Workflow](#migration-workflow)
6. [Case Studies](#case-studies)
7. [Summary](#summary)

---

## Project Overview

### Pure UI Framework

- **Lightweight client-side rendering framework**
- **Server-side EJS component system**
- **Automated toolchain support**

### Core Challenges

- Traditional page migration: **Manual, repetitive, error-prone**
- Component reuse difficulties
- Complex theme switching
- High maintenance costs

### Solution

Efficient migration through **three automation mechanisms**:

1. ✅ **Automated Component Creation**
2. ✅ **Automated Page Creation**
3. ✅ **Automated Theme Switching**

---

## Automated Component Creation

### Traditional Approach vs Automated Approach

#### ❌ Traditional Approach
```html
<!-- Repeated in every page -->
<section class="section-hero">
  <div class="picture">
    <img src="../../assets/images/welcome/point0.jpeg" alt="Hero">
  </div>
  <div class="content">
    <h1><strong>Pure UI</strong></h1>
    <p class="desc">Pure UI is a lightweight...</p>
  </div>
</section>
```

#### ✅ Automated Approach
```js
// 1. Create component data file (comp_hero.js)
export function createHeroComponent() {
  return {
    name: 'hero',
    template: 'comp_hero',
    data: { title: 'Pure UI', desc: '...' }
  };
}

// 2. Create component template (comp_hero.ejs)
<%_ if (hero) { _%>
<section class="section-hero">
  <h1><%= hero.title %></h1>
  <p><%= hero.desc %></p>
</section>
<%_ } _%>

// 3. Use in page
const heroComponent = createHeroComponent();
```

### Component Creation Workflow

```
Requirement Analysis
    ↓
Determine Component Name (camelCase)
    ↓
Create Data File (comp_<name>.js)
    ├─ Define COMPONENT_NAME
    ├─ Define COMPONENT_TEMPLATE
    ├─ Create Data Object
    └─ Export Factory Function
    ↓
Create Template File (comp_<name>.ejs)
    ├─ Conditional Render Guard
    ├─ EJS Expressions
    └─ Loop Processing
    ↓
Use in Page Config
    └─ Import and Call createXComponent()
```

### Standardized Component Structure

```js
// server/ejs/comp_hero.js
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
  subtitle: 'Client-side rendering framework',
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

### Component Benefits

- ✅ **Create once, reuse everywhere**
- ✅ **Separation of data and view**
- ✅ **Easy maintenance and updates**
- ✅ **CMS dynamic loading support**
- ✅ **Type-safe data structure**

---

## Automated Page Creation

### Page Creation Workflow

```
Determine Page Name
    ↓
Update Webpack Config
    └─ webpack.config.base.page.js
    ↓
Create Page File Structure
    ├─ client/pages/<name>/index.html
    ├─ client/pages/<name>/index.js
    └─ (Optional) Server EJS Template
    ↓
Update Navigation Links
    ├─ server/ejs/comp_header.js
    └─ client/components/header.html
    ↓
Page Complete ✅
```

### Webpack Configuration Automation

```js
// webpack.config.base.page.js
{
  name: 'about',        // Auto-generate entry, template, filename
  static: true,         // Static page marker
}
// Auto-configured:
// - entry: client/pages/about/index.js
// - template: client/pages/about/index.html
// - filename: about.html
```

### Page File Structure

```
client/pages/about/
├── index.html          # Page HTML (includes header/footer includes)
└── index.js            # Page entry (imports main and scss)
```

### Server-Side Page Creation

```js
// server/configs/aboutPage.js
export default {
  name: 'about',
  seo: function() {
    return {
      title: 'About Us',
      desc: 'Learn about our company',
      keywords: '',
    };
  },
  get: async function() {
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

### Page Creation Benefits

- ✅ **Standardized process reduces errors**
- ✅ **Automatic Webpack configuration**
- ✅ **Automatic navigation updates**
- ✅ **Supports static and dynamic pages**
- ✅ **Rapid prototyping**

---

## Automated Theme Switching

### Theme System Architecture

```
data/theme.js (Global Theme)
    ↓
BaseController (Server-Side)
    ├─ Read Theme Data
    ├─ Generate CSS Variables
    └─ Inject into <head>
    ↓
CSS Custom Properties
    ├─ --color-major-hue
    ├─ --color-major-saturation
    └─ --color-major-lightness
    ↓
Page Automatically Applies Theme
```

### Theme Data Structure

```js
// data/theme.js
export default {
  default: {
    '--color-major-hue': '140',           // Hue (0-360)
    '--color-major-saturation': '85%',    // Saturation
    '--color-major-lightness': '25%',     // Lightness
    '--logo': 'url("/assets/images/logo.svg")',
  },
  dark: {
    '--color-glb-bg-lightness': '75%',    // Dark background
    '--color-glb-lightness': '95%',       // Dark text
  },
};
```

### Page-Level Theme Override

```js
// server/configs/demoPage.js
export default {
  name: 'demo',
  get: async function() {
    return {
      data: {
        theme: {
          default: {
            '--color-major-hue': '200',  // Override global theme
            '--color-major-saturation': '85%',
            '--color-major-lightness': '25%',
          },
          dark: {
            '--color-glb-bg-lightness': '75%',
            '--color-glb-lightness': '95%',
          },
        },
      },
    };
  },
};
```

### Theme Switching Benefits

- ✅ **Centralized global management**
- ✅ **Flexible page-level overrides**
- ✅ **Automatic dark mode support**
- ✅ **No CSS file modifications needed**
- ✅ **Real-time preview and switching**

---

## Migration Workflow

### Complete Migration Process

```
Analyze Old Page
    ├─ Extract HTML Structure
    ├─ Identify Dynamic Content
    └─ Determine Component Boundaries
    ↓
Create Reusable Components
    ├─ Use create-comp skill
    ├─ Extract data to comp_*.js
    └─ Create template comp_*.ejs
    ↓
Create New Page
    ├─ Use create-static-page skill
    ├─ Configure Webpack
    └─ Update Navigation Links
    ↓
Apply Theme
    ├─ Update data/theme.js
    └─ (Optional) Page-level override
    ↓
Test and Optimize
    └─ Verify Functionality
    ↓
Migration Complete ✅
```

### Before & After Comparison

#### Before Migration
- ❌ Repeated HTML code
- ❌ Hard-coded styles
- ❌ Difficult theme switching
- ❌ High maintenance costs

#### After Migration
- ✅ Componentized architecture
- ✅ Data-driven approach
- ✅ Centralized theme management
- ✅ Easy maintenance and extension

---

## Case Studies

### Case Study 1: Hero Component Migration

**Original HTML:**
```html
<section class="section-hero">
  <div class="picture">
    <img src="../../assets/images/welcome/point0.jpeg" alt="Hero">
  </div>
  <div class="content">
    <h1><strong>Pure UI</strong></h1>
    <p>Client-side rendering framework</p>
  </div>
</section>
```

**Migrated to Component:**
```js
// comp_hero.js - Data Layer
const heroData = {
  image: { src: getImgCdnUrl(CDN_URL, 'welcome/point0.jpeg') },
  title: 'Pure UI',
  subtitle: 'Client-side rendering framework',
};

// comp_hero.ejs - View Layer
<%_ if (hero) { _%>
<section class="section-hero">
  <img src="<%= hero.image.src %>" alt="<%= hero.image.alt %>">
  <h1><%= hero.title %></h1>
  <p><%= hero.subtitle %></p>
</section>
<%_ } _%>
```

**Benefits:**
- Data-view separation
- Reusable across multiple pages
- Easy updates and maintenance

### Case Study 2: Multi-Page Theme Switching

**Scenario:** Create pages with different themes for different brands

**Solution:**
```js
// Global Theme (data/theme.js)
export default {
  default: { '--color-major-hue': '140' }, // Green theme
};

// Brand A Page (server/configs/brandAPage.js)
export default {
  get: async function() {
    return {
      data: {
        theme: {
          default: { '--color-major-hue': '200' }, // Blue theme
        },
      },
    };
  },
};

// Brand B Page (server/configs/brandBPage.js)
export default {
  get: async function() {
    return {
      data: {
        theme: {
          default: { '--color-major-hue': '4' }, // Red theme
        },
      },
    };
  },
};
```

**Result:**
- Same component code
- Different theme configurations
- Rapid brand switching

---

## Summary

### Core Value

1. **Efficiency Improvement**
   - Component creation: from **2 hours → 10 minutes**
   - Page creation: from **4 hours → 30 minutes**
   - Theme switching: from **1 hour → 5 minutes**

2. **Quality Assurance**
   - Standardized processes reduce errors
   - Component reuse improves consistency
   - Easier automated testing

3. **Maintainability**
   - Separation of data and view
   - Centralized theme management
   - Clear code structure

### Technical Highlights

- 🎯 **Componentized Architecture**: Reusable server-side EJS components
- 🚀 **Automated Toolchain**: Webpack + custom scripts
- 🎨 **Theme System**: CSS custom properties + data-driven
- 📦 **Standardized Process**: Skill-based development model

### Future Outlook

- More automation tools
- Enhanced CMS integration
- Visual component editor
- AI-assisted code generation

---

## Q&A

**Thank you!**
