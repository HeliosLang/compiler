import { deepEqual, match, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { removeWhitespace } from "@helios-lang/codec-utils"
import { expectLeft, expectSome } from "@helios-lang/type-utils"
import { IntData, UplcDataValue, UplcRuntimeError } from "@helios-lang/uplc"
import { getScriptHashType } from "./multi.js"
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

        deepEqual(Object.keys(fns), ["my_func"])

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

    it("source code mapping stack trace ok", () => {
        const src = `testing m
        
        enum MyEnum {
            A {
                a: Int
            }
            B
        
            func fn4(self, _a: Int) -> String {
                self.switch{
                    A{a} => a.show(),
                    B => error("unexpected variant")
                }
            }
        }

        struct MyStruct {
            a: Int

            func fn4(self) -> () {
                print(MyEnum::B.fn4(self.a))
            }

            func fn3(a: Int) -> () {
                MyStruct{a}.fn4()
            }
        }
        
        func fn2(a: Int) -> () {
            MyStruct::fn3(a+1)
        }
        
        func fn1(a: Int) -> () {
            fn2(a + 1)
        }
        
        func main(a: Int) -> Int {
            b = a*2;
            fn1(b + 1); a
        }`

        const program = new Program(src)

        const uplc = program.compile(false)

        const res = uplc.eval([new UplcDataValue(new IntData(1))])
        const err = expectLeft(res.result)

        try {
            throw new UplcRuntimeError(err.error, err.callSites)
        } catch (err) {
            if (err instanceof Error) {
                const lines = expectSome(err.stack).split("\n").slice(1)

                // Note: these tests can easily fail upon minor changes of the compiler, which is fine: simply verify that the stack trace is still sensible and rewrite some of these checks
                strictEqual(
                    lines[0].trim(),
                    "at <anonymous> (helios:m:12:31) [e0=(Constr 1 []), __lhs_0=(Constr 1 [])]"
                )
                strictEqual(
                    lines[1].trim(),
                    "at MyEnum::fn4 (helios:m:10:21) [self=(Constr 1 []), _a=5]"
                )
                strictEqual(
                    lines[2].trim(),
                    "at MyStruct::fn4 (helios:m:21:36) [self=5]"
                )
                strictEqual(
                    lines[3].trim(),
                    "at MyStruct::fn3 (helios:m:25:32) [a=5]"
                )
                strictEqual(lines[4].trim(), "at fn2 (helios:m:30:26) [a=4]")
                strictEqual(lines[5].trim(), "at fn1 (helios:m:34:16) [a=3]")
                strictEqual(
                    lines[6].trim(),
                    "at <anonymous> (helios:m:39:16) [b=2]"
                )
                strictEqual(
                    lines[7].trim(),
                    "at main (helios:m:38:15) [arg0=(I 1), a=1]"
                )
                match(lines[8], /Program.test.js/)
            } else {
                throw new Error("expeced Error, got " + err.toString())
            }
        }
    })
})
