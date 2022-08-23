#!/usr/bin/env node

import * as helios from "./helios.js";

const helios_ = helios.exportedForTesting;

let site = helios_.Site.dummy();

function newProgram(term) {
	return new helios_.PlutusCoreProgram(term);
}

function newLambda(term) {
	return new helios_.PlutusCoreLambda(site, term);
}

function newCall(fn, arg) {
	return new helios_.PlutusCoreCall(site, fn, arg);
}

function newCall2(fn, a, b) {
	return newCall(newCall(fn, a), b)
}

function newBuiltin(name) {
	return new helios_.PlutusCoreBuiltin(site, name);
}

function newVariable(i) {
	return new helios_.PlutusCoreVariable(site, new helios_.PlutusCoreInt(site, BigInt(i), false));
}

function newInt(x) {
	return new helios_.PlutusCoreConst(new helios_.PlutusCoreInt(site, x));
}

async function run(name, program, args) {
	let profile = await program.profile(args);

	console.log(`${name} (mem: ${profile.mem}, cpu: ${profile.cpu}, size: ${profile.size})`);
}


async function main() {
	// expected memCost: 200, expected cpuCost: 23100
	await run("add1",
		newProgram(
			newLambda( 
				newLambda(
					newCall2(
						newBuiltin("addInteger"),
						newCall2(newBuiltin("addInteger"), newVariable(2), newVariable(1)),
						newInt(1n)
					)
				)
			)
		),
		null
	)

	// expected memCost: 3710, expected cpuCost: 1860485
	await run("add-lambda",
		newProgram(
			newCall(
				newLambda(
					newCall2(
						newBuiltin("addInteger"),
						newCall2(
							newVariable(1),
							newInt(12n),
							newInt(32n)
						),
						newCall2(
							newVariable(1),
							newInt(5n),
							newInt(4n)
						)
					)
				),
				newLambda(
					newLambda(
						newCall2(
							newBuiltin("addInteger"),
							newCall2(
								newBuiltin("addInteger"),
								newVariable(2),
								newVariable(1)
							),
							newInt(1n)
						)
					)
				)
			)
		),
		null
	)
}

void main();