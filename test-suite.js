#!/usr/bin/env node
import fs from "fs";
import * as helios from "./helios.js";


///////////////////////////////////////////////////////////
// Inline unit tests 
///////////////////////////////////////////////////////////
// These tests are defined JSDoc strings of helios.js
async function runInlineUnitTests() {
   // import  the helios library and remove the export keywords so we can use a plain eval

   let heliosSrc = fs.readFileSync("./helios.js").toString();

   heliosSrc = heliosSrc.replace(/^export /gm, "");

   let lines = heliosSrc.split("\n");

   let tests = [];
   let fnCount = 0;
   for (let i = 0; i < lines.length; i++) {
       let line = lines[i];

       if (line.trim().startsWith("* @example")) {
           i++;

           line = lines[i];

           line = line.trim().slice(1).trim().replace(/\/\/.*/, "").trim();
           
           tests.push(line);
        } else if (line.startsWith("function") || line.startsWith("async")) {
            fnCount += 1;
        }
    }

    heliosSrc = "'use strict';\n" + heliosSrc + "\n" + tests.map(t => {
        let parts = t.split("=>");

        return `assertEq(${parts[0].trim()}, ${parts[1].trim()}, 'unit test ${t} failed')`
    }).join(";\n") + ";";

    eval(heliosSrc);

    console.log(`unit tested ${tests.length} out of ${fnCount} js function statements`);
    for (let test of tests) {
        console.log("  " + test);
    }
}

async function runUnitTests() {
    await runInlineUnitTests();

    // fn should evaluate to true for a passed unit test
    async function runUnitTest(descr, fn) {
        let b = fn();
        
        if (!b) {
            throw new Error(`unit test ${descr} failed`);
        }
    }
}

