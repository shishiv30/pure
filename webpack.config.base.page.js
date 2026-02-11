const favicon = './client/assets/img/logo.png';
//default names
export const pageConfig = {
	pages: [
		{
			name: 'animation',
			static: true,
		},
		{
			name: 'demo',
		},
		{
			name: 'index',
			static: true,
		},
		{
			name: '3d',
			static: true,
		},
		{
			name: 'about',
			static: true,
		},
		{
			name: 'document',
			static: true,
		},
		{
			name: 'ai-trend',
			static: true,
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
