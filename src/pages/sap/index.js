import { defBool, defEnum } from '../../js/core/def.js';
import { Plugin } from '../../js/core/plugin.js';
import { main } from '../../js/index.js';
import { router } from '../../js/core/router.js';
// eslint-disable-next-line no-unused-vars
import scss from '../../scss/sap.scss';
const boolStatus = ['lock', 'collapse'];
const defBoolStatus = function (status, $el, opt, exportObj) {
	status.forEach((name) => {
		defBool(name, $el, opt, exportObj);
	});
};

const enumStatus = [
	{
		key: 'view',
		names: ['grid', 'detail', 'index'],
	},
];
const defEnumStatus = function (status, $el, opt, exportObj) {
	status.forEach((e) => {
		defEnum(e.key, e.names, $el, opt, exportObj);
	});
};

let sap = {
	name: 'sap',
	init: function ($el, opt, exportObj) {
		defBoolStatus(boolStatus, $el, opt, exportObj);
		defEnumStatus(enumStatus, $el, opt, exportObj);
	    let tmp = new router([
			{
				reg: /^\/(sap|sap.html)$/i, 
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToGrid();
						resolve(null) ;
					});
				},
			},
			{
				reg: /^\/sap\/detail\/(\w+)/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToDetail();
						resolve(null);
					});
				},
			},
			{
				reg: /^\/sap\/index/i,
				loading: () => {
					return new Promise((resolve) => {
						exportObj.switchToIndex();
						resolve(null);
					});
				},
			}
		]);
	},
	load: function ($el, opt, exportObj) {
		return new Promise((resolve) => {
			setTimeout(() => {
				if (opt && opt.data) {
					Object.assign(exportObj, opt.data);
				}
				resolve(exportObj);
			}, 1000);
		});
	},
	render: function ($el, opt, exportObj) {
		function switchNavButton($this){
			document.querySelectorAll('.nav-button > .active').forEach((item) => {
				item.classList.remove('active');
			});
			$this.classList.add('active');
		}
		document.getElementById('switchToDetail').addEventListener('click', (e) => {
			switchNavButton(e.target);
			exportObj.switchToDetail();
		});
		document.getElementById('switchToGrid').addEventListener('click', (e) => {
			switchNavButton(e.target);
			exportObj.switchToGrid();
		});
		document.getElementById('switchToIndex').addEventListener('click', (e) => {
			switchNavButton(e.target);
			exportObj.switchToPhoto();
		});
	},
};

export default (function (win) {
	main(win, sap);
})(window);
