import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { analyzeMulti } from "./multi.js"

describe(analyzeMulti.name, () => {
    it("DAG ok for two validators", () => {
        const src1 = `spending checks_mint
        import { tx } from ScriptContext
        func test_int() -> Int {
            0
        }

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

        strictEqual(
            "test_int" in validators["checks_mint"].functions &&
                validators["checks_mint"].functions["test_int"]
                    .requiresScriptContext &&
                !validators["checks_mint"].functions["test_int"]
                    .requiresCurrentScript,
            true
        )
    })

    it("invalid DAG throws an error", () => {
        const src1 = `spending spend
        import { tx } from ScriptContext
        func main(_, _) -> Bool {
            tx.minted.get_policy(Scripts::mint).length > 0
        }`

        const src2 = `minting mint
        import { tx } from ScriptContext

        func main(_) -> Bool {
            tx.is_approved_by(SpendingCredential::new_validator(Scripts::spend))
        }`

        throws(() => {
            analyzeMulti([src1, src2], [])
        })
    })

    it("optimizes IR before doing DAG detection", () => {
        const module1 = `module HashModule
        import { current_script } from ScriptContext
        const VH: ValidatorHash = current_script.switch{
            mint => ValidatorHash::new(#),
            spend => Scripts::spend
        }`

        const src1 = `spending spend
        import { tx } from ScriptContext
        func main(_, _) -> Bool {
            tx.minted.get_policy(Scripts::mint).length > 0
        }`

        const src2 = `minting mint
        import { tx } from ScriptContext
        import { VH } from HashModule

        func main(_) -> Bool {
            tx.is_approved_by(SpendingCredential::new_validator(VH))
        }`

        analyzeMulti([src1, src2], [module1])
    })

    it("doesn't throw an error if a validator depends on itself in a dag", () => {
        const src1 = `spending spend
        import { tx } from ScriptContext
        func main(_, _) -> Bool {
            tx.minted.get_policy(Scripts::mint).length > 0 &&
            tx.is_approved_by(
                SpendingCredential::new_validator(Scripts::spend)
            )
        }`

        const src2 = `minting mint
        func main(_) -> Bool {
            true
        }`

        const analysis = analyzeMulti([src1, src2], [])
        strictEqual(
            analysis.validators["spend"].hashDependencies.some(
                (d) => d == "spend"
            ),
            true
        )
    })
})
