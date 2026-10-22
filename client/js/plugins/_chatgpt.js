/**
 * ChatGPT float button: opens chatgpt.com in a new tab with a warmup prompt
 * for the current page URL and /llms.txt search rules.
 */

function getLlmsUrl() {
	const origin = location.origin;
	const prefix = location.pathname.startsWith('/pure/') ? '/pure' : '';
	return origin + prefix + '/llms.txt';
}

function getChatGptUrl() {
	const pageUrl = location.href;
	const llmsUrl = getLlmsUrl();
	const prompt =
		'You are helping someone on ' +
		pageUrl +
		'. Read ' +
		llmsUrl +
		' first and follow its search URL rules. When they ask about homes, ' +
		'answer with direct links on this site.';
	return 'https://chatgpt.com/?q=' + encodeURIComponent(prompt);
}

export default {
	name: 'chatgpt',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		$el.classList.add('chatgpt');
		exportObj.getUrl = getChatGptUrl;
		exportObj.setHref = function () {
			$el.setAttribute('href', getChatGptUrl());
		};
		exportObj.setHref();
	},
	initAfter: function ($el, opt, exportObj) {
		exportObj._clickHandler = function () {
			exportObj.setHref();
		};
		$el.addEventListener('click', exportObj._clickHandler);
	},
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._clickHandler) {
			$el.removeEventListener('click', exportObj._clickHandler);
		}
		$el.classList.remove('chatgpt');
	},
};
