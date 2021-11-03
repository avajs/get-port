export default { // eslint-disable-line import/no-anonymous-default-export
	files: ['!dist/**'],
	typescript: {
		compile: false,
		rewritePaths: {
			'test/': 'dist/test/',
		},
	},
};
