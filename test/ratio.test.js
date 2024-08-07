import { describe } from "node:test"
import { False, True, compileAndRunMany, int, ratio, real } from "./utils.js"

describe("Ratio", () => {
    const ratioNewTopScript = `testing ratio_new_first
    func main(a: Int, b: Int) -> Int {
        Ratio::new(a, b).top
    }`

    const ratioNewBottomScript = `testing ratio_new_second
    func main(a: Int, b: Int) -> Int {
        Ratio::new(a, b).bottom
    }`

    const ratioAddScript = `testing ratio_add
    func main(a: Ratio, b: Ratio) -> Ratio {
        a + b
    }`

    const ratioAddIntScript = `testing ratio_add_int
    func main(a: Ratio, b: Int) -> Ratio {
        a + b
    }`

    const intAddRatioScript = `testing int_add_ratio
    func main(a: Int, b: Ratio) -> Ratio {
        a + b
    }`

    const ratioSubScript = `testing ratio_sub
    func main(a: Ratio, b: Ratio) -> Ratio {
        a - b
    }`

    const ratioSubIntScript = `testing ratio_sub_int
    func main(a: Ratio, b: Int) -> Ratio {
        a - b
    }`

    const intSubRatioScript = `testing int_sub_ratio
    func main(a: Int, b: Ratio) -> Ratio {
        a - b
    }`

    const ratioMulScript = `testing ratio_mul
    func main(a: Ratio, b: Ratio) -> Ratio {
        a * b
    }`

    const ratioMulIntScript = `testing ratio_mul_int
    func main(a: Ratio, b: Int) -> Ratio {
        a * b
    }`

    const intMulRatioScript = `testing int_mul_ratio
    func main(a: Int, b: Ratio) -> Ratio {
        a * b
    }`

    const ratioDivScript = `testing ratio_div
    func main(a: Ratio, b: Ratio) -> Ratio {
        a/b
    }`

    const ratioDivIntScript = `testing ratio_div_int
    func main(a: Ratio, b: Int) -> Ratio {
        a/b
    }`

    const intDivRatioScript = `testing int_div_ratio
    func main(a: Int, b: Ratio) -> Ratio {
        a/b
    }`

    const ratioFloorScript = `testing ratio_floor
    func main(a: Ratio) -> Int {
        a.floor()
    }`

    const ratioTruncScript = `testing ratio_trunc
    func main(a: Ratio) -> Int {
        a.trunc()
    }`

    const ratioCeilScript = `testing ratio_ceil
    func main(a: Ratio) -> Int {
        a.ceil()
    }`

    const ratioLtScript = `testing ratio_lt
    func main(a: Ratio, b: Ratio) -> Bool {
        a < b
    }`

    const ratioLtIntScript = `testing ratio_lt_int
    func main(a: Ratio, b: Int) -> Bool {
        a < b
    }`

    const intLtRatioScript = `testing int_lt_ratio
    func main(a: Int, b: Ratio) -> Bool {
        a < b
    }`

    const ratioLeqScript = `testing ratio_leq
    func main(a: Ratio, b: Ratio) -> Bool {
        a <= b
    }`

    const ratioLeqIntScript = `testing ratio_leq_int
    func main(a: Ratio, b: Int) -> Bool {
        a <= b
    }`

    const intLeqRatioScript = `testing int_leq_ratio
    func main(a: Int, b: Ratio) -> Bool {
        a <= b
    }`

    const ratioGtScript = `testing ratio_gt
    func main(a: Ratio, b: Ratio) -> Bool {
        a > b
    }`

    const ratioGtIntScript = `testing ratio_gt_int
    func main(a: Ratio, b: Int) -> Bool {
        a > b
    }`

    const intGtRatioScript = `testing int_gt_ratio
    func main(a: Int, b: Ratio) -> Bool {
        a > b
    }`

    const ratioGeqScript = `testing ratio_geq
    func main(a: Ratio, b: Ratio) -> Bool {
        a >= b
    }`

    const ratioGeqIntScript = `testing ratio_geq_int
    func main(a: Ratio, b: Int) -> Bool {
        a >= b
    }`

    const intGeqRatioScript = `testing int_geq_ratio
    func main(a: Int, b: Ratio) -> Bool {
        a >= b
    }`

    const ratioToRealScript = `testing ratio_to_real
    func main(a: Int, b: Int) -> Real {
        Ratio::new(a, b).to_real()
    }`

    compileAndRunMany([
        {
            description: "Ratio::new(1, 2).top == 1",
            main: ratioNewTopScript,
            inputs: [int(1), int(2)],
            output: int(1)
        },
        {
            description: "Ratio::new(1, 2).bottom == 2",
            main: ratioNewBottomScript,
            inputs: [int(1), int(2)],
            output: int(2)
        },
        {
            description: "1/2 + 1/4 == 6/8",
            main: ratioAddScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(6, 8)
        },
        {
            description: "1/2 + 1 == 3/2",
            main: ratioAddIntScript,
            inputs: [ratio(1, 2), int(1)],
            output: ratio(3, 2)
        },
        {
            description: "1 + 1/2 == 3/2",
            main: intAddRatioScript,
            inputs: [int(1), ratio(1, 2)],
            output: ratio(3, 2)
        },
        {
            description: "1/2 - 1/4 == 2/8",
            main: ratioSubScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(2, 8)
        },
        {
            description: "1/2 - 1 = -1/2",
            main: ratioSubIntScript,
            inputs: [ratio(1, 2), int(1)],
            output: ratio(-1, 2)
        },
        {
            description: "1 - 1/2 = 1/2",
            main: intSubRatioScript,
            inputs: [int(1), ratio(1, 2)],
            output: ratio(1, 2)
        },
        {
            description: "1/2 * 1/4 == 1/8",
            main: ratioMulScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(1, 8)
        },
        {
            description: "1/2 * 2 == 2/2",
            main: ratioMulIntScript,
            inputs: [ratio(1, 2), int(2)],
            output: ratio(2, 2)
        },
        {
            description: "2 * 1/2 == 2/2",
            main: intMulRatioScript,
            inputs: [int(2), ratio(1, 2)],
            output: ratio(2, 2)
        },
        {
            description: "1/2 / 1/4 == 4/2",
            main: ratioDivScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(4, 2)
        },
        {
            description: "1/2 / 0 == 1/0",
            main: ratioDivIntScript,
            inputs: [ratio(1, 2), int(0)],
            output: ratio(1, 0)
        },
        {
            description: "1/2 / 10 == 1/20",
            main: ratioDivIntScript,
            inputs: [ratio(1, 2), int(10)],
            output: ratio(1, 20)
        },
        {
            description: "10 / 1/2 == 20/1",
            main: intDivRatioScript,
            inputs: [int(10), ratio(1, 2)],
            output: ratio(20, 1)
        },
        {
            description: "1/2.floor() == 0",
            main: ratioFloorScript,
            inputs: [ratio(1, 2)],
            output: int(0)
        },
        {
            description: "-1/2.floor() == -1",
            main: ratioFloorScript,
            inputs: [ratio(-1, 2)],
            output: int(-1)
        },
        {
            description: "-1/2.trunc() == 0",
            main: ratioTruncScript,
            inputs: [ratio(-1, 2)],
            output: int(0)
        },
        {
            description: "-1/2.ceil() == 0",
            main: ratioCeilScript,
            inputs: [ratio(-1, 2)],
            output: int(0)
        },
        {
            description: "1/2.ceil() == 1",
            main: ratioCeilScript,
            inputs: [ratio(1, 2)],
            output: int(1)
        },
        {
            description: "-2/2.ceil() == -1",
            main: ratioCeilScript,
            inputs: [ratio(-2, 2)],
            output: int(-1)
        },
        {
            description: "2/2.ceil() == 1",
            main: ratioCeilScript,
            inputs: [ratio(2, 2)],
            output: int(1)
        },
        {
            description: "10000001/10000000.ceil() == 2",
            main: ratioCeilScript,
            inputs: [ratio(10000001, 10000000)],
            output: int(2)
        },
        {
            description: "1/2 < 1/4 == false",
            main: ratioLtScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: False
        },
        {
            description: "1/2 < 1 == true",
            main: ratioLtIntScript,
            inputs: [ratio(1, 2), int(1)],
            output: True
        },
        {
            description: "1 < 1/2 == false",
            main: intLtRatioScript,
            inputs: [int(1), ratio(1, 2)],
            output: False
        },
        {
            description: "1/2 <= 1/4 == false",
            main: ratioLeqScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: False
        },
        {
            description: "1/2 <= 2/4 == true",
            main: ratioLeqScript,
            inputs: [ratio(1, 2), ratio(2, 4)],
            output: True
        },
        {
            description: "2/2 <= 2/4 == false",
            main: ratioLeqScript,
            inputs: [ratio(2, 2), ratio(2, 4)],
            output: False
        },
        {
            description: "1/2 <= 1 == true",
            main: ratioLeqIntScript,
            inputs: [ratio(1, 2), int(1)],
            output: True
        },
        {
            description: "1 <= 1/2 == false",
            main: intLeqRatioScript,
            inputs: [int(1), ratio(1, 2)],
            output: False
        },
        {
            description: "1/2 > 1/4 == true",
            main: ratioGtScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: True
        },
        {
            description: "1/2 > 2/4 == false",
            main: ratioGtScript,
            inputs: [ratio(1, 2), ratio(2, 4)],
            output: False
        },
        {
            description: "1/2 > 1 == false",
            main: ratioGtIntScript,
            inputs: [ratio(1, 2), int(1)],
            output: False
        },
        {
            description: "1/0 > 1 == false",
            main: ratioGtIntScript,
            inputs: [ratio(1, 0), int(1)],
            output: True
        },
        {
            description: "1 > 1/2 == true",
            main: intGtRatioScript,
            inputs: [int(1), ratio(1, 2)],
            output: True
        },
        {
            description: "1/2 >= 1/4 == true",
            main: ratioGeqScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: True
        },
        {
            description: "1/2 >= 2/4 == true",
            main: ratioGeqScript,
            inputs: [ratio(1, 2), ratio(2, 4)],
            output: True
        },
        {
            description: "1/2 >= -1 == true",
            main: ratioGeqIntScript,
            inputs: [ratio(1, 2), int(-1)],
            output: True
        },
        {
            description: "-1 >= 1/2 == false",
            main: intGeqRatioScript,
            inputs: [int(-1), ratio(1, 2)],
            output: False
        },
        {
            description: "3/2.to_real() == 1.5",
            main: ratioToRealScript,
            inputs: [int(3), int(2)],
            output: real(1.5)
        },
        {
            description: "-3/2.to_real() == -1.5",
            main: ratioToRealScript,
            inputs: [int(-3), int(2)],
            output: real(-1.5)
        },
        {
            description: "-1/1000000.to_real() == -0.000001",
            main: ratioToRealScript,
            inputs: [int(-1), int(1000000)],
            output: real(-0.000001)
        },
        {
            description: "-1/10000000.to_real() == 0",
            main: ratioToRealScript,
            inputs: [int(-1), int(10000000)],
            output: real(0)
        }
    ])
})
