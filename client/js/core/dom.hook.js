import { Plugin } from './plugin.js';
import { logInfo } from './log.js';
import { emit } from './event.js';

// innerHTML, outerHTML are on Element.prototype; textContent on Node.prototype; innerText on HTMLElement.prototype
const PROP_PROTOTYPES = [
	['innerHTML', Element.prototype],
	['outerHTML', Element.prototype],
	['textContent', Node.prototype],
	['innerText', HTMLElement.prototype],
];

// Debounce only cleanup + dom.updated; apply writes synchronously so DOM updates immediately
let flushScheduled = false;
const updatedElements = new Set();

function scheduleFlush() {
	if (flushScheduled) return;
	flushScheduled = true;
	const run = () => {
		flushScheduled = false;
		if (Plugin.pendingCleanup.size > 0) {
			logInfo(`[DOM Hook] Scheduling cleanup for ${Plugin.pendingCleanup.size} element(s)`);
			Plugin.scheduleCleanup();
		}
		if (updatedElements.size > 0) {
			emit('dom.updated', { elements: Array.from(updatedElements) });
			updatedElements.clear();
		}
	};
	if (typeof requestAnimationFrame !== 'undefined') {
		requestAnimationFrame(run);
	} else {
		setTimeout(run, 0);
	}
}

function collectInstancesForElement(element, prop, namespace) {
	const _name = namespace;
	let found = 0;
	if (element.dataset && element.dataset[_name]) {
		logInfo(`[DOM Hook] Element will be removed via ${prop}:`, {
			element,
			tagName: element.tagName,
			id: element.id,
			className: element.className,
			pids: element.dataset[_name],
			property: prop,
		});
		Plugin.pendingCleanup.add(element);
		found++;
	}
	const children = element.querySelectorAll(`[data-${_name}]`);
	children.forEach((el) => {
		logInfo(`[DOM Hook] Child element will be removed via ${prop}:`, {
			element: el,
			tagName: el.tagName,
			id: el.id,
			className: el.className,
			pids: el.dataset[_name],
			property: prop,
			parent: element.tagName,
		});
		Plugin.pendingCleanup.add(el);
		found++;
	});
	return found;
}

export function installDOMHooks() {
	const namespace = Plugin.namespace;

	PROP_PROTOTYPES.forEach(([prop, prototype]) => {
		const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
		if (descriptor && descriptor.set) {
			const originalSetter = descriptor.set;
			Object.defineProperty(prototype, prop, {
				set: function (value) {
					if (!this.dataset || typeof this.querySelectorAll !== 'function') {
						originalSetter.call(this, value);
						return;
					}
					// Collect instances for cleanup before overwriting (sync)
					collectInstancesForElement(this, prop, namespace);
					updatedElements.add(this);
					// Apply write immediately so DOM updates (e.g. innerHTML += works)
					originalSetter.call(this, value);
					scheduleFlush();
				},
				get: descriptor.get,
				configurable: true,
				enumerable: descriptor.enumerable,
			});
		}
	});
}
