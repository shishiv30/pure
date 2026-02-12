---
name: change-page-theme
description: Changes page themes by updating CSS custom properties for hue, saturation, and lightness. Themes are loaded from local data files and can be overridden per-page. Automatically handles dark mode with proper lightness values.
---

# Change Page Theme

This skill guides you through changing page themes by updating CSS custom properties. Themes are managed via local data files and can be overridden per-page.

## Overview

The theme system uses CSS custom properties (variables) that can be overridden to customize colors, lightness, and saturation. Themes are automatically loaded from `data/theme.js` file or can be overridden per-page.

**Theme Structure:**
```javascript
{
  default: {
    // CSS variables for default/light theme
    '--color-major-hue': '200',
    '--color-major-saturation': '85%',
    '--color-major-lightness': '25%',
    // ... more variables
  },
  dark: {
    // CSS variables for dark theme
    '--color-glb-bg-lightness': '8%',
    '--color-glb-lightness': '92%',
    // ... more variables
  }
}
```

## Dark Mode Lightness Rules

When updating dark mode values, follow these guidelines:

| Type | Lightness Value | Description |
|------|----------------|-------------|
| **Background (`bg`)** | ~75% | Main background color |
| **Background Level 1 (`bg-l1`)** | ~55% | Darker background variant |
| **Color/Text (`color` or `front`)** | ~95% | Main text/foreground color |
| **Color Level 1 (`color-l1`)** | ~100% | Lighter text variant |

## Method 1: Update Global Theme

### Edit Theme Data File

Edit `data/theme.js`:

```javascript
export default {
  default: {
    '--color-major-hue': '200',           // Change hue (0-360)
    '--color-major-saturation': '85%',    // Change saturation (0-100%)
    '--color-major-lightness': '25%',     // Change lightness (0-100%)
    '--color-major-lightness-l1': '96%',  // Lighter variant
  },
  dark: {
    '--color-glb-bg-lightness': '75%',    // Background (follow dark mode rules)
    '--color-glb-bg-l1-lightness': '55%', // Background l1
    '--color-glb-lightness': '95%',       // Text color
    '--color-glb-l1-lightness': '100%',   // Text color l1
    '--color-major-lightness': '75%',
    '--color-major-lightness-l1': '15%',
  },
};
```

**That's it!** The theme component automatically loads from `data/theme.js` on every page render. Just restart your server after making changes.

## Method 2: Override Theme Per Page

### In Page Config (`server/configs/<page>.js`)

Add a `theme` property to the model returned by the `get` function:

```javascript
export default {
  name: 'demo',
  get: async function (payload) {
    // ... other code ...
    
    return {
      // ... other data ...
      data: {
        theme: {
          default: {
            '--color-major-hue': '200',        // Override hue
            '--color-major-saturation': '85%', // Override saturation
            '--color-major-lightness': '25%',  // Override lightness
          },
          dark: {
            '--color-glb-bg-lightness': '75%',
            '--color-glb-lightness': '95%',
            '--color-major-lightness': '75%',
          },
        },
      },
    };
  },
};
```

**Note:** Page-specific theme overrides take precedence over the global theme from `data/theme.js`. If `model.data.theme` is provided, it will be used instead of the default theme file.

## Available CSS Variables

### Color Variables

**Major Color:**
- `--color-major-hue` - Hue value (0-360)
- `--color-major-saturation` - Saturation (0-100%)
- `--color-major-lightness` - Lightness (0-100%)
- `--color-major-lightness-l1` - Lighter variant

**Minor, Safe, Danger, Tip Colors:**
- `--color-minor-hue`, `--color-safe-hue`, `--color-danger-hue`, `--color-tip-hue`
- `--color-minor-lightness`, `--color-safe-lightness`, etc.
- `--color-minor-lightness-l1`, etc.

### Global Variables

**Background:**
- `--color-glb-bg-lightness` - Background lightness
- `--color-bg-default-lightness` - Default background lightness
- `--color-bg-default-l1-lightness` - Background level 1 lightness

