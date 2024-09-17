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

describe("AssetClass", () => {
    describe("AssetClass::is_valid_data", () => {
        const runner = compileForRun(`
        testing assetclass_is_valid_data
        func main(a: Data) -> Bool {
            AssetClass::is_valid_data(a)
        }`)

        it("returns true for constrData with tag equal to 0 and two bData fields with 28 bytes", () => {
            runner(
                [
                    constr(
                        0,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0))
                    )
                ],
                True
            )
        })

        it("returns false for constrData with tag equal to 0 and one bData field with 28 bytes and another with 33 bytes", () => {
            runner(
                [
                    constr(
                        0,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(33).fill(0))
                    )
                ],
                False
            )
        })

        it("returns false for constrData with tag equal to 0 and one bData field with 27 bytes and another empty bData field", () => {
            runner([constr(0, bytes(new Array(27).fill(0)), bytes([]))], False)
        })

        it("returns true for constrData with tag equal to 0 and one bData field with 28 bytes and another empty bData field", () => {
            runner([constr(0, bytes(new Array(28).fill(0)), bytes([]))], True)
        })

        it("returns false for constrData with tag equal to 0 and three bData fields with 28 bytes", () => {
            runner(
                [
                    constr(
                        0,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0))
                    )
                ],
                False
            )
        })

        it("returns false for constrData with tag equal to 0 and one bData field with 28 bytes", () => {
            runner([constr(0, bytes(new Array(28).fill(0)))], False)
        })

        it("returns false for constrData with tag equal to 0 and one iData field", () => {
            runner([constr(0, int(0))], False)
        })

        it("returns false for constrData with tag equal to 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns false for constrData with tag equal to 1 and one bData field with 28 bytes", () => {
            runner([constr(1, bytes(new Array(28).fill(0)))], False)
        })

        it("returns false for constrData with tag equal to 1 and two bData fields with 28 bytes", () => {
            runner(
                [
                    constr(
                        1,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0))
                    )
                ],
                False
            )
        })

        it("returns false for constrData with tag equal to 1 and one iData field", () => {
            runner([constr(1, int(0))], False)
        })

        it("returns false for constrData with tag equal to 1 and no fields", () => {
            runner([constr(1)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })
})
