publish: check-version generate-types
	npm publish .

generate-types:
	npx tsc

check-version:
	node ./check-version.js