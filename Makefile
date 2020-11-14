# usage
start: run
setup: dependency install
dependency:
	npm ci
build:
	npm run build

# local run
run-heroku:
	NODE_ENV=development heroku local web
run:
	NODE_ENV=development ./bin/index.js

# dev
install:
	chmod +x ./bin/index.js
lint:
	npx eslint .
test:
	NODE_ENV=test npm test -s
test_dev:
	NODE_ENV=test npm test -s -- --watchAll
test_coverage:
	NODE_ENV=test npm test -s -- --coverage

