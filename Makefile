# usage
start: run
setup: dependency install
dependency:
	npm ci
install:
	chmod +x ./bin/index.js
run:
	NODE_ENV=local ./bin/index.js

# dev
lint:
	npx eslint .
test:
	NODE_ENV=test npm test -s
test_dev:
	NODE_ENV=test npm test -s -- --watchAll
test_coverage:
	NODE_ENV=test npm test -s -- --coverage

