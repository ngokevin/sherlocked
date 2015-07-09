install:
	@npm install
	@node db.js && sleep 5
	@cp config-local.js.dist config-local.js

test:
	@npm test

travis: install test

start:
	@node_modules/.bin/forever start index.js

deploy:
	@git pull --rebase origin master
	@npm install
	@node_modules/.bin/forever restart index.js
