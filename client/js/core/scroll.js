const preventDefault = (event) => {
	//if parent node not include '.overlay' '.dialog' '.mvt-searchbox' then prevent default with vanilla js
	if (!event.target.closest('.overlay')) {
		event.preventDefault();
	}
};
export function disableScroll(name) {
	if (document.body.classList.contains(`disable-scroll-${name}`)) {
		return;
	}
	document.body.classList.add(`disable-scroll-${name}`);
	//if any classname on <body> star with 'disable-scroll-' then prevent default
	if (document.body.className.match('disable-scroll-')) {
		document.body.style.overflow = 'hidden';
		window.addEventListener('touchmove', preventDefault, { passive: false });
	}
}

export function enableScroll(name) {
	if (!document.body.classList.contains(`disable-scroll-${name}`)) {
		return;
	}
	document.body.classList.remove(`disable-scroll-${name}`);
	if (!document.body.className.match('disable-scroll-')) {
		document.body.style.overflow = '';
		window.removeEventListener('touchmove', preventDefault, { passive: false });
	}
}
