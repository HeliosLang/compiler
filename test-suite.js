#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";
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

async function runPropertyTests() {
    const ft = new helios.FuzzyTest(Math.random()*42);


    ////////////
    // Int tests
    ////////////

    await ft.test([ft.int()], `
    test int_eq_1;
    func main(a: Int) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_eq_2;
    func main(a: Int, b: Int) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_neq_1;
    func main(a: Int) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_neq_2;
    func main(a: Int, b: Int) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
    });

    await ft.test([ft.int()], `
    test int_neg;
    func main(a: Int) -> Int {
        -a
    }`, ([a], res) => {
        return 
        res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test int_pos;
    func main(a: Int) -> Int {
        +a
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_add_0;
    func main(a: Int) -> Int {
        a + 0
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test int_add_2;
    func main(a: Int, b: Int) -> Int {
        a + b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_0;
    func main(a: Int) -> Int {
        a - 0
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_0_alt;
    func main(a: Int) -> Int {
        0 - a
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_self;
    func main(a: Int) -> Int {
        a - a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt())
    });

    await ft.test([ft.int(), ft.int()], `
    test int_sub_2;
    func main(a: Int, b: Int) -> Int {
        a - b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mul_0;
    func main(a: Int) -> Int {
        a*0
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mul_1;
    func main(a: Int) -> Int {
        a*1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test int_mul_2;
    func main(a: Int, b: Int) -> Int {
        a * b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() * b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_div_0;
    func main(a: Int) -> Int {
        a / 0
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test int_div_0_alt;
    func main(a: Int) -> Int {
        0 / a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_div_1;
    func main(a: Int) -> Int {
        a / 1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(-10, 10)], `
    test int_div_1_alt;
    func main(a: Int) -> Int {
        1 / a
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ?
            res instanceof helios.UserError && res.info === "division by zero" :
            (
                a.asInt() === 1n ? 
                1n === res.asInt() :
                (
                    a.asInt() === -1n ?
                    -1n === res.asInt() :
                    0n === res.asInt()
                )
            )
        );
    });

    await ft.test([ft.int(-20, 20)], `
    test int_div_1_self;
    func main(a: Int) -> Int {
        a / a
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ?
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (1n === res.asInt())
        );
    });

    await ft.test([ft.int(), ft.int()], `
    test int_div_2;
    func main(a: Int, b: Int) -> Int {
        a / b
    }`, ([a, b], res) => {
        return (
            b.asInt() === 0n ? 
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (a.asInt() / b.asInt() === res.asInt())
        );
    });

    await ft.test([ft.int()], `
    test int_mod_0;
    func main(a: Int) -> Int {
        a % 0
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test int_mod_0_alt;
    func main(a: Int) -> Int {
        0 % a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mod_1;
    func main(a: Int) -> Int {
        a % 1
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int(-20, 20)], `
    test int_mod_1_alt;
    func main(a: Int) -> Int {
        1 % a
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ? 
            res instanceof helios.UserError && res.info === "division by zero" :
            (
                a.asInt() === -1n || a.asInt() === 1n ?
                res.isInt() && (0n === res.asInt()) :
                res.isInt() && (1n === res.asInt())
            )
        );
    });

    await ft.test([ft.int(-10, 10)], `
    test int_mod_1_self;
    func main(a: Int) -> Int {
        a % a
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ?
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (0n === res.asInt())
        );
    });

    await ft.test([ft.int(), ft.int(-10, 10)], `
    test int_mod_2;
    func main(a: Int, b: Int) -> Int {
        a % b
    }`, ([a, b], res) => {
        return (
            b.asInt() === 0n ? 
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (a.asInt() % b.asInt() === res.asInt())
        );
    });

    await ft.test([ft.int()], `
    test int_geq_1;
    func main(a: Int) -> Bool {
        a >= a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_geq_2;
    func main(a: Int, b: Int) -> Bool {
        a >= b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_gt_1;
    func main(a: Int) -> Bool {
        a > a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_gt_2;
    func main(a: Int, b: Int) -> Bool {
        a > b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_leq_1;
    func main(a: Int) -> Bool {
        a <= a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_leq_2;
    func main(a: Int, b: Int) -> Bool {
        a <= b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_lt_1;
    func main(a: Int) -> Bool {
        a < a
    }`, ([a], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_lt_2;
    func main(a: Int, b: Int) -> Bool {
        a < b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });

    await ft.test([ft.int(-10, 10)], `
    test int_to_bool;
    func main(a: Int) -> Bool {
        a.to_bool()
    }`, ([a], res) => {
        return res.isBool() && ((a.asInt() === 0n) === !res.asBool());
    });

    await ft.test([ft.int()], `
    test int_to_hex;
    func main(a: Int) -> String {
        a.to_hex()
    }`, ([a], res) => {
        return res.isString() && (a.asInt().toString("16") === res.asString());
    });

    await ft.test([ft.int()], `
    test int_show;
    func main(a: Int) -> String {
        a.show()
    }`, ([a], res) => {
        return res.isString() && (a.asInt().toString() === res.asString());
    });


    /////////////
    // Bool tests
    /////////////

    await ft.test([ft.bool(), ft.bool()], `
    test bool_and;
    func main(a: Bool, b: Bool) -> Bool {
        a && b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() && b.asBool()) === res.asBool());
    });

    // test branch deferral as well
    await ft.test([ft.bool(), ft.bool()], `
    test bool_and_alt;
    func main(a: Bool, b: Bool) -> Bool {
        Bool::and(() -> Bool {
            a
        }, () -> Bool {
            b && (0 / 0 == 0)
        })
    }`, ([a, b], res) => {
        return (
            a.asBool() ? (
                b.asBool() ?
                res instanceof helios.UserError && res.info === "division by zero" :
                res.isBool() && (false === res.asBool())        
            ) :
            res.isBool() && (false === res.asBool())
        );
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_or;
    func main(a: Bool, b: Bool) -> Bool {
        a || b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() || b.asBool()) === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_or_alt;
    func main(a: Bool, b: Bool) -> Bool {
        Bool::or(() -> Bool {
            a
        }, () -> Bool {
            b || (0 / 0 == 0)
        }) 
    }`, ([a, b], res) => {
        return (
            a.asBool() ? 
            res.isBool() && (true === res.asBool()) :
            (
                b.asBool() ?
                res.isBool() && (true === res.asBool()) :
                res instanceof helios.UserError && res.info === "division by zero"
            )
        );
    });

    await ft.test([ft.bool()], `
    test bool_eq_1;
    func main(a: Bool) -> Bool {
        a == a
    }`, ([a], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_eq_2;
    func main(a: Bool, b: Bool) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() === b.asBool()) === res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_neq_1;
    func main(a: Bool) -> Bool {
        a != a
    }`, ([a], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_neq_2;
    func main(a: Bool, b: Bool) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() === b.asBool()) === !res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_not;
    func main(a: Bool) -> Bool {
        !a
    }`, ([a], res) => {
        return res.isBool() && (a.asBool() === !res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_to_int;
    func main(a: Bool) -> Int {
        a.to_int()
    }`, ([a], res) => {
        return res.isInt() && ((a.asBool() ? 1n : 0n) === res.asInt());
    });

    await ft.test([ft.bool()], `
    test bool_show;
    func main(a: Bool) -> String {
        a.show()
    }`, ([a], res) => {
        return res.isString() && ((a.asBool() ? "true": "false") === res.asString());
    });


    ///////////////
    // String tests
    ///////////////

    await ft.test([ft.string()], `
    test string_eq_1;
    func main(a: String) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_eq_2;
    func main(a: String, b: String) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asString() === b.asString()) === res.asBool());
    });

    await ft.test([ft.string()], `
    test string_neq_1;
    func main(a: String) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_neq_2;
    func main(a: String, b: String) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asString() === b.asString()) === !res.asBool());
    });

    await ft.test([ft.string()], `
    test string_add_1;
    func main(a: String) -> String {
        a + ""
    }`, ([a], res) => {
        return res.isString() && (a.asString() === res.asString());
    });

    await ft.test([ft.string()], `
    test string_add_1_alt;
    func main(a: String) -> String {
        "" + a
    }`, ([a], res) => {
        return res.isString() && (a.asString() === res.asString());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_add_2;
    func main(a: String, b: String) -> String {
        a + b
    }`, ([a, b], res) => {
        let sa = a.asString();
        let sb = b.asString();
        let sRes = res.asString();

        return {
            "length": res.isString() && ((sa + sb).length === sRes.length),
            "concat": res.isString() && ((sa + sb) === sRes)
        };
    });

    await ft.test([ft.string()], `
    test string_encode_utf8;
    func main(a: String) -> ByteArray {
        a.encode_utf8()
    }`, ([a], res) => {
        let aBytes = Array.from((new TextEncoder()).encode(a.asString()));
        return res.isByteArray() && res.equalsByteArray(aBytes);
    });


    //////////////////
    // ByteArray tests
    //////////////////

    let testByteArray = true;

    if (testByteArray) {
        await ft.test([ft.bytes()], `
        test bytearray_eq_1;
        func main(a: ByteArray) -> Bool {
            a == a
        }`, ([_], res) => {
            return res.isBool() && (true === res.asBool());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_eq_2;
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a == b
        }`, ([a, b], res) => {
            return res.isBool() && (a.equalsByteArray(b.asByteArray()) === res.asBool());
        });

        await ft.test([ft.bytes()], `
        test bytearray_neq_1;
        func main(a: ByteArray) -> Bool {
            a != a
        }`, ([_], res) => {
            return res.isBool() && (false === res.asBool());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_neq_2;
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a != b
        }`, ([a, b], res) => {
            return res.isBool() && (a.equalsByteArray(b.asByteArray()) === !res.asBool());
        });

        await ft.test([ft.bytes()], `
        test bytearray_add_1;
        func main(a: ByteArray) -> ByteArray {
            a + #
        }`, ([a], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray());
        });

        await ft.test([ft.bytes()], `
        test bytearray_add_1_alt;
        func main(a: ByteArray) -> ByteArray {
            # + a
        }`, ([a], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_add_2;
        func main(a: ByteArray, b: ByteArray) -> ByteArray {
            a + b
        }`, ([a, b], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray().concat(b.asByteArray()));
        });

        await ft.test([ft.bytes()], `
        test bytearray_length;
        func main(a: ByteArray) -> Int {
            a.length
        }`, ([a], res) => {
            return res.isInt() && (BigInt(a.asByteArray().length) === res.asInt());
        });

        await ft.test([ft.utf8Bytes()], `
        test bytearray_decode_utf8_utf8;
        func main(a: ByteArray) -> String {
            a.decode_utf8()
        }`, ([a], res) => {
            return res.isString() && (a.asString() === res.asString());
        });

        await ft.test([ft.bytes()], `
        test bytearray_decode_utf8;
        func main(a: ByteArray) -> String {
            a.decode_utf8()
        }`, ([a], res) => {
            if (a.isString()) {
                return res.isString() && (a.asString() === res.asString());
            } else {
                return res instanceof helios.UserError && res.info === "invalid utf-8";
            }
        });

        await ft.test([ft.bytes(0, 10)], `
        test bytearray_sha2;
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(55, 70)], `
        test bytearray_sha2_alt;
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(0, 10)], `
        test bytearray_sha3;
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(130, 140)], `
        test bytearray_sha3_alt;
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        // the crypto library only supports blake2b512 (and not blake2b256), so temporarily set digest size to 64 bytes for testing
        helios.setBlake2bDigestSize(64);

        await ft.test([ft.bytes(0, 10)], `
        test bytearray_blake2b;
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            let hash = Array.from(hasher.digest());

            return res.equalsByteArray(hash);
        });

        await ft.test([ft.bytes(130, 140)], `
        test bytearray_blake2b_alt;
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        helios.setBlake2bDigestSize(32);

        await ft.test([ft.bytes()], `
        test bytearray_show;
        func main(a: ByteArray) -> String {
            a.show()
        }`, ([a], res) => {
            let s = Array.from(a.asByteArray(), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

            return res.isString() && (s === res.asString());
        });
    }


    /////////////
    // List tests
    /////////////

    await ft.test([ft.int(-20, 20), ft.int()], `
    test list_new;
    func main(a: Int, b: Int) -> []Int {
        []Int::new(a, b)
    }`, ([a, b], res) => {
        let n = Number(a.asInt());
        if (n < 0) {
            n = 0;
        }

        return res.isList() && res.equalsList((new Array(n).fill(b.asInt())));
    });

    await ft.test([ft.list(ft.int(), 0, 20)], `
    test list_eq_1;
    func main(a: []Int) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
    test list_eq_2;
    func main(a: []Int, b: []Int) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && (b.equalsList(a.asList()) === res.asBool());
    });

    await ft.test([ft.list(ft.int())], `
    test list_neq_1;
    func main(a: []Int) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
    test list_neq_2;
    func main(a: []Int, b: []Int) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && (b.equalsList(a.asList()) === !res.asBool());
    });

    await ft.test([ft.list(ft.int())], `
    test list_add_1;
    func main(a: []Int) -> []Int {
        a + []Int{}
    }`, ([a], res) => {
        return res.isList() && (res.equalsList(a.asList()));
    });

    await ft.test([ft.list(ft.int())], `
    test list_add_1_alt;
    func main(a: []Int) -> []Int {
        []Int{} + a
    }`, ([a], res) => {
        return res.isList() && (res.equalsList(a.asList()));
    });

    await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
    test list_add_2;
    func main(a: []Int, b: []Int) -> []Int {
        a + b
    }`, ([a, b], res) => {
        return res.isList() && res.equalsList(a.asList().concat(b.asList()));
    });

    await ft.test([ft.list(ft.int(), 0, 50)], `
    test list_length;
    func main(a: []Int) -> Int {
        a.length
    }`, ([a], res) => {
        return res.isInt() && (BigInt(a.asList().length) === res.asInt());
    });

    await ft.test([ft.list(ft.int())], `
    test list_head;
    func main(a: []Int) -> Int {
        a.head
    }`, ([a], res) => {
        let aLst = a.asList();

        return (
            aLst.length == 0 ? 
            res instanceof helios.UserError && res.info === "empty list" :
            res.equalsInt(aLst[0])
        );
    });

    await ft.test([ft.list(ft.int())], `
    test list_tail;
    func main(a: []Int) -> []Int {
        a.tail
    }`, ([a], res) => {
        let aLst = a.asList();

        return  (
            aLst.length == 0 ?
            res instanceof helios.UserError && res.info === "empty list" :
            res.isList() && res.equalsList(aLst.slice(1))
        );
    });

    await ft.test([ft.list(ft.int())], `
    test list_is_empty;
    func main(a: []Int) -> Bool {
        a.is_empty()
    }`, ([a], res) => {
        return res.isBool() && ((a.asList().length == 0) === res.asBool());
    });

    await ft.test([ft.list(ft.int(), 0, 10), ft.int(-5, 15)], `
    test list_get;
    func main(a: []Int, b: Int) -> Int {
        a.get(b)
    }`, ([a, b], res) => {
        let i = Number(b.asInt());
        let n = a.asList().length;

        if (i >= n || i < 0) {
            return res instanceof helios.UserError && res.info === "index out of range";
        } else {
            return res.isInt() && res.equalsInt(a.asList()[i]);
        }
    });

    await ft.test([ft.list(ft.int()), ft.int()], `
    test list_prepend;
    func main(a: []Int, b: Int) -> []Int {
        a.prepend(b)
    }`, ([a, b], res) => {
        let expected = a.asList();
        expected.unshift(b);
        return res.isList() && res.equalsList(expected);
    });

    await ft.test([ft.list(ft.int())], `
    test list_any;
    func main(a: []Int) -> Bool {
        a.any((x: Int) -> Bool {x > 0})
    }`, ([a], res) => {
        return res.isBool() && (a.asList().some((i) => i.asInt() > 0n) === res.asBool());
    });

    await ft.test([ft.list(ft.int())], `
    test list_all;
    func main(a: []Int) -> Bool {
        a.all((x: Int) -> Bool {x > 0})
    }`, ([a], res) => {
        return res.isBool() && (a.asList().every((i) => i.asInt() > 0n) === res.asBool());
    });

    await ft.test([ft.list(ft.int())], `
    test list_find;
    func main(a: []Int) -> Int {
        a.find((x: Int) -> Bool {x > 0})
    }`, ([a], res) => {
        let aLst = a.asList();

        if (aLst.every(i => i.asInt() <= 0n)) {
            return res instanceof helios.UserError && res.info === "not found";
        } else {
            return res.equalsInt(aLst.find(i => i.asInt() > 0n));
        }
    });

    await ft.test([ft.list(ft.int())], `
    test list_filter;
    func main(a: []Int) -> []Int {
        a.filter((x: Int) -> Bool {x > 0})
    }`, ([a], res) => {
        let aLst = a.asList();
        return res.equalsList(aLst.filter(i => i.asInt() > 0n));
    });

    await ft.test([ft.list(ft.int())], `
    test list_fold;
    func main(a: []Int) -> Int {
        a.fold((sum: Int, x: Int) -> Int {sum + x}, 0)
    }`, ([a], res) => {
        let aLst = a.asList();

        return aLst.reduce((sum, i) => sum + i.asInt(), 0n) === res.asInt();
    });

    await ft.test([ft.list(ft.list(ft.int()))], `
    test list_fold_nested;
    func main(a: [][]Int) -> Int {
        a.fold((sum: Int, x: []Int) -> Int {
            x.fold((sumInner: Int, xInner: Int) -> Int {
                sumInner + xInner
            }, sum)
        }, 0)
    }`, ([a], res) => {
        let aLst = a.asList();

        let sum = aLst.reduce((sum, inner) => inner.asList().reduce((sum, i) => sum + i.asInt(), sum), 0n);

        return sum === res.asInt();
    });

    await ft.test([ft.list(ft.list(ft.int()))], `
    test list_map_fold;
    func main(a: [][]Int) -> []Int {
        a.map((inner: []Int) -> Int {
            inner.fold((sum: Int, x: Int) -> Int {
                sum + x
            }, 0)
        })
    }`, ([a], res) => {
        let aLst = a.asList();

        let sumLst = aLst.map(inner => inner.asList().reduce((sum, i) => sum + i.asInt(), 0n));

        return res.equalsList(sumLst);
    });


    ///////////////
    // Option tests
    ///////////////

    await ft.test([ft.option(ft.int())], `
    test option_eq_1;
    func main(a: Option[Int]) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_eq_2;
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_eq_2_alt;
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s == b,
            n: None => n == b
        }
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === res.asBool());
    });

    await ft.test([ft.option(ft.int())], `
    test option_neq_1;
    func main(a: Option[Int]) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_neq_2;
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === !res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_neq_2_alt;
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s != b,
            n: None => n != b
        }
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === !res.asBool());
    });

    await ft.test([ft.option(ft.int())], `
    test option_some;
    func main(a: Option[Int]) -> Int {
        a.switch{
            s: Some => s.some,
            None    => -1
        }
    }`, ([a], res) => {
        if (a.index == 1) {
            return -1n === res.asInt();
        } else {
            return a.fields[0].asInt() === res.asInt();
        }
    });


    /////////////
    // Hash tests
    /////////////

    // all hash types are equivalent, so we only need to test one
    
    await ft.test([ft.bytes(0, 1)], `
    test hash_new;
    func main(a: PubKeyHash) -> Bool {
        []ByteArray{#70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #7a, #7b, #7c, #7d, #7e, #7f}.any((ba: ByteArray) -> Bool {
            PubKeyHash::new(ba) == a
        })
    }`, ([a], res) => {
        return res.isBool() && ([[0x70], [0x71], [0x72], [0x73], [0x74], [0x75], [0x76], [0x77], [0x78], [0x79], [0x7a], [0x7b], [0x7c], [0x7d], [0x7e], [0x7f]].some(ba => a.equalsByteArray(ba)) === res.asBool());
    });

    await ft.test([ft.bytes()], `
    test hash_eq_1;
    func main(a: PubKeyHash) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.bytes(), ft.bytes()], `
    test hash_eq_2;
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsByteArray(b.asByteArray()) === res.asBool());
    });

    await ft.test([ft.bytes()], `
    test hash_neq_1;
    func main(a: PubKeyHash) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.bytes(), ft.bytes()], `
    test hash_neq_2;
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsByteArray(b.asByteArray()) === !res.asBool());
    });

    await ft.test([ft.bytes(0, 10)], `
    test hash_show;
    func main(a: PubKeyHash) -> String {
        a.show()
    }`, ([a], res) => {
        let s = Array.from(a.asByteArray(), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

        return res.isString() && (s === res.asString());
    });


    ///////////////////
    // AssetClass tests
    ///////////////////

    await ft.test([ft.bytes(0, 1), ft.string(0, 1)], `
    test assetclass_new;
    func main(a: ByteArray, b: String) -> Bool {
        AssetClass::new(a, b) == AssetClass::ADA
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asByteArray().length == 0 && b.asString().length == 0) === res.asBool());
    });

    await ft.test([ft.bytes(0, 1), ft.string(0, 1)], `
    test assetclass_new;
    func main(a: ByteArray, b: String) -> Bool {
        AssetClass::new(a, b) != AssetClass::ADA
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asByteArray().length == 0 && b.asString().length == 0) === !res.asBool());
    });


    ///////////////////
    // MoneyValue tests
    ///////////////////

    await ft.test([ft.int(-5, 5)], `
    test value_is_zero;
    func main(a: Int) -> Bool {
        Value::lovelace(a).is_zero()
    }`, ([a], res) => {
        return res.isBool() && ((a.asInt() === 0n) === res.asBool());
    });

    await ft.test([ft.int()], `
    test value_get;
    func main(a: Int) -> Int {
        Value::lovelace(a).get(AssetClass::ADA)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test value_eq_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) == Value::lovelace(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_eq_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) == Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test value_neq_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) != Value::lovelace(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_neq_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) != Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
    });

    await ft.test([ft.int()], `
    test value_add_0;
    func main(a: Int) -> Int {
        (Value::lovelace(a) + Value::ZERO).get(AssetClass::ADA)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test value_add_2;
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a) + Value::lovelace(b)).get(AssetClass::ADA)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test value_sub_0;
    func main(a: Int) -> Int {
        (Value::lovelace(a) - Value::ZERO).get(AssetClass::ADA)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test value_sub_0_alt;
    func main(a: Int) -> Int {
        (Value::ZERO - Value::lovelace(a)).get(AssetClass::ADA)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test value_sub_self;
    func main(a: Int) -> Bool {
        (Value::lovelace(a) - Value::lovelace(a)).is_zero()
    }`, ([_], res) => {
        return res.isBool() && res.asBool()
    });

    await ft.test([ft.int(), ft.int()], `
    test value_sub_2;
    func main(a: Int, b: Int) -> Int {
        (Value::lovelace(a) - Value::lovelace(b)).get(AssetClass::ADA)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test value_geq_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) >= Value::lovelace(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_geq_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) >= Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test value_gt_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) > Value::lovelace(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_gt_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) > Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test value_leq_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) <= Value::lovelace(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_leq_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) <= Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test value_lt_1;
    func main(a: Int) -> Bool {
        Value::lovelace(a) < Value::lovelace(a)
    }`, ([a], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test value_lt_2;
    func main(a: Int, b: Int) -> Bool {
        Value::lovelace(a) < Value::lovelace(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });
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

        console.log(`integration test '${name}' succeeded`);
    }
    
   

    // start of integration tests

    // 1. hello_world_true
    // * __helios__common__unStringData
    // * __helios__common__stringData
    // * __helios__common__boolData
    await runTestScript(`test hello_world_true;
    func main() -> Bool {
        print("hello world");
        true
    }`, "c:1", ["hello world"]);

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
    }`, "c:0", ["hello world"]);

    // 3. hello_number
    // * non-main function statement
    await runTestScript(`test hello_number;
    func print_message(a: Int) -> String {
        "hello number " + a.show()
    }
    func main() -> Bool {
        print(print_message(0) + "");
        !true
    }`, "c:0", ["hello number 0"]);

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
    }`, "2", []);

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
            owner: PubKeyHash::new(#1234),
            value: Value::lovelace(100)
        };
        print(d.owner.show());
        d.value > Value::ZERO
    }`, "c:1", ["1234"]);

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
    }`, "8", []);

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
    }`, "not callable", []);

    // 7. list_get ok
    await runTestScript(`test list_get;
    func main() -> Bool {
        x: []Int = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(2) == 3
    }`, "c:1", "1");

    // 8. list_get nok
    // * error thrown by builtin
    await runTestScript(`test list_get;
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out of range", "1");

    // 9. multiple_args
    // * function that takes more than 1 arguments
    await runTestScript(`test multiple_args;
    func concat(a: String, b: String) -> String {
        a + b
    }
    func main() -> Bool {
        print(concat("hello ", "world"));
        true
    }`, "c:1", ["hello world"]);

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
    }`, "[1, 2, 4, 8, 16, 5, 10, 3]", []);

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
    }`, "c:1", []);
    
    // 12. value_get
    await runTestScript(`test value_get;
    func main() -> []Int {
        ac1: AssetClass = AssetClass::new(#123, "123");
        ac2: AssetClass = AssetClass::new(#456, "456");
        ac3: AssetClass = AssetClass::new(#789, "789");


        x: Value = Value::new(ac1, 100) + Value::new(ac2, 200) - Value::new(ac1, 50);

        []Int{x.get(ac1), x.get(ac2), x.get(ac3)}
    }`, "[50, 200, 0]", []);

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
    }`, "c:1", ["false", "true", "false"]);
}

async function main() {
    let stats = new Map();

    helios.setRawUsageNotifier(function (name, n) {
        if (!stats.has(name)) {
            stats.set(name, 0);
        }

        if (n != 0) {
            stats.set(name, stats.get(name) + n);
        }
    });

    await runUnitTests();

    await runPropertyTests();

    await runIntegrationTests();

    // print statistics
    console.log("helios builtin coverage:");
    for (let [name, n] of stats) {
        console.log(n, name);
    }
}

main().catch(e => {
    console.error(`Error: ${e.message}`);
	process.exit(1);
});
