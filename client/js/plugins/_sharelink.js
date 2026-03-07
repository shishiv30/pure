/**
 * Sharelink plugin: injects a responsive share bar (icon + text on large, icon only on small)
 * into elements with data-role="sharelink". Uses share URLs for Facebook, Twitter, LinkedIn,
 * WhatsApp, and Email. On mobile, uses native Web Share API when available.
 */

const SHARE_WINDOW_OPTS = 'toolbar=0,status=0,width=626,height=436';

function hasNativeShare() {
	return (
		typeof navigator !== 'undefined' && typeof navigator.share === 'function'
	);
}

const NATIVE_SHARE_ITEM = {
	id: 'native',
	label: 'Share',
	icon: 'icon-share-alt',
};

const PLATFORMS = [
	{ id: 'facebook', label: 'Facebook', icon: 'icon-facebook', width: 626, height: 436 },
	{ id: 'twitter', label: 'Twitter', icon: 'icon-twitter', width: 550, height: 420 },
	{ id: 'linkedin', label: 'LinkedIn', icon: 'icon-linkedin', width: 600, height: 600 },
	{ id: 'whatsapp', label: 'WhatsApp', icon: 'icon-whatsapp', width: 600, height: 600 },
	{ id: 'email', label: 'Email', icon: 'icon-envelope', width: 0, height: 0 },
];

function getShareUrl(platformId, url, text, subject) {
	const encodedUrl = encodeURIComponent(url);
	switch (platformId) {
		case 'facebook':
			return 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
		case 'twitter':
			return (
				'https://twitter.com/intent/tweet?url=' +
				encodedUrl +
				(text ? '&text=' + encodeURIComponent(text) : '')
			);
		case 'linkedin':
			return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl;
		case 'whatsapp':
			return 'https://wa.me/?text=' + encodedUrl;
		case 'email':
			return (
				'mailto:?subject=' +
				encodeURIComponent(subject || '') +
				'&body=' +
				encodedUrl
			);
		default:
			return '#';
	}
}

function openShare(platformId, url, text, subject) {
	if (platformId === 'native' && hasNativeShare()) {
		const shareData = { url };
		if (text) shareData.text = text;
		shareData.title = subject || (typeof document !== 'undefined' ? document.title : '');
		navigator.share(shareData).catch(() => {});
		return;
	}
	const shareUrl = getShareUrl(platformId, url, text, subject);
	if (platformId === 'email') {
		window.location.href = shareUrl;
		return;
	}
	const platform = PLATFORMS.find((p) => p.id === platformId);
	const opts =
		platform && platform.width
			? `toolbar=0,status=0,width=${platform.width},height=${platform.height}`
			: SHARE_WINDOW_OPTS;
	window.open(shareUrl, 'share-' + platformId, opts);
}

function buildBar(opt) {
	const url = opt.url || (typeof location !== 'undefined' ? location.href : '');
	const platforms =
		opt.platforms && Array.isArray(opt.platforms) && opt.platforms.length
			? PLATFORMS.filter((p) => opt.platforms.includes(p.id))
			: PLATFORMS;
	const withNative = hasNativeShare()
		? [NATIVE_SHARE_ITEM].concat(platforms)
		: platforms;

	const items = withNative
		.map(
			(p) =>
				'<a class="sharelink-item" href="#" data-share="' +
				p.id +
				'" aria-label="' +
				(p.id === 'native' ? 'Share' : 'Share on ' + p.label) +
				'" role="button">' +
				'<i class="' +
				p.icon +
				'" aria-hidden="true"></i>' +
				'<span class="sharelink-label">' +
				p.label +
				'</span></a>'
		)
		.join('');

	return (
		'<div class="sharelink-bar" role="group" aria-label="Share">' + items + '</div>'
	);
}

export default {
	name: 'sharelink',
	defaultOpt: {
		url: '',
		text: '',
		subject: '',
		platforms: null,
	},
	setOptionsBefore: function ($el, opt) {
		if ($el.dataset.url) opt.url = $el.dataset.url;
		if ($el.dataset.text) opt.text = $el.dataset.text;
		if ($el.dataset.subject) opt.subject = $el.dataset.subject;
		if ($el.dataset.platforms)
			opt.platforms = $el.dataset.platforms.split(',').map((s) => s.trim());
	},
	init: function ($el, opt, exportObj) {
		const url = opt.url || (typeof location !== 'undefined' ? location.href : '');
		$el.innerHTML = buildBar(opt);
		$el.classList.add('sharelink');

		exportObj.getUrl = function () {
			return url;
		};
		exportObj.open = function (platformId) {
			openShare(platformId, url, opt.text, opt.subject);
		};
	},
	initAfter: function ($el, opt, exportObj) {
		const url = opt.url || (typeof location !== 'undefined' ? location.href : '');
		exportObj._clickHandler = function (e) {
			const item = e.target.closest('[data-share]');
			if (!item) return;
			e.preventDefault();
			const platformId = item.getAttribute('data-share');
			openShare(platformId, url, opt.text, opt.subject);
		};
		$el.addEventListener('click', exportObj._clickHandler);
	},
	destroyBefore: function ($el, opt, exportObj) {
		$el.removeEventListener('click', exportObj._clickHandler);
		$el.innerHTML = '';
		$el.classList.remove('sharelink');
	},
};
