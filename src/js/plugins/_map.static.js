import { emit } from '../core/event.js';
function loadImg(img) {
	let $img = $(img);
	let imgSrc = $img.dataset.map;
	if (imgSrc) {
		$.loadImg($img, imgSrc);
	}
	$img.remov.dataset.map;
}
function setImg(img, src) {
	let $img = $(img);
	$img.attr('data-map', src);
	if (window.IntersectionObserver) {
		if (!window.observerMap) {
			const options = {
				rootMargin: '0% 0% 0% 0%',
				threshold: 0,
			};
			window.observerMap = new IntersectionObserver(function (entries) {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) {
						return;
					}
					loadImg(entry.target);
					window.observer.unobserve(entry.target);
				});
			}, options);
		}
		window.observerMap.observe(img);
	} else {
		loadImg(img);
	}
}
let iconType = {
	home: 0,
	heart: 2,
	poiSchool: 1,
	//poi pins
	poiBank: 116,
	poiWorship: 115,
	poiRecreation: 113,
	poiTransportHub: 111,
	poiGas: 110,
	poiTexi: 109,
	poiTransportation: 108,
	poiGrocery: 106,
	poiCafe: 104,
	poiRestaurant: 103,
	poiBar: 102,
	poiShopping: 117,
};
let getIconUrl = function (type) {
	let url = '';
	switch (type * 1) {
		case iconType.home:
			url = 'img/pin/homeicon.png';
			break;
		case iconType.school:
			url = 'img/pin/schoolicon.png';
			break;
		case iconType.schoolred:
			url = 'img/pin/red_school.png';
			break;
		case iconType.heart:
			url = 'img/pin/favorite.png';
			break;
		case iconType.condored:
			url = 'img/pin/red_condo.png';
			break;
		case iconType.condoblue:
			url = 'img/pin/blue_condo.png';
			break;
		case iconType.condogreen:
			url = 'img/pin/green_condo.png';
			break;
		case iconType.condogray:
			url = 'img/pin/black_condo.png';
			break;
		case iconType.condoyellow:
			url = 'img/pin/yellow_condo.png';
			break;
		case iconType.singlered:
			url = 'img/pin/red_single.png';
			break;
		case iconType.singleblue:
			url = 'img/pin/blue_single.png';
			break;
		case iconType.singlegreen:
			url = 'img/pin/green_single.png';
			break;
		case iconType.singlegray:
			url = 'img/pin/black_single.png';
			break;
		case iconType.singleyellow:
			url = 'img/pin/yellow_single.png';
			break;
		case iconType.poiBank:
			url = 'img/pin/poi-bank.png';
			break;
		case iconType.poiWorship:
			url = 'img/pin/poi-worship.png';
			break;
		case iconType.poiRecreation:
			url = 'img/pin/poi-recreation.png';
			break;
		case iconType.poiTransportHub:
			url = 'img/pin/poi-train.png';
			break;
		case iconType.poiGas:
			url = 'img/pin/poi-gas.png';
			break;
		case iconType.poiTexi:
			url = 'img/pin/poi-taxi.png';
			break;
		case iconType.poiTransportation:
			url = 'img/pin/poi-transportation.png';
			break;
		case iconType.poiGrocery:
			url = 'img/pin/poi-grocery.png';
			break;
		case iconType.poiCafe:
			url = 'img/pin/poi-cafe.png';
			break;
		case iconType.poiRestaurant:
			url = 'img/pin/poi-restaurant.png';
			break;
		case iconType.poiBar:
			url = 'img/pin/poi-bar.png';
			break;
		case iconType.poiShopping:
			url = 'img/pin/poi-shopping.png';
			break;
		case iconType.comericialorange:
			url = 'img/pin/property_orange_commercial.png';
			break;
		case iconType.condoorange:
			url = 'img/pin/property_orange_condo.png';
			break;
		case iconType.lotlandorange:
			url = 'img/pin/property_orange_lot_land.png';
			break;
		case iconType.mobilehomeorange:
			url = 'img/pin/property_orange_mobile_home.png';
			break;
		case iconType.otherorange:
			url = 'img/pin/property_orange_other.png';
			break;
		case iconType.singleorange:
			url = 'img/pin/property_orange_single_family.png';
			break;
		case iconType.multifamilyorange:
			url = 'img/pin/property_orange_multi_family.png';
			break;
		default:
			url = type;
	}
	return url;
};
let getIcon = function (type) {
	let icon = {
		url: window.location.hostname,
	};
	switch (type) {
		case iconType.home:
			icon.size = new window.google.maps.Size(32, 48);
			icon.origin = new window.google.maps.Point(0, 0);
			icon.anchor = new window.google.maps.Point(18, 48);
			break;
		case iconType.school:
		case iconType.poiBank:
		case iconType.poiWorship:
		case iconType.poiRecreation:
		case iconType.poiTransportHub:
		case iconType.poiGas:
		case iconType.poiTexi:
		case iconType.poiTransportation:
		case iconType.poiGrocery:
		case iconType.poiCafe:
		case iconType.poiRestaurant:
		case iconType.poiBar:
		case iconType.poiShopping:
			icon.size = new window.google.maps.Size(36, 48);
			icon.origin = new window.google.maps.Point(0, 0);
			icon.anchor = new window.google.maps.Point(18, 48);
			break;
		case iconType.comericialorange:
		case iconType.condoorange:
		case iconType.lotlandorange:
		case iconType.mobilehomeorange:
		case iconType.otherorange:
		case iconType.singleorange:
		case iconType.multifamilyorange:
			icon.size = new window.google.maps.Size(48, 64);
			icon.origin = new window.google.maps.Point(0, 0);
			icon.anchor = new window.google.maps.Point(24, 64);
			break;
		default:
			icon.size = new window.google.maps.Size(30, 44);
			icon.origin = new window.google.maps.Point(0, 0);
			icon.anchor = new window.google.maps.Point(14, 44);
			break;
	}

	icon.url += getIconUrl(type);
	if (type === iconType.home) {
		icon.zIndex = 998; //cannot large than 999, the pop panel cannot cover the pin
	}
	return icon;
};
let streetViewCheckList = {};
let hasStreetView = function (opt) {
	let key = null;
	if (opt.address) {
		key = encodeURIComponent(opt.address);
	} else if (opt.lat && opt.lng) {
		key = opt.lat + ',' + opt.lng;
	} else {
		return opt.callback(false);
	}
	if (streetViewCheckList[key] !== undefined) {
		if (streetViewCheckList[key] !== 'loading') {
			return opt.callback(streetViewCheckList[key]);
		}
		one('hasStreetView.' + key, function (e, hasStreetView) {
			opt.callback(hasStreetView);
		});
	} else {
		streetViewCheckList[key] = 'loading';
		let metaDataUrl =
			'https://maps.googleapis.com/maps/api/streetview/metadata?location=' +
			key +
			'&' +
			opt.googleMapKey;
		let data = {
			url: metaDataUrl,
		};
		$.get(data.url, function (res) {
			streetViewCheckList[key] = res && res.status === 'OK';
			opt.callback(streetViewCheckList[key]);
			emit('hasStreetView.' + key, [streetViewCheckList[key]]);
		});
	}
};
export default {
	name: 'gsmap',
	defaultOpt: {
		lat: 0,
		lng: 0,
		address: null,
		zoom: 8,
		type: 'terrain',
		icon: '',
		markers: [],
		width: 300,
		height: 300,
		lazyload: true,
		autoresize: true,
		onload: null,
		polylinedata: null,
		fillcolor: null,
		switchmaptype: 'terrain',
		removedTarget: null,
		googleMapKey: null,
	},
	init: function ($this, opt, exportObj) {
		opt.googleMapKey = opt.googleMapKey || window.googleMapKey;
		let insertMap = function (mapUrl) {
			if (!mapUrl) {
				return;
			}
			mapUrl = 'https://maps.googleapis.com' + mapUrl;
			if (opt.lazyload) {
				setImg(mapUrl);
			} else {
				$.loadImg($this, mapUrl);
			}
		};
		let setGSMapParams = function () {
			let mapUrl;
			mapUrl = '/maps/api/staticmap?';
			if (opt.address) {
				mapUrl += 'center=' + encodeURIComponent(opt.address);
			} else if (opt.lat && opt.lng) {
				mapUrl += 'center=' + opt.lat + ',' + opt.lng;
			}
			mapUrl += '&maptype=' + opt.type;
			if (opt.zoom && !opt.polylinedata && opt.zoom != -1) {
				mapUrl += '&zoom=' + opt.zoom;
			}
			if (opt.markers && opt.markers.length) {
				$.each(opt.markers, function (item, index) {
					let iconStr = '';
					if (opt.icon && opt.icon.length) {
						let realUrl = getIconUrl(opt.icon[Math.min(index, opt.icon.length - 1)]);
						iconStr = 'icon:' + encodeURIComponent(realUrl + '|');
					}
					mapUrl += '&markers=' + iconStr + encodeURIComponent(item);
				});
			}
			if (opt.fillcolor) {
				if (opt.polylinedata) {
					mapUrl += encodeURIComponent(
						'&path=fillcolor:' +
						opt.fillcolor +
						'|color:0xFFFFFF00|enc:' +
						opt.polylinedata,
					);
				} else {
					mapUrl += '&path=fillcolor:' + opt.fillcolor;
				}
			}
			let _width = opt.width || $this.width();
			let _height = opt.height || $this.height();
			mapUrl += '&size=' + _width + 'x' + _height;
			mapUrl += '&' + opt.googleMapKey;
			return mapUrl;
		};
		let initialGStaticStreetView = function (hasSteetView) {
			if (hasSteetView) {
				let streetviewUrl = '/maps/api/streetview?location=';
				let _width = opt.width || $this.width();
				let _height = opt.height || $this.height();
				if (opt.address) {
					streetviewUrl += encodeURIComponent(opt.address);
				} else if (opt.lat && opt.lng) {
					streetviewUrl += opt.lat + ',' + opt.lng;
				}
				streetviewUrl += '&size=' + _width + 'x' + _height;
				streetviewUrl += '&' + opt.googleMapKey;
				insertMap(streetviewUrl);
			} else {
				opt.onError && emit(opt.onError, $this, opt, exportObj);

				if (opt.removedTarget) {
					let $removedTarget = $(opt.removedTarget);
					$removedTarget.remove();
					emit('dom.resize');
				}
				if (opt.switchmaptype) {
					opt.type = opt.switchmaptype;
					insertMap(setGSMapParams());
				}
			}
		};
		exportObj.reload = function () {
			if (opt.type === 'streetview') {
				hasStreetView({
					address: opt.address,
					lat: opt.lat,
					lng: opt.lng,
					callback: initialGStaticStreetView,
				});
			} else {
				let url = setGSMapParams();
				insertMap(url);
			}
			opt.onload && emit(opt.onload, $this, opt, exportObj);
		};
		exportObj.reload();
	},
	setOptionsBefore: function (context, options) {
		options.icon = options.icon ? options.icon.split('|') : null;
		options.markers = options.markers ? options.markers.split('|') : [];
	},
	setOptionsAfter: null,
	initBefore: null,
	initAfter: function ($this, opt, exportObj) {
		if (opt.autoresize) {
			$(document).addEventListener('dom.resize', function () {
				exportObj.reload();
			});
		}
	},
	destroyBefore: null,
};
// $.cui.plugin(gsmapConfig);
// $(document).addEventListener('dom.load.gsmap', function () {
//     $('[data-gsmap]').forEach(function (item, index) {
//         let $this = $item;
//         let data = $this.data();
//         $this.remov.dataset.gsmap;
//         $this.gsmap(data);
//         $this.attr('data-gsmap-load', '');
//     });
// });
