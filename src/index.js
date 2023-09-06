#!/usr/bin/env node

import fs from "fs";
import process from "process";
import { dirname } from "path";

// constituent source files in correct order
const FILES = [
	"config.js",
	"utils.js",
	"tokens.js",
	"crypto.js",
	"cbor.js",
	"uplc-data.js",
	"helios-data.js",
	"uplc-costmodels.js",
	"uplc-builtins.js",
	"uplc-ast.js",
	"uplc-program.js",
	"tokenization.js",
	"eval-common.js",
	"eval-primitives.js",
	"eval-parametric.js",
	"eval-builtin-funcs.js",
	"eval-containers.js",
	"eval-time.js",
	"eval-hashes.js",
	"eval-money.js",
	"eval-tx.js",
	"helios-scopes.js",
	"ir-defs.js",
	"helios-ast-expressions.js",
	"helios-ast-statements.js",
	"helios-ast-build.js",
	"ir-context.js",
	"ir-ast.js",
	"ir-build.js",
	"ir-evaluation.js",
	"ir-optimize.js",
	"ir-program.js",
	"helios-program.js",
	"native.js",
	"tx-builder.js",
	"highlight.js",
	"coinselection.js",
	"wallets.js",
	"network.js",
	"emulator.js",
	"fuzzy-test.js",
	"bundling.js"
];

// build script that bundles all constituents of helios.js // goal: helios.js should be auditable

const RE_TS_CHECK = /^\/\/@ts-check\s*\n/m;

const RE_IMPORT = /^\s*import\s*\{[\s\S]*\}\s*from\s*"\.\/.*.js";.*\n/gm;

