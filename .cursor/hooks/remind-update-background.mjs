#!/usr/bin/env node
/**
 * postToolUse hook: remind agent to update .cursor/background.json after
 * structural changes (mv, git mv/rm, folder moves) or deletes in mapped areas.
 */
import fs from 'fs';

const REMINDER = [
	'Structural change detected (rename, move, delete, or folder layout change).',
	'Update `.cursor/background.json` in the same pass:',
	'- `server_helpers.*.file` and `data_folder` paths',
	'- `project.architecture` paths (routes, configs, content_sources)',
	'- Any section keys renamed with the module (e.g. path, article, geo)',
	'Also search the repo for stale imports/paths (`rg` old filename) and update',
	'`.cursor/skills/`, `docs/`, READMEs when paths are documented.',
	'Normative checklist: `.cursor/rules/rename-or-move-file.mdc`.',
].join('\n');

const STRUCTURAL_PATH =
	/^(helpers\/|data\/|server\/(configs|routes|controllers|middleware|utils|ejs)\/|scripts\/|webpack\.config|\.cursor\/(background\.json|skills\/))/;

const SHELL_STRUCTURAL_CMD =
	/\b(git\s+mv|git\s+rm\b|\bmv\s+|\bcp\s+-r\b|mkdir\s+-p|rm\s+-rf?\s+)\b/i;

const SHELL_MENTIONS_PATH =
	/(helpers\/|data\/|server\/|scripts\/|webpack\.config|\.cursor\/)/;

function readInput() {
	const raw = fs.readFileSync(0, 'utf8');
	if (!raw.trim()) return {};
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function toolCommand(input) {
	const ti = input.tool_input ?? input.toolInput ?? input.input ?? {};
	if (typeof ti === 'string') {
		try {
			return JSON.parse(ti).command ?? '';
		} catch {
			return ti;
		}
	}
	return String(ti.command ?? ti.cmd ?? input.command ?? '');
}

function toolPath(input) {
	const ti = input.tool_input ?? input.toolInput ?? input.input ?? {};
	if (typeof ti === 'string') {
		try {
			const parsed = JSON.parse(ti);
			return String(parsed.path ?? parsed.file_path ?? parsed.target_file ?? '');
		} catch {
			return '';
		}
	}
	return String(ti.path ?? ti.file_path ?? ti.target_file ?? input.path ?? input.file_path ?? '');
}

function toolName(input) {
	return String(input.tool_name ?? input.toolName ?? input.tool ?? '');
}

function normalizePath(p) {
	return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

function shouldRemindShell(input) {
	const cmd = toolCommand(input);
	if (!SHELL_STRUCTURAL_CMD.test(cmd)) return false;
	if (SHELL_MENTIONS_PATH.test(cmd)) return true;
	return /\b(mv|git\s+mv)\b/i.test(cmd);
}

function shouldRemindDelete(input) {
	const name = toolName(input);
	if (!/delete/i.test(name)) return false;
	const p = normalizePath(toolPath(input));
	return STRUCTURAL_PATH.test(p);
}

function main() {
	const mode = process.argv[2] ?? 'postToolUse';
	const input = readInput();

	let remind = false;
	if (mode === 'postToolUse') {
		const name = toolName(input);
		if (/shell/i.test(name)) {
			remind = shouldRemindShell(input);
		} else if (/delete/i.test(name)) {
			remind = shouldRemindDelete(input);
		}
	}

	if (remind) {
		process.stdout.write(JSON.stringify({ additional_context: REMINDER }));
	} else {
		process.stdout.write('{}');
	}
}

main();
