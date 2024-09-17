import { describe, it } from "node:test"
import {
    False,
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map
} from "./utils.js"

describe("Enum with two variants", () => {
    describe("is_valid_data", () => {
        const runner =
            compileForRun(`testing enum_with_two_variants_is_valid_data
        enum E {
            A
            B {
                a: Int
                b: Int
            }
        }
        
        func main(d: Data) -> Bool {
            E::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 0 and no fields", () => {
            runner([constr(0)], True)
        })

        it("returns false for constrData with tag -1 and no fields", () => {
            runner([constr(-1)], False)
        })

        it("returns false for constrData with tag 0 and one field", () => {
            runner([constr(0, int(0))], False)
        })

        it("returns true for constrData with tag 1 and two fields", () => {
            runner([constr(1, int(0), int(1))], True)
        })

        it("returns false for constrData with tag 1 and one of the two fields isn't iData", () => {
            runner([constr(1, int(0), bytes([]))], False)
        })

        it("returns false for constrData with tag 1 and too many fields", () => {
            runner([constr(1, int(0), int(1), int(1))], False)
        })

        it("returns false for constrData with tag 2 and two fields", () => {
            runner([constr(2, int(0), int(1))], False)
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
    })
})
