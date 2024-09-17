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

describe("Option", () => {
    describe("Option::is_valid_data", () => {
        const runner = compileForRun(`testing option_is_valid_data
        func main(data: Data) -> Bool {
            Option[Int]::is_valid_data(data)
        }`)

        it("returns true for constrData with tag equal to 0 and one iData field", () => {
            runner([constr(0, int(0))], True)
        })

        it("returns false for constrData with tag equal to 0 and one bData field", () => {
            runner([constr(0, bytes([]))], False)
        })

        it("returns false for constrData with tag equal to 0 and too many iData fields", () => {
            runner([constr(0, int(0), int(1))], False)
        })

        it("returns false for constrData with tag equal to 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns true for constrData with tag equal to 1 and no fields", () => {
            runner([constr(1)], True)
        })

        it("returns false for constrData with tag equal to 1 and one field", () => {
            runner([constr(1, int(0))], False)
        })

        it("returns false for constrData with wrong tag", () => {
            runner([constr(123)], False)
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
