import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { analyzeMulti } from "./multi.js"

describe(analyzeMulti.name, () => {
    it("DAG ok for two validators", () => {
        const src1 = `spending checks_mint
        import { tx } from ScriptContext
        import { parametric } from utils
        func test_int() -> Int {
            parametric(0) + tx.inputs.length
        }

        func main(_, _) -> Bool {
            tx.minted.get_policy(Scripts::always_succeeds).length > 0
        }`

        const src2 = `minting always_succeeds
        func main(_) -> Bool {
            true
        }`

        const srcM = `module utils
        
        func parametric[V](v: V) -> V {
            v
        }`

        const { validators } = analyzeMulti([src1, src2], [srcM])

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

    it("detects module function", () => {
        const src1 = `spending s
        import { ok } from utils
        func main(_, _) -> Bool {
            ok()
        }`

        const src2 = `minting m 
        func main(_) -> Bool {
            true
        }`

        const mod = `module utils

        func ok() -> Bool {
            true
        }`

        analyzeMulti([src1, src2], [mod])
    })

    it("converts untyped const statement as userFunc", () => {
        const src1 = `spending s
        const ok = true
        func main(_, _) -> Bool {
            ok
        }`

        analyzeMulti([src1], [])
    })
})
