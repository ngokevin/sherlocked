test-api:
	@cd api
	@npm install
	@node db.js
	make test

test-client:
	@cd client
	@make install
	@python -m SimpleHTTPServer
	@sleep 5
	node sherlocked.js

test-lib:
	@cd lib
	@npm install
	make test
