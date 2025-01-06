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

describe("Option", () => {
    describe("Option::is_valid_data", () => {
        const runner = compileForRun(`testing option_is_valid_data
        func main(data: Data) -> Bool {
            Option[Int]::is_valid_data(data)
        }`)

        it("returns true for constrData with tag equal to 0 and one iData field", () => {
            runner([constr(0, int(0))], True)
        })

        it("returns false for constrData with tag equal to 0 and one bData field", () => {
            runner([constr(0, bytes([]))], False)
        })

        it("returns false for constrData with tag equal to 0 and too many iData fields", () => {
            runner([constr(0, int(0), int(1))], False)
        })

        it("returns false for constrData with tag equal to 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns true for constrData with tag equal to 1 and no fields", () => {
            runner([constr(1)], True)
        })

        it("returns false for constrData with tag equal to 1 and one field", () => {
            runner([constr(1, int(0))], False)
        })

        it("returns false for constrData with wrong tag", () => {
            runner([constr(123)], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })
    })

    describe("Option[Int].show()", () => {
        const runner = compileForRun(`testing option_show
            func main(opt: Option[Int]) -> String {
                opt.show()
            }`)

        it("Option[Int]::None shows as Option::None", () => {
            runner([constr(1)], str("None"))
        })

        it("Option[Int]::Some{1} shows as Option::Some{1}", () => {
            runner([constr(0, int(1))], str("Some{1}"))
        })

        it("Option[Int]::Some{ConstrData(1, [])} shows as Option::Some{1{}} (wrong structure, but can't fail)", () => {
            runner([constr(0, constr(1))], str("Some{1{}}"))
        })

        it("Option[Int]::Some{} shows as Option::Some{<missing>} (wrong structure, but can't fail)", () => {
            runner([constr(0)], str("Some{<missing>}"))
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing int_option_show_in_print_actual
                func main(opt: Option[Int]) -> () {
                    print(opt.show())
                }`,
                `testing int_option_show_in_print_expected_optimized
                func main(_: Option[Int]) -> () {
                    ()
                }`
            )
        })
    })
})
