import { describe, it } from "node:test"
import {
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    str
} from "./utils.js"

describe("TxInput", () => {
    describe("TxInput.show()", () => {
        const runner = compileForRun(
            `testing txinput_show
            func main(input: TxInput) -> String {
                input.show()
            }`
        )

        it('TxInput{} shows as "{id:<missing>,output:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner([constr(0)], str("{id:<missing>,output:<missing>}"))
        })

        it('TxInput{id:#10}} shows as "{id:#10,output:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner(
                [constr(0, constr(0, bytes([]), int(10n)))],
                str("{id:#10,output:<missing>}")
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing txinput_show_in_print_actual
                func main(input: TxInput) -> () {
                    print(input.show())
                }`,
                `testing txinput_show_in_print_expected_optimized
                func main(_: TxInput) -> () {
                    ()
                }`
            )
        })
    })
})
