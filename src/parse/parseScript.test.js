import { describe, it } from "node:test"
import { parseScript } from "./parseScript.js"
import { throws } from "node:assert"

describe(parseScript.name, () => {
    it("doesn't fail for simple script", () => {
        parseScript(`testing test
        
        func main() -> Int {
            0
        }`)
    })

    it("doesn't fail for simple script containing literal Real", () => {
        parseScript(`testing test
        
        func main() -> Real {
            0.0
        }`)
    })

    it("throws if top-level function doesn't have return type", () => {
        const { errors } = parseScript(
            `testing test
        func main() -> {
            0
        }`
        )

        throws(() => errors.throw())
    })
})
