// script lib - event
const eventList = {};
const eventNames = ['click'];
import { logError } from './log.js';

const on = function (str, cb, opts) {
	if (!cb || typeof cb !== 'function') {
		logError('call back is not a function');
		return;
	}
	let events = str.split(' ');
	let options = opts || false;
	events = events.map((event) => {
		return event.split('.');
	});
	events.forEach((event) => {
		let [name, namespace] = event;
		namespace = namespace || 'DEFAULT';
		if (!eventList[name]) {
			eventList[name] = {};
		}
		if (!eventList[name][namespace]) {
			eventList[name][namespace] = [];
		}
		if (eventNames.indexOf(name) === -1) {
			eventList[name][namespace].push(cb);
		} else {
			window.addEventListener(name, cb, options);
		}
	});
};

const once = function (str, cb) {
	on(str, cb, { once: true });
};

const off = function (str) {
	let events = str.split(' ');
	events = events.map((event) => {
		return event.split('.');
	});
	events.forEach((event) => {
		let [name, namespace] = event;
		namespace = namespace || 'DEFAULT';
		if (!eventList[name]) {
			return;
		}
		if (!eventList[name][namespace]) {
			return;
		}
		if (eventNames.indexOf(name) === -1) {
			delete eventList[name][namespace];
		} else {
			eventList[name][namespace].forEach((cb) => {
				window.removeEventListener(name, cb);
			});
		}
	});
};
const emit = function (str, data) {
	let events = str.split(' ');
	events = events.map((event) => {
		return event.split('.');
	});
	events.forEach((event) => {
		let [name, namespace] = event;
		namespace = namespace || 'DEFAULT';
		if (!eventList[name]) {
			logError('event ' + name + ' is not exist');
			return;
		}
		let params = Array.isArray(data) ? data : [data];
		if (namespace === 'DEFAULT') {
			for (let key in eventList[name]) {
				eventList[name][key].forEach((cb) => {
					cb.apply(this, params);
				});
			}
		} else if (!eventList[name][namespace]) {
			logError('event ' + event + ' is not exist');
		} else {
			eventList[name][namespace].forEach((cb) => {
				cb.apply(this, params);
			});
		}
	});
};

export { on, once, off, emit };
