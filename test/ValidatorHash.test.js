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

describe("ValidatorHash", () => {
    describe("ValidatorHash::is_valid_data", () => {
        const runner = compileForRun(`
        testing validatorhash_is_valid_data
        func main(a: Data) -> Bool {
            ValidatorHash::is_valid_data(a)
        }`)

        it("returns false for empty bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for #ffff", () => {
            runner([bytes([255, 255])], False)
        })

        it("returns true for bData with 28 bytes", () => {
            runner([bytes(new Array(28).fill(255))], True)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for constrData", () => {
            runner([constr(0)], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })
})
