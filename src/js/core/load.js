var resource = {
	js: {
		load: function (src, callback) {
			return new Promise((resolve, reject) => {
				try {
					var script = document.createElement('script');
					if (callback) {
						window[callback] = function (e) {
							resolve(e);
						};
					} else {
						script.onload = function (e) {
							resolve(e);
						};
						script.onerror = function (e) {
							reject(e);
						};
					}
					script.src = src;
					document
						.getElementsByTagName('head')[0]
						.appendChild(script);
				} catch (err) {
					reject(err);
				}
			});
		},
		cache: {},
	},
	css: {
		load: function (src) {
			return new Promise((resolve, reject) => {
				try {
					var link = document.createElement('link');
					link.rel = 'stylesheet';
					link.type = 'text/css';
					link.href = src;
					link.onload = function (e) {
						resolve(e);
					};
					link.onerror = function (e) {
						reject(e);
					};
				} catch (err) {
					reject(err);
				}
			});
		},
		cache: {},
	},
};
var _getFiletype = function (filename) {
	if (!filename) {
		return;
	}
	return filename.substring(filename.lastIndexOf('.') + 1, filename.length);
};
var _loadResource = function (url, filetype, callback) {
	var type = filetype || _getFiletype(url);
	var loader = resource[type];
	if (loader && loader.cache) {
		if (loader.cache[url]) {
			return true;
		}
		loader.cache[url] = true;
		return loader.load(url, callback);
	} else {
		console.log('do not support load' + type);
		return false;
	}
};

const load = function (options) {
	var defaultOpt = {
		files: [],
	};
	var opt = Object.assign(defaultOpt, options);
	var resources = [];
	if (opt.files && opt.files.length) {
		opt.files.forEach(function (item) {
			resources.push(_loadResource(item, opt.type, opt.callback));
		});
	}
	return Promise.all(resources);
};
export default load;
