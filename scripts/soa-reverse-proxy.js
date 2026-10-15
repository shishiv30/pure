/**
 * LAN reverse proxy so a NAS Pure process can reach SOA through this machine.
 *
 * NAS env (replace HOST with this machine's LAN IP, printed at startup):
 *   PROPERTY_API_DOMAIN=http://HOST:8787/property
 *   GEOAREA_API_DOMAIN=http://HOST:8787/geoarea
 *   SCHOOL_API_DOMAIN=http://HOST:8787/school
 *   USER_API_DOMAIN=http://HOST:8787/user
 *   POI_API_DOMAIN=http://HOST:8787/poi
 *
 * Upstream hosts come from .env.local (PROPERTY_API_DOMAIN and the other SOA domains).
 * Demo listing calls use PROPERTY_API_DOMAIN.
 *
 * Toggle: node scripts/soa-reverse-proxy.js on|off|status
 * Foreground: node scripts/soa-reverse-proxy.js start
 */
import http from 'http';
import https from 'https';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const PORT = Number(process.env.SOA_PROXY_PORT) || 8787;
const PID_FILE = path.join(os.tmpdir(), 'pure-soa-reverse-proxy.pid');
const LOG_FILE = path.join(os.tmpdir(), 'pure-soa-reverse-proxy.log');
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ENV_LOCAL = path.join(path.dirname(SCRIPT_PATH), '../.env.local');

const UPSTREAM_KEYS = [
	['/property', 'PROPERTY_API_DOMAIN'],
	['/geoarea', 'GEOAREA_API_DOMAIN'],
	['/school', 'SCHOOL_API_DOMAIN'],
	['/user', 'USER_API_DOMAIN'],
	['/poi', 'POI_API_DOMAIN'],
];

function readEnvLocal() {
	const values = {};
	let text = '';
	try {
		text = fs.readFileSync(ENV_LOCAL, 'utf8');
	} catch {
		return values;
	}
	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		values[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim();
	}
	return values;
}

function routesFromEnv() {
	const env = readEnvLocal();
	const missing = UPSTREAM_KEYS.map(([, key]) => key).filter((key) => !env[key]);
	if (missing.length) {
		console.error(`Missing upstreams in .env.local: ${missing.join(', ')}`);
		process.exit(1);
	}
	return UPSTREAM_KEYS.map(([prefix, key]) => ({
		prefix,
		target: env[key].replace(/\/$/, ''),
	}));
}

function lanAddresses() {
	const ips = [];
	for (const entries of Object.values(os.networkInterfaces())) {
		for (const entry of entries || []) {
			if (entry.family === 'IPv4' && !entry.internal) {
				ips.push(entry.address);
			}
		}
	}
	return ips;
}

let ROUTES = [];

function matchRoute(pathname) {
	return ROUTES.find(
		(route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
	);
}

function targetUrl(route, req) {
	const incoming = new URL(req.url, 'http://127.0.0.1');
	const rest = incoming.pathname.slice(route.prefix.length);
	const base = route.target.replace(/\/$/, '');
	return new URL(`${base}${rest}${incoming.search}`);
}

const server = http.createServer((req, res) => {
	const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
	const route = matchRoute(pathname);
	if (!route) {
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'no upstream for path', path: pathname }));
		return;
	}

	const upstream = targetUrl(route, req);
	const headers = { ...req.headers, host: upstream.host };
	delete headers.connection;

	const proxyReq = https.request(
		upstream,
		{
			method: req.method,
			headers,
		},
		(proxyRes) => {
			res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
			proxyRes.pipe(res);
		},
	);
	proxyReq.on('error', (error) => {
		console.error('upstream error', upstream.host, error.message);
		if (!res.headersSent) {
			res.writeHead(502, { 'Content-Type': 'application/json' });
		}
		res.end(JSON.stringify({ error: 'upstream failed', message: error.message }));
	});
	req.pipe(proxyReq);
});

function readPid() {
	try {
		const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
		return Number.isInteger(pid) && pid > 0 ? pid : null;
	} catch {
		return null;
	}
}

function isRunning(pid) {
	if (!pid) {
		return false;
	}
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function listenerPids() {
	try {
		const output = execFileSync('lsof', ['-t', `-iTCP:${PORT}`, '-sTCP:LISTEN'], {
			encoding: 'utf8',
		});
		return output
			.split('\n')
			.map((line) => Number(line.trim()))
			.filter((pid) => Number.isInteger(pid) && pid > 0);
	} catch {
		return [];
	}
}

function isProxyProcess(pid) {
	try {
		const command = execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
			encoding: 'utf8',
		});
		return command.includes('soa-reverse-proxy.js');
	} catch {
		return false;
	}
}

function proxyPid() {
	const recorded = readPid();
	if (isRunning(recorded) && isProxyProcess(recorded)) {
		return recorded;
	}
	return listenerPids().find((pid) => isProxyProcess(pid)) || null;
}

function printStatus() {
	const pid = proxyPid();
	if (pid) {
		console.log(`SOA reverse proxy is on (pid ${pid}, port ${PORT})`);
		return;
	}
	console.log(`SOA reverse proxy is off (port ${PORT})`);
}

function turnOn() {
	const pid = proxyPid();
	if (pid) {
		console.log(`SOA reverse proxy already on (pid ${pid}, port ${PORT})`);
		return;
	}
	const logFd = fs.openSync(LOG_FILE, 'a');
	const child = spawn(process.execPath, [SCRIPT_PATH, 'start'], {
		detached: true,
		stdio: ['ignore', logFd, logFd],
		env: process.env,
	});
	child.unref();
	fs.closeSync(logFd);
	fs.writeFileSync(PID_FILE, String(child.pid));
	console.log(`SOA reverse proxy on (pid ${child.pid}, port ${PORT})`);
	console.log(`log ${LOG_FILE}`);
}

function turnOff() {
	const pid = proxyPid();
	if (!pid) {
		if (fs.existsSync(PID_FILE)) {
			fs.unlinkSync(PID_FILE);
		}
		console.log('SOA reverse proxy is already off');
		return;
	}
	process.kill(pid, 'SIGTERM');
	if (fs.existsSync(PID_FILE)) {
		fs.unlinkSync(PID_FILE);
	}
	console.log(`SOA reverse proxy off (pid ${pid})`);
}

const command = process.argv[2];
if (command === 'on') {
	turnOn();
} else if (command === 'off') {
	turnOff();
} else if (command === 'status') {
	printStatus();
} else if (command && command !== 'start') {
	console.error('usage: node scripts/soa-reverse-proxy.js [on|off|status|start]');
	process.exit(1);
} else {
	ROUTES = routesFromEnv();
	server.on('error', (error) => {
		console.error(error.message);
		process.exit(1);
	});
	server.listen(PORT, '0.0.0.0', () => {
		const ips = lanAddresses();
		console.log(`SOA reverse proxy on 0.0.0.0:${PORT}`);
		for (const ip of ips) {
			console.log(`NAS PROPERTY_API_DOMAIN=http://${ip}:${PORT}/property`);
		}
		if (ips.length === 0) {
			console.log(`NAS PROPERTY_API_DOMAIN=http://<this-machine-lan-ip>:${PORT}/property`);
		}
	});
}
