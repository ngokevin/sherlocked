install:
	@npm install
	@node db.js

test:
	@SHERLOCKED_TEST_DB=testdb.sqlite node_modules/.bin/mocha test.js

travis: install test

start:
	@node_modules/.bin/forever start index.js
