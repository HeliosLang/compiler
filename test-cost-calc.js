#!/usr/bin/env node
//@ts-check
import fs from "fs";
import {exportedForTesting as helios_, NetworkParams} from "./helios.js";

const networkParams = new NetworkParams(JSON.parse(fs.readFileSync("./network-parameters/preview.json").toString()));

let site = helios_.Site.dummy();

function newProgram(term) {
	return new helios_.UplcProgram(term);
}

function newLambda(term) {
	return new helios_.UplcLambda(site, term);
}

function newCall(fn, arg) {
	return new helios_.UplcCall(site, fn, arg);
}

function newCall2(fn, a, b) {
	return newCall(newCall(fn, a), b)
}

function newBuiltin(name) {
	return new helios_.UplcBuiltin(site, name);
}

function newVariable(i) {
	return new helios_.UplcVariable(site, new helios_.UplcInt(site, BigInt(i), false));
}

function newInt(x) {
	return new helios_.UplcConst(new helios_.UplcInt(site, x));
}

async function run(name, program, args) {
	let profile = await program.profile(args, networkParams);

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
