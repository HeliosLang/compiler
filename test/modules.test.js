//@ts-check
import {
    Program,
    UplcProgram,
    UserError
} from "helios"

async function test1() {
    const moduleSrc = `
    module my_module

    const test: Int = 0
    `;

    const mainSrc = `
    testing my_script

    import {test} from my_module

    func main() -> Int {
        test
    }
    
    const QTY: Int = 10
    `;

    let program = Program.new(mainSrc, [moduleSrc]);

    console.log(program.prettyIR());
    console.log(program.prettyIR(true));

    // also test the transfer() function
    let uplcProgram = program.compile(false).transfer(UplcProgram);
    let result = await uplcProgram.run([]);

    console.log(result.toString());

    program.parameters.QTY = 20;
    console.log(program.evalParam("QTY").toString());
}

async function test2() {
    const module1 = `
    module m1
    
    const test: Int = 1
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

    let program = Program.new(main, [module1, module2]);

    console.log(program.prettyIR());
    console.log(program.prettyIR(true));

    // also test transfer() function
    let uplcProgram = program.compile(false).transfer(UplcProgram);
    let result = await uplcProgram.run([]);

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

    let program = Program.new(main, [moduleSrc]);

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
        Program.new(main, [module1, module2]);
    } catch (e) {
        if (e instanceof UserError) {
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
    
    const vh: ValidatorHash = ValidatorHash::new(#00112233445566778899001122334455667788990011223344556677)
    `;

    const mainSrc = `
    testing my_script

    func main() -> Int {
        0
    }

    import {vh} from my_module

    const VH: ValidatorHash = vh
    `;

    let program = Program.new(mainSrc, [moduleSrc]);

    console.log(program.evalParam("VH").toString())
}

async function test6() {
    const module1 = `
    module Module1
    
    const test: Int = 1
    `;

    const module2 = `
    module Module2

    import Module1
    `;

    const main = `
    testing my_script

    import {Module1 as RenamedModule1} from Module2
    import Module2

    func main() -> Int  {
        RenamedModule1::test + Module2::Module1::test + 1_000_000.000.round()
    }
    `;

    console.log("Testing namespace import");

    let program = Program.new(main, [module1, module2]);

    console.log(program.prettyIR());
    console.log(program.prettyIR(true));

    // also test the transfer() function
    let uplcProgram = program.compile(false).transfer(UplcProgram);
    let result = await uplcProgram.run([]);

    console.log(result.toString());
}

export default async function main() {
    await test1();

    await test2();

    await test3();

    await test4();

    await test5();

    await test6();
}