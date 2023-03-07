#!/usr/bin/env node
//@ts-check
import * as helios from "../helios.js";
import { runIfEntryPoint } from "./util.js";

async function test1() {
    const moduleSrc = `
    module my_module

    const test = 0
    `;

    const mainSrc = `
    testing my_script

    import {test} from my_module

    func main() -> Int {
        test
    }
    
    const QTY = 10
    `;

    let program = helios.Program.new(mainSrc, [moduleSrc]);

    console.log(program.prettyIR());
    console.log(program.prettyIR(true));

    let irProgram = program.compile(false);
    let result = await irProgram.run([]);

    console.log(result.toString());

    program.changeParam("QTY", "20");
    console.log(program.evalParam("QTY").toString());
}

async function test2() {
    const module1 = `
    module m1
    
    const test = 1
    `;

    const module2 = `
    module m2

    import {test as test_} from m1
    `;

    const main = `
    testing my_script

    import {test_} from m2

    func main() -> Int  {
        test_
    }
    `;

    let program = helios.Program.new(main, [module1, module2]);

    console.log(program.prettyIR());
    console.log(program.prettyIR(true));

    let irProgram = program.compile(false);
    let result = await irProgram.run([]);

    console.log(result.toString());
}

async function test3() {
    const moduleSrc = `
    module my_module

    struct MyDatum {
        a: Int
        b: Int
    }
    `;

    const main = `
    spending my_script
    
    import {MyDatum as Datum} from my_module

    func main(d: Datum, _, _) -> Bool {
        d.a == d.b
    }`;

    let program = helios.Program.new(main, [moduleSrc]);

    console.log(program.prettyIR());
}

async function test4() {
    const module1 = `
    module m1

    import {test} from m2
    `;

    const module2 = `
    module m2
    
    import {test} from m1
    `;

    const main = `
    testing my_script
    
    import {test} from m2

    func main() -> Int {
        test
    }`;

    try {
        helios.Program.new(main, [module1, module2]);
    } catch (e) {
        if (e instanceof helios.UserError) {
            if (e.message.split(":")[1].trim() == "circular import detected") {
                return;
            }
        }

        throw e;
    }
}

async function test5() {
    const moduleSrc = `
    module my_module
    
    const vh: ValidatorHash = ValidatorHash::CURRENT
    `;

    const mainSrc = `
    testing my_script

    func main() -> Int {
        0
    }

    import {vh} from my_module

    const VH: ValidatorHash = vh
    `;

    let program = helios.Program.new(mainSrc, [moduleSrc]);

    console.log(program.evalParam("VH").toString())
}``

export default async function main() {
    await test1();

    await test2();

    await test3();

    await test4();

    await test5();
}

runIfEntryPoint(main, "modules.js");
