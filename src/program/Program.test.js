import { throws } from "assert"
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

    it("generates a CompilerError if a namespace member isn't found", () => {
        const mainSrc = `spending undefined_namespace_member
        import ScriptContext

        func main(_, _) -> Bool {
            ScriptContext::a == 0
        }`

        new Program(mainSrc, { throwCompilerErrors: false })
    })

    it("throws a type error when destructuring wrong tuple type", () => {
        const mainSrc = `testing destruct_tuple_infered_types
            
        func main(a: Int, b: Bool) -> Int {
            c = (a, b);

            (d, e) = c;

            d + e
        }`

        throws(() => {
            new Program(mainSrc)
        })
    })

    it("doesn't throw an error for an unused arg", () => {
        const mainSrc = `testing unused_arg 
        func main(_a: Int, b: Int) -> Int {
            b
        }`

        new Program(mainSrc)
    })

    it("an unused arg doesn't need a type", () => {
        const mainSrc = `testing unused_arg_without_type
        func main(_a, b: Int) -> Int {
            b
        }`

        new Program(mainSrc)
    })

    it("throws an error when trying to access an unused arg", () => {
        const mainSrc = `testing trying_to_use_unused_arg
        func main(_a: Int, b: Int) -> Int {
            _a + b
        }`

        throws(() => {
            new Program(mainSrc)
        })
    })
})
