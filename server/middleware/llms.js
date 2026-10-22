import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** When this file exists, /llms.txt is off (503 and no describedby links). No restart needed. */
export const LLMS_OFF_FILE = path.join(__dirname, '../../.llms-off');

export function isLlmsOn() {
	return !fs.existsSync(LLMS_OFF_FILE);
}

export function setLlms(on) {
	if (on) {
		fs.rmSync(LLMS_OFF_FILE, { force: true });
	} else {
		fs.writeFileSync(LLMS_OFF_FILE, `${new Date().toISOString()}\n`);
	}
}

function keyMatches(given) {
	const key = config.llmsToggleKey;
	if (!key || !given) return false;
	const a = Buffer.from(String(given));
	const b = Buffer.from(key);
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * ?llm=status → "on" | "off" (public).
 * ?llm=on|off → toggle; needs LLMS_TOGGLE_KEY via X-Llms-Key header or &key=. Unset key = URL toggle disabled.
 * GET /llms.txt while off → 503 + Retry-After, not 404: fetchers (ChatGPT's included) cache a 404
 * as "gone" and keep serving it after the switch is back on; a 503 reads as temporary.
 */
export default function llms(req, res, next) {
	const action = req.query.llm;
	if (action === 'status' || action === 'on' || action === 'off') {
		res.set('Cache-Control', 'no-store');
		if (action !== 'status') {
			if (!keyMatches(req.get('X-Llms-Key') || req.query.key)) {
				return res.status(403).type('text').send('Forbidden\n');
			}
			setLlms(action === 'on');
		}
		return res.type('text').send(`llms.txt is ${isLlmsOn() ? 'on' : 'off'}\n`);
	}

	const on = isLlmsOn();
	res.locals.llmsOn = on;
	if (on) {
		res.append('Link', '</llms.txt>; rel="describedby"');
	} else if (req.path === '/llms.txt') {
		res.set({ 'Cache-Control': 'no-store', 'Retry-After': '60' });
		return res.status(503).type('text').send('llms.txt is temporarily unavailable\n');
	}
	next();
}
