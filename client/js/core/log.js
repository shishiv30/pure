// script lib - console log
const isDev = () => {
	if (typeof window === 'undefined') {
		return false;
	}
	return window.location.protocol === 'http:';
};

const logError = (data) => {
	if (isDev()) {
		console.error(data);
	}
};

const logInfo = (data) => {
	if (isDev()) {
		console.info(data);
	}
};

export { logError, logInfo };
