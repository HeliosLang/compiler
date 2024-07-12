import { Program, assert } from "helios"
import { runTestScript } from "../test-runners.js"

export default async function test() {
    await runTestScript(
        `
    testing enum_scope

    func helper(a: Int, b: Int) -> Int {
        a + b
    }

    enum Enum {
        A {
            x: Int
        }

        B {
            x: Int
        }

        func helper(self) -> Int {
            self.switch{
                A{x} => helper(x, x),
                B{x} => helper(x, x)
            }
        }
    }

    func main() -> Bool {
        e = Enum::B{10};
        e.helper() == 20
    }`,
        "data(1{})",
        []
    )

    const program = Program.new(
        `
    testing enum_scope_imported
    
    import { helper } from Helpers
    enum Enum {
        A {
            x: Int
        }

        B {
            x: Int
        }

        func helper(self) -> Int {
            self.switch{
                A{x} => helper(x, x),
                B{x} => helper(x, x)
            }
        }
    }

    func main() -> Bool {
        e = Enum::B{10};
        e.helper() == 20
    }
    `,
        [
            `module Helpers
        
        func helper(a: Int, b: Int) -> Int {
            a + b
        }`
        ]
    )

    assert((await program.compile(true).run([])).toString() == "data(1{})")
}
