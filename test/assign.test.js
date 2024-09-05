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
            description:
                "can destruct custom enum variant using variant name in enum type namespace",
            main: `testing destruct_custom_enum_variant_namespaced

            enum MyEnum {
                A{a: Int}
                B
                C
            }
            func main(d: Int) -> Int {
                my_enum: MyEnum = MyEnum::A{d};
                MyEnum::A{b} = my_enum;
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "can destruct enum nested variant (fully namespaced)",
            main: `testing destruct_custom_enum_variant_nested
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                Outer::C{Inner::A{b}} = outer;
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "can destruct enum nested variant (implicit variants)",
            main: `testing destruct_custom_enum_variant_nested
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                C{A{b}} = outer;
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "can destruct enum nested in tuple",
            main: `testing destruct_custom_enum_variant_nested
            
            enum MyEnum {
                A{
                    a: Int
                }
                B
            }
            
            func main(a: Int) -> Int {
                enum: MyEnum = MyEnum::A{a};

                (_, A{b}) = (a, enum);
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description: "can destruct enum nested in tuple (fully namespaced)",
            main: `testing destruct_custom_enum_variant_nested
            
            enum MyEnum {
                A{
                    a: Int
                }
                B
            }
            
            func main(a: Int) -> Int {
                enum: MyEnum = MyEnum::A{a};

                (_, MyEnum::A{b}) = (a, enum);
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description:
                "can destruct enum nested variant nested in tuple (implicit variants)",
            main: `testing destruct_custom_enum_variant_nested_in_tuple
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                (_, C{A{b}}) = (a, outer);
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description:
                "can destruct enum nested variant nested in tuple (partially namespaced)",
            main: `testing destruct_custom_enum_variant_nested_in_tuple
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                (_, C{Inner::A{b}}) = (a, outer);
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description:
                "can destruct enum nested variant nested in tuple (partially namespaced 2)",
            main: `testing destruct_custom_enum_variant_nested_in_tuple
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                (_, Outer::C{A{b}}) = (a, outer);
                b
            }`,
            inputs: [int(1)],
            output: int(1)
        },
        {
            description:
                "can destruct enum nested variant nested in tuple (fully namespaced)",
            main: `testing destruct_custom_enum_variant_nested_in_tuple
            
            enum Inner {
                A{a: Int}
                B
            }
            enum Outer {
                C{
                    i: Inner
                }
                D
            }
            
            func main(a: Int) -> Int {
                inner: Inner = Inner::A{a};
                outer: Outer = Outer::C{inner};

                (_, Outer::C{Inner::A{b}}) = (a, outer);
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
