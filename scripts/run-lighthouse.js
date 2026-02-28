#!/usr/bin/env node

/**
 * Waits for the app at baseUrl to be ready, then runs Lighthouse on /page/index.
 * Used after build-docker:prod (or build-docker:dev); port should match DOCKER_PORT.
 * Usage: node scripts/run-lighthouse.js
 * Env: DOCKER_PORT (default 3002), LIGHTHOUSE_OUTPUT (default ./lighthouse-report.html)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OUTPUT_PATH = process.env.LIGHTHOUSE_OUTPUT || path.join(ROOT, 'lighthouse-report.html');
const WAIT_MS = 30000;
const POLL_MS = 500;

function getPort() {
	let port = Number(process.env.DOCKER_PORT) || 3002;
	try {
		const envPath = path.join(ROOT, '.env.production');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			for (const line of content.split('\n')) {
				const trimmed = line.replace(/#.*/, '').trim();
				if (trimmed.startsWith('DOCKER_PORT=')) {
					const val = trimmed.slice('DOCKER_PORT='.length).trim();
					if (val) port = Number(val) || port;
					break;
				}
			}
		}
	} catch (_) {}
	return port;
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
		const args = [
			targetUrl,
			'--output=html',
			'--output-path=' + OUTPUT_PATH,
			'--chrome-flags=--headless --no-sandbox --disable-gpu',
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

async function main() {
	const port = getPort();
	const targetUrl = `http://localhost:${port}/page/index`;

	console.log('Waiting for server at', targetUrl, '...');
	const ready = await waitForUrl(targetUrl);
	if (!ready) {
		console.error('Server did not become ready in time. Is the Docker container running?');
		process.exit(1);
	}
	console.log('Server ready. Running Lighthouse...');
	await runLighthouse(targetUrl);
	console.log('Lighthouse report written to', OUTPUT_PATH);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
