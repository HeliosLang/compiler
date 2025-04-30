import { describe, it } from "node:test"
import {
    False,
    True,
    str,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    assertOptimizedAs
} from "./utils.js"
import { encodeUtf8 } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"

/**
 * @param {number} stackOffset
 * @returns {number}
 */
function getLine(stackOffset) {
    var stack = expectDefined(new Error().stack).split("\n"),
        line = stack[(stackOffset || 1) + 1].split(":")
    return parseInt(line[line.length - 2], 10)
}

Object.defineProperty(global, "__line", {
    get: function () {
        return getLine(2)
    }
})
describe("Singleton-field-struct ", () => {
    describe("Singleton(Int)::is_valid_data", () => {
        const runner = compileForRun(`testing singleton_int_is_valid_data
        struct sfStruct {
            a: Int
        }

        func main(d: Data) -> Bool {
            sfStruct::is_valid_data(d)
        }`)

        it("returns true for bare iData", () => {
            runner([int(0)], True)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData", () => {
            runner([constr(1)], False)
        })
    })
})

describe("field-list struct Pair[Int, Int]", () => {
    const PAIR_DEF = `struct fStruct {
        a: Int
        b: Int
    }`
    describe("Pair[Int, Int]::is_valid_data", () => {
        const runner = compileForRun(`testing pair_int_int_is_valid_data
        ${PAIR_DEF}

        func main(d: Data) -> Bool {
            fStruct::is_valid_data(d)
        }`)

        it("returns true for list with two iData items", () => {
            runner([list(int(0), int(1))], True)
        })

        it("returns false for list with three iData items", () => {
            runner([list(int(0), int(1), int(2))], False)
        })

        it("returns false for list with one iData item", () => {
            runner([list(int(0))], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for empty listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData", () => {
            runner([constr(1)], False)
        })
    })

    describe("show", () => {
        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing pair_show_in_print_actual
                ${PAIR_DEF}
                func main(pair: fStruct) -> () {
                    print(pair.show())
                }`,
                `testing pair_show_in_print_expected_optimized
                ${PAIR_DEF}
                func main(_: fStruct) -> () {
                    ()
                }`
            )
        })
    })
})

describe("mStruct Pair[Int, Int]", () => {
    const $a = str("a")
    const $b = str("b")

    const PAIR_DEF = `struct Pair {
        a: Int "a"
        b: Int "b"
    }`
    describe("Pair[Int, Int]::is_valid_data", () => {
        const runner = compileForRun(`testing pair_int_int_is_valid_data
        ${PAIR_DEF}

        func main(d: Data) -> Bool {
            Pair::is_valid_data(d)
        }`)

        const goodMapData = map([
            [$a, int(0)],
            [$b, int(1)]
        ])

        it("returns true with the essential MapData", () => {
            runner([goodMapData], True)
        })

        it("returns false with an extraneous constrData wrapper tag 0", () => {
            runner([constr(0, goodMapData)], False)
        })

        it("returns false if one of the fields isn't iData", () => {
            runner(
                [
                    map([
                        [$a, int(0)],
                        [$b, bytes([])]
                    ])
                ],
                False
            )
        })

        it("returns false if one of the fields is missing", () => {
            runner([map([[$a, int(0)]])], False)
        })

        it("issues warnings from unoptimized version (missing field by-name, and invalid ‹struct-name›)", () => {
            const [result] = runner([map([[$a, int(0)]])], False)
            const logs = result.logs.map((l) => l.message)
            if (!logs.some((x) => x.match(/field not found: b/))) {
                // from is_valid_data() path
                throw new Error(
                    "Expected warning about missing field 'b', got logs:\n" +
                        logs.map((l) => `unoptimized> ${l}`).join("\n")
                )
            }
            if (!logs.some((x) => x.match(/invalid data in Pair.b/))) {
                throw new Error(
                    "Expected warning about invalid Pair, got logs:\n" +
                        logs.map((l) => `unoptimized> ${l}`).join("\n")
                )
            }
        })

        it("fails without warnings in optimized version (missing field or invalid ‹struct-name›)", () => {
            const [_, res2] = runner(
                [
                    //prettier-ignore
                    map([
                        [$a, int(0)]
					])
                ],
                False
            )
            const { logs } = expectDefined(res2)

            if (logs.length > 0) {
                throw new Error(
                    "Unexpected log entries from optimized version:\n" +
                        logs.map((l) => `optimized> ${l}`).join("\n")
                )
            }
        })

        it("returns true even if an unknown field is included", () => {
            const $c = str("c")
            runner(
                [
                    map([
                        [$b, int(1)],
                        [$a, int(0)],
                        [$c, int(2)]
                    ])
                ],
                True
            )
        })

        it("returns false for list", () => {
            runner([list()], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for constrData with any tag", () => {
            runner([constr(0)], False)
            runner([constr(1)], False)
            runner([constr(2)], False)
        })
    })

    describe("mStruct Pair[Int, Int] == Pair", () => {
        const runner = compileForRun(`testing mStruct_pair_equals
        struct Pair {
            fieldA: Int "a"
            fieldB: Int "b"
        }

        func main(a: Int, b: Int, c: Pair) -> Bool {
            Pair{a, b} == c
        }`)

        it("returns true if the order of the fields is the same", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$a, int(0)],
                        [$b, int(1)]
                    ])
                ],
                True
            )
        })

        it("returns true if the order of the fields is different", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [$a, int(0)]
                    ])
                ],
                True
            )
        })

        it("returns true if the second pair has additional entries", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [$a, int(0)],
                        [str("c"), bytes([])]
                    ])
                ],
                True
            )
        })

        it("returns false if an entry doesn't match", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [$a, int(1)]
                    ])
                ],
                False
            )
        })
        it("throws an error if the second pair is missing an entry", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [str("wrongFieldName"), int(0)]
                    ])
                ],
                { error: "" }
            )
        })

        it("unoptimized version issues log message if the second pair is missing an entry", () => {
            const [result] = runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [str("wrongFieldName"), int(0)]
                    ])
                ],
                { error: "" }
            )

            if (
                !result.logs.some(
                    (x) => x.message.match(/field not found: a/) // from is_valid_data() path
                )
            ) {
                throw new Error(
                    "Expected error about missing field 'a', got logs:\n" +
                        result.logs
                            .map((l) => `unoptimized> ${l.message}`)
                            .join("\n")
                )
            }
        })

        it("optimized version issues no message if the second pair is missing an entry", () => {
            const [_, optimizedResult_] = runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [str("wrongFieldName"), int(0)]
                    ])
                ],
                { error: "" }
            )

            const optimizedResult = expectDefined(optimizedResult_)

            if (
                optimizedResult.logs.some((x) =>
                    x.message.match(/field not found/)
                )
            ) {
                throw new Error(
                    "Optimized version: Expected no logged error about missing field 'a', got logs:\n" +
                        optimizedResult.logs
                            .map((l) => `optimized> ${l.message}`)
                            .join("\n")
                )
            }
            if (optimizedResult.logs.length > 0) {
                throw new Error(
                    "Optimized version: Unexpected log entries: \n " +
                        optimizedResult.logs
                            .map((l) => `optimized> ${l.message}`)
                            .join("\n")
                )
            }
        })
    })

    describe("mStruct Pair[Int, Int] != Pair", () => {
        const runner = compileForRun(`testing mStruct_pair_neq
        ${PAIR_DEF}
        func main(a: Int, b: Int, y: Pair) -> Bool {
			x = Pair{a, b};
			x != y
        }`)

        it("returns true if the order of the fields is the same and one entry differs", () => {
            runner(
                [
                    int(0),
                    int(77899223),
                    map([
                        [$a, int(0)],
                        [$b, int(1)]
                    ])
                ],
                True
            )
        })

        it("returns false if the order of the fields is the same and all entries are the same", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$a, int(0)],
                        [$b, int(1)]
                    ])
                ],
                False
            )
        })

        it("returns true if the order of the fields is different and one entry differs", () => {
            runner(
                [
                    int(0),
                    int(277),
                    map([
                        [$b, int(1)],
                        [$a, int(0)]
                    ])
                ],
                True
            )
        })

        it("returns false if the order of the fields is different and all entries are the same", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [$a, int(0)]
                    ])
                ],
                False
            )
        })

        it("returns true if the second pair has additional entries and one entry differs", () => {
            runner(
                [
                    int(0),
                    int(744982),
                    map([
                        [$b, int(2)],
                        [$a, int(0)],
                        [str("c"), bytes([])]
                    ])
                ],
                True
            )
        })

        it("returns false if the second pair has additional entries and but all other entries are the same", () => {
            runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [$a, int(0)],
                        [str("c"), bytes([])]
                    ])
                ],
                False
            )
        })

        it("throws an error if the second pair is missing an entry", () => {
            const [result] = runner(
                [
                    int(0),
                    int(1),
                    map([
                        [$b, int(1)],
                        [str("wrongFieldName"), int(0)]
                    ])
                ],
                { error: "" }
            )
            if (
                !result.logs.some((x) => x.message.match(/field not found: a/)) // from is_valid_data() path
            ) {
                throw new Error(
                    "Expected warning about missing field 'a', got logs:\n" +
                        result.logs
                            .map((l) => `unoptimized> ${l.message}`)
                            .join("\n")
                )
            }
        })
    })

    describe("show", () => {
        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing pair_show_in_print_actual
                ${PAIR_DEF}
                func main(pair: Pair) -> () {
                    print(pair.show())
                }`,
                `testing pair_show_in_print_expected_optimized
                ${PAIR_DEF}
                func main(_: Pair) -> () {
                    ()
                }`
            )
        })
    })
})

