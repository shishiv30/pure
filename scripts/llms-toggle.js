/**
 * Turn /llms.txt on or off for the running server (no restart).
 *
 * Toggle: node scripts/llms-toggle.js on|off|status
 * NAS:    sudo /usr/local/bin/docker exec pure npm run llms:off
 */
import { isLlmsOn, setLlms, LLMS_OFF_FILE } from '../server/middleware/llms.js';

const action = process.argv[2];
if (action === 'on' || action === 'off') {
	setLlms(action === 'on');
} else if (action !== 'status') {
	console.error('Usage: node scripts/llms-toggle.js on|off|status');
	process.exit(1);
}
console.log(`llms.txt is ${isLlmsOn() ? 'on' : 'off'} (flag file: ${LLMS_OFF_FILE})`);
