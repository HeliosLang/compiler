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
            description: "multi switch with wildcard",
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
        }
    ])

    evalTypesMany([
        {
            description: "typecheck fails for unreachable default case",
            main: `testing multi_switch_wildcard
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
        }
    ])
})
