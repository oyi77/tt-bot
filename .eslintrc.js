module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Allow unused variables in function parameters
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Allow underscore prefix for private methods
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    
    // Increase max-len for better readability
    'max-len': ['error', { code: 120, ignoreUrls: true }],
    
    // Allow async/await in loops when necessary
    'no-await-in-loop': 'off',
    
    // Allow for...of loops
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    
    // Allow function declarations
    'func-names': 'off',
    
    // Allow default export
    'import/prefer-default-export': 'off',
    
    // Allow named exports
    'import/no-named-as-default': 'off',
    
    // Allow dynamic requires
    'import/no-dynamic-require': 'off',
    
    // Allow global requires
    'global-require': 'off',
    
    // Allow param reassignment
    'no-param-reassign': ['error', { props: false }],
    
    // Allow camelcase exceptions
    'camelcase': ['error', { properties: 'never', ignoreDestructuring: true }],
    
    // Allow class methods without this
    'class-methods-use-this': 'off',
    
    // Allow empty functions
    'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    
    // Allow multiple empty lines
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    
    // Allow trailing spaces in comments
    'no-trailing-spaces': ['error', { skipBlankLines: true }],
    
    // Allow indentation with 2 spaces
    'indent': ['error', 2, { SwitchCase: 1 }],
    
    // Allow linebreak-style
    'linebreak-style': 'off',
    
    // Allow consistent return
    'consistent-return': 'off',
    
    // Allow arrow body style
    'arrow-body-style': 'off',
    
    // Allow prefer-arrow-callback
    'prefer-arrow-callback': 'off',
    
    // Allow prefer-template
    'prefer-template': 'off',
    
    // Allow prefer-destructuring
    'prefer-destructuring': 'off',
    
    // Allow prefer-const
    'prefer-const': 'error',
    
    // Allow prefer-spread
    'prefer-spread': 'error',
    
    // Allow prefer-rest-params
    'prefer-rest-params': 'error',
    
    // Allow prefer-arrow-callback
    'prefer-arrow-callback': 'off',
    
    // Allow prefer-template
    'prefer-template': 'off',
    
    // Allow prefer-destructuring
    'prefer-destructuring': 'off',
    
    // Allow prefer-const
    'prefer-const': 'error',
    
    // Allow prefer-spread
    'prefer-spread': 'error',
    
    // Allow prefer-rest-params
    'prefer-rest-params': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};
