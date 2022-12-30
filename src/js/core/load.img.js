const loadImg = function (img, imgSrc) {
	return new Promise((resolve) => {
		if (!window.loadedImage) {
			window.loadedImage = [];
		}
		img.classList.remove('img-load-error', 'img-load-success');
		img.addEventListener(
			'load',
			(imgSrc) => {
				img.classList.add('img-load-success');
				window.loadedImage.push(imgSrc);
				resolve(true);
			},
			{ once: true },
		);
		img.addEventListener('error', () => {
			img.classList.add('img-load-error');
			resolve(false);
		});
		if (imgSrc) {
			img.setAttribute('src', imgSrc);
		} else {
			img.classList.add('img-load-error');
		}
	});
};

export default loadImg;
