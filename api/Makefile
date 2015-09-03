install:
	@npm install
	@npm run migrate
	@cp config-local.js.dist config-local.js

test:
	@npm test

travis: install test

start:
	@node_modules/.bin/forever -c "node_modules/.bin/babel-node --stage 1" start index.js

deploy:
	@git pull --rebase origin master
	@npm install
	@node_modules/.bin/forever -c "node_modules/.bin/babel-node --stage 1" restart index.js
