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
    real,
    str
} from "./utils.js"

describe("Real", () => {
    describe("Literals", () => {
        it("literal 0.0", () => {
            const runner = compileForRun(`testing lit_real_0
            func main() -> Real {
                0.0
            }`)

            runner([], real(0))
        })

        it("literal 1.0", () => {
            const runner = compileForRun(`testing lit_real_1
            func main() -> Real {
                1.0
            }`)

            runner([], real(1))
        })
    })

    describe("Real == Real", () => {
        const runner1 = compileForRun(`testing real_eq_1
        func main(a: Real) -> Bool {
            a == 1.0
        }`)

        it("literal 1.0 equals 1.0", () => {
            runner1([real(1)], True)
        })

        it("literal 1.0 isn't equal to -1.0", () => {
            runner1([real(-1)], False)
        })

        it("equals self", () => {
            const runner = compileForRun(
                `testing real_eq_self
            func main(a: Real) -> Bool {
                a == a
            }`
            )

            runner([real(2345.142351)], True)
        })

        const runner2 = compileForRun(`testing real_eq
        func main(a: Real, b: Real) -> Bool {
            a == b
        }`)

        it("ok for many decimals", () => {
            runner2([real(123.123123), real(123.123123)], True)
        })

        it("nok for many decimal with one difference", () => {
            runner2([real(123.123123), real(123.123124)], False)
        })
    })

    describe("Real != Real", () => {
        const runner1 = compileForRun(`testing real_neq_self
        func main(a: Real) -> Bool {
            a != a
        }`)

        it("neq self always false", () => {
            runner1([real(0)], False)
        })

        const runner2 = compileForRun(`testing real_neq
        func main(a: Real, b: Real) -> Bool {
            a != b
        }`)

        it("neq ok for many decimals with one difference", () => {
            runner2([real(123.123123), real(123.123124)], True)
        })
    })

    describe("- Real", () => {
        const runner = compileForRun(`testing real_neg
        func main(a: Real) -> Real {
            -a
        }`)

        it("negative 1.0 == -1.0", () => {
            runner([real(1)], real(-1))
        })

        it("negative 0.0 == 0.0", () => {
            runner([real(0)], real(0))
        })

        it("negative -1.0 == 1.0", () => {
            runner([real(-1)], real(1))
        })
    })

    describe("+ Real", () => {
        const runner = compileForRun(`testing real_pos
        func main(a: Real) -> Real {
            +a
        }`)

        it("+ 1.0 == 1.0", () => {
            runner([real(1)], real(1))
        })
    })

    describe("Real + Real", () => {
        const runner1 = compileForRun(`testing real_add_0
        func main(a: Real) -> Real {
            a + 0.0
        }`)

        it("1.0 + 0.0 == 1.0", () => {
            runner1([real(1)], real(1))
        })

        const runner2 = compileForRun(`testing real_add
        func main(a: Real, b: Real) -> Real {
            a + b
        }`)

        it("1.0 + 0.5 == 0.5", () => {
            runner2([real(1), real(0.5)], real(1.5))
        })

        it("1.0 + 1000000000.5 == 1000000001.5", () => {
            runner2([real(1.0), real(1000000000.5)], real(1000000001.5))
        })
    })

    describe("Real - Real", () => {
        const runner1 = compileForRun(`testing real_sub_0
        func main(a: Real) -> Real {
            a - 0.0
        }`)

        it("1.0 - 0.0 == 1.0", () => {
            runner1([real(1.0)], real(1.0))
        })

        const runner2 = compileForRun(`testing real_0_sub
        func main(a: Real) -> Real {
            0.0 - a 
        }`)

        it("0.0 - 1.0 == -1.0", () => {
            runner2([real(1.0)], real(-1.0))
        })

        const runner3 = compileForRun(`testing real_sub_self
        func main(a: Real) -> Real {
            a - a
        }`)

        it("sub self == 0.0", () => {
            runner3([real(123.123123)], real(0.0))
        })

        const runner4 = compileForRun(`testing real_sub
        func main(a: Real, b: Real) -> Real {
            a - b
        }`)

        it("10.5 - 1.5 == 9.0", () => {
            runner4([real(10.5), real(1.5)], real(9))
        })
    })

    describe("Real * Real", () => {
        const runner1 = compileForRun(`testing real_mul_0
        func main(a: Real) -> Real {
            a * 0.0
        }`)

        it("1.0 * 0.0 == 0.0", () => {
            runner1([real(1.0)], real(0.0))
        })

        const runner2 = compileForRun(`testing real_mul_1
        func main(a: Real) -> Real {
            a * 1.0
        }`)

        it("10.123123 * 1.0 == 10.123123", () => {
            runner2([real(10.123123)], real(10.123123))
        })

        const runner3 = compileForRun(`testing real_mul
        func main(a: Real, b: Real) -> Real {
            a * b
        }`)

        it("2.0 * -0.5 == -1.0", () => {
            runner3([real(2), real(-0.5)], real(-1.0))
        })

        it("1000000.0 * 0.000001 == 1.0", () => {
            runner3([real(1000000), real(0.000001)], real(1.0))
        })

        it("0.100001 * 10 == 1.000010 ", () => {
            runner3([real(0.100001), real(10)], real(1.00001))
        })

        it("-0.100001 * 10 == -1.000010", () => {
            runner3([real(-0.100001), real(10)], real(-1.00001))
        })
    })

    describe("Real / Real", () => {
        const runner1 = compileForRun(`testing real_div_0
        func main(a: Real) -> Real {
            a / 0.0
        }`)

        it("1.0 / literal 0.0 results in error", () => {
            runner1([real(1.0)], { error: "" })
        })

        const runner2 = compileForRun(`testing real_0_div
        func main(a: Real) -> Real {
            0.0 / a
        }`)

        it("literal 0.0 / 1.0 == 0.0", () => {
            runner2([real(1.0)], real(0.0))
        })

        const runner3 = compileForRun(`testing real_div_1
        func main(a: Real) -> Real {
            a / 1.0
        }`)

        it("123.123123 / literal 1.0 == 123.123123", () => {
            runner3([real(123.123123)], real(123.123123))
        })

        const runner4 = compileForRun(`testing real_div_self
        func main(a: Real) -> Real {
            a / a
        }`)

        it("123.123123 / 123.123123 == 1.0", () => {
            runner4([real(123.123123)], real(1.0))
        })

        const runner5 = compileForRun(`testing real_div
        func main(a: Real, b: Real) -> Real {
            a / b
        }`)

        it("2.5 / 2.0 == 1.25", () => {
            runner5([real(2.5), real(2.0)], real(1.25))
        })

        it("1.000010 / 10 = 0.100001", () => {
            runner5([real(1.00001), real(10)], real(0.100001))
        })

        it("1.000010 / 100 = 0.010000", () => {
            runner5([real(1.00001), real(100)], real(0.01))
        })

        it("-1.000010 / 10 = -0.100001", () => {
            runner5([real(-1.00001), real(10)], real(-0.100001))
        })
    })

    describe("Real.trunc", () => {
        const runner = compileForRun(`testing real_trunc
        func main(a: Real) -> Int {
            a.trunc()
        }`)

        it("1.000010.trunc() == 1", () => {
            runner([real(1.00001)], int(1.0))
        })

        it("1.999999.trunc() == 1", () => {
            runner([real(1.999999)], int(1))
        })

        it("2.trunc() == 2", () => {
            runner([real(2)], int(2))
        })

        it("-1.000010.trunc() == -1", () => {
            runner([real(-1.00001)], int(-1))
        })

        it("-1.999999.trunc() == -1", () => {
            runner([real(-1.999999)], int(-1))
        })

        it("-2.trunc() == -2", () => {
            runner([real(-2)], int(-2))
        })
    })

    describe("Real.floor", () => {
        const runner = compileForRun(
            `testing real_floor
            func main(a: Real) -> Int {
                a.floor()
            }`
        )

        it("1.000010.floor() == 1", () => {
            runner([real(1.00001)], int(1))
        })

        it("1.999999.floor() == 1", () => {
            runner([real(1.999999)], int(1))
        })

        it("2.floor() == 2", () => {
            runner([real(2)], int(2))
        })

        it("-1.000010.floor() == -2", () => {
            runner([real(-1.00001)], int(-2))
        })

        it("-1.999999.floor() == -2", () => {
            runner([real(-1.999999)], int(-2))
        })

        it("-2.floor() == -2", () => {
            runner([real(-2)], int(-2))
        })
    })

    describe("Real.ceil", () => {
        const runner = compileForRun(`testing real_ceil
        func main(a: Real) -> Int {
            a.ceil()
        }`)

        it("1.000010.ceil() == 2", () => {
            runner([real(1.00001)], int(2))
        })

        it("1.999999.ceil() == 2", () => {
            runner([real(1.999999)], int(2))
        })

        it("2.ceil() == 2", () => {
            runner([real(2)], int(2))
        })

        it("-1.000010.ceil() == -1", () => {
            runner([real(-1.00001)], int(-1))
        })

        it("-1.999999.ceil() == -1", () => {
            runner([real(-1.999999)], int(-1))
        })

        it("-2.ceil() == -2", () => {
            runner([real(-2)], int(-2))
        })
    })

    describe("Real::sqrt", () => {
        const runner = compileForRun(`testing real_sqrt
        func main(a: Real) -> Real {
            Real::sqrt(a)
        }`)

        it("sqrt(0) == 0.0", () => {
            runner([real(0)], real(0))
        })

        it("sqrt(2) == 1.414213", () => {
            runner([real(2)], real(1.414213))
        })

        it("sqrt(4) == 2.0", () => {
            runner([real(4)], real(2))
        })

        it("sqrt(-1) fails", () => {
            runner([real(-1)], { error: "" })
        })

        it("sqrt(8) == 2.828427", () => {
            runner([real(8)], real(2.828427))
        })

        it("sqrt(1024) == 32", () => {
            runner([real(1024)], real(32))
        })

        it("sqrt(1000000) == 1000", () => {
            runner([real(1000000)], real(1000))
        })

        it("sqrt(1_000_000_000) == 31622.776601", () => {
            runner([real(1_000_000_000)], real(31622.776601))
        })
    })

    describe("Real::from_data", () => {
        const runner = compileForRun(`testing real_from_data
        func main(a: Data) -> Real {
            Real::from_data(a)
        }`)

        it("from_data(iData 1_000_000) == 1.0", () => {
            runner([int(1_000_000)], real(1.0))
        })
    })

    describe("Real.show", () => {
        const runner = compileForRun(`testing real_show
        func main(a: Real) -> String {
            a.show()
        }`)

        it('0.020176.show() == "0.020176"', () => {
            runner([real(0.020176)], str("0.020176"))
        })

        it('-0.020176.show() == "-0.020176"', () => {
            runner([real(-0.020176)], str("-0.020176"))
        })

        it('-305948.394872.show() == "-305948.394872"', () => {
            runner([real(-305948.394872)], str("-305948.394872"))
        })

        it('-0.394872.show() == "-0.394872"', () => {
            runner([real(-0.394872)], str("-0.394872"))
        })
    })

    describe("Real.to_ratio", () => {
        const runner = compileForRun(`testing real_to_ratio
        func main(a: Real) -> Ratio {
            a.to_ratio()
        }`)

        it("2.5.to_ratio() == 2_500_000 / 1_000_000", () => {
            runner([real(2.5)], ratio(2_500_000, 1_000_000))
        })
    })

    describe("Real::min", () => {
        const runner = compileForRun(`testing real_min
        func main(a: Real, b: Real) -> Real {
            Real::min(a, b)
        }`)

        it("min(-1.0, -1.1) == -1.1", () => {
            runner([real(-1.0), real(-1.1)], real(-1.1))
        })
    })

    describe("Real::max", () => {
        const runner = compileForRun(`testing real_max
        func main(a: Real, b: Real) -> Real {
            Real::max(a, b)
        }`)

        it("max(-1.0, -1.1) == -1.0", () => {
            runner([real(-1.0), real(-1.1)], real(-1.0))
        })
    })

    describe("Real::is_valid_data", () => {
        const runner = compileForRun(`testing real_is_valid_data
        func main(a: Data) -> Bool {
            Real::is_valid_data(a)
        }`)

        it("ok for iData", () => {
            runner([int(0)], True)
        })

        it("nok for bData", () => {
            runner([bytes("")], False)
        })

        it("nok for list", () => {
            runner([list()], False)
        })

        it("nok for map", () => {
            runner([map([])], False)
        })

        it("nok for constr", () => {
            runner([constr(0)], False)
        })
    })
})
