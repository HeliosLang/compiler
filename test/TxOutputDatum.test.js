import { describe, it } from "node:test"
import { compileForRun, int } from "./utils.js"
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
})
