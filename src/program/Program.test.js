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
        const utilsSrc =  `module utils
            
        struct MyUtilType {
            hello: Int
        }
        const my_assetclass: AssetClass = AssetClass::new(MintingPolicyHash::new(#1234), #)
        const my_hash: ValidatorHash = ValidatorHash::new(#)
        func compare(a: String, b: String) -> Bool {
            a == b
        }`

        const mainSrc = `spending match_string
        import { compare, my_assetclass } from utils
        import { tx } from ScriptContext

        enum Datum {
            One {
                message: String
            }
            Two {
                code: Int
            }
        }
        func main(datum: Datum, redeemer: String) -> Bool {
            compare(datum.switch{
                d: One => d.message, 
                d: Two => d.code.show()
            }, redeemer) && tx.minted.get(my_assetclass) > 0
        }`

        const program = new Program(mainSrc, {moduleSources: [utilsSrc]})

        program.compile({optimize: true})
    })
})
