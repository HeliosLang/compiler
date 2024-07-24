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
        }
    ])
})
