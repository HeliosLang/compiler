import { describe, it } from "node:test"
import { encodeUtf8 } from "@helios-lang/codec-utils"
import { ByteArrayData, ConstrData, IntData } from "@helios-lang/uplc"
import { cbor, compileAndRunMany, False, True, str, int } from "./utils.js"

describe("Bool", () => {
    const boolIdentityScript = `testing bool_identity
    func main(x: Bool) -> Bool {
        x
    }`

    const boolNotIdentityScript = `testing bool_not_identity
    func main(x: Bool) -> Bool {
        !x
    }`

    const boolAndScript = `testing bool_and
    func main(a: Bool, b: Bool) -> Bool {
        a && b
    }`

    const boolAndAltScript = `testing bool_and_alt
    func main(a: Bool, b: Bool) -> Bool {
        Bool::and(() -> {
            a
        }, () -> {
            b
        })
    }`

    const boolOrScript = `testing bool_or
    func main(a: Bool, b: Bool) -> Bool {
        a || b
    }`

    const boolOrAltScript = `testing bool_or_alt
    func main(a: Bool, b: Bool) -> Bool {
        Bool::or(() -> {a}, () -> {b})
    }`

    const boolEqScript = `testing bool_eq
    func main(a: Bool, b: Bool) -> Bool {
        a == b
    }`

    const boolNeqScript = `testing bool_neq
    func main(a: Bool, b: Bool) -> Bool {
        a != b
    }`

    const boolToIntScript = `testing bool_to_int
    func main(a: Bool) -> Int {
        a.to_int()
    }`

    const boolShowScript = `testing bool_show
    func main(a: Bool) -> String {
        a.show()
    }`

    const boolFromDataScript = `testing bool_from_data
    func main(a: Data) -> Bool {
        Bool::from_data(a)
    }`

    const boolSerializeScript = `testing bool_serialize
    func main(a: Bool) -> ByteArray {
        a.serialize()
    }`

    const boolTraceScript = `testing bool_trace
    func main(a: Bool) -> Bool {
        a.trace("prefix")
    }`

    compileAndRunMany([
        {
            description: "Literal false == false",
            main: `testing bool_lit_false
            func main() -> Bool {
                false
            }`,
            inputs: [],
            output: False
        },
        {
            description: "Literal true == true",
            main: `testing bool_lit_true
            func main() -> Bool {
                true
            }`,
            inputs: [],
            output: True
        },
        {
            description: "Literal !false == true",
            main: `testing bool_not_lit_false
            func main() -> Bool {
                !false
            }`,
            inputs: [],
            output: True
        },
        {
            description: "Literal !true == false",
            main: `testing bool_not_lit_true
            func main() -> Bool {
                !true
            }`,
            inputs: [],
            output: False
        },
        {
            description: "Identity false == false",
            main: boolIdentityScript,
            inputs: [False],
            output: False
        },
        {
            description: "Identity true == true",
            main: boolIdentityScript,
            inputs: [True],
            output: True
        },
        {
            description: "!false == true",
            main: boolNotIdentityScript,
            inputs: [False],
            output: True
        },
        {
            description: "!true == false",
            main: boolNotIdentityScript,
            inputs: [True],
            output: False
        },
        {
            description: "true && true == true",
            main: boolAndScript,
            inputs: [True, True],
            output: True
        },
        {
            description: "true && false == false",
            main: boolAndScript,
            inputs: [True, False],
            output: False
        },
        {
            description: "false && true == false",
            main: boolAndScript,
            inputs: [False, True],
            output: False
        },
        {
            description: "false && false == false",
            main: boolAndScript,
            inputs: [False, False],
            output: False
        },
        {
            description: "Bool::and(true, true) == true",
            main: boolAndAltScript,
            inputs: [True, True],
            output: True
        },
        {
            description: "Bool::and(true, false) == false",
            main: boolAndAltScript,
            inputs: [True, False],
            output: False
        },
        {
            description: "Bool::and(false, true) == false",
            main: boolAndAltScript,
            inputs: [False, True],
            output: False
        },
        {
            description: "Bool::and(false, false) == false",
            main: boolAndAltScript,
            inputs: [False, False],
            output: False
        },
        {
            description: "true || true == true",
            main: boolOrScript,
            inputs: [True, True],
            output: True
        },
        {
            description: "true || false == true",
            main: boolOrScript,
            inputs: [True, False],
            output: True
        },
        {
            description: "false || true == true",
            main: boolOrScript,
            inputs: [False, True],
            output: True
        },
        {
            description: "false || false == false",
            main: boolOrScript,
            inputs: [False, False],
            output: False
        },
        {
            description: "Bool::or(true, true) == true",
            main: boolOrAltScript,
            inputs: [True, True],
            output: True
        },
        {
            description: "Bool::or(true, false) == true",
            main: boolOrAltScript,
            inputs: [True, False],
            output: True
        },
        {
            description: "Bool::or(false, true) == true",
            main: boolOrAltScript,
            inputs: [False, True],
            output: True
        },
        {
            description: "Bool::or(false, false) == false",
            main: boolOrAltScript,
            inputs: [False, False],
            output: False
        },
        {
            description: "(x == x) == true",
            main: `testing bool_eq_identity
            func main(x: Bool) -> Bool {
                x == x
            }`,
            inputs: [False],
            output: True
        },
        {
            description: "(true == true) == true",
            main: boolEqScript,
            inputs: [True, True],
            output: True
        },
        {
            description: "(true == false) == false",
            main: boolEqScript,
            inputs: [True, False],
            output: False
        },
        {
            description: "(false == true) == false",
            main: boolEqScript,
            inputs: [False, True],
            output: False
        },
        {
            description: "(false == false) == true",
            main: boolEqScript,
            inputs: [False, False],
            output: True
        },
        {
            description: "(x != x) == false",
            main: `testing bool_neq_identity
            func main(x: Bool) -> Bool {
                x != x
            }`,
            inputs: [True],
            output: False
        },
        {
            description: "(true != true) == false",
            main: boolNeqScript,
            inputs: [True, True],
            output: False
        },
        {
            description: "(true != false) == true",
            main: boolNeqScript,
            inputs: [True, False],
            output: True
        },
        {
            description: "(false != true) == true",
            main: boolNeqScript,
            inputs: [False, True],
            output: True
        },
        {
            description: "(false != false) == false",
            main: boolNeqScript,
            inputs: [False, False],
            output: False
        },
        {
            description: "false.to_int() == 0",
            main: boolToIntScript,
            inputs: [False],
            output: int(0)
        },
        {
            description: "true.to_int() == 1",
            main: boolToIntScript,
            inputs: [True],
            output: int(1)
        },
        {
            description: 'false.show() == "false"',
            main: boolShowScript,
            inputs: [False],
            output: str("false")
        },
        {
            description: 'true.show() == "true"',
            main: boolShowScript,
            inputs: [True],
            output: str("true")
        },
        {
            description: "Bool::from_data(false as Data) == false",
            main: boolFromDataScript,
            inputs: [False],
            output: False
        },
        {
            description: "Bool::from_data(true as Data) == true",
            main: boolFromDataScript,
            inputs: [True],
            output: True
        },
        {
            description: "false.serialize() == Cbor encoding of ConstrData(0)",
            main: boolSerializeScript,
            inputs: [False],
            output: cbor(False)
        },
        {
            description: "true.serialize() == Cbor encoding of ConstrData(1)",
            main: boolSerializeScript,
            inputs: [True],
            output: cbor(True)
        },
        {
            description: 'false.trace("...") == false',
            main: boolTraceScript,
            inputs: [False],
            output: False
        },
        {
            description: 'true.trace("...") == true',
            main: boolTraceScript,
            inputs: [True],
            output: True
        }
    ])
})
