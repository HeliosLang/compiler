import { describe, it } from "node:test"
import {
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    str
} from "./utils.js"

describe("TxOutput", () => {
    describe("TxOutput.show()", () => {
        const runner = compileForRun(
            `testing txoutput_show
            func main(output: TxOutput) -> String {
                output.show()
            }`
        )

        it('TxOutput{} shows as "{address:<missing>,value:<missing>,datum:<missing>,ref_script_hash:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner(
                [constr(0)],
                str(
                    "{address:<missing>,value:<missing>,datum:<missing>,ref_script_hash:<missing>}"
                )
            )
        })

        it('TxOutput{address:Address{SpendingCredential::PubKey{#}, None}} shows as "{address:{spending_credential:PubKey{hash:},staking_credential:None},value:<missing>,datum:<missing>,ref_script_hash:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner(
                [constr(0, constr(0, constr(0, bytes("")), constr(1)))],
                str(
                    "{address:{spending_credential:PubKey{hash:},staking_credential:None},value:<missing>,datum:<missing>,ref_script_hash:<missing>}"
                )
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing txoutput_show_in_print_actual
                func main(output: TxOutput) -> () {
                    print(output.show())
                }`,
                `testing txoutput_show_in_print_expected_optimized
                func main(_: TxOutput) -> () {
                    ()
                }`
            )
        })
    })
})
