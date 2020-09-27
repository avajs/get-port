module.exports = {
	rules: {
		'@typescript-eslint/prefer-readonly-parameter-types': 'off',
		'no-void': 'off'
	},
	overrides: [
		{
			files: '**/*.ts',
			rules: {
				'@typescript-eslint/no-floating-promises': ['error', {ignoreVoid: true}]
			}
		}
	]
};
