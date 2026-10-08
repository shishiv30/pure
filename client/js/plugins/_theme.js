const THEME_KEY = 'theme';

function systemIsDark() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readMode() {
	const saved = localStorage.getItem(THEME_KEY);
	if (saved === 'dark' || saved === 'light') {
		return saved;
	}
	return 'auto';
}

function applyMode(mode) {
	const root = document.documentElement;
	const body = document.body;
	root.classList.remove('theme-dark', 'theme-light');
	body.classList.remove('theme-dark', 'theme-light');
	if (mode === 'dark' || mode === 'light') {
		const cls = mode === 'dark' ? 'theme-dark' : 'theme-light';
		root.classList.add(cls);
		body.classList.add(cls);
		localStorage.setItem(THEME_KEY, mode);
		return;
	}
	localStorage.removeItem(THEME_KEY);
}

function toggleMode() {
	const mode = readMode();
	if (mode === 'light') {
		applyMode('dark');
		return;
	}
	if (mode === 'dark') {
		applyMode('light');
		return;
	}
	applyMode(systemIsDark() ? 'light' : 'dark');
}

export default {
	name: 'theme',
	defaultOpt: {},
	init: function ($el, opt, exportObj) {
		const onClick = function (e) {
			e.preventDefault();
			toggleMode();
		};
		$el.addEventListener('click', onClick);
		exportObj.toggle = toggleMode;
		exportObj._onClick = onClick;
	},
	setOptionsBefore: null,
	setOptionsAfter: null,
	initBefore: null,
	initAfter: null,
	destroyBefore: function ($el, opt, exportObj) {
		if (exportObj._onClick) {
			$el.removeEventListener('click', exportObj._onClick);
		}
	},
};
