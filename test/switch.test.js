import { describe } from "node:test"
import { True, compileAndRunMany, evalTypesMany, int } from "./utils.js"

describe("Switch", () => {
    compileAndRunMany([
        {
            description: "basic switch ok",
            main: `testing basic_switch
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                
                a.switch{
                    Some => true,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch ok",
            main: `testing multi_switch
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::None;
                
                (a, b).switch{
                    (Some, None) => true,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch with partial destructure",
            main: `testing multi_switch_destructure
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::None;
                
                (a, b).switch{
                    (Some{n}, None) => n == 10,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch with assignment",
            main: `testing multi_switch_assign
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::Some{#};
                
                (a, b).switch{
                    (Some, None) => false,
                    (Some, bs: Some) => bs.some == #,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch with wildcard",
            main: `testing multi_switch_wildcard
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::Some{#};
                
                (a, b).switch{
                    (Some, _) => true,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch with wildcard and full coverage",
            main: `testing multi_switch_wildcard
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::Some{#};
                
                (a, b).switch{
                    (Some, _) => true,
                    (None, None) => false,
                    (_, Some) => false
                }
            }`,
            inputs: [],
            output: True
        },
        {
            description: "multi switch with two custom enums",
            main: `testing multi_switch_wildcard
            enum MyEnum1 {
                A
                B
                C
            }
            enum MyEnum2 {
                D
                E
                F
            }
            func main() -> Bool {
                a: MyEnum1 = MyEnum1::A;
                b: MyEnum2 = MyEnum2::D;
                
                (a, b).switch{
                    (B, E) => false,
                    (A, _) => true,
                    else => false
                }
            }`,
            inputs: [],
            output: True
        }
    ])

    evalTypesMany([
        {
            description: "typecheck fails for unreachable default case",
            main: `testing multi_switch_wildcard_unreachable
            func main() -> Bool {
                a: Option[Int] = Option[Int]::Some{10};
                b: Option[ByteArray] = Option[ByteArray]::Some{#};
                
                (a, b).switch{
                    (Some, _) => true,
                    (None, None) => false,
                    (_, Some) => false,
                    else => false
                }
            }`,
            fails: true
        },
        {
            description: "typecheck fails if control type isn't an enum",
            main: `testing switch_not_enum
            func main() -> Bool {
                a = 100;
                a.switch{
                    Int => true,
                    else => false
                }
            }`,
            fails: true
        },
        {
            description: "typecheck fails if one of control tuple type isn't an enum",
            main: `testing switch_not_enum
            func main() -> Bool {
                a = 100;
                b: Option[Int] = Option[Int]::Some{100};
                (b, a).switch{
                    (Some, Int) => true,
                    else => false
                }
            }`,
            fails: true
        }
    ])
})
