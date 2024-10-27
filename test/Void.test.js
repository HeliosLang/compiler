import { describe, it } from "node:test"
import { Program } from "../src/index.js"
import { throws } from "node:assert"

describe("Void (i.e. Unit)", () => {
    it("can't assign to void", () => {
        const src = `testing assign_to_void
        func main() -> Bool {
            a = print("hello");
            a;
            true
        }`

        throws(() => {
            new Program(src)
        }, /can't assign to unit type/)
    })
})
