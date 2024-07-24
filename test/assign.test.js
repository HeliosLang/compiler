import { describe } from "node:test";
import { compileAndRunMany, int } from "./utils.js";

describe("Assign", () => {
    compileAndRunMany([
        {
            description: "basic assignment ok",
            main: `testing basic_assign
            func main(a: Int) -> Int {
                b: Int = a;
                b + a
            }`,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "rhs type can be inferred",
            main: `testing infer_assign
            func main(a: Int) -> Int {
                b = a;
                b + a
            }`,
            inputs: [int(1)],
            output: int(2)
        }
    ])
})