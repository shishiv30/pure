const favicon = './client/assets/img/logo.png';
//default names
const pageConfig = {
	pages: [
		{
			name: 'animation',
		},
		{
			name: 'demo',
		},
		{
			name: 'index',
		},
		{
			name: '3d',
		},
		{
			name: 'about',
		},
	],
};
pageConfig.pages.forEach((page) => {
	if (page.name) {
		if (!page.entry) {
			page.entry = `./client/pages/${page.name}/index.js`;
		}
		if (!page.template) {
			page.template = `./client/pages/${page.name}/index.html`;
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
