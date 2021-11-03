export default { // eslint-disable-line import/no-anonymous-default-export
	files: ['!dist/**'],
	nonSemVerExperiments: {
		sharedWorkers: true,
	},
	typescript: {
		rewritePaths: {
			'test/': 'dist/test/',
		},
	},
};
