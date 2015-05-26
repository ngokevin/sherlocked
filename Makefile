test-api:
	@cd api && make travis

test-client:
	@cd client && make travis

test-lib:
	@cd lib && make travis

deploy:
	@cd api && make deploy
	@cd client && make deploy
