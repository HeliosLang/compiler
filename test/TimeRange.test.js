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

describe("TimeRange", () => {
    describe("TimeRange::is_valid_data", () => {
        const runner = compileForRun(`testing timerange_is_valid_data
        func main(d: Data) -> Bool {
            TimeRange::is_valid_data(d)
        }`)

        it("returns false for constrData with tag 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns false for constrData with tag 0 and two fields which themselves have tag 0 and no fields", () => {
            runner([constr(0, constr(0), constr(0))], False)
        })

        it("returns true for constrData with the correct structure", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                True
            )
        })

        it("returns false if one the boolean properties isn't constrData", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), int(0))
                    )
                ],
                False
            )
        })

        it("returns false if the constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the inner constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True, int(0)),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0), int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has an out-of-range tag", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(3, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has tag 2 and too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(2, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has tag 0 and too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(0, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })
})
