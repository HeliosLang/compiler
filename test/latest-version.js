#!/usr/bin/env node

import { exec } from "child_process"; 
import { compareVersions } from "./check-version.js";

function printLatestVersion() {
	exec("git tag", (error, stdout, stderr) => {
		if (error) {
			throw error
		} else {
			let tags = stdout.split("\n").filter(t => t != "").map(t => t.startsWith("v") ? t.slice(1) : t); 

			tags.sort(compareVersions);

			let latestTag = tags[tags.length-1];

			console.log(latestTag);
		}
	});
}

function main() {
	printLatestVersion();
}

main();
