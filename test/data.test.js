import { describe } from "node:test"
import { bytes, compileAndRunMany, int, str } from "./utils.js"

describe("Data", () => {
    const dataAsScript = `testing data_as
    func main(a: Data) -> Int {
        a.as[Int]
    }`

    compileAndRunMany([
        {
            description: "parametric getter works",
            main: dataAsScript,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "parametric fails for wrong input",
            main: dataAsScript,
            inputs: [bytes("")],
            output: { error: "" }
        },
        {
            description: "data.as[] can be used with operators",
            main: `testing data_as
            func main(a: Data) -> Int {
                a.as[Int]*2 + a.as[Int]/2
            }`,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "data.as[] can be used in chain",
            main: `testing data_as
            func main(a: Data) -> String {
                a.as[Int].show()
            }`,
            inputs: [int(1)],
            output: str("1")
        }
    ])
})
