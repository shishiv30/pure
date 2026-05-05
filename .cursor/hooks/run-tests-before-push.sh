#!/usr/bin/env bash
set -euo pipefail

HOOK_INPUT="$(cat)"

COMMAND="$(printf '%s' "$HOOK_INPUT" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8");
try {
	const input = JSON.parse(raw);
	process.stdout.write(String(input.command || ""));
} catch (error) {
	process.stdout.write("");
}
')"

if [[ ! "$COMMAND" =~ ^git[[:space:]]+push([[:space:]]|$) ]]; then
	echo '{ "permission": "allow" }'
	exit 0
fi

if npm run test; then
	echo '{ "permission": "allow" }'
	exit 0
fi

echo '{
	"permission": "deny",
	"user_message": "Push blocked: `npm run test` failed. Please fix tests and try again.",
	"agent_message": "Denied git push because test suite failed in beforeShellExecution hook."
}'
exit 0
