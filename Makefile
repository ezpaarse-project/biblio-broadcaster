.PHONY: help clean build chown

.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## install depedencies thanks to a dockerized npm install
	@docker run -it --rm -v $$(pwd):/app -w /app --net=host -e NODE_ENV -e http_proxy -e https_proxy node:6.9.4 npm install
	@make chown

build: ## build the docker image ezpaarseproject/biblio-broadcaster localy
	@docker-compose build biblio-broadcaster

run-debug: ## run biblio-broadcaster in debug mode with docker
	@docker-compose -f ./docker-compose.debug.yml up

run-prod: ## run biblio-broadcaster in production mode with the full dockerized image (see build)
	@docker-compose -f ./docker-compose.yml up -d

# makefile rule used to keep current user's unix rights on the docker mounted files
chown:
	@test ! -d $$(pwd)/node_modules || docker run -it --rm -v $$(pwd):/app node:6.9.4 chown -R $$(id -u):$$(id -g) /app/

clean: ## remove node_modules and temp files
	@rm -Rf ./node_modules/ ./npm-debug.log

version-major: ## create a new major version
	@npm version major
version-minor: ## create a new minor version
	@npm version minor
version-patch: ## create a new patch version
	@npm version patch

