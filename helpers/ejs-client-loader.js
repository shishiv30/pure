/**
 * Webpack loader: compile server/ejs templates for client render with static includes.
 * Emits { render(locals) } using precompiled EJS client functions and a partials registry.
 */
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATIC_INCLUDE_RE = /<%-?\s*include\s*\(\s*['"]([^'"]+)['"]/g;

/**
 * @param {string} name
 * @returns {string}
 */
function normalizePartialName(name) {
	return name.replace(/\.ejs$/i, '');
}

/**
 * @param {string} absPath
 * @param {string} ejsRoot
 * @param {Map<string, { key: string, absPath: string }>} nodes
 */
function collectGraph(absPath, ejsRoot, nodes) {
	const resolved = path.resolve(absPath);
	if (nodes.has(resolved)) {
		return;
	}
	const key = normalizePartialName(path.basename(resolved, '.ejs'));
	nodes.set(resolved, { key, absPath: resolved });
	const source = fs.readFileSync(resolved, 'utf8');
	let match;
	const re = new RegExp(STATIC_INCLUDE_RE.source, 'g');
	while ((match = re.exec(source)) !== null) {
		const partialName = match[1];
		const partialPath = path.join(ejsRoot, `${normalizePartialName(partialName)}.ejs`);
		if (!fs.existsSync(partialPath)) {
			throw new Error(
				`ejs-client-loader: missing partial ${partialName} for ${resolved}`,
			);
		}
		collectGraph(partialPath, ejsRoot, nodes);
	}
}

/**
 * @param {string} resourcePath
 * @returns {Map<string, { key: string, absPath: string }>}
 */
function buildDependencyGraph(resourcePath) {
	const ejsRoot = path.dirname(resourcePath);
	const nodes = new Map();
	collectGraph(resourcePath, ejsRoot, nodes);
	return nodes;
}

/**
 * @param {string} absPath
 * @returns {string} JSON-stringified compiled function source
 */
function compileClientTemplate(absPath) {
	const source = fs.readFileSync(absPath, 'utf8');
	const compiled = ejs.compile(source, {
		client: true,
		compileDebug: false,
		filename: absPath,
	});
	return JSON.stringify(compiled.toString());
}

/**
 * @param {string} _source
 * @this {import('webpack').LoaderContext<{}>}
 * @returns {string}
 */
export default function ejsClientLoader(_source) {
	const resourcePath = this.resourcePath;
	const rootKey = normalizePartialName(path.basename(resourcePath, '.ejs'));
	const graph = buildDependencyGraph(resourcePath);

	for (const { absPath } of graph.values()) {
		this.addDependency(absPath);
	}

	const partialEntries = [...graph.values()].map(({ key, absPath }) => {
		const fnSource = compileClientTemplate(absPath);
		return `  ${JSON.stringify(key)}: ${fnSource}`;
	});

	return `const partialSources = {
${partialEntries.join(',\n')}
};

/** @type {Record<string, Function>} */
const partials = {};
for (const key of Object.keys(partialSources)) {
  // eslint-disable-next-line no-new-func
  partials[key] = new Function('return ' + partialSources[key])();
}

function callPartial(key, locals, includeFn) {
  const fn = partials[key];
  if (!fn) {
    throw new Error('Unknown EJS partial: ' + key);
  }
  return fn(locals, null, includeFn, function rethrow(err) { throw err; });
}

export function render(locals) {
  const ctx = locals || {};
  function include(name, data) {
    const key = String(name).replace(/\\.ejs$/i, '');
    const merged = Object.assign({}, ctx, data || {});
    merged.include = include;
    if (typeof ctx.getHref === 'function') {
      merged.getHref = ctx.getHref;
    }
    if (typeof ctx.getSrc === 'function') {
      merged.getSrc = ctx.getSrc;
    }
    return callPartial(key, merged, include);
  }
  ctx.include = include;
  return callPartial(${JSON.stringify(rootKey)}, ctx, include);
}

export default { render };
`;
}
