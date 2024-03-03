const favicon = './src/assets/img/logo.png';
//default names
const pageConfig = {
	pages: [
		{
			name: 'index',
			filename: 'index.html',
		}
	],
};
pageConfig.pages.forEach((page) => {
	if (page.name) {
		if (!page.entry) {
			page.entry = `./src/${page.name}.js`;
		}
		if (!page.template) {
			page.template = `./src/${page.name}.html`;
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
