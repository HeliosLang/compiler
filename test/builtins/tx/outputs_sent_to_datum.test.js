import { config, FuzzyTest } from "helios"
import { asBool } from "../../assert.js"
import { spendingScriptContextParam } from "../../scriptcontext.js"

export default async function test() {
    config.set({ DEBUG: true })

    const ft = new FuzzyTest(/*Math.random()*/ 42, 100, true)

    await ft.testParams(
        { PUB_KEY_HASH_BYTES: ft.bytes() },
        ["SCRIPT_CONTEXT"],
        `
        testing tx_outputs_sent_to_datum
        func main(ctx: ScriptContext) -> Bool {
            if (ctx.tx.signatories.is_empty()) {
                true
            } else {
                ctx.tx.outputs_sent_to_datum(ctx.tx.signatories.head, 42, true).length > 0
            }
        }
        ${spendingScriptContextParam(true)}
        `,
        ([_], res) => asBool(res),
        5
    )

    config.set({ DEBUG: false })
}
