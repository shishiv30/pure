---
name: create-plugin
description: Creates and converts plugins for the pure UI framework. Use when creating new plugins, converting old jQuery-style plugins to the Plugin system, or when working with data-role attributes and plugin initialization.
---

# Creating Plugins for Pure UI

This skill guides you through creating and converting plugins for the pure UI framework's Plugin system.

## Plugin System Overview

Plugins are registered components that initialize on elements with `data-role` attributes. They follow a consistent structure and lifecycle.

### Key Files
- **Plugin Core**: `client/js/core/plugin.js` - Base Plugin class
- **Plugin Registry**: `client/js/plugins/index.js` - Exports all plugins
- **Initialization**: `client/js/core/page.js` - Scans for `[data-role]` and initializes plugins

## Plugin Structure

Every plugin must export a default object with this structure:

```javascript
export default {
	name: 'plugin-name',           // Required: unique identifier
	defaultOpt: {                  // Required: default options
		option1: 'default-value',
		option2: null,
	},
	init: function ($el, opt, exportObj) {
		// Required: initialization logic
		// Creates methods on exportObj
	},
	setOptionsBefore: null,         // Optional: called before options merge
	setOptionsAfter: null,          // Optional: called after options merge
	initBefore: null,               // Optional: called before init
	initAfter: function ($el, opt, exportObj) {
		// Optional: called after init
		// Typically sets up event listeners
	},
	destroyBefore: function ($el, opt, exportObj) {
		// Optional: cleanup before destroy
		// Remove event listeners, clean up DOM
	},
	destroyAfter: null,             // Optional: called after destroy completes
};
```

## Workflow: creating a new plugin

When building a **new** plugin (not just converting an old one), follow this end‑to‑end flow:

1. **Read the requirements carefully**  
   - Clarify what user problem the plugin solves and how it should be used in HTML (`data-role="..."`, expected children, etc.).
   - Check existing plugins first (e.g. `_header.js`, `_collapse.js`, `_autocomplete.js`, `_shifter.js`) and reuse patterns whenever possible.

2. **Create JS + CSS files for the plugin name**  
   - JS: `client/js/plugins/_<name>.js` exporting the standard plugin object shown above.  
   - CSS: `client/scss/_<name>.scss` with a base class matching the plugin name (e.g. `.shifter`, `.tooltip`, `.album`).  
   - Register both:
     - JS: add the plugin to `client/js/plugins/index.js`.
     - CSS: `@forward './_<name>.scss';` in `client/scss/base.scss`.

3. **Design the HTML structure in `client/pages/document/index.html`**  
   - Add a demo section that shows typical usage of the new plugin:
     - A root element with `data-role="<name>"`.
     - Any required nested elements (e.g. a `data-role="scroller"` child for scrolling content).
   - Keep the markup minimal; let the plugin JS create extra DOM (e.g. arrows, overlays) when appropriate rather than hard‑coding everything in HTML.

4. **Design UI status using `defBool` / `defEnum` (if needed)**  
   - For boolean UI states, use `defBool` from `client/js/core/def.js`:
     - Example: `defBool('header-close', $el, opt, exportObj);`
       - Generates methods like `addHeaderClose()`, `removeHeaderClose()`, `toggleHeaderClose()`, `isHeaderClose()`.
       - Toggles a CSS class (`.header-close`) on the element.
   - For enum/multi‑state UI, use `defEnum`:
     - Example: `defEnum('view', ['grid', 'detail', 'map'], $el, opt, exportObj);`
       - Generates methods like `switchToGrid()`, `switchToDetail()`, `switchToMap()` and a `currentView()` getter.
       - Manages classes like `.view-grid`, `.view-detail`, `.view-map`.
   - Follow the pattern used in `client/pages/demo/index.js` and `_header.js`:
     - Define `const boolStatus = [...]` / `const enumStatus = [...]` at the top.
     - Loop them in `init` and call `defBool` / `defEnum` to attach all status methods.

5. **Implement JS: when to switch UI status (if needed)**  
   - Use existing utilities as much as possible:
     - Event helpers: `on`, `off`, `emit`, `trigger` from `client/js/core/event.js`.
     - State helpers: `defBool`, `defEnum` from `client/js/core/def.js`.
     - Scroll/lock helpers: `disableScroll`, `enableScroll` from `client/js/core/scroll.js`.
   - In `init($el, opt, exportObj)`:
     - Create any dynamic DOM needed (e.g. shifter arrows, overlays).
     - Wire event listeners that call the status methods (`add<Status>`, `remove<Status>`, `switchTo<Value>`).
     - Expose a small, meaningful API on `exportObj` (e.g. `show()`, `hide()`, `next()`, `prev()`).
   - Make sure listeners can be cleaned up later (store references on `exportObj` when necessary and remove them in `destroyBefore` if the plugin defines it).

