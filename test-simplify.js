#!/usr/bin/env node

import * as helios from "./helios.js";

const helios_ = helios.exportedForTesting;

function simplify(src) {
	let config = {stage: helios.CompilationStage.Simplify, simplify: true};

	let [orig, simplified] = helios.compile(src, config);

	console.log("ORIG:");
	console.log(orig);

	console.log("\nSIMPLIFIED:");
	console.log(simplified);
}

simplify(`
test add
func main(a: Int) -> Int {
	if (true) {
  		print("blablal" + "balbalb"); 1 + 1/2 + a
	} else {
		2
	}
}`);

simplify(`
test and
func main() -> Bool {
	true && true
}`);
