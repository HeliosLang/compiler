import { describe, it } from "node:test"
import { assertOptimizedAs } from "./utils.js"

describe("DCert", () => {
    describe("DCert.show()", () => {
        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing dcert_show_in_print_actual
                func main(dcert: DCert) -> () {
                    print(dcert.show())
                }`,
                `testing dcert_show_in_print_expected_optimized
                func main(_: DCert) -> () {
                    ()
                }`
            )
        })
    })
})
