import config from '../config.js';

const APP_URL = config.appUrl || '';

const COMPONENT_NAME = 'scrollview';
const COMPONENT_TEMPLATE = 'comp_scrollview';

const scrollviewData = {
	links: [
		{ href: `${APP_URL}/demo/ny/new-york`, text: 'New York, NY homes for sale' },
		{ href: `${APP_URL}/demo/tx/san-antonio`, text: 'San Antonio, TX homes for sale' },
		{ href: `${APP_URL}/demo/tx/houston`, text: 'Houston, TX homes for sale' },
		{ href: `${APP_URL}/demo/nv/las-vegas`, text: 'Las Vegas, NV homes for sale' },
		{ href: `${APP_URL}/demo/fl/miami`, text: 'Miami, FL homes for sale' },
		{ href: `${APP_URL}/demo/il/chicago`, text: 'Chicago, IL homes for sale' },
		{ href: `${APP_URL}/demo/fl/orlando`, text: 'Orlando, FL homes for sale' },
		{ href: `${APP_URL}/demo/tx/austin`, text: 'Austin, TX homes for sale' },
		{ href: `${APP_URL}/demo/tx/dallas`, text: 'Dallas, TX homes for sale' },
		{ href: `${APP_URL}/demo/fl/ocala`, text: 'Ocala, FL homes for sale' },
		{ href: `${APP_URL}/demo/fl/naples`, text: 'Naples, FL homes for sale' },
		{ href: `${APP_URL}/demo/ga/atlanta`, text: 'Atlanta, GA homes for sale' },
		{ href: `${APP_URL}/demo/nc/charlotte`, text: 'Charlotte, NC homes for sale' },
		{ href: `${APP_URL}/demo/ca/los-angeles`, text: 'Los Angeles, CA homes for sale' },
		{ href: `${APP_URL}/demo/pa/philadelphia`, text: 'Philadelphia, PA homes for sale' },
		{ href: `${APP_URL}/demo/fl/cape-coral`, text: 'Cape Coral, FL homes for sale' },
		{ href: `${APP_URL}/demo/fl/sarasota`, text: 'Sarasota, FL homes for sale' },
		{ href: `${APP_URL}/demo/az/tucson`, text: 'Tucson, AZ homes for sale' },
		{ href: `${APP_URL}/demo/sc/myrtle-beach`, text: 'Myrtle Beach, SC homes for sale' },
		{ href: `${APP_URL}/demo/ca/bakersfield`, text: 'Bakersfield, CA homes for sale' },
		{ href: `${APP_URL}/demo/fl/tampa`, text: 'Tampa, FL homes for sale' },
		{ href: `${APP_URL}/demo/fl/jacksonville`, text: 'Jacksonville, FL homes for sale' },
		{ href: `${APP_URL}/demo/az/phoenix`, text: 'Phoenix, AZ homes for sale' },
		{ href: `${APP_URL}/demo/tn/nashville`, text: 'Nashville, TN homes for sale' },
		{ href: `${APP_URL}/demo/fl/boca-raton`, text: 'Boca Raton, FL homes for sale' },
		{ href: `${APP_URL}/demo/tx/el-paso`, text: 'El Paso, TX homes for sale' },
		{ href: `${APP_URL}/demo/fl/pensacola`, text: 'Pensacola, FL homes for sale' },
		{ href: `${APP_URL}/demo/fl/kissimmee`, text: 'Kissimmee, FL homes for sale' },
		{ href: `${APP_URL}/demo/mi/detroit`, text: 'Detroit, MI homes for sale' },
		{ href: `${APP_URL}/demo/ny/brooklyn`, text: 'Brooklyn, NY homes for sale' },
	],
};

/**
 * Create the scrollview UI component config.
 * @returns {{ name: string, template: string, data: object }}
 */
export function createScrollviewComponent() {
	return {
		name: COMPONENT_NAME,
		template: COMPONENT_TEMPLATE,
		data: scrollviewData,
	};
}
