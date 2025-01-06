import { describe, it } from "node:test"
import {
    False,
    True,
    assertOptimizedAs,
    bool,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
} from "./utils.js"

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

    describe("[]Int.fold", () => {
        const runner = compileForRun(`
        testing list_fold
        func main(a: []Int) -> Int {
            a.fold((sum: Int, x: Int) -> Int {sum + x}, 0)
        }`)

        it("sums [1,2,3] as 6", () => {
            runner([list(int(1), int(2), int(3))], int(6))
        })
    })

    describe("[]Int.fold2", () => {
        const runner = compileForRun(`
        testing list_fold_as_fold2
        func main(a: []Int) -> Int {
            (sa: Int, sb: Int) = a.fold((sum: () -> (Int, Int), x: Int) -> () -> (Int, Int) {
                (sa_: Int, sb_: Int) = sum();
                () -> {(sa_ + x, sb_ + x)}
            }, () -> {(0, 0)})();
            (sa + sb)/2
        }`)

        it("sums [1,2,3] as 6 (using internally fold)", () => {
            runner([list(int(1), int(2), int(3))], int(6))
        })

        const runner2 = compileForRun(`
        testing list_fold2
        func main(a: []Int) -> Int {
            (sum0: Int, sum1: Int) = a.fold2((sum0: Int, sum1: Int, x: Int) -> {(sum0 + x, sum1 + x)}, 0, 0);
            (sum0 + sum1)/2
        }`)

        it("sums [1,2,3] as 6 (using fold2 internally)", () => {
            runner2([list(int(1), int(2), int(3))], int(6))
        })
    })

    describe("[]Int.fold2_lazy", () => {
        const runner = compileForRun(`
        testing list_fold2_lazy
        func main(a: []Int) -> Int {
            (sum0: Int, sum1: Int) = a.fold2_lazy((item: Int, sum: () -> (Int, Int)) -> {
                (sum0: Int, sum1: Int) = sum(); 
                (item + sum0, item + sum1)
            }, 0, 0);
            (sum0 + sum1)/2
        }`)

        it("sums [1,2,3] as 6", () => {
            runner([list(int(1), int(2), int(3))], int(6))
        })
    })

    describe("[]Int.fold3", () => {
        const runner = compileForRun(`
        testing list_fold3
        func main(a: [][]Int) -> Int {
            (sum0, _sum1, _) = a.fold3((s0: Int, s1: Int, s2: Int, item_: []Int) -> {
                (inner_sum0, inner_sum1) = item_.fold2((s0: Int, s1: Int, item: Int) -> {
                    (s0 + item, s1 + item)
                }, s0, s1);

                (inner_sum0, inner_sum1, 0)
            }, 0, 0, 0);

            sum0
        }`)

        it("sums [[1],[2],[3]] as 6", () => {
            runner([list(list(int(1)), list(int(2)), list(int(3)))], int(6))
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

    describe("[]Int.append", () => {
        const runner = compileForRun(`
        testing list_append
        func main(a: []Int, b: Int) -> []Int {
            a.append(b)
        }`)

        it("returns a singleton if the initial list is empty", () => {
            runner([list(), int(0)], list(int(0)))
        })

        it("returns a list with two entries if the initial list has one entry", () => {
            runner([list(int(0)), int(1)], list(int(0), int(1)))
        })
    })

    describe("[]Int::is_valid_data", () => {
        const runner = compileForRun(`
        testing int_list_is_valid_data
        func main(a: Data) -> Bool {
            []Int::is_valid_data(a)
        }`)

        it("returns true for empty listData", () => {
            runner([list()], True)
        })

        it("returns true for listData with one iData entry", () => {
            runner([list(int(0))], True)
        })

        it("returns true for listData with two iData entries", () => {
            runner([list(int(1), int(2))], True)
        })

        it("returns false for listData with one iData entry and another listData entry", () => {
            runner([list(int(1), list())], False)
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

        it("returns false for constrData", () => {
            runner([constr(123)], False)
        })
    })

    describe("[][]Int::is_valid_data", () => {
        const runner = compileForRun(`
        testing nested_int_list_is_valid_data
        func main(a: Data) -> Bool {
            [][]Int::is_valid_data(a)
        }`)

        it("returns true for empty listData", () => {
            runner([list()], True)
        })

        it("returns false for listData with one nested iData entry", () => {
            runner([list(list(int(0)))], True)
        })

        it("returns false for listData with two iData entries", () => {
            runner([list(int(1), int(2))], False)
        })

        it("returns true for listData with one iData entry in a the first nested list, and another empty listData entry", () => {
            runner([list(list(int(1)), list())], True)
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

        it("returns false for constrData", () => {
            runner([constr(123)], False)
        })
    })

    describe("[]Bool.show()", () => {
        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing bool_list_show_in_print_actual
                func main(lst: []Bool) -> () {
                    print(lst.show())
                }`,
                `testing bool_list_show_int_print_expected_optimized
                func main(_: []Bool) -> () {
                    ()
                }`
            )
        })
    })

    describe("[]Int.show()", () => {
        const runner = compileForRun(`testing list_show
            func main(a: []Int) -> String {
                a.show()
            }`)

        it('[] shows as "[]"', () => {
            runner([list()], str("[]"))
        })

        it('[1] shows as "[1]"', () => {
            runner([list(int(1))], str("[1]"))
        })

        it('[1,2] shows as "[1,2]"', () => {
            runner([list(int(1), int(2))], str("[1,2]"))
        })

        it('[1,2,3] shows as "[1,2,3]"', () => {
            runner([list(int(1), int(2), int(3))], str("[1,2,3]"))
        })

        it('[1,2,ConstrData(3, [])] shows as "[1,2,3{}]" (wrong structure but can\'t fail', () => {
            runner([list(int(1), int(2), constr(3))], str("[1,2,3{}]"))
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing int_list_show_in_print_actual
                func main(lst: []Int) -> () {
                    print(lst.show())
                }`,
                `testing int_list_show_in_print_expected_optimized
                func main(_: []Int) -> () {
                    ()
                }`
            )
        })
    })
})
