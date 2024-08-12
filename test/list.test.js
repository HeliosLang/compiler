import { describe, it } from "node:test"
import { False, True, bool, compileForRun, int, list } from "./utils.js"

describe("List", () => {
    describe("[]Int::new_const", () => {
        const runner = compileForRun(`
        testing list_new_const
        func main(n: Int, b: Int) -> Bool {
            lst: []Int = []Int::new_const(n, b);
            if (n < 0) {
                lst.length == 0
            } else {
                lst.length == n && lst.all((v: Int) -> Bool {v == b})
            }
        }`)

        it("self-check always succeeds", () => {
            runner([int(10), int(-123)], True)
        })

        it("ok for zero length", () => {
            runner([int(0), int(123)], True)
        })

        it("ok for negative length (ignored)", () => {
            runner([int(-10), int(-123)], True)
        })
    })

    describe("[]Int::new", () => {
        const runner1 = compileForRun(`
        testing list_new
        func main(n: Int) -> []Int {
            []Int::new(n, (i: Int) -> Int {i})
        }`)

        it("creates sequential list", () => {
            runner1([int(5)], list(int(0), int(1), int(2), int(3), int(4)))
        })

        it("creates empty list for zero length", () => {
            runner1([int(0)], list())
        })

        it("creates empty list for negative length", () => {
            runner1([int(-1000)], list())
        })

        const runner2 = compileForRun(`
        testing list_new
        func main(n: Int) -> Bool {
            lst: []Int = []Int::new(n, (i: Int) -> Int {i});
            if (n < 0) {
                lst.length == 0
            } else {
                lst.length == n && (
                    sum: Int = lst.fold((acc: Int, v: Int) -> Int {acc + v}, 0);
                    sum == n*(n-1)/2
                )
            }
        }`)

        it("self check sequential list ok", () => {
            runner2([int(100)], True)
        })

        it("self check sequential list ok for negative length", () => {
            runner2([int(-10)], True)
        })
    })

    describe("[]Int == []Int", () => {
        const runner1 = compileForRun(`
        testing list_eq_self
        func main(a: []Int) -> Bool {
            a == a
        }`)

        it("always equals self", () => {
            runner1([list(int(0))], True)
        })

        const runner2 = compileForRun(`
        testing list_eq_self_check
        func main(a: []Int, b: []Int) -> Bool {
            (a == b) == ((a.length == b.length) && (
                []Int::new(a.length, (i: Int) -> {i}).all((i: Int) -> Bool {
                    a.get(i) == b.get(i)
                })
            ))
        }`)

        it("self-check ok for two empty lists", () => {
            runner2([list(), list()], True)
        })

        it("self-check ok for one empty list and other non-empty", () => {
            runner2([list(), list(int(0))], True)
        })
    })

    describe("[]Bool.any", () => {
        const runner = compileForRun(`
        testing list_wrong_data
        func main(a: []Bool) -> Bool {
            a.any((item: Bool) -> {item})
        }`)

        it("returns true if some entries are true", () => {
            runner([list(False, False, True)], True)
        })

        it("false for empty list", () => {
            runner([list()], False)
        })
    })
})