**Text/Foreground:**
- `--color-glb-lightness` - Text lightness
- `--color-default-lightness` - Default text lightness
- `--color-default-l1-lightness` - Text level 1 lightness

### Color Scale (0-9)

- `--color-0-lightness` through `--color-9-lightness` - Color scale lightness values

### Logo Variables

- `--logo` - Logo image URL (use `url("/assets/images/...")` format, automatically converted to CDN)
- `--logo-bg` - Background logo image URL (for dark backgrounds)
- `--logo-size` - Logo width (calculated based on image aspect ratio)

**Logo Size Calculation:**

Logo size is calculated proportionally based on the image's aspect ratio:

- **Square (1:1)**: `56px`
- **Landscape (2:1)**: `112px`
- **Portrait (1:2)**: `35px`

For other ratios, size is interpolated linearly:
- **Landscape (ratio > 1)**: `56px + (112px - 56px) × ((ratio - 1.0) / (2.0 - 1.0))`
- **Portrait (ratio < 1)**: `35px + (56px - 35px) × ((ratio - 0.5) / (1.0 - 0.5))`

**Examples:**
- Logo 22×15 (ratio 1.47:1) → `82px`
- Logo 1:1 (square) → `56px`
- Logo 2:1 (landscape) → `112px`
- Logo 1:2 (portrait) → `35px`

**Note:** Logo paths should use `/assets/images/` format. The theme system automatically converts them to `cdnUrl + '/images/'` when generating CSS.

## Examples

### Example 1: Change to Blue Theme

```javascript
// In data/theme.js or page config
theme: {
  default: {
    '--color-major-hue': '200',        // Blue hue
    '--color-major-saturation': '85%',
    '--color-major-lightness': '25%',
  },
  dark: {
    '--color-glb-bg-lightness': '75%',
    '--color-glb-lightness': '95%',
  },
}
```

### Example 2: Change to Red Theme

```javascript
// In data/theme.js
export default {
  default: {
    '--color-major-hue': '4',          // Red hue
    '--color-major-saturation': '100%',
    '--color-major-lightness': '30%',
    '--color-major-lightness-l1': '96%',
  },
  dark: {
    '--color-glb-bg-lightness': '75%',
    '--color-glb-lightness': '95%',
    '--color-major-lightness': '75%',
  },
};
```

### Example 3: Green Theme with Custom Logos

```javascript
// In data/theme.js
// Logo: 22×15 (ratio 1.47:1) → calculated size: 82px
export default {
  default: {
    '--color-major-hue': '140',        // Green hue
    '--color-major-saturation': '85%',
    '--color-major-lightness': '25%',
    '--color-major-lightness-l1': '96%',
    '--logo': 'url("/assets/images/movoto-lower-logo-m.svg")',
    '--logo-bg': 'url("/assets/images/movoto-lower-logo-m-white.svg")',
    '--logo-size': '82px',  // Calculated: 56px + (112px - 56px) × ((1.47 - 1.0) / (2.0 - 1.0)) = 82px
  },
  dark: {
    '--color-glb-bg-lightness': '75%',
    '--color-glb-bg-l1-lightness': '55%',
    '--color-glb-lightness': '95%',
    '--color-glb-l1-lightness': '100%',
    '--color-major-lightness': '75%',
    '--color-major-lightness-l1': '15%',
    '--logo': 'url("/assets/images/movoto-lower-logo-m-white.svg")',
  },
};
```

**Logo Size Calculation:**
- Check image dimensions (e.g., `22×15` from SVG `viewBox` or `width`/`height` attributes)
- Calculate ratio: `width / height` (e.g., `22 / 15 = 1.47`)
- Apply interpolation formula based on ratio:
  - Square (1:1) = 56px
  - Landscape (2:1) = 112px
  - Portrait (1:2) = 35px
  - Other ratios: interpolate between reference points

### Example 4: Customize Dark Mode Only

```javascript
theme: {
  dark: {
    '--color-glb-bg-lightness': '70%',      // Slightly lighter bg
    '--color-glb-bg-l1-lightness': '50%',   // Darker bg variant
    '--color-glb-lightness': '98%',          // Brighter text
    '--color-glb-l1-lightness': '100%',     // Brightest text
  },
}
```