6. **Implement CSS: base + status modifiers (if needed)**  
   - Base class: style the plugin’s default appearance on the root (e.g. `.shifter`, `.tooltip`, `.album`).
   - Status modifiers: add CSS for the classes driven by `defBool` / `defEnum`:
     - Boolean example:  
       - `.header.header-close { transform: translateY(-100%); }`
     - Enum example:  
       - `.view-grid { /* grid layout */ }`  
       - `.view-detail { /* detail layout */ }`
   - Reuse existing utility classes and mixins (`_mixins.scss`, `_circle.scss`, `_utilities.scss`) instead of redefining spacing, typography, or shapes.

7. **Wire the plugin into the system**  
   - Confirm:
     - It’s imported and exported in `client/js/plugins/index.js`.
     - Its SCSS file is forwarded from `client/scss/base.scss`.
     - `client/pages/document/index.html` has a clear demo section.
   - Verify that `client/js/core/page.js` will pick it up via its `data-role` automatically (no extra wiring should be necessary).

8. **Update documentation (`client.md` / `README.md`)**  
   - Add a new section to `client.md` under “Plugins”:
     - Show usage HTML.
     - List data attributes / options.
     - Describe any CSS custom properties (e.g. `--shifter-height`).
     - Document generated UI status methods (from `defBool` / `defEnum`) if they’re meant to be used externally.
   - If the plugin is a major UI element, add or update a short description in `README.md` to reflect its existence and purpose.

## Converting Old Plugins

When converting jQuery-style plugins to the Plugin system:

### 1. Replace jQuery Methods

**Old (jQuery-style):**
```javascript
let $container = $(opt.template);
$container.css('position', 'relative');
$container.show();
let width = $container.outerWidth();
let offset = $this.offset();
```

**New (Native DOM):**
```javascript
const $container = document.createElement('div');
$container.style.position = 'relative';
$container.style.display = 'block';
const width = $container.offsetWidth;
const offset = $container.getBoundingClientRect();
```

### 2. Helper Functions

Create utility functions for common operations:

```javascript
function outerWidth(el) {
	return el.offsetWidth;
}

function outerHeight(el) {
	return el.offsetHeight;
}

function getOffset(el, relativeTo) {
	const elRect = el.getBoundingClientRect();
	if (relativeTo) {
		const parentRect = relativeTo.getBoundingClientRect();
		return {
			top: elRect.top - parentRect.top,
			left: elRect.left - parentRect.left,
		};
	}
	return {
		top: elRect.top + window.pageYOffset,
		left: elRect.left + window.pageXOffset,
	};
}

function setStyles(el, styles) {
	for (const prop in styles) {
		if (styles[prop] === '') {
			el.style.removeProperty(prop);
		} else {
			el.style[prop] = styles[prop];
		}
	}
}
```

### 3. Event Handling

**Old:**
```javascript
$this.on('click.plugin-name', handler);
$this.off('click.plugin-name');
```

**New:**
```javascript
// Store handler reference for cleanup
exportObj._clickHandler = function(e) { /* ... */ };
$this.addEventListener('click', exportObj._clickHandler);
$this.removeEventListener('click', exportObj._clickHandler);
```

### 4. Use Event Utilities

Import from `client/js/core/event.js`:
```javascript
import { trigger } from '../core/event.js';

// Trigger callbacks
opt.beforeShow && trigger(opt.beforeShow, $el, opt, exportObj);
```

## Plugin Registration

### Step 1: Create Plugin File

Create `client/js/plugins/_pluginname.js` following the structure above.

### Step 2: Register in Index

Add to `client/js/plugins/index.js`:

```javascript
import pluginname from './_pluginname.js';

export default {
	// ... other plugins
	pluginname,
};
```

### Step 3: Include CSS (if needed)

If the plugin has styles, add to `client/scss/base.scss`:

```scss
@forward './_pluginname.scss';
```

## Data Attributes

Plugins read options from `data-*` attributes. The Plugin system automatically converts:
- `data-content` → `opt.content`
- `data-placement` → `opt.placement`
- `data-trigger` → `opt.trigger`

Use `setOptionsBefore` to handle special cases:

