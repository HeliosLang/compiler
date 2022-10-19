#!/usr/bin/env node

import fs from "fs"; 
import {exec} from "child_process"; 
import process from "process";

function parseVersion(v) {
	if (v.startsWith("v")) {
		v = v.slice(1);
	}

	let parts = v.split(".");

	return parts.map(p => (p != undefined ? parseInt(p) : 0));
}

function compareVersions(va, vb) {
	let a = parseVersion(va);
	let b = parseVersion(vb);

	if (a[0] == b[0]) {
		if (a[1] == b[1]) {
			return a[2] - b[2];
		} else {
			return a[1] - b[1];
		}
	} else {
		return a[0] - b[0];
	}
}

function checkVersion() {
	exec("git tag", (error, stdout, stderr) => {
		if (error) {
			throw error
		} else {
			let tags = stdout.split("\n").filter(t => t != "").map(t => t.startsWith("v") ? t.slice(1) : t); 

			tags.sort(compareVersions);

			let latestTag = tags[tags.length-1];

			let version = JSON.parse(fs.readFileSync("./package.json").toString()).version; 

			let src = fs.readFileSync("./helios.js").toString(); 
			
			let a = src.match(/\/\/ Version:\ *([0-9]+\.[0-9]+\.[0-9]+)/)[1]; 
			let b = src.match(/export const VERSION = \"([0-9]+\.[0-9]+\.[0-9]+)\"/)[1]; 

			if (latestTag != version) {
				throw new Error("package version differs from git tag");
			} else if (a != version) {
				throw new Error("package version differs from helios.js header version");
			} else if (b != version) {
				throw new Error("package version differs from VERSION");
			}
		}
	});
}

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
	let subCommand = process.argv.pop();

	switch (subCommand) {
		case "latest-version":
			checkVersion();
			printLatestVersion();
			break;
		default:
			checkVersion();
	}
}

main();
