import { describe } from "node:test"
import { True, compileAndRunMany } from "./utils.js"

describe("if-else", () => {
    compileAndRunMany([
        {
            description: "ok if no else branch for inner expressions",
            main: `testing if_else_single_branch
            func main(b: Bool) -> Bool {
                if (b) {
                    print("hello")
                };
                true
            }`,
            inputs: [True],
            output: True
        }
    ])
})
