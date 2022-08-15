#!/usr/bin/env node

import * as helios from "./helios.js";

const helios_ = helios.exportedForTesting;

function simplify(src) {
	let config = {stage: helios.CompilationStage.Simplify, simplify: true};

	let [orig, simplified] = helios.compile(src, config);

	console.log("ORIG:");
	console.log(new helios_.Source(orig).pretty());

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
	false && true
}`);

simplify(`
test concat
func main() -> []Int {
	[]Int{1,2,3} + []Int{4,5,6}
}`);

simplify(`
test concat
func main(a: Int) -> []Int {
	[]Int{a,1,2} + []Int{}
}
`)

simplifyAndRun(`
test value_is_zero
func main(a: Int) -> Bool {
	Value::lovelace(a).is_zero()
}
`);