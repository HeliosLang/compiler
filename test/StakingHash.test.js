import { describe, it } from "node:test"
import {
    False,
    True,
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
} from "./utils.js"

describe("StakingHash", () => {
    describe("StakingHash::is_valid_data", () => {
        const runner = compileForRun(`
        testing stakinghash_is_valid_data
        func main(a: Data) -> Bool {
            StakingHash::is_valid_data(a)
        }`)

        it("returns true for constrData with tag equal to 0 and one bData field with 28 bytes", () => {
            runner([constr(0, bytes(new Array(28).fill(0)))], True)
        })

        it("returns false for constrData with tag equal to 0 and two bData fields with 28 bytes", () => {
            runner(
                [
                    constr(
                        0,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0))
                    )
                ],
                False
            )
        })

        it("returns false for constrData with tag equal to 0 and one iData field", () => {
            runner([constr(0, int(0))], False)
        })

        it("returns false for constrData with tag equal to 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns true for constrData with tag equal to 1 and one bData field with 28 bytes", () => {
            runner([constr(1, bytes(new Array(28).fill(0)))], True)
        })

        it("returns false for constrData with tag equal to 1 and two bData fields with 28 bytes", () => {
            runner(
                [
                    constr(
                        1,
                        bytes(new Array(28).fill(0)),
                        bytes(new Array(28).fill(0))
                    )
                ],
                False
            )
        })

        it("returns false for constrData with tag equal to 1 and one iData field", () => {
            runner([constr(1, int(0))], False)
        })

        it("returns false for constrData with tag equal to 1 and no fields", () => {
            runner([constr(1)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })

    describe("StakingHash.show", () => {
        const runner = compileForRun(`testing stakinghash_show
        func main(sh: StakingHash) -> String {
            sh.show()
        }`)

        it('StakingHash::StakeKey{#}.show() == "StakeKey{hash:}"', () => {
            runner([constr(0, bytes(""))], str("StakeKey{hash:}"))
        })

        it('StakingHash::StakeKey{#01020304050607080910111213141516171819202122232425262728}.show() == "StakeKey{hash:01020304050607080910111213141516171819202122232425262728}"', () => {
            runner(
                [
                    constr(
                        0,
                        bytes(
                            "01020304050607080910111213141516171819202122232425262728"
                        )
                    )
                ],
                str(
                    "StakeKey{hash:01020304050607080910111213141516171819202122232425262728}"
                )
            )
        })

        it('StakingHash::Validator{#01020304050607080910111213141516171819202122232425262728}.show() == "Validator{hash:01020304050607080910111213141516171819202122232425262728}"', () => {
            runner(
                [
                    constr(
                        1,
                        bytes(
                            "01020304050607080910111213141516171819202122232425262728"
                        )
                    )
                ],
                str(
                    "Validator{hash:01020304050607080910111213141516171819202122232425262728}"
                )
            )
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing stakinghash_show_in_print_actual
                func main(sh: StakingHash) -> () {
                    print(sh.show())
                }`,
                `testing stakinghash_show_in_print_expected_optimized
                func main(_: StakingHash) -> () {
                    ()
                }`
            )
        })
    })
})
