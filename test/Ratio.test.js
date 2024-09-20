import { describe, it } from "node:test"
import {
    False,
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    ratio,
    real
} from "./utils.js"

describe("Ratio", () => {
    describe("Ratio.top", () => {
        const runner1 = compileForRun(`testing ratio_new_top
        func main(a: Int, b: Int) -> Int {
            Ratio::new(a, b).top
        }`)

        it("new(1,2).top == 1", () => {
            runner1([int(1), int(2)], int(1))
        })

        const runner2 = compileForRun(`testing ratio_top
        func main(r: Ratio) -> Int {
            r.top
        }`)

        it("(1/2).top == 1", () => {
            runner2([ratio(1, 2)], int(1))
        })
    })

    describe("Ratio.bottom", () => {
        const runner1 = compileForRun(`testing ratio_new_bottom
        func main(a: Int, b: Int) -> Int {
            Ratio::new(a, b).bottom
        }`)

        it("new(1,2).bottom == 2", () => {
            runner1([int(1), int(2)], int(2))
        })

        const runner2 = compileForRun(`testing ratio_bottom
        func main(r: Ratio) -> Int {
            r.bottom
        }`)

        it("(1/2).bottom == 2", () => {
            runner2([ratio(1, 2)], int(2))
        })
    })

    describe("Ratio + Ratio", () => {
        const runner = compileForRun(`testing ratio_add
        func main(a: Ratio, b: Ratio) -> Ratio {
            a + b
        }`)

        it("1/2 + 1/4 == 6/8", () => {
            runner([ratio(1, 2), ratio(1, 4)], ratio(6, 8))
        })
    })

    describe("Ratio + Int", () => {
        const runner1 = compileForRun(`testing ratio_add_int
        func main(a: Ratio, b: Int) -> Ratio {
            a + b
        }`)

        it("1/2 + 1 == 3/2", () => {
            runner1([ratio(1, 2), int(1)], ratio(3, 2))
        })

        const runner2 = compileForRun(`testing int_add_ratio
        func main(a: Int, b: Ratio) -> Ratio {
            a + b
        }`)

        it("1 + 1/2 == 3/2", () => {
            runner2([int(1), ratio(1, 2)], ratio(3, 2))
        })
    })

    describe("Ratio - Ratio", () => {
        const runner = compileForRun(`testing ratio_sub
        func main(a: Ratio, b: Ratio) -> Ratio {
            a - b
        }`)

        it("1/2 - 1/4 == 2/8", () => {
            runner([ratio(1, 2), ratio(1, 4)], ratio(2, 8))
        })
    })

    describe("Ratio - Int", () => {
        const runner = compileForRun(`testing ratio_sub_int
        func main(a: Ratio, b: Int) -> Ratio {
            a - b
        }`)

        it("1/2 - 1 = -1/2", () => {
            runner([ratio(1, 2), int(1)], ratio(-1, 2))
        })
    })

    describe("Int - Ratio", () => {
        const runner = compileForRun(`testing int_sub_ratio
        func main(a: Int, b: Ratio) -> Ratio {
            a - b
        }`)

        it("1 - 1/2 = 1/2", () => {
            runner([int(1), ratio(1, 2)], ratio(1, 2))
        })
    })

    describe("Ratio * Ratio", () => {
        const runner = compileForRun(`testing ratio_mul
        func main(a: Ratio, b: Ratio) -> Ratio {
            a * b
        }`)

        it("1/2 * 1/4 == 1/8", () => {
            runner([ratio(1, 2), ratio(1, 4)], ratio(1, 8))
        })
    })

    describe("Ratio * Int", () => {
        const runner1 = compileForRun(`testing ratio_mul_int
        func main(a: Ratio, b: Int) -> Ratio {
            a * b
        }`)

        it("1/2 * 2 == 2/2", () => {
            runner1([ratio(1, 2), int(2)], ratio(2, 2))
        })

        const runner2 = compileForRun(`testing int_mul_ratio
        func main(a: Int, b: Ratio) -> Ratio {
            a * b
        }`)

        it("2 * 1/2 == 2/2", () => {
            runner2([int(2), ratio(1, 2)], ratio(2, 2))
        })
    })

    describe("Ratio / Ratio", () => {
        const runner = compileForRun(`testing ratio_div
        func main(a: Ratio, b: Ratio) -> Ratio {
            a/b
        }`)

        it("1/2 / 1/4 == 4/2", () => {
            runner([ratio(1, 2), ratio(1, 4)], ratio(4, 2))
        })
    })

    describe("Ratio / Int", () => {
        const runner = compileForRun(`testing ratio_div_int
        func main(a: Ratio, b: Int) -> Ratio {
            a/b
        }`)

        it("1/2 / 0 == 1/0", () => {
            runner([ratio(1, 2), int(0)], ratio(1, 0))
        })

        it("1/2 / 10 == 1/20", () => {
            runner([ratio(1, 2), int(10)], ratio(1, 20))
        })
    })

    describe("Int / Ratio", () => {
        const runner = compileForRun(`testing int_div_ratio
        func main(a: Int, b: Ratio) -> Ratio {
            a/b
        }`)

        it("10 / 1/2 == 20/1", () => {
            runner([int(10), ratio(1, 2)], ratio(20, 1))
        })
    })

    describe("Ratio.floor", () => {
        const runner = compileForRun(`testing ratio_floor
        func main(a: Ratio) -> Int {
            a.floor()
        }`)

        it("1/2.floor() == 0", () => {
            runner([ratio(1, 2)], int(0))
        })

        it("-1/2.floor() == -1", () => {
            runner([ratio(-1, 2)], int(-1))
        })
    })

    describe("Ratio.trunc", () => {
        const runner = compileForRun(`testing ratio_trunc
        func main(a: Ratio) -> Int {
            a.trunc()
        }`)

        it("1/2.trunc() == 0", () => {
            runner([ratio(1, 2)], int(0))
        })

        it("-1/2.trunc() == 0", () => {
            runner([ratio(-1, 2)], int(0))
        })
    })

    describe("Ratio.ceil", () => {
        const runner = compileForRun(`testing ratio_ceil
        func main(a: Ratio) -> Int {
            a.ceil()
        }`)

        it("-1/2.ceil() == 0", () => {
            runner([ratio(-1, 2)], int(0))
        })

        it("1/2.ceil() == 1", () => {
            runner([ratio(1, 2)], int(1))
        })

        it("-2/2.ceil() == -1", () => {
            runner([ratio(-2, 2)], int(-1))
        })

        it("2/2.ceil() == 1", () => {
            runner([ratio(2, 2)], int(1))
        })

        it("10000001/10000000.ceil() == 2", () => {
            runner([ratio(10000001, 10000000)], int(2))
        })

        it("-10000001/10000000.ceil() == -1", () => {
            runner([ratio(-10000001, 10000000)], int(-1))
        })

        it("10000001/-10000000.ceil() == -1", () => {
            runner([ratio(10000001, -10000000)], int(-1))
        })

        it("-10000001/-10000000.ceil() == 2", () => {
            runner([ratio(-10000001, -10000000)], int(2))
        })
    })

    describe("Ratio == Ratio", () => {
        const runner = compileForRun(`testing ratio_eq
        func main(a: Ratio, b: Ratio) -> Bool {
            a == b
        }`)

        it("1/1 == 1/1 is true", () => {
            runner([ratio(1, 1), ratio(1, 1)], True)
        })

        it("2/2 == 1/1 is true", () => {
            runner([ratio(2, 2), ratio(1, 1)], True)
        })
    })

    describe("Ratio < Ratio", () => {
        const runner = compileForRun(`testing ratio_lt
        func main(a: Ratio, b: Ratio) -> Bool {
            a < b
        }`)

        it("1/2 < 1/4 == false", () => {
            runner([ratio(1, 2), ratio(1, 4)], False)
        })

        it("1/4 < 1/2 == true", () => {
            runner([ratio(1, 4), ratio(1, 2)], True)
        })
    })

    describe("Ratio < Int", () => {
        const runner = compileForRun(`testing ratio_lt_int
        func main(a: Ratio, b: Int) -> Bool {
            a < b
        }`)

        it("1/2 < 1 == true", () => {
            runner([ratio(1, 2), int(1)], True)
        })

        it("1/2 < 0 == false", () => {
            runner([ratio(1, 2), int(0)], False)
        })

        it("2/2 < 1 == false", () => {
            runner([ratio(2, 2), int(1)], False)
        })
    })

    describe("Int < Ratio", () => {
        const runner = compileForRun(`testing int_lt_ratio
        func main(a: Int, b: Ratio) -> Bool {
            a < b
        }`)

        it("1 < 1/2 == false", () => {
            runner([int(1), ratio(1, 2)], False)
        })

        it("0 < 1/2 == true", () => {
            runner([int(0), ratio(1, 2)], True)
        })

        it("1 < 2/2 == false", () => {
            runner([int(1), ratio(2, 2)], False)
        })
    })

    describe("Ratio <= Ratio", () => {
        const runner = compileForRun(`testing ratio_leq
        func main(a: Ratio, b: Ratio) -> Bool {
            a <= b
        }`)

        it("1/2 <= 1/4 == false", () => {
            runner([ratio(1, 2), ratio(1, 4)], False)
        })

        it("1/2 <= 2/4 == true", () => {
            runner([ratio(1, 2), ratio(2, 4)], True)
        })

        it("2/2 <= 2/4 == false", () => {
            runner([ratio(2, 2), ratio(2, 4)], False)
        })
    })

    describe("Ratio <= Int", () => {
        const runner = compileForRun(`testing ratio_leq_int
        func main(a: Ratio, b: Int) -> Bool {
            a <= b
        }`)

        it("1/2 <= 1 == true", () => {
            runner([ratio(1, 2), int(1)], True)
        })

        it("2/2 <= 1 == true", () => {
            runner([ratio(2, 2), int(1)], True)
        })

        it("1000001/1000000 <= 1 == false", () => {
            runner([ratio(1000001, 1000000), int(1)], False)
        })
    })

    describe("Int <= Ratio", () => {
        const runner = compileForRun(`testing int_leq_ratio
        func main(a: Int, b: Ratio) -> Bool {
            a <= b
        }`)

        it("1 <= 1/2 == false", () => {
            runner([int(1), ratio(1, 2)], False)
        })
    })

    describe("Ratio > Ratio", () => {
        const runner = compileForRun(`testing ratio_gt
        func main(a: Ratio, b: Ratio) -> Bool {
            a > b
        }`)

        it("1/2 > 1/4 == true", () => {
            runner([ratio(1, 2), ratio(1, 4)], True)
        })

        it("1/2 > 2/4 == false", () => {
            runner([ratio(1, 2), ratio(2, 4)], False)
        })
    })

    describe("Ratio > Int", () => {
        const runner = compileForRun(`testing ratio_gt_int
        func main(a: Ratio, b: Int) -> Bool {
            a > b
        }`)

        it("1/2 > 1 == false", () => {
            runner([ratio(1, 2), int(1)], False)
        })

        it("1/0 > 1 == false", () => {
            runner([ratio(1, 0), int(1)], True)
        })
    })

    describe("Int > Ratio", () => {
        const runner = compileForRun(`testing int_gt_ratio
        func main(a: Int, b: Ratio) -> Bool {
            a > b
        }`)

        it("1 > 1/2 == true", () => {
            runner([int(1), ratio(1, 2)], True)
        })
    })

    describe("Ratio >= Ratio", () => {
        const runner = compileForRun(`testing ratio_geq
        func main(a: Ratio, b: Ratio) -> Bool {
            a >= b
        }`)

        it("1/2 >= 1/4 == true", () => {
            runner([ratio(1, 2), ratio(1, 4)], True)
        })

        it("1/2 >= 2/4 == true", () => {
            runner([ratio(1, 2), ratio(2, 4)], True)
        })
    })

    describe("Ratio >= Int", () => {
        const runner = compileForRun(`testing ratio_geq_int
        func main(a: Ratio, b: Int) -> Bool {
            a >= b
        }`)

        it("1/2 >= -1 == true", () => {
            runner([ratio(1, 2), int(-1)], True)
        })
    })

    describe("Int >= Ratio", () => {
        const runner = compileForRun(`testing int_geq_ratio
        func main(a: Int, b: Ratio) -> Bool {
            a >= b
        }`)

        it("-1 >= 1/2 == false", () => {
            runner([int(-1), ratio(1, 2)], False)
        })
    })

    describe("Ratio.trunc", () => {
        const runner = compileForRun(`testing ratio_trunc
        func main(a: Int, b: Int) -> Int {
            Ratio::new(a, b).trunc()
        }`)

        it("3/2.trunc() == 1", () => {
            runner([int(3), int(2)], int(1))
        })

        it("-3/2.trunc() == -1", () => {
            runner([int(-3), int(2)], int(-1))
        })

        it("-1/1000000.trunc() == 0", () => {
            runner([int(-1), int(1000000)], int(0))
        })

        it("1/1000000.trunc() == 0", () => {
            runner([int(1), int(1000000)], int(0))
        })

        it("4999999/10000000.trunc() == 0", () => {
            runner([int(4999999), int(10000000)], int(0))
        })

        it("5000001/10000000.trunc() == 0", () => {
            runner([int(5000001), int(10000000)], int(0))
        })

        it("9999999/10000000.trunc() == 0", () => {
            runner([int(9999999), int(10000000)], int(0))
        })

        it("-4999999/10000000.trunc() == 0", () => {
            runner([int(-4999999), int(10000000)], int(0))
        })

        it("-5000001/10000000.trunc() == 0", () => {
            runner([int(-5000001), int(10000000)], int(0))
        })

        it("4999999/-10000000.trunc() == 0", () => {
            runner([int(4999999), int(-10000000)], int(0))
        })

        it("5000001/-10000000.trunc() == 0", () => {
            runner([int(5000001), int(-10000000)], int(0))
        })

        it("-4999999/-10000000.trunc() == 0", () => {
            runner([int(-4999999), int(-10000000)], int(0))
        })

        it("-5000001/-10000000.trunc() == 0", () => {
            runner([int(-5000001), int(-10000000)], int(0))
        })

        it("140/120.trunc() == 1", () => {
            runner([int(140), int(120)], int(1))
        })
    })

    describe("Ratio.round", () => {
        const runner = compileForRun(`testing ratio_round
        func main(a: Int, b: Int) -> Int {
            Ratio::new(a, b).round()
        }`)

        it("3/2.round() == 2", () => {
            runner([int(3), int(2)], int(2))
        })

        it("-3/2.round() == -2", () => {
            runner([int(-3), int(2)], int(-2))
        })

        it("-1/1000000.round() == 0", () => {
            runner([int(-1), int(1000000)], int(0))
        })

        it("1/1000000.round() == 0", () => {
            runner([int(1), int(1000000)], int(0))
        })

        it("4999999/10000000.round() == 0", () => {
            runner([int(4999999), int(10000000)], int(0))
        })

        it("5000001/10000000.round() == 1", () => {
            runner([int(5000001), int(10000000)], int(1))
        })

        it("-4999999/10000000.round() == 0", () => {
            runner([int(-4999999), int(10000000)], int(0))
        })

        it("-5000001/10000000.round() == -1", () => {
            runner([int(-5000001), int(10000000)], int(-1))
        })

        it("4999999/-10000000.round() == 0", () => {
            runner([int(4999999), int(-10000000)], int(0))
        })

        it("5000001/-10000000.round() == -1", () => {
            runner([int(5000001), int(-10000000)], int(-1))
        })

        it("-4999999/-10000000.round() == 0", () => {
            runner([int(-4999999), int(-10000000)], int(0))
        })

        it("-5000001/-10000000.round() == 1", () => {
            runner([int(-5000001), int(-10000000)], int(1))
        })

        it("140/120.round() == 1", () => {
            runner([int(140), int(120)], int(1))
        })
    })

    describe("Ratio.to_real", () => {
        const runner = compileForRun(`testing ratio_to_real
        func main(a: Int, b: Int) -> Real {
            Ratio::new(a, b).to_real()
        }`)

        it("3/2.to_real() == 1.5", () => {
            runner([int(3), int(2)], real(1.5))
        })

        it("-3/2.to_real() == -1.5", () => {
            runner([int(-3), int(2)], real(-1.5))
        })

        it("-1/1000000.to_real() == -0.000001", () => {
            runner([int(-1), int(1000000)], real(-0.000001))
        })

        it("-1/10000000.to_real() == 0", () => {
            runner([int(-1), int(10000000)], real(0))
        })

        it("1/1000000.to_real() == 0.000001", () => {
            runner([int(1), int(1000000)], real(0.000001))
        })

        it("1/10000000.to_real() == 0", () => {
            runner([int(1), int(10000000)], real(0))
        })

        it("4999999/10000000.to_real() == 0.5", () => {
            runner([int(4999999), int(10000000)], real(0.5))
        })

        it("5000001/10000000.to_real() == 0.5", () => {
            runner([int(5000001), int(10000000)], real(0.5))
        })

        it("5000004/10000000.to_real() == 0.5", () => {
            runner([int(5000004), int(10000000)], real(0.5))
        })

        it("5000005/10000000.to_real() == 0.500001", () => {
            runner([int(5000005), int(10000000)], real(0.500001))
        })

        it("-4999999/10000000.to_real() == -0.5", () => {
            runner([int(-4999999), int(10000000)], real(-0.5))
        })

        it("-5000001/10000000.to_real() == -0.5", () => {
            runner([int(-5000001), int(10000000)], real(-0.5))
        })

        it("-5000004/10000000.to_real() == -0.5", () => {
            runner([int(-5000004), int(10000000)], real(-0.5))
        })

        it("-5000005/10000000.to_real() == -0.500001", () => {
            runner([int(-5000005), int(10000000)], real(-0.500001))
        })

        it("4999999/-10000000.to_real() == -0.5", () => {
            runner([int(4999999), int(-10000000)], real(-0.5))
        })

        it("5000001/-10000000.to_real() == -0.5", () => {
            runner([int(5000001), int(-10000000)], real(-0.5))
        })

        it("5000004/-10000000.to_real() == -0.5", () => {
            runner([int(5000004), int(-10000000)], real(-0.5))
        })

        it("5000005/-10000000.to_real() == -0.500001", () => {
            runner([int(5000005), int(-10000000)], real(-0.500001))
        })

        it("-4999999/-10000000.to_real() == 0.5", () => {
            runner([int(-4999999), int(-10000000)], real(0.5))
        })

        it("-5000001/-10000000.to_real() == 0.5", () => {
            runner([int(-5000001), int(-10000000)], real(0.5))
        })

        it("-5000004/-10000000.to_real() == 0.5", () => {
            runner([int(-5000004), int(-10000000)], real(0.5))
        })

        it("-5000005/-10000000.to_real() == 0.500001", () => {
            runner([int(-5000005), int(-10000000)], real(0.500001))
        })

        it("140/120.to_real() == 1.166667", () => {
            runner([int(140), int(120)], real(1.166667))
        })
    })

    describe("Ratio::is_valid_data", () => {
        const runner = compileForRun(`testing ratio_is_valid_data
        func main(data: Data) -> Bool {
            Ratio::is_valid_data(data)
        }`)

        it("returns true for ratio", () => {
            runner([ratio(1, 1)], True)
        })

        it("returns true for list of two ints", () => {
            runner([list(int(1), int(1))], True)
        })

        it("returns true for list of negative and positive iData", () => {
            runner([list(int(-1), int(1))], True)
        })

        it("returns false for iData", () => {
            runner([int(1)], False)
        })

        it("returns false for bData", () => {
            runner([bytes("")], False)
        })

        it("returns false for constrData", () => {
            runner([constr(0)], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for empty listData", () => {
            runner([list()], False)
        })

        it("returns false for lisData only one iData entry", () => {
            runner([list(int(1))], False)
        })

        it("returns false for lisData with zero iData second entry", () => {
            runner([list(int(1), int(0))], False)
        })

        it("returns false for lisData with negative iData second entry", () => {
            runner([list(int(1), int(-1))], False)
        })

        it("returns false for lisData with bData second entry", () => {
            runner([list(int(1), bytes(""))], False)
        })

        it("returns false for listData with too many entries", () => {
            runner([list(int(1), int(1), int(1))], False)
        })
    })
})
