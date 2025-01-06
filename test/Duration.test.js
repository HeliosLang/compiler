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
    map
} from "./utils.js"

describe("Duration", () => {
    describe("Duration::is_valid_data", () => {
        const runner = compileForRun(`testing duration_is_valid_data
        func main(data: Data) -> Bool {
            Duration::is_valid_data(data)
        }`)

        it("returns true for int", () => {
            runner([int(0)], True)
        })

        it("returns false for bytes", () => {
            runner([bytes("")], False)
        })

        it("returns false for list", () => {
            runner([list()], False)
        })

        it("returns false for constr", () => {
            runner([constr(0)], False)
        })

        it("returns false for map", () => {
            runner([map([])], False)
        })
    })

    describe("Duration.show()", () => {
        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing duration_show_in_print_actual
                func main(d: Duration) -> () {
                    print(d.show())
                }`,
                `testing duration_show_in_print_expected_optimized
                func main(_: Duration) -> () {
                    ()
                }`
            )
        })
    })
})
