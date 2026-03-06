#!/usr/bin/env node

/**
 * Performance checker: builds Docker, waits for app, runs Lighthouse, outputs HTML + summary.
 *
 * Workflow:
 * 1. Build Docker instance (via npm run build-docker:dev)
 * 2. Run Lighthouse in headless browser on target page
 * 3. Generate HTML report + summarized improvement report
 *
 * Usage: node scripts/run-lighthouse.js
 * Env:
 *   DOCKER_PORT (default 3002)
 *   LIGHTHOUSE_URL (default /document) - path to test, e.g. /document, /page/index
 *   LIGHTHOUSE_OUTPUT (default ./dist/lighthouse-report) - base path for .report.html and .report.json
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OUTPUT_BASE = process.env.LIGHTHOUSE_OUTPUT || path.join(ROOT, 'dist', 'lighthouse-report');
const OUTPUT_HTML = OUTPUT_BASE + (OUTPUT_BASE.endsWith('.html') ? '' : '.report.html');
const OUTPUT_JSON = OUTPUT_BASE.replace(/\.html$/, '') + (OUTPUT_BASE.endsWith('.html') ? '.report.json' : '.report.json');
const WAIT_MS = 30000;
const POLL_MS = 500;

function getPort() {
	let port = Number(process.env.DOCKER_PORT) || 3002;
	const envFiles = ['.env', '.env.local', '.env.production'];
	for (const name of envFiles) {
		const envPath = path.join(ROOT, name);
		if (!fs.existsSync(envPath)) continue;
		try {
			const content = fs.readFileSync(envPath, 'utf8');
			for (const line of content.split('\n')) {
				const trimmed = line.replace(/#.*/, '').trim();
				if (trimmed.startsWith('DOCKER_PORT=')) {
					const val = trimmed.slice('DOCKER_PORT='.length).trim();
					if (val) port = Number(val) || port;
					return port;
				}
			}
		} catch (_) {}
	}
	return port;
}

function getTargetPath() {
	return process.env.LIGHTHOUSE_URL || '/document';
}

async function waitForUrl(url) {
	const start = Date.now();
	while (Date.now() - start < WAIT_MS) {
		try {
			const res = await fetch(url, { method: 'GET', redirect: 'follow' });
			if (res.ok) return true;
		} catch (_) {}
		await new Promise((r) => setTimeout(r, POLL_MS));
	}
	return false;
}

function runLighthouse(targetUrl) {
	return new Promise((resolve, reject) => {
		// Chrome flags: --disable-dev-shm-usage helps Docker; avoid --headless=new (trace issues)
		const chromeFlags = [
			'--headless',
			'--no-sandbox',
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			'--window-size=1280,720',
		].join(' ');
		const args = [
			targetUrl,
			'--output=html',
			'--output=json',
			'--output-path=' + OUTPUT_BASE,
			'--chrome-flags=' + chromeFlags,
			'--quiet',
		];
		const child = spawn('npx', ['lighthouse', ...args], {
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
			cwd: ROOT,
		});
		let stderr = '';
		child.stderr?.on('data', (chunk) => { stderr += chunk; });
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(stderr || `Lighthouse exited with code ${code}`));
		});
		child.on('error', reject);
	});
}

function generateSummary(lhr) {
	const lines = [];
	const url = lhr.finalDisplayedUrl || lhr.finalUrl || '';

	lines.push('# Lighthouse Performance Report');
	lines.push('');
	lines.push(`**URL:** ${url}`);
	lines.push(`**Fetched:** ${lhr.fetchTime || 'N/A'}`);
	lines.push('');

	// Category scores
	const categories = lhr.categories || {};
	lines.push('## Category Scores');
	lines.push('');
	for (const [id, cat] of Object.entries(categories)) {
		if (!cat) continue;
		if (typeof cat.score === 'number') {
			const pct = Math.round(cat.score * 100);
			const emoji = pct >= 90 ? '🟢' : pct >= 50 ? '🟡' : '🔴';
			lines.push(`- ${emoji} **${cat.title || id}:** ${pct}`);
		} else {
			lines.push(`- ⚪ **${cat.title || id}:** ? (audit incomplete)`);
		}
	}
	lines.push('');

	// Opportunities (audits that suggest improvements)
	const audits = lhr.audits || {};
	const opportunityIds = [
		'render-blocking-resources',
		'unused-css-rules',
		'unused-javascript',
		'uses-responsive-images',
		'offscreen-images',
		'efficient-animated-content',
		'duplicated-javascript',
		'legacy-javascript',
		'total-byte-weight',
		'uses-optimized-images',
		'modern-image-formats',
		'uses-text-compression',
		'uses-rel-preconnect',
		'font-display',
		'largest-contentful-paint-element',
		'cumulative-layout-shift',
		'dom-size',
		'long-tasks',
		'bootup-time',
		'mainthread-tasks',
	];

	lines.push('## Improvement Opportunities');
	lines.push('');

	let hasOpportunities = false;
	for (const id of opportunityIds) {
		const audit = audits[id];
		if (!audit || audit.score === null || audit.score === 1) continue;
		hasOpportunities = true;
		const title = audit.title || id;
		const desc = audit.description || '';
		const displayValue = audit.displayValue || '';
		lines.push(`### ${title}`);
		if (displayValue) lines.push(`- **Current:** ${displayValue}`);
		if (desc) {
			const short = desc.replace(/\s+/g, ' ').trim().slice(0, 300);
			lines.push(`- **Suggestion:** ${short}${short.length >= 300 ? '…' : ''}`);
		}
		lines.push('');
	}

	if (!hasOpportunities) {
		lines.push('No major opportunities identified. Scores look good.');
		lines.push('');
	}

	// Diagnostics (informational)
	const diagIds = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift'];
	lines.push('## Core Web Vitals');
	lines.push('');
	for (const id of diagIds) {
		const audit = audits[id];
		if (!audit) continue;
		const title = audit.title || id;
		const val = audit.displayValue || audit.numericValue;
		if (val != null) lines.push(`- **${title}:** ${val}`);
	}
	lines.push('');

	lines.push('---');
	lines.push('*Run `npm run test:lighthouse` to regenerate. Set `LIGHTHOUSE_URL` to test other pages (e.g. `/page/index`).*');
	return lines.join('\n');
}

async function main() {
	const port = getPort();
	const targetPath = getTargetPath();
	const targetUrl = `http://localhost:${port}${targetPath.startsWith('/') ? targetPath : '/' + targetPath}`;

	console.log('Waiting for server at', targetUrl, '...');
	const ready = await waitForUrl(targetUrl);
	if (!ready) {
		console.error('Server did not become ready in time. Is the Docker container running?');
		process.exit(1);
	}
	console.log('Server ready. Running Lighthouse...');
	// Brief delay so page can stabilize; helps axe-core complete accessibility audits
	await new Promise((r) => setTimeout(r, 2000));
	await runLighthouse(targetUrl);

	// Parse JSON and generate summary
	let jsonPath = OUTPUT_JSON;
	if (!fs.existsSync(jsonPath)) {
		const alt = path.join(ROOT, 'dist', 'lighthouse-report.report.json');
		if (fs.existsSync(alt)) jsonPath = alt;
	}
	if (fs.existsSync(jsonPath)) {
		const lhr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
		const summary = generateSummary(lhr);
		const summaryPath = path.join(ROOT, 'dist', 'lighthouse-summary.md');
		fs.writeFileSync(summaryPath, summary, 'utf8');
		console.log('Summary written to', summaryPath);
	}

	console.log('HTML report:', OUTPUT_HTML);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
