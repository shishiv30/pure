const favicon = './src/assets/img/logo.png';
//default names
const pageConfig = {
	pages: [
		{
			name: 'animation',
		},
		{
			name: 'sap',
		},
		{
			name: 'index',
		},
		{
			name: '3d'
		}
	],
};
pageConfig.pages.forEach((page) => {
	if (page.name) {
		if (!page.entry) {
			page.entry = `./src/pages/${page.name}/index.js`;
		}
		if (!page.template) {
			page.template = `./src/pages/${page.name}/index.html`;
		}
		if (!page.chunks) {
			page.chunks = [page.name];
		}
		if (!page.favicon) {
			page.favicon = favicon;
		}
		if (!page.filename) {
			page.filename = `${page.name}.html`;
		}
	}
});

export default pageConfig;
