import geoip from 'geoip-lite';
import { getGeoCityByCityState } from '../helpers/geo.js';
export function getGeoCityByIp(ip) {
	const ipInfo = geoip.lookup(ip);
	if (ipInfo) {
		return getGeoCityByCityState(ipInfo.city, ipInfo.region);
	}
	return null;
}