const RE_IMPORT_TYPES = /^\s*\*\s*@typedef\s*\{import\("\.\/.*.js"\).*\n/gm;

const RE_EMPTY_JSDOC = /^\s*\/\*\*\s*\n\s*\*\/\s*\n/gm;

const RE_SECTION_TITLE = /^\/\/\s*(.*)\n/im;

const RE_TOP_LEVEL_DEFS = /^(export\s*)?(var|let|const|function|class)\s*([a-zA-Z_0-9]*)\b/gm;

const RE_LAST_WORD = /[a-zA-Z_0-9]*$/;

const INDEX_LEFT_WIDTH = 45;

const WIDTH = 99;

function correctDir() {
	process.chdir(dirname(process.argv[1]));
}

function getPackageJson() {
	return JSON.parse(fs.readFileSync("../package.json").toString());
}

function getLicense() {
	return fs.readFileSync("../LICENSE").toString();
}

function buildHeader(version, licenseType, licenseBody) {
	return `//@ts-check
//////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////      Helios      /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Author:        Christian Schmitz
// Email:         cschmitz398@gmail.com
// Website:       https://www.hyperion-bt.org
// Repository:    https://github.com/hyperion-bt/helios
// Version:       ${version}
// Last update:   ${(new Date()).toLocaleDateString("en-US", {year: 'numeric', month: 'long'})}
// License type:  ${licenseType}
//
//
// About: Helios is a smart contract DSL for Cardano.
//     This Javascript library contains functions to compile Helios sources into Plutus-core.
//     Transactions can also be built using Helios.
//
//
// Dependencies: none
//
//
// Disclaimer: I made Helios available as FOSS so that the Cardano community can test it 
//     extensively. I don't guarantee the library is bug-free, nor do I guarantee
//     backward compatibility with future versions.
//
//
// Example usage:
//     > import * as helios from "helios.js";
//     > console.log(helios.Program.new("spending my_validator ...").compile().serialize());
//     
//
// Documentation: https://www.hyperion-bt.org/helios-book
//
//
// Note: I recommend keeping the Helios library as a single unminified file for optimal 
//     auditability.
//
// 
// License text:
//     ${licenseBody.split("\n").join("\n//     ")}
//
//
// Overview of internals:`;
}

function buildVersionConst(version) {
	return `
/**
 * Current version of the Helios library.
 */
export const VERSION = "${version}";`;
}

class IndexWriter {
	#col;
	#parts;
	#prefix;

	constructor(prefix, title) {
		this.#col = 0;
		this.#parts = [];
		this.#prefix = prefix;

		this.write(prefix);
		this.write(title);
		this.pad();
	}

	write(txt) {
		if (this.#col + txt.length > WIDTH) {
			this.#parts.push("\n");
			this.#col = 0;
			this.write(this.#prefix);
			this.pad();
			this.write(txt);
		} else {
			this.#parts.push(txt);
			this.#col += txt.length;
		}
	}

	pad() {
		if (this.#col < INDEX_LEFT_WIDTH) {
			const n = INDEX_LEFT_WIDTH - this.#col;

			this.#parts.push((new Array(n)).fill(" ").join(""))
			this.#col = INDEX_LEFT_WIDTH;
		}
	}

	string() {
		return this.#parts.join("");
	}
}

function buildIndex(id, src) {
	const m = src.match(RE_SECTION_TITLE);

	const title = m[1];

	const names = src.match(RE_TOP_LEVEL_DEFS).map(m => {
		return m.match(RE_LAST_WORD)[0];
	});

	const writer = new IndexWriter("//     ", `Section ${id+1}: ${title}`);

	names.forEach((name, i) => {
		if (i < names.length - 1) {
			writer.write(name + ", ");
		} else {
			writer.write(name);
		}
	});

	return [title, writer.string()];
}

function processFile(fname, id, src, version) {
	// remove @ts-check comment
	src = src.replace(RE_TS_CHECK, "");

	// remove lines contained import {...} from "./[0-9][0-9].*.js"
	src = src.replace(RE_IMPORT, "");

	// remove lines containing "* @typedef {import(./ ..."
	src = src.replace(RE_IMPORT_TYPES, "");

	// remove empty jsdocs
	src = src.replace(RE_EMPTY_JSDOC, "");

	if (id == 0) {
		// inject const VERSION after title
		const lines = src.split("\n");

		const first = lines.shift();

		lines.unshift(buildVersionConst(version));

		lines.unshift(first);

		src = lines.join("\n");
	}

	try {
		const [title, index] = buildIndex(id, src);

		// add section number to title, along with some filler characters
		const newTitleLine = `// Section ${id+1}: ${title}`;

		const filler = new Array(newTitleLine.length).fill("/").join("");

		src = src.replace(RE_SECTION_TITLE, filler + "\n" + newTitleLine + "\n" + filler + "\n");

		return [index, src];
	} catch (e) {
		console.error(e);
		throw new Error("unable to build index for " + fname);
	}

	
}

function assertAllFilesUsed(files) {
	const actualFiles = fs.readdirSync("./").filter(f => (f != "index.js") && f.endsWith(".js") && !f.startsWith("."));

	actualFiles.sort();

	files = files.slice().sort();

	if (files.length < actualFiles.length) {
		for (let f of actualFiles) {
			if (files.findIndex(f_ => f_ == f) == -1) {
				throw new Error(`${f} not used`);
			}
		}
	}
}

function main() {
	correctDir();

	const files = FILES.slice();

	assertAllFilesUsed(files);

	const packageJson = getPackageJson();
	const version = packageJson.version;
	const licenseType = packageJson.license;
	const licenseBody = getLicense();

	const header = buildHeader(version, licenseType, licenseBody);

	const indexParts = [];
	const srcParts = [];

	files.forEach((f, i) => {
		let src = fs.readFileSync(f).toString();

		const [index, part] = processFile(f, i, src, version);

		indexParts.push(index);
		srcParts.push(part);
	});

	const all = [
		header, 
		indexParts.join("\n//\n"), 
		"//",
		new Array(WIDTH).fill("/").join(""), 
		new Array(WIDTH).fill("/").join(""), 
		"\n",
		srcParts.join("\n\n\n")
	].join("\n");

	fs.writeFileSync("../helios.js", all);
}

main();
