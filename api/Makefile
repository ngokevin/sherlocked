install:
	@npm install
	@node db.js && sleep 5

test:
	@SHERLOCKED_TEST_DB=testdb.sqlite node_modules/.bin/mocha test.js

travis: install test

start:
	@node_modules/.bin/forever start index.js
