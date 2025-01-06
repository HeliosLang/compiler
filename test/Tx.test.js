import { describe, it } from "node:test"
import { assertOptimizedAs, compileForRun, constr, str } from "./utils.js"

describe("Tx", () => {
    describe("Tx.show()", () => {
        const runner = compileForRun(`testing tx_show
            func main(tx: Tx) -> String {
                tx.show()
            }`)

        it("Tx{} shows as {inputs:<missing>,ref_inputs:<missing>,outputs:<missing>,fee:<minted>,minted:<missing>,dcerts:<missing>,withdrawals:<missing>,validity_time_range:<missing>,signatories:<missing>,redeemers:<missing>,datums:<missing>,id:<missing>}", () => {
            runner(
                [constr(0)],
                str(
                    "{inputs:<missing>,ref_inputs:<missing>,outputs:<missing>,fee:<missing>,minted:<missing>,dcerts:<missing>,withdrawals:<missing>,validity_time_range:<missing>,signatories:<missing>,redeemers:<missing>,datums:<missing>,id:<missing>}"
                )
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing tx_show_in_print_actual
                func main(tx: Tx) -> () {
                    print(tx.show())
                }`,
                `testing tx_show_in_print_expected_optimized
                func main(_: Tx) -> () {
                    ()
                }`
            )
        })
    })
})
