import { describe } from "node:test"
import { compileAndRunMany, int } from "./utils.js"

describe("Assign", () => {
    compileAndRunMany([
        {
            description: "basic assignment ok",
            main: `testing basic_assign
            func main(a: Int) -> Int {
                b: Int = a;
                b + a
            }`,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "rhs type can be inferred",
            main: `testing infer_assign
            func main(a: Int) -> Int {
                b = a;
                b + a
            }`,
            inputs: [int(1)],
            output: int(2)
        },
        {
            description: "rhs enum variant only can be checked",
            main: `testing check_enum_variant
            func main(a: Int) -> Int {
                opt: Option[Int] = Option[Int]::Some{a};
                Some{b} = opt;
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description:
                "can destruct custom enum variant using only variant name",
            main: `testing destruct_custom_enum_variant

            enum MyEnum {
                A{a: Int}
                B
                C
            }
            func main(d: Int) -> Int {
                my_enum: MyEnum = MyEnum::A{d};
                A{b} = my_enum;
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "infers types when assigning to tuple",
            main: `testing destruct_tuple_infered_types
            
            func main(a: Int, b: Int) -> Int {
                c = (a, b);

                (d, e) = c;

                d + e
            }`,
            inputs: [int(1), int(1)],
            output: int(2)
        }
    ])
})
