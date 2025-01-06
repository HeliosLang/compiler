import { describe, it } from "node:test"
import {
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    str
} from "./utils.js"

describe("ScriptPurpose", () => {
    describe("ScriptPurpose.show()", () => {
        const runner = compileForRun(
            `testing scriptpurpose_show
            func main(purpose: ScriptPurpose) -> String {
                purpose.show()
            }`
        )

        it('ScriptPurpose::Minting{} shows as "Minting{mph:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner([constr(0)], str("Minting{mph:<missing>}"))
        })

        it('ScriptPurpose::Minting{#} shows as "Minting{mph:}"', () => {
            runner([constr(0, bytes(""))], str("Minting{mph:}"))
        })

        it('ScriptPurpose::Spending{} shows as "Spending{id:<missing>}" (wrong structure, but can\'t fail)', () => {
            runner([constr(1)], str("Spending{id:<missing>}"))
        })

        it('ScriptPurpose::Spending{#10} shows as "Spending{id:#10}"', () => {
            runner(
                [constr(1, constr(0, bytes([]), int(10n)))],
                str("Spending{id:#10}")
            )
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing scriptpurpose_show_in_print_actual
                func main(purpose: ScriptPurpose) -> () {
                    print(purpose.show())
                }`,
                `testing scriptpurpose_show_in_print_expected_optimized
                func main(_: ScriptPurpose) -> () {
                    ()
                }`
            )
        })
    })
})
