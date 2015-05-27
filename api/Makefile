install:
	@npm install
	@node db.js && sleep 5
	@cp config-local.js.dist config-local.js

test:
	@SHERLOCKED_TEST_DB=testdb.sqlite node_modules/.bin/mocha test.js

travis: install test

start:
	@node_modules/.bin/forever start index.js

deploy:
	@git pull --rebase origin master
	@node_modules/.bin/forever restart index.js
