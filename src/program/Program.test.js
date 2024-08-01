import { describe, it } from "node:test"
import { Program } from "./Program.js"

describe(Program.name, () => {
    const basic = `testing test
    func main() -> Int {
        0
    }`

    it("typechecks basic program", () => {
        new Program(basic)
    })

    it("compiles basic program", () => {
        const program = new Program(basic)

        program.compile(false)
    })

    it("real script 3 works", () => {
        const mainSrc = `testing match_string

        enum Datum {
            One
            Two {
                code: Int
            }
        }

        func main(datum: Datum) -> String {
            datum.switch{
                One => "", 
                d: Two => d.code.show()
            }
        }`

        const program = new Program(mainSrc)

        program.compile({ optimize: true })
    })
})
