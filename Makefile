# usage
start: run
setup: dependency install
dependency:
	npm ci
install:
	chmod +x ./bin/index.js
run:
	./bin/index.js

# dev
lint:
	npx eslint .
test:
	npm test -s
test_dev:
	npm test -s -- --watchAll
test_coverage:
	npm test -s -- --coverage

