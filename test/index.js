#!/usr/bin/env node

import { correctDir } from "./util.js";

correctDir();

async function runTests(paths) {
	for (let path of paths) {
		console.log(`\nTesting ${path}:`);
		await (await import(path)).default();
	}
}

async function main() {
	console.log("Running all tests for Helios...");

	await runTests([
		"./builtins.js",
		"./deserialize-uplc.js",
		"./ed25519.js",
		"./example-scripts.js",
		"./exbudget.js",
		"./inline.js",
		"./metadata.js",
		"./modules.js",
		"./profile.js",
		"./script-addr.js",
		"./simplify.js",
		"./syntax.js",
		"./tx-building.js"
	]);
}

main()
