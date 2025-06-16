import { sendError } from './log.js';

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

const ErrorTypes = {
	NETWORK: 'NETWORK_ERROR',
	TIMEOUT: 'TIMEOUT_ERROR',
	HTTP: 'HTTP_ERROR',
	PARSE: 'PARSE_ERROR',
	VALIDATION: 'VALIDATION_ERROR',
};

const createError = (type, message, details = {}) => {
	const error = new Error(message);
	error.type = type;
	error.details = details;
	error.timestamp = new Date().toISOString();
	return error;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleResponse = async (response) => {
	try {
		if (!response.ok) {
			const error = createError(ErrorTypes.HTTP, `HTTP error: ${response.status}`, {
				status: response.status,
				statusText: response.statusText,
				url: response.url,
			});

			try {
				const errorData = await response.json();
				error.details.data = errorData;
			} catch (e) {
				const errorText = await response.text();
				error.details.data = errorText;
			}

			sendError(error);
			return null;
		}

		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			try {
				return await response.json();
			} catch (e) {
				const error = createError(ErrorTypes.PARSE, 'Failed to parse JSON response', {
					originalError: e.message,
				});
				sendError(error);
				return null;
			}
		}
		return response.text();
	} catch (error) {
		if (error.name === 'AbortError') {
			const timeoutError = createError(ErrorTypes.TIMEOUT, 'Request timeout', {
				originalError: error.message,
			});
			sendError(timeoutError);
		} else {
			const networkError = createError(ErrorTypes.NETWORK, 'Network error', {
				originalError: error.message,
			});
			sendError(networkError);
		}
		return null;
	}
};

const validateRequest = (url, data) => {
	if (!url) {
		const error = createError(ErrorTypes.VALIDATION, 'URL is empty');
		sendError(error);
		return false;
	}

	if (data && typeof data === 'object') {
		try {
			JSON.stringify(data);
		} catch (e) {
			const error = createError(ErrorTypes.VALIDATION, 'Invalid request data', {
				originalError: e.message,
			});
			sendError(error);
			return false;
		}
	}

	return true;
};

const fetchWithTimeout = async (url, options, timeout) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
};

const retryFetch = async (url, options, retryCount, retryDelay) => {
	let lastError;

	for (let i = 0; i < retryCount; i++) {
		try {
			return await fetchWithTimeout(url, options, DEFAULT_TIMEOUT);
		} catch (error) {
			lastError = error;
			if (i < retryCount - 1) {
				await sleep(retryDelay);
			}
		}
	}

	throw lastError;
};

const get = function (url, data, defaultValue = null, options = {}) {
	return new Promise((resolve) => {
		try {
			if (!validateRequest(url, data)) {
				resolve(defaultValue);
				return;
			}

			if (data) {
				const queryString = new URLSearchParams(data).toString();
				url += url.indexOf('?') >= 0 ? '&' + queryString : '?' + queryString;
			}

			const fetchOptions = {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					...options.headers,
				},
			};

			retryFetch(
				url,
				fetchOptions,
				options.retryCount || DEFAULT_RETRY_COUNT,
				options.retryDelay || DEFAULT_RETRY_DELAY,
			)
				.then(handleResponse)
				.then((result) => resolve(result || defaultValue))
				.catch((error) => {
					sendError(error);
					resolve(defaultValue);
				});
		} catch (err) {
			sendError(err);
			resolve(defaultValue);
		}
	});
};

const post = function (url, data, headers = {}, defaultValue = null, options = {}) {
	return new Promise((resolve) => {
		try {
			if (!validateRequest(url, data)) {
				resolve(defaultValue);
				return;
			}

			const _headers = Object.assign(
				{
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				headers,
				options.headers,
			);

			const fetchOptions = {
				method: 'POST',
				headers: _headers,
				body: data ? JSON.stringify(data) : undefined,
			};

			retryFetch(
				url,
				fetchOptions,
				options.retryCount || DEFAULT_RETRY_COUNT,
				options.retryDelay || DEFAULT_RETRY_DELAY,
			)
				.then(handleResponse)
				.then((result) => resolve(result || defaultValue))
				.catch((error) => {
					sendError(error);
					resolve(defaultValue);
				});
		} catch (err) {
			sendError(err);
			resolve(defaultValue);
		}
	});
};

export { get, post, ErrorTypes };
