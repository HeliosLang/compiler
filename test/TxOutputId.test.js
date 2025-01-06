import { describe, it } from "node:test"
import {
    False,
    True,
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
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

    describe("TxOutputId.show", () => {
        const runner = compileForRun(`testing txoutputid_show
            func main(tx_id: ByteArray, index: Int) -> String {
                TxOutputId::new(TxId::new(tx_id), index).show()
            }`)

        it('[]#0 shows as "#0"', () => {
            runner([bytes([]), int(0n)], str("#0"))
        })

        it('[]#10 shows as "#10"', () => {
            runner([bytes([]), int(10n)], str("#10"))
        })

        it('#0001020304050607080910111213141516171819202122232425262728293031#123 shows as "0001020304050607080910111213141516171819202122232425262728293031#123"', () => {
            runner(
                [
                    bytes(
                        "0001020304050607080910111213141516171819202122232425262728293031"
                    ),
                    int(123)
                ],
                str(
                    "0001020304050607080910111213141516171819202122232425262728293031#123"
                )
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `
            testing txoutputid_show_in_print_actual

            func main(id: TxOutputId) -> () {
                print(id.show())
            }`,
                `testing txoutputid_show_in_print_expected_optimized
            
            func main(_: TxOutputId) -> () {
                ()
            }`
            )
        })
    })
})
