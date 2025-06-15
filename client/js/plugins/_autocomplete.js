import { emit, off, on } from '../core/event.js';
import guid from '../core/guid.js';
import { defBool, defEnum } from '../core/def.js';
const boolStatus = ['input-focus'];
import { disableScroll, enableScroll } from '../core/scroll.js';
import { getPathByGeo } from '../../../helpers/geo.js';
export default {
	name: 'autocomplete',
	defaultOpt: {
		method: 'GET',
		type: 'city',
		name: 'text',
		delay: 100,
		container: '.input',
		abortController: null,
	},
	init($el, opt, exportObj) {
		let $container = $el.closest(opt.container);

		let _show = function () {
			if (!$container.classList.contains('autocomplete-show')) {
				document.addEventListener('click', _clickOutside);
				$container.classList.add('autocomplete-show');
				disableScroll('autocomplete');
			}
		};
		let _hide = function () {
			if ($container.classList.contains('autocomplete-show')) {
				document.removeEventListener('click', _clickOutside);
				$container.classList.remove('autocomplete-show');
				enableScroll('autocomplete');
			}
		};
		let _clickOutside = function (e) {
			if (!e.target.closest(opt.container)) {
				_hide();
			}
		};
		//insert suggestionList below the input
		let $suggestionList = document.createElement('div');
		$suggestionList.className = 'suggestion-list';
		$container.append($suggestionList);

		let _selectSuggestion = function (item) {
			if (item) {
				window.location.href = `/demo/${getPathByGeo(item)}`;
			}
		};
		let _updateSuggestion = function (data) {
			//todo list update the UI of suggestion list
			let html = '';
			if (data && data.length > 0) {
				opt.data = data;
				data.forEach((item, i) => {
					html += `<div class="suggestion-item" data-index="${i}">${item.city}, ${item.state}</div>`;
				});
			}
			$suggestionList.innerHTML = html;
		};

		let _getSuggestion = function () {
			let value = $el.value.trim();
			if (value.length === 0) {
				return;
			}

			if (opt.timer) {
				clearTimeout(opt.timer);
			}
			opt.timer = setTimeout(() => {
				//get text
				let key = opt.name;
				let url = opt.url;
				let keys = opt.keys.split(',');
				let method = opt.method;
				let payload = {};
				payload[key] = value;
				if (keys && keys.length > 0) {
					keys.forEach((item) => {
						if (!item) return;
						if (payload[item]) {
							console.warn(`key ${item} is existing`);
						} else if (!opt[item]) {
							console.warn(`key ${item} haven't set data attribute`);
						} else {
							payload[item] = opt[item];
						}
					});
				}
				//check if previous request is still pending
				if (
					opt.abortController &&
					opt.abortController.signal &&
					opt.abortController.signal.aborted === false
				) {
					opt.abortController.abort();
				}
				opt.abortController = new AbortController();
				new AbortController();
				//fetch data from url
				let body;
				if (method === 'GET') {
					url += '?' + new URLSearchParams(payload).toString();
				} else {
					body = JSON.stringify(payload);
				}
				fetch(url, {
					method: method,
					headers: {
						'Content-Type': 'application/json',
					},
					body: body,
					signal: opt.abortController.signal,
				})
					.then((response) => {
						if (!response.ok) {
							throw new Error(`HTTP error: ${response.status}`);
						}
						response.json().then((res) => {
							if (res && res.data && res.data.length > 0) {
								_updateSuggestion(res.data);
							}
						});
					})
					.catch((error) => {
						console.error('Error sending data:', error);
					});
			}, opt.delay);
		};

		$el.addEventListener('focus', () => {
			//show suggestion list
			_show();
			//get suggestion
			_getSuggestion();
		});

		$el.addEventListener('input', () => {
			_show();
			//get suggestion
			_getSuggestion();
		});

		$suggestionList.addEventListener('click', (e) => {
			if (e.target.classList.contains('suggestion-item')) {
				let index = e.target.dataset.index;
				let item = opt.data[index];
				_selectSuggestion(item);
				_hide();
			}
		});
		exportObj.show = _show;
		exportObj.hide = _hide;
	},
};
