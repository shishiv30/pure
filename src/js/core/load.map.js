import load from './load.js';
var mapLoaded = 0;
const todo = [];
const loadMap = async function (googleMapKey) {
	return new Promise((resolve) => {
		//has load
		if (mapLoaded === 2) {
			resolve(window.google && window.google.map);
		} else {
			if (mapLoaded === 0) {
				mapLoaded = 1;
				//get ready to load
				var config = {
					callback: 'googlemapcallback',
				};
				var mapUrl =
					'https://maps.googleapis.com/maps/api/js?' + googleMapKey;
				$.each(config, function (key, value) {
					mapUrl += '&' + key + '=' + value;
				});
				load({
					files: [mapUrl],
					type: 'js',
					callback: 'googlemapcallback',
				});
				window.googlemapcallback = function () {
					mapLoaded = 2;
					if (window.google && window.google.map) {
						todo.forEach((item) => {
							item(window.google.map);
						});
					}
				};
			}
			todo.push(resolve);
		}
	});
};
export default loadMap;