```javascript
setOptionsBefore: function ($el, opt, exportObj) {
	// Ensure content is read from data-content
	if (opt.content === undefined && $el.dataset.content) {
		opt.content = $el.dataset.content;
	}
},
```

## HTML Usage

Plugins initialize automatically on elements with `data-role`:

```html
<a href="#" data-role="tooltip" 
   data-content="Tooltip text"
   data-placement="top"
   data-trigger="hover">
  Hover me
</a>
```

## Common Patterns

### Pattern 1: Simple Toggle Plugin

```javascript
export default {
	name: 'toggle',
	defaultOpt: {
		shown: false,
	},
	init: function ($el, opt, exportObj) {
		exportObj.show = function () {
			$el.classList.add('shown');
			exportObj.shown = true;
		};
		exportObj.hide = function () {
			$el.classList.remove('shown');
			exportObj.shown = false;
		};
		exportObj.toggle = function () {
			if (exportObj.shown) {
				exportObj.hide();
			} else {
				exportObj.show();
			}
		};
	},
	initAfter: function ($el, opt, exportObj) {
		$el.addEventListener('click', exportObj.toggle);
		if (opt.shown) {
			exportObj.show();
		}
	},
	destroyBefore: function ($el, opt, exportObj) {
		$el.removeEventListener('click', exportObj.toggle);
	},
};
```

### Pattern 2: Plugin with DOM Creation

```javascript
export default {
	name: 'widget',
	defaultOpt: {
		template: '<div class="widget-inner"></div>',
	},
	init: function ($el, opt, exportObj) {
		// Create container
		const $container = document.createElement('div');
		$container.className = 'widget';
		$container.innerHTML = opt.template;
		$el.appendChild($container);
		exportObj.$container = $container;
		
		// Initialize functionality
		exportObj.update = function (content) {
			const inner = $container.querySelector('.widget-inner');
			if (inner) {
				inner.textContent = content;
			}
		};
	},
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj.$container) {
			exportObj.$container.remove();
		}
	},
};
```

### Pattern 3: Plugin with Positioning Logic

```javascript
export default {
	name: 'popover',
	defaultOpt: {
		placement: 'top',
	},
	init: function ($el, opt, exportObj) {
		exportObj.show = function () {
			const $container = exportObj.$container;
			const cWidth = $container.offsetWidth;
			const tWidth = $el.offsetWidth;
			const triggerRect = $el.getBoundingClientRect();
			const wWidth = window.innerWidth;
			
			// Calculate position
			const x = Math.abs(tWidth - cWidth) / 2;
			
			if (x > triggerRect.left) {
				// Align left
				$container.style.left = '0';
				$container.classList.add(`${opt.placement}-left`);
			} else if (triggerRect.left + tWidth + x > wWidth) {
				// Align right
				$container.style.right = '0';
				$container.classList.add(`${opt.placement}-right`);
			} else {
				// Center
				$container.style.left = `${(tWidth - cWidth) / 2}px`;
			}
		};
	},
};
```

## Best Practices

1. **Use native DOM methods** - Avoid jQuery-style helpers
2. **Store element references** - Keep `$container`, `$parent` in `exportObj` for cleanup
3. **Clean up event listeners** - Always remove in `destroyBefore`
4. **Use `trigger` for callbacks** - Don't call `opt.callback()` directly
5. **Handle data attributes** - Use `setOptionsBefore` to read from `dataset`
6. **Measure before showing** - Use `visibility: hidden` during measurement
7. **Follow CSS patterns** - Match CSS class structure (base + modifiers)

## Examples

- **Simple**: `client/js/plugins/_collapse.js` - Toggle visibility
- **Complex**: `client/js/plugins/_album.js` - Image gallery with touch support
- **Converted**: `client/js/plugins/_tooltip.js` - Converted from jQuery-style

## Checklist

When creating a new plugin:

- [ ] Export default object with `name` and `defaultOpt`
- [ ] Implement `init` function
- [ ] Add to `client/js/plugins/index.js`
- [ ] Include CSS in `client/scss/base.scss` (if needed)
- [ ] Handle data attributes in `setOptionsBefore`
- [ ] Set up event listeners in `initAfter`
- [ ] Clean up in `destroyBefore`
- [ ] Add a demo section to `client/pages/document/index.html` using `data-role="<name>"`
- [ ] Document usage / options in `client.md` (and `README.md` if it's a major UI element)
- [ ] Test with `data-role` attribute in HTML
