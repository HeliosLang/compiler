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

describe("TxOutputId", () => {
    describe("TxOutputId::is_valid_data", () => {
        const runner = compileForRun(`testing txoutputid_is_valida_data
        func main(d: Data) -> Bool {
            TxOutputId::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 0 and two fields: one txid and one iData", () => {
            runner(
                [constr(0, constr(0, bytes(new Array(32).fill(0))), int(0))],
                True
            )
        })

        it("returns false for constrData with tag 1 and two fields: one txid and one iData", () => {
            runner(
                [constr(1, constr(0, bytes(new Array(32).fill(0))), int(0))],
                False
            )
        })

        it("returns false for constrData with tag 0 and too many", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, bytes(new Array(32).fill(0))),
                        int(0),
                        int(0)
                    )
                ],
                False
            )
        })

        it("returns false txid is 31 bytes long", () => {
            runner(
                [constr(0, constr(0, bytes(new Array(31).fill(0))), int(0))],
                False
            )
        })

        it("returns false txid is 33 bytes long", () => {
            runner(
                [constr(0, constr(0, bytes(new Array(33).fill(0))), int(0))],
                False
            )
        })

        it("returns false for constrData with tag 0 and no fields", () => {
            runner([constr(0)], False)
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