async function runIntegrationTests() {
    async function runTestScript(src, expectedResult, expectedMessages) {
        let [purpose, name] = helios.extractScriptPurposeAndName(src);
    
        if (purpose != "test") {
            throw new Error(`${name} is not a test script`);
        }
        
        let [result, messages] = await helios.run(src);
    
        let resStr = result.toString();
        if (result instanceof Error) {
            resStr = resStr.split(":")[1].trim();
        } 
    
        if (resStr != expectedResult) {
            throw new Error(`unexpected result in ${name}: expected "${expectedResult}", got "${resStr}"`);
        }
    
        if (messages.length != expectedMessages.length) {
            throw new Error(`unexpected number of messages in ${name}: expected ${expectedMessages.length}, got ${messages.length}`);
        } 
    
        for (let i = 0; i < messages.length; i++) {
            if (messages[i] != expectedMessages[i]) {
                throw new Error(`unexpected message ${i} in ${name}`);
            }
        }   
    }
    
    let stats = new Map();

    helios.setRawUsageNotifier(function (name, n) {
        if (!stats.has(name)) {
            stats.set(name, 0);
        }

        if (n != 0) {
            stats.set(name, stats.get(name) + n);
        }
    });

    // start of integration tests

    // 1. hello_world_true
    // * __helios__common__unStringData
    // * __helios__common__stringData
    // * __helios__common__boolData
    await runTestScript(`test hello_world_true;
    func main() -> Bool {
        print("hello world");
        true
    }`, "data(c:1)", ["hello world"]);

    // 2. hello_world_false
    // * __helios__common__unStringData
    // * __helios__common__stringData
    // * __helios__common__boolData
    // * __helios__common__not
    // * __helios__common__unBoolData
    // * __helios__bool____not
    await runTestScript(`test hello_world_false;
    func main() -> Bool {
        print("hello world");
        !true
    }`, "data(c:0)", ["hello world"]);

    // 3. hello_number
    // * non-main function statement
    await runTestScript(`test hello_number;
    func print_message(a: Int) -> String {
        "hello number " + a.show()
    }
    func main() -> Bool {
        print(print_message(0) + "");
        !true
    }`, "data(c:0)", ["hello number 0"]);

    // 4. my_struct
    // * struct statement
    // * struct literal
    // * struct getters
    await runTestScript(`test my_struct;
    struct MyStruct {
        a: Int
        b: Int
    }
    func main() -> Int {
        x: MyStruct = MyStruct{a: 1, b: 1};
        x.a + x.b
    }`, "data(2)", []);

    // 4. owner_value
    // * struct statement
    // * struct literal
    // * struct getters
    await runTestScript(`test owner_value;
    struct Datum {
        owner: PubKeyHash
        value: Value
    }
    func main() -> Bool {
        d = Datum{
            owner: PubKeyHash::new(#123),
            value: Value::lovelace(100)
        };
        print(d.owner.show());
        d.value > Value::ZERO
    }`, "data(c:1)", ["123"]);

    // 5. fibonacci
    // * recursive function statement
    await runTestScript(`test fibonacci;
    func fibonacci(n: Int) -> Int {
        if (n < 2) {
            1
        } else {
            fibonacci(n-1) + fibonacci(n-2)
        }
    }
    func main() -> Int {
        fibonacci(5)
    }`, "data(8)", []);

    // 6. fibonacci2
    // * calling a non-function
    await runTestScript(`test fibonacci2;
    func fibonacci(n: Int) -> Int {
        if (n < 2) {
            1
        } else {
            fibonacci(n-1) + fibonacci(n-2)
        }
    }
    func main() -> Bool {
        x: ByteArray = #32423acd232;
        (fibonacci(1) == 1) && x.length() == 12
    }`, "not callable (not a function)", []);

    // 7. list_get ok
    await runTestScript(`test list_get;
    func main() -> Bool {
        x: []Int = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(2) == 3
    }`, "data(c:1)", "1");

    // 8. list_get nok
    // * error thrown by builtin
    await runTestScript(`test list_get;
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out-of-range (<0)", "1");

    // 9. multiple_args
    // * function that takes more than 1 arguments
    await runTestScript(`test multiple_args;
    func concat(a: String, b: String) -> String {
        a + b
    }
    func main() -> Bool {
        print(concat("hello ", "world"));
        true
    }`, "data(c:1)", ["hello world"]);

    // 10. collatz recursion
    // * recursion
    await runTestScript(`test collatz;
    func collatz(current: Int, accumulator: []Int) -> []Int {
        if (current == 1) {
            accumulator.prepend(current) 
        } else if (current%2 == 0) {
            collatz(current/2, accumulator.prepend(current))
        } else {
            collatz(current*3 + 1, accumulator.prepend(current))      
        }
    }
    func main() -> []Int {
        collatz(3, []Int{})
    }`, "data([1, 2, 4, 8, 16, 5, 10, 3])", []);

    // 11. list_any
    // * member function as value
    await runTestScript(`test list_any;
    func main_inner(fnAny: ((Int) -> Bool) -> Bool) -> Bool {
        fnAny((i: Int) -> Bool {
            i == 10
        })
    }
    func main() -> Bool {
        main_inner([]Int{1,2,3,4,5,6,10}.any)
    }`, "data(c:1)", []);
    
    // 12. value_get
    await runTestScript(`test value_get;
    func main() -> []Int {
        ac1: AssetClass = AssetClass::new(#123, "123");
        ac2: AssetClass = AssetClass::new(#456, "456");
        ac3: AssetClass = AssetClass::new(#789, "789");


        x: Value = Value::new(ac1, 100) + Value::new(ac2, 200) - Value::new(ac1, 50);

        []Int{x.get(ac1), x.get(ac2), x.get(ac3)}
    }`, "data([50, 200, 0])", []);

    // 13. switch_redeemer
    await runTestScript(`test staking;
    enum Redeemer {
        Unstake
        Reward
        Migrate
    }
    func main_internal(redeemer: Redeemer) -> Bool {
        redeemer.switch{
            Unstake => {false},
            Reward  => {true},
            Migrate => {false}
        }
    }
    func main() -> Bool {
        print(main_internal(Redeemer::Unstake).show());
        print(main_internal(Redeemer::Reward).show());
        print(main_internal(Redeemer::Migrate).show());
        true
    }`, "data(c:1)", ["false", "true", "false"]);

    console.log("all tests passed");
    // end of integration tests

    // print statistics
    console.log("helios builtin coverage:");
    for (let [name, n] of stats) {
        console.log(n, name);
    }
}

async function main() {
    await runUnitTests();

    await runIntegrationTests();
}

main().catch(e => {
    console.error(`Error: ${e.message}`);
	process.exit(1);
});
