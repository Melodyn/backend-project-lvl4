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
	NODE_ENV=development nodemon ./bin/index.js

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
migrations_up:
	DB_TYPE=sqlite3 DB_NAME=task_manager.sqlite npx knex --esm migrate:up
migrations_down:
	DB_TYPE=sqlite3 DB_NAME=task_manager.sqlite npx knex --esm migrate:down

postgres:
	docker rm postgres || true
	docker run --rm --name postgres -it -p 5432:5432 \
		-e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -e POSTGRES_DB=task_manager \
		-d postgres:12 || true
