//@ts-check
import fs from "fs"

import {
    NetworkParams,
    Site,
    UplcBuiltin,
    UplcCall,
    UplcConst,
    UplcInt,
    UplcProgram,
    UplcLambda,
    UplcVariable,
    assert
} from "helios"

const networkParams = new NetworkParams(
    JSON.parse(fs.readFileSync("./network-parameters-preview.json").toString())
)

let site = Site.dummy()

function newProgram(term) {
    return new UplcProgram(term)
}

function newLambda(term) {
    return new UplcLambda(site, term)
}

function newCall(fn, arg) {
    return new UplcCall(site, fn, arg)
}

function newCall2(fn, a, b) {
    return newCall(newCall(fn, a), b)
}

function newBuiltin(name) {
    return new UplcBuiltin(site, name)
}

function newVariable(i) {
    return new UplcVariable(site, new UplcInt(site, BigInt(i), false))
}

function newInt(x) {
    return new UplcConst(new UplcInt(site, x))
}

async function run(name, program, args, expected) {
    let profile = await program.profile(args, networkParams)

    console.log(
        `${name} (mem: ${profile.mem}, cpu: ${profile.cpu}, size: ${profile.size})`
    )

    if (expected !== null) {
        assert(profile.mem === expected.mem, "unexpected mem value")
        assert(profile.cpu === expected.cpu, "unexpected cpu value")
        assert(profile.size === expected.size, "unexpected size value")
    }
}

export default async function main() {
    // expected memCost: 200, expected cpuCost: 23100
    /*await run("add1",
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
		null,
		{mem: 200n, cpu: 23100n, size: 15}
	)*/

    // expected memCost: 3710, expected cpuCost: 1860485
    await run(
        "add-lambda",
        newProgram(
            newCall(
                newLambda(
                    newCall2(
                        newBuiltin("addInteger"),
                        newCall2(newVariable(1), newInt(12n), newInt(32n)),
                        newCall2(newVariable(1), newInt(5n), newInt(4n))
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
        null,
        { mem: 3710n, cpu: 1860485n, size: 32 }
    )
}
