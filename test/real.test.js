import { describe } from "node:test"
import {
    False,
    True,
    compileAndRunMany,
    int,
    ratio,
    real,
    str
} from "./utils.js"

describe("Real", () => {
    const realEq1Script = `testing real_eq_1
    func main(a: Real) -> Bool {
        a == 1.0
    }`

    const realEqScript = `testing real_eq
    func main(a: Real, b: Real) -> Bool {
        a == b
    }`

    const realNeqScript = `testing real_neq
    func main(a: Real, b: Real) -> Bool {
        a != b
    }`

    const realNegScript = `testing real_neg
    func main(a: Real) -> Real {
        -a
    }`

    const realAddScript = `testing real_add
    func main(a: Real, b: Real) -> Real {
        a + b
    }`

    const realSubScript = `testing real_sub
    func main(a: Real, b: Real) -> Real {
        a - b
    }`

    const realMulScript = `testing real_mul
    func main(a: Real, b: Real) -> Real {
        a * b
    }`

    const realDivScript = `testing real_div
    func main(a: Real, b: Real) -> Real {
        a / b
    }`

    const realTruncScript = `testing real_trunc
    func main(a: Real) -> Int {
        a.trunc()
    }`

    const realFloorScript = `testing real_floor
    func main(a: Real) -> Int {
        a.floor()
    }`

    const realCeilScript = `testing real_ceil
    func main(a: Real) -> Int {
        a.ceil()
    }`

    const realSqrtScript = `testing real_sqrt
    func main(a: Real) -> Real {
        Real::sqrt(a)
    }`

    const realFromDataScript = `testing real_from_data
    func main(a: Data) -> Real {
        Real::from_data(a)
    }`

    const realShowScript = `testing real_show
    func main(a: Real) -> String {
        a.show()
    }`

    const realToRatioScript = `testing real_to_ratio
    func main(a: Real) -> Ratio {
        a.to_ratio()
    }`

    const realMinScript = `testing real_min
    func main(a: Real, b: Real) -> Real {
        Real::min(a, b)
    }`

    const realMaxScript = `testing real_max
    func main(a: Real, b: Real) -> Real {
        Real::max(a, b)
    }`

    compileAndRunMany([
        {
            description: "literal 0.0",
            main: `testing lit_real_0
            func main() -> Real {
                0.0
            }`,
            inputs: [],
            output: real(0)
        },
        {
            description: "literal 1.0",
            main: `testing lit_real_1
            func main() -> Real {
                1.0
            }`,
            inputs: [],
            output: real(1)
        },
        {
            description: "literal 1.0 == 1.0",
            main: realEq1Script,
            inputs: [real(1)],
            output: True
        },
        {
            description: "literal 1.0 != -1.0",
            main: realEq1Script,
            inputs: [real(-1)],
            output: False
        },
        {
            description: "equals self",
            main: `testing real_eq_self
            func main(a: Real) -> Bool {
                a == a
            }`,
            inputs: [real(2345.142351)],
            output: True
        },
        {
            description: "equals ok for many decimals",
            main: realEqScript,
            inputs: [real(123.123123), real(123.123123)],
            output: True
        },
        {
            description: "equals nok for many decimal with one difference",
            main: realEqScript,
            inputs: [real(123.123123), real(123.123124)],
            output: False
        },
        {
            description: "neq self always false",
            main: `testing real_neq_self
            func main(a: Real) -> Bool {
                a != a
            }`,
            inputs: [real(0)],
            output: False
        },
        {
            description: "neq ok for many decimals with one difference",
            main: realNeqScript,
            inputs: [real(123.123123), real(123.123124)],
            output: True
        },
        {
            description: "negative 1.0 == -1.0",
            main: realNegScript,
            inputs: [real(1)],
            output: real(-1)
        },
        {
            description: "negative 0.0 == 0.0",
            main: realNegScript,
            inputs: [real(0)],
            output: real(0)
        },
        {
            description: "negative -1.0 == 1.0",
            main: realNegScript,
            inputs: [real(-1)],
            output: real(1)
        },
        {
            description: "+ 1.0 == 1.0",
            main: `testing real_pos
            func main(a: Real) -> Real {
                +a
            }`,
            inputs: [real(1)],
            output: real(1)
        },
        {
            description: "1.0 + 0.0 == 1.0",
            main: `testing real_add_0
            func main(a: Real) -> Real {
                a + 0.0
            }`,
            inputs: [real(1)],
            output: real(1)
        },
        {
            description: "1.0 + 0.5 == 0.5",
            main: realAddScript,
            inputs: [real(1), real(0.5)],
            output: real(1.5)
        },
        {
            description: "1.0 + 1000000000.5 == 1000000001.5",
            main: realAddScript,
            inputs: [real(1.0), real(1000000000.5)],
            output: real(1000000001.5)
        },
        {
            description: "1.0 - 0.0 == 1.0",
            main: `testing real_sub_0
            func main(a: Real) -> Real {
                a - 0.0
            }`,
            inputs: [real(1.0)],
            output: real(1.0)
        },
        {
            description: "0.0 - 1.0 == -1.0",
            main: `testing real_0_sub
            func main(a: Real) -> Real {
                0.0 - a 
            }`,
            inputs: [real(1.0)],
            output: real(-1.0)
        },
        {
            description: "sub self == 0.0",
            main: `testing real_sub_self
            func main(a: Real) -> Real {
                a - a
            }`,
            inputs: [real(123.123123)],
            output: real(0.0)
        },
        {
            description: "10.5 - 1.5 == 9.0",
            main: realSubScript,
            inputs: [real(10.5), real(1.5)],
            output: real(9)
        },
        {
            description: "1.0 * 0.0 == 0.0",
            main: `testing real_mul_0
            func main(a: Real) -> Real {
                a * 0.0
            }`,
            inputs: [real(1.0)],
            output: real(0.0)
        },
        {
            description: "10.123123 * 1.0 == 10.123123",
            main: `testing real_mul_1
            func main(a: Real) -> Real {
                a * 1.0
            }`,
            inputs: [real(10.123123)],
            output: real(10.123123)
        },
        {
            description: "2.0 * -0.5 == -1.0",
            main: realMulScript,
            inputs: [real(2), real(-0.5)],
            output: real(-1.0)
        },
        {
            description: "1000000.0 * 0.000001 == 1.0",
            main: realMulScript,
            inputs: [real(1000000), real(0.000001)],
            output: real(1.0)
        },
        {
            description: "0.100001 * 10 == 1.000010 ",
            main: realMulScript,
            inputs: [real(0.100001), real(10)],
            output: real(1.00001)
        },
        {
            description: "-0.100001 * 10 == -1.000010",
            main: realMulScript,
            inputs: [real(-0.100001), real(10)],
            output: real(-1.00001)
        },
        {
            description: "1.0 / literal 0.0 results in error",
            main: `testing real_div_0
            func main(a: Real) -> Real {
                a / 0.0
            }`,
            inputs: [real(1.0)],
            output: { error: "" }
        },
        {
            description: "literal 0.0 / 1.0 == 0.0",
            main: `testing real_0_div
            func main(a: Real) -> Real {
                0.0 / a
            }`,
            inputs: [real(1.0)],
            output: real(0.0)
        },
        {
            description: "123.123123 / literal 1.0 == 123.123123",
            main: `testing real_div_1
            func main(a: Real) -> Real {
                a / 1.0
            }`,
            inputs: [real(123.123123)],
            output: real(123.123123)
        },
        {
            description: "123.123123 / 123.123123 == 1.0",
            main: `testing real_div_self
            func main(a: Real) -> Real {
                a / a
            }`,
            inputs: [real(123.123123)],
            output: real(1.0)
        },
        {
            description: "2.5 / 2.0 == 1.25",
            main: realDivScript,
            inputs: [real(2.5), real(2.0)],
            output: real(1.25)
        },
        {
            description: "1.000010 / 10 = 0.100001",
            main: realDivScript,
            inputs: [real(1.00001), real(10)],
            output: real(0.100001)
        },
        {
            description: "-1.000010 / 10 = -0.100001",
            main: realDivScript,
            inputs: [real(-1.00001), real(10)],
            output: real(-0.100001)
        },
        {
            description: "1.000010.trunc() == 1",
            main: realTruncScript,
            inputs: [real(1.00001)],
            output: int(1.0)
        },
        {
            description: "1.999999.trunc() == 1",
            main: realTruncScript,
            inputs: [real(1.999999)],
            output: int(1)
        },
        {
            description: "-1.000010.trunc() == -1",
            main: realTruncScript,
            inputs: [real(-1.00001)],
            output: int(-1)
        },
        {
            description: "-1.999999.trunc() == -1",
            main: realTruncScript,
            inputs: [real(-1.999999)],
            output: int(-1)
        },
        {
            description: "1.000010.floor() == 1",
            main: realFloorScript,
            inputs: [real(1.00001)],
            output: int(1)
        },
        {
            description: "1.999999.floor() == 1",
            main: realFloorScript,
            inputs: [real(1.999999)],
            output: int(1)
        },
        {
            description: "-1.000010.floor() == -2",
            main: realFloorScript,
            inputs: [real(-1.00001)],
            output: int(-2)
        },
        {
            description: "-1.999999.floor() == -2",
            main: realFloorScript,
            inputs: [real(-1.999999)],
            output: int(-2)
        },
        {
            description: "1.000010.ceil() == 2",
            main: realCeilScript,
            inputs: [real(1.00001)],
            output: int(2)
        },
        {
            description: "1.999999.ceil() == 2",
            main: realCeilScript,
            inputs: [real(1.999999)],
            output: int(2)
        },
        {
            description: "-1.000010.ceil() == -1",
            main: realCeilScript,
            inputs: [real(-1.00001)],
            output: int(-1)
        },
        {
            description: "-1.999999.ceil() == -1",
            main: realCeilScript,
            inputs: [real(-1.999999)],
            output: int(-1)
        },
        {
            description: "Real::sqrt(2) == 1.414213",
            main: realSqrtScript,
            inputs: [real(2)],
            output: real(1.414213)
        },
        {
            description: "Real::sqrt(4) == 2.0",
            main: realSqrtScript,
            inputs: [real(4)],
            output: real(2)
        },
        {
            description: "Real::sqrt(0) == 0.0",
            main: realSqrtScript,
            inputs: [real(0)],
            output: real(0)
        },
        {
            description: "Real::sqrt(-1) throws an error",
            main: realSqrtScript,
            inputs: [real(-1)],
            output: { error: "" }
        },
        {
            description: "Real::sqrt(8) == 2.828427",
            main: realSqrtScript,
            inputs: [real(8)],
            output: real(2.828427)
        },
        {
            description: "Real::sqrt(1024) == 32",
            main: realSqrtScript,
            inputs: [real(1024)],
            output: real(32)
        },
        {
            description: "Real::sqrt(1000000) == 1000",
            main: realSqrtScript,
            inputs: [real(1000000)],
            output: real(1000)
        },
        {
            description: "Real::sqrt(1000000) == 1000",
            main: realSqrtScript,
            inputs: [real(1000000)],
            output: real(1000)
        },
        {
            description: "Real::sqrt(1_000_000_000) == 31622.776601",
            main: realSqrtScript,
            inputs: [real(1_000_000_000)],
            output: real(31622.776601)
        },
        {
            description: "Real::from_data(iData 1_000_000) == 1.0",
            main: realFromDataScript,
            inputs: [int(1_000_000)],
            output: real(1.0)
        },
        {
            description: '0.020176.show() == "0.020176"',
            main: realShowScript,
            inputs: [real(0.020176)],
            output: str("0.020176")
        },
        {
            description: '-0.020176.show() == "-0.020176"',
            main: realShowScript,
            inputs: [real(-0.020176)],
            output: str("-0.020176")
        },
        {
            description: '-305948.394872.show() == "-305948.394872"',
            main: realShowScript,
            inputs: [real(-305948.394872)],
            output: str("-305948.394872")
        },
        {
            description: '-0.394872.show() == "-0.394872"',
            main: realShowScript,
            inputs: [real(-0.394872)],
            output: str("-0.394872")
        },
        {
            description: "2.5.to_ratio() == 2_500_000 / 1_000_000",
            main: realToRatioScript,
            inputs: [real(2.5)],
            output: ratio(2_500_000, 1_000_000)
        },
        {
            description: "Real::min(-1.0, -1.1) == -1.1",
            main: realMinScript,
            inputs: [real(-1.0), real(-1.1)],
            output: real(-1.1)
        },
        {
            description: "Real::max(-1.0, -1.1) == -1.0",
            main: realMaxScript,
            inputs: [real(-1.0), real(-1.1)],
            output: real(-1.0)
        }
    ])
})
