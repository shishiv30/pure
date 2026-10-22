/**
 * ChatGPT float button: toggles a prompt panel. Submitting opens chatgpt.com in a
 * new tab with the typed text as the prompt, plus a one-line context: answer with
 * links on this site per /llms.txt, and the current page (its .md twin if any).
 * Without JS the button is a plain link to chatgpt.com.
 */

function getLlmsUrl() {
	const origin = location.origin;
	const prefix = location.pathname.startsWith('/pure/') ? '/pure' : '';
	// Fresh query each time so ChatGPT's fetch cache can't hand back an old 404/503
	return origin + prefix + '/llms.txt?v=' + Date.now().toString(36);
}

// The page's markdown twin when it has one: ChatGPT reads it faster, and a URL in the
// prompt is one its browsing tool is allowed to open.
function getPageUrl() {
	const $md = document.querySelector('link[rel="alternate"][type="text/markdown"]');
	return $md ? new URL($md.getAttribute('href'), location.href).href : location.href;
}

function getChatGptUrl(text) {
	const context =
		'Answer with links on ' + location.host + ' only, built per ' + getLlmsUrl() +
		'. Current page: ' + getPageUrl();
	const prompt = text ? text + '\n\n' + context : context;
	return 'https://chatgpt.com/?q=' + encodeURIComponent(prompt);
}

function createPanel(id) {
	const $panel = document.createElement('form');
	$panel.id = id;
	$panel.className = 'chatgpt-panel panel inline outline';
	$panel.setAttribute('role', 'dialog');
	$panel.setAttribute('aria-label', 'Ask ChatGPT');
	$panel.hidden = true;
	$panel.innerHTML =
		'<label class="text-bold" for="' + id + '-text">Ask ChatGPT about this page</label>' +
		'<div class="textarea"><textarea id="' + id + '-text" name="prompt" rows="3" ' +
		'placeholder="e.g. 3 bed homes under $600k near a good elementary school"></textarea></div>' +
		'<div class="chatgpt-panel-actions">' +
		'<button type="button" class="btn default" data-chatgpt-close>Cancel</button>' +
		'<button type="submit" class="btn major active">Ask ChatGPT</button>' +
		'</div>';
	document.body.appendChild($panel);
	return $panel;
}

export default {
	name: 'chatgpt',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		$el.classList.add('chatgpt');
		const panelId = 'chatgpt-panel';
		const $panel = document.getElementById(panelId) || createPanel(panelId);
		const $text = $panel.querySelector('textarea');
		$el.setAttribute('aria-controls', panelId);
		$el.setAttribute('aria-expanded', 'false');

		exportObj.$panel = $panel;
		exportObj.getUrl = getChatGptUrl;
		exportObj.open = function () {
			$panel.hidden = false;
			$el.setAttribute('aria-expanded', 'true');
			$text.focus();
		};
		exportObj.close = function () {
			$panel.hidden = true;
			$el.setAttribute('aria-expanded', 'false');
		};
		exportObj.submit = function () {
			const text = $text.value.trim();
			if (!text) {
				$text.focus();
				return;
			}
			window.open(getChatGptUrl(text), '_blank', 'noopener');
			$text.value = '';
			exportObj.close();
		};
	},
	initAfter: function ($el, opt, exportObj) {
		const $panel = exportObj.$panel;
		exportObj._clickHandler = function (e) {
			e.preventDefault();
			if ($panel.hidden) {
				exportObj.open();
			} else {
				exportObj.close();
			}
		};
		exportObj._submitHandler = function (e) {
			e.preventDefault();
			exportObj.submit();
		};
		exportObj._panelClickHandler = function (e) {
			if (e.target.closest('[data-chatgpt-close]')) {
				exportObj.close();
			}
		};
		// Enter sends, Shift+Enter adds a line, Escape closes. Enter that commits an IME
		// candidate (Chinese/Japanese input) must not send: Safari reports it with
		// isComposing false but keyCode 229.
		exportObj._keyHandler = function (e) {
			if (e.key === 'Escape') {
				exportObj.close();
				$el.focus();
			} else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
				e.preventDefault();
				exportObj.submit();
			}
		};
		// pointerdown, not click: a text selection that starts in the box and ends outside
		// the panel fires click on the page behind it and would close the panel.
		exportObj._outsideHandler = function (e) {
			if (!$panel.hidden && !$panel.contains(e.target) && !$el.contains(e.target)) {
				exportObj.close();
			}
		};
		$el.addEventListener('click', exportObj._clickHandler);
		$panel.addEventListener('submit', exportObj._submitHandler);
		$panel.addEventListener('click', exportObj._panelClickHandler);
		$panel.addEventListener('keydown', exportObj._keyHandler);
		document.addEventListener('pointerdown', exportObj._outsideHandler);
	},
	destroyBefore: function ($el, opt, exportObj) {
		const $panel = exportObj.$panel;
		if (exportObj._clickHandler) {
			$el.removeEventListener('click', exportObj._clickHandler);
			$panel.removeEventListener('submit', exportObj._submitHandler);
			$panel.removeEventListener('click', exportObj._panelClickHandler);
			$panel.removeEventListener('keydown', exportObj._keyHandler);
			document.removeEventListener('pointerdown', exportObj._outsideHandler);
		}
		$el.classList.remove('chatgpt');
	},
};
