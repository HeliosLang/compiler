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
        },
        {
            description: "an if else branch can contain a void expr",
            main: `testing  if_else_void_branch
            func main(b: Bool) -> Bool {
                if (b) {
                    ()
                } else {
                    (); (); (); error("false")
                };
                true
            }`,
            inputs: [True],
            output: True
        }
    ])
})
