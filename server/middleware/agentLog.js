/**
 * One log line per request from an AI agent or search crawler, so `docker logs pure`
 * shows what ChatGPT & co. actually fetched: `[agent] 200 312ms ChatGPT-User GET /property/tx/austin.md`.
 */
const AGENT_UA =
	/ChatGPT-User|GPTBot|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Googlebot|bingbot|Applebot|CCBot|meta-externalagent|Bytespider|Amazonbot|DuckAssistBot|python-requests|Python-urllib|curl\//i;

export default function agentLog(req, res, next) {
	const ua = req.get('User-Agent') || '';
	const match = ua.match(AGENT_UA);
	if (!match) return next();
	const start = Date.now();
	res.on('finish', () => {
		console.log(`[agent] ${res.statusCode} ${Date.now() - start}ms ${match[0]} ${req.method} ${req.originalUrl}`);
	});
	next();
}
