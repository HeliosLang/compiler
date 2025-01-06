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

describe("TxId", () => {
    describe("TxId::is_valid_data", () => {
        const runner = compileForRun(`testing txid_is_valid_data
        func main(d: Data) -> Bool {
            TxId::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 0 and a 32 byte txid field", () => {
            runner([constr(0, bytes(new Array(32).fill(0)))], True)
        })

        it("returns false for constrData with tag 1 and a 32 byte txid field", () => {
            runner([constr(1, bytes(new Array(32).fill(0)))], False)
        })

        it("returns false for constrData with tag -1 and a 32 byte txid field", () => {
            runner([constr(-1, bytes(new Array(32).fill(0)))], False)
        })

        it("returns false for constrData with tag 0 and a 31 byte txid field", () => {
            runner([constr(0, bytes(new Array(31).fill(0)))], False)
        })

        it("returns false for constrData with tag 0 and a 33 byte txid field", () => {
            runner([constr(0, bytes(new Array(33).fill(0)))], False)
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

    describe("TxId.show", () => {
        const runner = compileForRun(`testing txid_show
            func main(bs: ByteArray) -> String {
                TxId::new(bs).show()
            }`)

        it('shows # as ""', () => {
            runner([bytes("")], str(""))
        })

        it('shows #0001020304050607080910111213141516171819202122232425262728293031 as "0001020304050607080910111213141516171819202122232425262728293031"', () => {
            runner(
                [
                    bytes(
                        "0001020304050607080910111213141516171819202122232425262728293031"
                    )
                ],
                str(
                    "0001020304050607080910111213141516171819202122232425262728293031"
                )
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `
            testing txid_show_in_print_actual

            func main(id: TxId) -> () {
                print(id.show())
            }`,
                `testing txid_show_in_print_expected_optimized
            
            func main(_: TxId) -> () {
                ()
            }`
            )
        })
    })
})
