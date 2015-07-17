install:
	@npm install
	@node_modules/.bin/gulp build

sherlocked:
	@cd src && python -m SimpleHTTPServer &
	@sleep 5 && node sherlocked.js

travis: install sherlocked

deploy:
	@git pull --rebase origin master
	@npm install
	@NODE_ENV=production node_modules/.bin/gulp build
