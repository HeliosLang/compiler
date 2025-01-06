import { describe, it } from "node:test"
import { assertOptimizedAs } from "./utils.js"

describe("StakingPurpose", () => {
    describe("StakingPurpose.show()", () => {
        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `testing stakingpurpose_show_in_print_actual
                func main(purpose: StakingPurpose) -> () {
                    print(purpose.show())
                }`,
                `testing stakingpurpose_show_in_print_expected_optimized
                func main(_: StakingPurpose) -> () {
                    ()
                }`
            )
        })
    })
})
