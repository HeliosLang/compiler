import { describe, it } from "node:test"
import { extractName } from "./parseHeader.js"
import { strictEqual } from "node:assert"

describe(extractName.name, () => {
    it("is able to extract name from simple script", () => {
        const src = `module MyModule
        const a = 0`

        const name = extractName(src)

        strictEqual(name, "MyModule")
    })
})
