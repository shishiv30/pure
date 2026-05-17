// script lib - console log (dev-only; production uses no-op exports)

const DEV =
	typeof window !== 'undefined' && window.location.protocol === 'http:';

const noop = () => {};

/**
 * Human-readable selector-style label for an element.
 * @param {Element} $el
 * @returns {string}
 */
function buildPluginTargetLabel($el) {
	const role = $el.dataset?.role;
	const tag = $el.tagName.toLowerCase();
	let label = tag;
	if ($el.id) {
		label += `#${$el.id}`;
	}
	if (role) {
		label += `[data-role="${role}"]`;
	}
	const className = typeof $el.className === 'string' ? $el.className.trim() : '';
	if (className) {
		const preview = className.split(/\s+/).slice(0, 2).join('.');
		if (preview) {
			label += `.${preview}`;
		}
	}
	return label;
}

/**
 * DevTools: `target` is the live Element (click to inspect in Elements panel).
 * `label` is a short string summary alongside it.
 * @param {Element|null|undefined} $el
 * @returns {{ target: string | Element, label?: string, tagName?: string, id?: string, role?: string, className?: string }}
 */
function buildPluginTarget($el) {
	if (!$el || typeof $el.tagName !== 'string') {
		return { target: '(no element)' };
	}
	const role = $el.dataset?.role;
	const className = typeof $el.className === 'string' ? $el.className.trim() : '';
	return {
		target: $el,
		label: buildPluginTargetLabel($el),
		tagName: $el.tagName,
		...($el.id && { id: $el.id }),
		...(role && { role }),
		...(className && { className }),
	};
}

/**
 * @param {Iterable<Element>} elements
 * @param {number} [limit]
 * @returns {Array<{ label: string, target: Element }>}
 */
function buildPluginTargetList(elements, limit = 12) {
	const targets = [];
	for (const el of elements) {
		if (!el || typeof el.tagName !== 'string') {
			continue;
		}
		targets.push({
			label: buildPluginTargetLabel(el),
			target: el,
		});
		if (targets.length >= limit) {
			break;
		}
	}
	return targets;
}

/** @param {string} message @param {unknown} [detail] */
function logInfoImpl(message, detail) {
	if (detail === undefined) {
		console.info(message);
		return;
	}
	if (typeof detail === 'function') {
		console.info(message, detail());
		return;
	}
	console.info(message, detail);
}

/** @param {unknown} message @param {unknown} [detail] */
function logErrorImpl(message, detail) {
	if (detail === undefined) {
		console.error(message);
		return;
	}
	if (typeof detail === 'function') {
		console.error(message, detail());
		return;
	}
	console.error(message, detail);
}

export const logInfo = DEV ? logInfoImpl : noop;

export const logError = DEV ? logErrorImpl : noop;

/**
 * @param {string} pluginName
 * @param {string} phase
 * @param {Element} $el
 * @param {object} [options]
 * @param {object} [exportObj]
 */
export const logPluginPhase = DEV
	? function logPluginPhase(pluginName, phase, $el, options, exportObj) {
			logInfoImpl(`[Plugin] ${phase}`, {
				plugin: pluginName,
				...(options?.role && options.role !== pluginName
					? { dataRole: options.role }
					: {}),
				...buildPluginTarget($el),
				...(exportObj?._pid && { pid: exportObj._pid }),
			});
		}
	: noop;

/** @param {Element[]} pending */
export const logPluginScheduleCleanup = DEV
	? function logPluginScheduleCleanup(pending) {
			logInfoImpl('[Plugin] Scheduling cleanup', {
				pendingCount: pending.length,
				targets: buildPluginTargetList(pending),
				...(pending.length > 12 ? { truncated: true } : {}),
			});
		}
	: noop;

export const logPluginPerformCleanup = DEV
	? function logPluginPerformCleanup() {
			logInfoImpl('[Plugin] Performing cleanup');
		}
	: noop;

/** @param {Element[]} pending */
export const logPluginStartCleanup = DEV
	? function logPluginStartCleanup(pending) {
			logInfoImpl('[Plugin] Starting cleanup', {
				pendingCount: pending.length,
				targets: buildPluginTargetList(pending),
				...(pending.length > 12 ? { truncated: true } : {}),
			});
		}
	: noop;

/**
 * @param {number} cleanedCount
 * @param {number} pendingCount
 */
export const logPluginCleanupCompleted = DEV
	? function logPluginCleanupCompleted(cleanedCount, pendingCount) {
			logInfoImpl('[Plugin] Cleanup completed', {
				cleanedCount,
				pendingCount,
			});
		}
	: noop;

/** @param {string} message */
export const logPluginCleanupMissingElement = DEV
	? function logPluginCleanupMissingElement(message) {
			logInfoImpl(`[Plugin] cleanupInstance: ${message}`);
		}
	: noop;

/**
 * @param {string} message
 * @param {Element} $el
 * @param {object} [extra]
 */
export const logPluginCleanupInstance = DEV
	? function logPluginCleanupInstance(message, $el, extra) {
			logInfoImpl(`[Plugin] cleanupInstance: ${message}`, {
				...buildPluginTarget($el),
				...extra,
			});
		}
	: noop;
