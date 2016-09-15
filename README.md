# Why? [![Build Status](https://travis-ci.org/davidlondono/babel-boilerplate-module.svg?branch=master)](https://travis-ci.org/davidlondono/babel-boilerplate-module)
:page_with_curl: Boilerplate for npm/node module. Write with ES6 and ES7 - have compatibility `node > 5`.

This boilerplate is for people who want write code using all ES6 and ES7 features ( and stage-3 ) but also want/need backwards compatibility with old node versions. 

# Features
* Build with [Babel](https://babeljs.io). (ES7 -> ES5)
* Test with [mocha](https://mochajs.org).
* Check with [eslint](eslint.org).
* Deploy with [Travis](travis-ci.org).

# Commands
- `npm run pretest` - Hook for test. Run the lint before the test run 
- `npm run clean` - Remove `./lib` directory
- `npm test` - Run tests. Tests can be written with ES7
- `npm test:watch` - You can even re-run tests on file changes!
- `npm run lint` - Run Lint of ESLint with [airbnb-config](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb) rules
- `npm run test:examples` - We recommend writing examples on pure JS for better understanding module usage.
- `npm run build` - Create the ES5 on ./lib` of the ES7 of `./src`
- `npm run watch:babel` - watch changes of files on `./src` to compile them on real time
- `npm run postinstall` - Hook to compile after the module is installed

# Installation
Just clone this repo and remove `.git` folder.