const cip68_and_mStructs__defs = `
    struct ExampleCip68Meta {
        name: String "name" // required by Cip68
        description: String // can't be "desc" or anything shorter because Cip68 requires "description".
        url: String // allowed by Cip68
        
        merit: Int  // allowed by extensibility rule of Cip68
    }
        
    struct SomethingElseStringMapped {
        // field names here don't need to follow Cip68 rules
        longFieldName: String "sfn"
        f2: String
    }

    enum Datum {
        StrictCip68 { 
            data: ExampleCip68Meta
            version: Int  // 2
            extra : Data
        }
        LooseCip68 { 
			data: ExampleCip68Meta 
			version: Int // 2
		}
        nonCip68 {
            someIntField: Int
            smap: SomethingElseStringMapped
        }
    }
`

describe("CIP-68 encoding", () => {
    const $name = str("name")
    const $description = str("description")
    const $url = str("url")
    const $merit = str("merit")

    describe("when in a Datum enum variant (Cip68 context)", () => {
        const myName = "JimBob Charlie"
        const unwrappedMap = map([
            [$name, str(myName)],
            [$description, str("bar")],
            [$url, str("https://example.com")],
            [$merit, int(1)]
        ])

        const StrictCip68Datum = constr(
            0,
            unwrappedMap,
            int(2),
            bytes(encodeUtf8("extra"))
        )

        it("requires the constrData wrapper", () => {
            const runner = compileForRun(
                `testing mStruct_encodings_returnsDatum
            ${cip68_and_mStructs__defs}
        
            func main(d: Data) -> Bool {
                Datum::is_valid_data(d)
            }`
            )
            runner([unwrappedMap], False)
        })

        it("reads and writes Cip68-formatted data", () => {
            const runner = compileForRun(
                `testing mStruct_encodings_returnsDatum
            ${cip68_and_mStructs__defs}
        
            func main(d: Data) -> Datum {
                assert(Datum::is_valid_data(d), "invalid data");
                Datum::from_data(d)
            }`
            )
            runner([StrictCip68Datum], StrictCip68Datum)
        })

        it("accesses data details", () => {
            const runner = compileForRun(`testing mStruct_encodings_returnsField
			${cip68_and_mStructs__defs}
            
			func main(d: Data) -> String {
				Datum::from_data(d).switch {
					StrictCip68 { data, _version, _ } => data.name,
					_ => error("no way")
				}
			}`)

            runner([StrictCip68Datum], str(myName))
        })
    })
})
