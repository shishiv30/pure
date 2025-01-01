import { formatClassToStatus } from './format.js';
import { trigger } from '../core/event.js';

/**
 * base on provided key, the made an element could switch between true and false status.
 * @param {*} name the key name will be used to store the current status
 * @param {*} $el the element will support the className ${name}
 * @param {*} opt  the options will include beforeAddName, afterAddName, beforeRemoveName, afterRemoveName
 * @param {*} exportObj  the object will be injected with the following methods addName, removeName, toggleName, isName
 */
export function defBool(name, $el, opt, exportObj) {
	//name first letter to upper case
	let statusName = formatClassToStatus(name);
	let eventName = statusName.charAt(0).toUpperCase() + statusName.slice(1);
	exportObj[`add${eventName}`] = () => {
		opt[`beforeAdd${eventName}`] && trigger(opt[`beforeAdd${eventName}`], $el, opt, exportObj);
		$el.classList.add(name);
		exportObj[statusName] = true;
		opt[`afterAdd${eventName}`] && trigger(opt[`afterAdd${eventName}`], $el, opt, exportObj);
	};
	exportObj[`remove${eventName}`] = () => {
		opt[`beforeRemove${eventName}`] &&
			trigger(opt[`beforeRemove${eventName}`], $el, opt, exportObj);
		$el.classList.remove(name);
		exportObj[statusName] = false;
		opt[`afterRemove${eventName}`] &&
			trigger(opt[`afterRemove${eventName}`], $el, opt, exportObj);
	};

	exportObj[`toggle${eventName}`] = () => {
		if ($el.classList.contains(name)) {
			exportObj[`remove${eventName}`]();
		} else {
			exportObj[`add${eventName}`]();
		}
	};

	exportObj[`is${eventName}`] = () => {
		return $el.classList.contains(name);
	};
}

/**
 * base on provided key and possible values, the made an element could switch diff status.
 * @param {*} key the key name will be used to store the current status
 * @param {*} names the value could be switched to like ['nameA', 'nameB', 'nameC']
 * @param {*} $el the element will support the className ${key}-${nameA}, ${key}-${nameB}, ${key}-${nameC}
 * @param {*} opt  the options will include beforeSwitchToNameA, afterSwitchToNameA
 * @param {*} exportObj  the object will be injected with the following methods switchToNameA, switchToNameB, switchToNameC ...
 */
export function defEnum(key, names, $el, opt, exportObj) {
	let statusName = formatClassToStatus(key);
	names.forEach((name, index) => {
		let statusValue = formatClassToStatus(name);
		let eventName = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);

		exportObj[`switchTo${eventName}`] = () => {
			if (name != exportObj[statusName]) {
				opt[`beforeSwitchTo${eventName}`] &&
					trigger(opt[`beforeSwitchTo${eventName}`], $el, opt, exportObj);
				names.forEach((item, index) => {
					if (item !== name) {
						$el.classList.remove(`${key}-${item}`);
					} else {
						$el.classList.add(`${key}-${item}`);
						exportObj[statusName] = item;
					}
				});
				opt[`afterSwitchTo${eventName}`] &&
					trigger(opt[`afterSwitchTo${eventName}`], $el, opt, exportObj);
			}
		};
	});
	exportObj[`current${formatClassToStatus(key)}`] = () => {
		return exportObj[statusName];
	};
}
