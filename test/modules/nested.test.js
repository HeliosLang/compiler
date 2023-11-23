// test to make sure trace shows correct line-number/file

import { Program } from "helios";

export default async function test() {
    const program = Program.new(`
    testing nested_modules

    import { foo } from Foo

    func main() -> Bool {
        foo()
    }
    `, [
        `
        module Foo
        
        import { bar } from Bar
        func foo() -> Bool {
            print("foo");
            bar()
        }
        `,
        `module Bar
        
        func bar() -> Bool {
            if (1 == 1) {
                error("bar")
            };
            true
        }`
    ]);

    console.log((await program.compile(false).run([])).toString())
}