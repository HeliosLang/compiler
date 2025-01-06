import { describe, it } from "node:test"
import {
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    str
} from "./utils.js"
import { throws } from "node:assert"

describe("TxOutputDatum", () => {
    describe("destruct Inline in switch", () => {
        const runner = compileForRun(`
        testing destruct_txoutputdatum_inline_switch
        func main(a: Int) -> Data {
            datum = TxOutputDatum::new_inline(a);

            datum.switch{
                Inline{d} => d,
                else => error("unexpected")
            }
        }`)

        it("ok with payload = 0", () => {
            runner([int(0)], int(0))
        })

        it("ok with payload = 123456890", () => {
            const payload = int(1234567890)
            runner([payload], payload)
        })
    })

    describe("destruct Inline in assign", () => {
        const runner1 = compileForRun(`
        testing destruct_txoutputdatum_inline_assign
        
        func main(a: Int) -> Data {
            datum = TxOutputDatum::new_inline(a);
            Inline{b} = datum;
            b
        }`)

        it("ok with payload = 0", () => {
            runner1([int(0)], int(0))
        })

        it("ok with payload = 123456890", () => {
            const payload = int(1234567890)
            runner1([payload], payload)
        })

        const runner2 = compileForRun(`
        testing destruct_txoutputdatum_inline_assign_fail
        func main(_a: Int) -> Data {
            datum = TxOutputDatum::new_hash(DatumHash::new(#));
            Inline{b} = datum;
            b
        }`)

        it("fails for non-Inline", () => {
            throws(() => {
                runner2([int(0)], int(0))
            })
        })
    })

    describe("TxOutputDatum.show()", () => {
        const runner = compileForRun(
            `testing txoutputdatum_show
            func main(datum: TxOutputDatum) -> String {
                datum.show()
            }`
        )

        it('TxOutputDatum::None shows as "None"', () => {
            runner([constr(0)], str("None"))
        })

        it('TxOutputDatum::Hash{#} shows as "Hash{hash:}"', () => {
            runner([constr(1, bytes(""))], str("Hash{hash:}"))
        })

        it('TxOutputDatum::Inline{IntData{0}} shows as "Inline{data:0}"', () => {
            runner([constr(2, int(0))], str("Inline{data:0}"))
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing txoutputdatum_show_in_print_actual
                func main(datum: TxOutputDatum) -> () {
                    print(datum.show())
                }`,
                `testing txoutputdatum_show_in_print_expected_optimized
                func main(_: TxOutputDatum) -> () {
                    ()
                }`
            )
        })
    })
})
