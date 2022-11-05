#!/usr/bin/env node
//@ts-check
import * as helios from "./helios.js"

async function test() {
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

test();