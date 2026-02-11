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
};
```

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
- [ ] Test with `data-role` attribute in HTML
