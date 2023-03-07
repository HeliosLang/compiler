#!/usr/bin/env node
//@ts-check

import * as helios from "../helios.js";
import { runIfEntryPoint } from "./util.js";

const DUMMY_PKH = "00112233445566778899001122334455667788990011223344556677"
async function test1() {
    const src = `spending always_true
	struct Datum {
	    admin: PubKeyHash
		value: Value
		hashes: []PubKeyHash
	}

	func main(_, _, _) -> Bool {
		true
	}
	`;

    const program = helios.Program.new(src);

	const Datum = program.types.Datum;

	console.log(new Datum(DUMMY_PKH, new helios.Value(50000n), [DUMMY_PKH, DUMMY_PKH]).toSchemaJson());
}

export default async function main() {
  await test1();
}

runIfEntryPoint(main, "user-types.js");
