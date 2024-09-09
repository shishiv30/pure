import { sendError } from './log.js';

const get = function (url, data) {
	return new Promise((resolve) => {
		try {
			if (!url) {
				sendError('url is empty');
				resolve(null);
				return;
			}
			if (data) {
				var queryString = new URLSearchParams(data).toString();
				if (url.indexOf('?') >= 0) {
					url += '&' + queryString;
				} else {
					url += '?' + queryString;
				}
			}
			fetch(url)
				.then((res) => res.json())
				.then((data) => resolve(data));
		} catch (err) {
			sendError(err);
			resolve(null);
		}
	});
};
const post = function (url, data, headers) {
	return new Promise((resolve) => {
		if (!url) {
			sendError('url is empty');
			resolve(null);
			return;
		}
		var _headers = Object.assign(
			{
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			headers,
		);
		var _opt = {
			headers: _headers,
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		};
		try {
			fetch(url, _opt)
				.then((res) => res.json())
				.then((data) => resolve(data));
		} catch (err) {
			sendError(err);
			resolve(null);
		}
	});
};

export { get, post };
