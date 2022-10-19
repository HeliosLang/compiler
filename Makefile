publish: check-version generate-types
	npm publish .

generate-types:
	npx tsc

check-version:
	node ./check-version.js

publish-aws:
	aws s3 cp ./helios.js s3://helios-library/$(shell ./check-version.js latest-version)/
