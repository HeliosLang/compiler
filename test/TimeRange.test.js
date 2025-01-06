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

describe("TimeRange", () => {
    describe("TimeRange::ALWAYS.contains", () => {
        const runner = compileForRun(`testing timerange_always_contains
        func main(a: Int) -> Bool {
            TimeRange::ALWAYS.contains(Time::new(a))
        }`)

        it("contains -1000", () => {
            runner([int(-1000)], True)
        })

        it("contains 1000", () => {
            runner([int(1000)], True)
        })

        it("contains -1_000_000_000_000_000_000", () => {
            runner([int(-1_000_000_000_000_000_000n)], True)
        })

        it("contains 1_000_000_000_000_000_000", () => {
            runner([int(1_000_000_000_000_000_000n)], True)
        })
    })

    describe("TimeRange::NEVER.contains", () => {
        const runner = compileForRun(`testing timerange_never_contains
        func main(a: Int) -> Bool {
            TimeRange::NEVER.contains(Time::new(a))
        }`)

        it("doesn't contain 0", () => {
            runner([int(0)], False)
        })

        it("doesn't contain 1", () => {
            runner([int(1)], False)
        })

        it("doesn't contain -1000", () => {
            runner([int(-1000)], False)
        })

        it("doesn't contain 1000", () => {
            runner([int(1000)], False)
        })

        it("doesn't contain -1_000_000_000_000_000_000", () => {
            runner([int(-1_000_000_000_000_000_000n)], False)
        })

        it("doesn't contain 1_000_000_000_000_000_000", () => {
            runner([int(1_000_000_000_000_000_000n)], False)
        })
    })

    describe("TimeRange::is_valid_data", () => {
        const runner = compileForRun(`testing timerange_is_valid_data
        func main(d: Data) -> Bool {
            TimeRange::is_valid_data(d)
        }`)

        it("returns false for constrData with tag 0 and no fields", () => {
            runner([constr(0)], False)
        })

        it("returns false for constrData with tag 0 and two fields which themselves have tag 0 and no fields", () => {
            runner([constr(0, constr(0), constr(0))], False)
        })

        it("returns true for constrData with the correct structure", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                True
            )
        })

        it("returns false if one the boolean properties isn't constrData", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), int(0))
                    )
                ],
                False
            )
        })

        it("returns false if the constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the inner constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True, int(0)),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0), int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has an out-of-range tag", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(3, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has tag 2 and too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(2, int(0)), True),
                        constr(0, constr(1, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false if one of the innermost constrData has tag 0 and too many fields", () => {
            runner(
                [
                    constr(
                        0,
                        constr(0, constr(1, int(0)), True),
                        constr(0, constr(0, int(0)), True)
                    )
                ],
                False
            )
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })

    describe("TimeRange.show", () => {
        const showFromToRunner = compileForRun(`testing timerange_from_to_show
        func main(a: Int, b: Int) -> String {
            TimeRange::new(Time::new(a), Time::new(b)).show()
        }`)

        it('TimeRange::new(0, 1) shows as "[0,1]"', () => {
            showFromToRunner([int(0), int(1)], str("[0,1]"))
        })

        it('TimeRange::new(-10, 10) shows as "[-10,10]"', () => {
            showFromToRunner([int(-10), int(10)], str("[-10,10]"))
        })

        it('TimeRange::new(10, -10) shows as "[10,-10]" (weird but allowed)', () => {
            showFromToRunner([int(10), int(-10)], str("[10,-10]"))
        })

        const showFromRunner = compileForRun(`testing timerange_from_show
        func main(a: Int) -> String {
            TimeRange::from(Time::new(a)).show()
        }`)

        it('TimeRange::from(0) shows as "[0,+inf]"', () => {
            showFromRunner([int(0)], str("[0,+inf]"))
        })

        it('TimeRange::from(-10000) shows as "[-10000,+inf]"', () => {
            showFromRunner([int(-10000)], str("[-10000,+inf]"))
        })

        it('TimeRange::from(10000) shows as "[10000,+inf]"', () => {
            showFromRunner([int(10000)], str("[10000,+inf]"))
        })

        const showToRunner = compileForRun(`testing timerange_to_show
            func main(a: Int) -> String {
                TimeRange::to(Time::new(a)).show()
            }`)

        it('TimeRange::to(0) shows as "[-inf,0]"', () => {
            showToRunner([int(0)], str("[-inf,0]"))
        })

        it('TimeRange::to(-10000) shows as "[-inf,-10000]"', () => {
            showToRunner([int(-10000)], str("[-inf,-10000]"))
        })

        it('TimeRange::to(10000) shows as "[-inf,10000]"', () => {
            showToRunner([int(10000)], str("[-inf,10000]"))
        })

        const showAlwaysRunner = compileForRun(`testing timerange_always_show
            func main() -> String {
                TimeRange::ALWAYS.show()
            }`)

        it('TimeRange::ALWAYS shows as "[-inf,+inf]"', () => {
            showAlwaysRunner([], str("[-inf,+inf]"))
        })

        const showNeverRunner = compileForRun(`testing timerange_never_show
            func main() -> String {
                TimeRange::NEVER.show()
            }`)

        it('TimeRange::NEVER shows as "[+inf,-inf]"', () => {
            showNeverRunner([], str("[+inf,-inf]"))
        })

        it("is optimized out in print()", () => {
            assertOptimizedAs(
                `
            testing timerange_show_in_print_actual

            func main(tr: TimeRange) -> () {
                print(tr.show())
            }`,
                `testing timerange_show_in_print_expected_optimized
            
            func main(_: TimeRange) -> () {
                ()
            }`
            )
        })
    })
})
