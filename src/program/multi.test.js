import { deepEqual } from "node:assert"
import { describe, it } from "node:test"
import { analyzeMulti } from "./multi.js"

describe(analyzeMulti.name, () => {
    it("dag ok for two validators", () => {
        const src1 = `spending checks_mint
        import { tx } from ScriptContext
        func main(_, _) -> Bool {
            tx.minted.get_policy(Scripts::always_succeeds).length > 0
        }`

        const src2 = `minting always_succeeds
        func main(_) -> Bool {
            true
        }`

        const { validators } = analyzeMulti([src1, src2], [])

        deepEqual(validators["checks_mint"].hashDependencies, [
            "always_succeeds"
        ])

        deepEqual(validators["always_succeeds"].hashDependencies, [])
    })
})