## How It Works

1. **Theme CSS Generator** (`server/ejs/comp_theme.js`):
   - Imports theme data from `data/theme.js` file
   - `getThemeInlineCss(themeOverride, cdnUrl)` function converts theme object to inline CSS
   - Automatically processes image paths: `/assets/images/` → `cdnUrl + '/images/'`
   - Supports override via `themeOverride` parameter
   - Accepts `cdnUrl` parameter to prepend CDN URL to image paths

2. **BaseController** (`server/controllers/basecontroller.js`):
   - Automatically generates theme CSS on every page render in `toPage()` method
   - Uses `model.data.theme` as override if provided
   - Falls back to `data/theme.js` if no override
   - Passes `model.meta.cdnUrl` to theme CSS generator
   - Stores generated CSS in `model.meta.inlineCss`

3. **Template** (`server/ejs/html_above.ejs`):
   - Outputs `meta.inlineCss` directly in `<head>` section as inline `<style>` block
   - No component approach - just direct CSS injection

4. **CSS Generation** (`getThemeInlineCss` function):
   - `default` properties → `body { ... }` CSS rules
   - `dark` properties → `body.theme-dark { ... }` CSS rules
   - Image paths in theme data are automatically converted to use CDN URL

## Workflow Checklist

### For Global Theme Changes:
- [ ] Edit `data/theme.js` with new theme values
- [ ] Restart server to load new theme
- [ ] Verify theme loads correctly on pages

### For Page-Specific Theme:
- [ ] Open page config file (`server/configs/<page>.js`)
- [ ] Add `theme` property to model returned by `get` function
- [ ] Follow dark mode lightness rules for `dark` properties
- [ ] Test page to verify theme override works

### For Dark Mode Updates:
- [ ] Set background lightness to ~75%
- [ ] Set background-l1 lightness to ~55%
- [ ] Set text/color lightness to ~95%
- [ ] Set color-l1 lightness to ~100%

## Logo Configuration

Logo paths in theme data use `/assets/images/` format, which are automatically converted to use CDN URL:

```javascript
export default {
  default: {
    '--logo': 'url("/assets/images/movoto-lower-logo.svg")',
    '--logo-bg': 'url("/assets/images/movoto-lower-logo-white.svg")',
    '--logo-size': '120px',
  },
  dark: {
    '--logo': 'url("/assets/images/movoto-lower-logo-white.svg")',
  },
};
```

The `getThemeInlineCss()` function automatically converts `/assets/images/` to `cdnUrl + '/images/'` when generating CSS. If no CDN URL is configured, it uses `/images/` as fallback.

## Reference Files

- **Theme CSS Generator**: `server/ejs/comp_theme.js` (contains `getThemeInlineCss()` function)
- **Theme Data**: `data/theme.js` (local data file, same structure as `data/footer.js`)
- **Base Controller**: `server/controllers/basecontroller.js` (generates theme CSS in `toPage()` method)
- **HTML Template**: `server/ejs/html_above.ejs` (outputs `meta.inlineCss` as inline style)
- **Default Theme SCSS**: `client/scss/_theme.default.scss` (fallback defaults, overridden by theme.js)

## Notes

- Theme data is stored in `data/theme.js` (local file, no CMS dependency)
- Theme changes are applied globally unless overridden per-page via `model.data.theme`
- Dark mode automatically applies when `body.theme-dark` class is present
- CSS custom properties cascade, so you only need to override what you want to change
- Hue values are in HSL color space (0-360)
- Lightness and saturation values are percentages (0-100%)
- Always follow dark mode lightness rules for consistent appearance
- Logo paths use `/assets/images/` format and are automatically converted to use CDN URL
- The `getThemeInlineCss()` function accepts `cdnUrl` parameter to prepend CDN URL to image paths
- Generated CSS is stored in `model.meta.inlineCss` and output directly in the HTML template
- Theme CSS is generated server-side and injected as inline `<style>` block in `<head>`
