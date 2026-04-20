NODE_PATH := /opt/homebrew/bin
BASE_PATH ?= /study-manager
PREVIEW_HOST ?= 127.0.0.1
PREVIEW_PORT ?= 4173
NVM_DIR ?= $(HOME)/.nvm
NVM_USE = export NVM_DIR="$(NVM_DIR)"; . "$$NVM_DIR/nvm.sh"; nvm use >/dev/null &&

.PHONY: dev build preview preview-deploy test

dev:
	PATH=$(NODE_PATH):$$PATH npm run dev

build:
	PATH=$(NODE_PATH):$$PATH BASE_PATH=$(BASE_PATH) npm run build

preview:
	PATH=$(NODE_PATH):$$PATH BASE_PATH= npm run build
	PATH=$(NODE_PATH):$$PATH npm run preview -- --host $(PREVIEW_HOST) --port $(PREVIEW_PORT)

preview-deploy: build
	PATH=$(NODE_PATH):$$PATH npm run preview -- --host $(PREVIEW_HOST) --port $(PREVIEW_PORT)

test:
	$(NVM_USE) npm run test:unit -- --run
