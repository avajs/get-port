export default { // eslint-disable-line import/no-anonymous-default-export
	files: ['!dist/**'],
	typescript: {
		rewritePaths: {
			'test/': 'dist/test/'
		}
	}
};
