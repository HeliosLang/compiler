import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { removeWhitespace } from "@helios-lang/codec-utils"
import { Program } from "./Program.js"
import { getScriptHashType } from "./multi.js"

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

    it("can access const defined inside struct inside module", () => {
        const mainSrc = `testing get_struct_const
        import { MyType } from MyModule
        func main() -> Int {
            MyType::MY_CONST
        }`

        const moduleSrc = `module MyModule
        
        struct MyType {
            field1: Int

            const MY_CONST: Int = 10
        }`

        const program = new Program(mainSrc, { moduleSources: [moduleSrc] })

        program.compile(false)
        program.compile(true)
    })

    it("can use Script enum", () => {
        const mainSrc = `spending always_succeeds_script_enum
        import { current_script } from ScriptContext
        
        func main(_, _) -> Bool {
            current_script.switch{
                always_succeeds_script_enum => true,
                other_script => false
            }
        }`

        const program = new Program(mainSrc, {
            validatorTypes: {
                always_succeeds_script_enum: getScriptHashType("spending"),
                other_script: getScriptHashType("minting")
            }
        })

        program.compile(false)
        const uplc = program.compile(true)

        strictEqual(
            removeWhitespace(uplc.toString()),
            removeWhitespace(
                "(lam __DATUM (lam __REDEEMER (lam __CONTEXT (con unit ()))))"
            )
        )
    })

    it("fails if a wrong Script name is used", () => {
        const mainSrc = `spending always_succeeds_script_enum
        import { current_script } from ScriptContext
        
        func main(_, _) -> Bool {
            current_script.switch{
                always_succeeds_script_enum => true,
                other_script => false
            }
        }`

        throws(() => {
            new Program(mainSrc, {
                validatorTypes: {
                    always_succeeds_script_enum: getScriptHashType("spending")
                }
            })
        })
    })

    it("can get mainFunc in user function for a type with a method and can gen IR", () => {
        const src = `testing user_func_methods
        
        struct Pair {
            a: Int
            b: Int

            func sum(self) -> Int {
                self.a + self.b
            }
        }

        func main() -> Int {
            0
        }`

        const program = new Program(src)

        const fn = program.userFunctions["user_func_methods"]["Pair::sum"]
        fn.mainFunc
        fn.toIR({ validatorTypes: {} })
    })

    it("tuple type schema ok", () => {
        const src = `testing m
        
        func my_func() -> (Int, Int) {
            (0, 0)
        }
        
        func main() -> Int {
            0
        }`

        const program = new Program(src)

        const fns = program.userFunctions["m"]

        deepEqual(Object.keys(fns), ["my_func", "main"])

        deepEqual(fns["my_func"].mainFunc.retType.asDataType?.toSchema(), {
            kind: "tuple",
            itemTypes: [
                {
                    kind: "internal",
                    name: "Int"
                },
                {
                    kind: "internal",
                    name: "Int"
                }
            ]
        })
    })
})
