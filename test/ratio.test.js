import { describe } from "node:test"
import { compileAndRunMany, int, ratio } from "./utils.js"

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

    const ratioSubScript = `testing ratio_sub
    func main(a: Ratio, b: Ratio) -> Ratio {
        a - b
    }`

    const ratioMulScript = `testing ratio_mul
    func main(a: Ratio, b: Ratio) -> Ratio {
        a * b
    }`

    const ratioDivScript = `testing ratio_div
    func main(a: Ratio, b: Ratio) -> Ratio {
        a/b
    }`

    const ratioFloorScript = `testing ratio_floor
    func main(a: Ratio) -> Int {
        a.floor()
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
            description: "1/2 - 1/4 == 2/8",
            main: ratioSubScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(2, 8)
        },
        {
            description: "1/2 * 1/4 == 1/8",
            main: ratioMulScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(1, 8)
        },
        {
            description: "1/2 / 1/4 == 4/2",
            main: ratioDivScript,
            inputs: [ratio(1, 2), ratio(1, 4)],
            output: ratio(4, 2)
        },
        {
            description: "1/2.floor() == 0",
            main: ratioFloorScript,
            inputs: [ratio(1, 2)],
            output: int(0)
        }
    ])
})
