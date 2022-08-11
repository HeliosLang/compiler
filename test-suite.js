#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";
import * as helios from "./helios.js";

const helios_ = helios.exportedForTesting;

///////////////////////////////////////////////////////////
// Inline unit tests 
///////////////////////////////////////////////////////////
// These tests are defined JSDoc strings of helios.js
async function runInlineUnitTests() {
   // import  the helios library and remove the export keywords so we can use a plain eval

   let heliosSrc = fs.readFileSync("./helios.js").toString();

   heliosSrc = heliosSrc.replace(/^\ *export /gm, "");

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
    test int_eq_1
    func main(a: Int) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_eq_2
    func main(a: Int, b: Int) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_neq_1
    func main(a: Int) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_neq_2
    func main(a: Int, b: Int) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
    });

    await ft.test([ft.int()], `
    test int_neg
    func main(a: Int) -> Int {
        -a
    }`, ([a], res) => {
        return 
        res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test int_pos
    func main(a: Int) -> Int {
        +a
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_add_0
    func main(a: Int) -> Int {
        a + 0
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test int_add_2
    func main(a: Int, b: Int) -> Int {
        a + b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_0
    func main(a: Int) -> Int {
        a - 0
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_0_alt
    func main(a: Int) -> Int {
        0 - a
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test int_sub_self
    func main(a: Int) -> Int {
        a - a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt())
    });

    await ft.test([ft.int(), ft.int()], `
    test int_sub_2
    func main(a: Int, b: Int) -> Int {
        a - b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mul_0
    func main(a: Int) -> Int {
        a*0
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mul_1
    func main(a: Int) -> Int {
        a*1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test int_mul_2
    func main(a: Int, b: Int) -> Int {
        a * b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() * b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_div_0
    func main(a: Int) -> Int {
        a / 0
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test int_div_0_alt
    func main(a: Int) -> Int {
        0 / a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_div_1
    func main(a: Int) -> Int {
        a / 1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(-10, 10)], `
    test int_div_1_alt
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
    test int_div_1_self
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
    test int_div_2
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
    test int_mod_0
    func main(a: Int) -> Int {
        a % 0
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test int_mod_0_alt
    func main(a: Int) -> Int {
        0 % a
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test int_mod_1
    func main(a: Int) -> Int {
        a % 1
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int(-20, 20)], `
    test int_mod_1_alt
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
    test int_mod_1_self
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
    test int_mod_2
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
    test int_geq_1
    func main(a: Int) -> Bool {
        a >= a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_geq_2
    func main(a: Int, b: Int) -> Bool {
        a >= b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_gt_1
    func main(a: Int) -> Bool {
        a > a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_gt_2
    func main(a: Int, b: Int) -> Bool {
        a > b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_leq_1
    func main(a: Int) -> Bool {
        a <= a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_leq_2
    func main(a: Int, b: Int) -> Bool {
        a <= b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test int_lt_1
    func main(a: Int) -> Bool {
        a < a
    }`, ([a], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test int_lt_2
    func main(a: Int, b: Int) -> Bool {
        a < b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });

    await ft.test([ft.int(-10, 10)], `
    test int_to_bool
    func main(a: Int) -> Bool {
        a.to_bool()
    }`, ([a], res) => {
        return res.isBool() && ((a.asInt() === 0n) === !res.asBool());
    });

    await ft.test([ft.int()], `
    test int_to_hex
    func main(a: Int) -> String {
        a.to_hex()
    }`, ([a], res) => {
        return res.isString() && (a.asInt().toString("16") === res.asString());
    });

    await ft.test([ft.int()], `
    test int_show
    func main(a: Int) -> String {
        a.show()
    }`, ([a], res) => {
        return res.isString() && (a.asInt().toString() === res.asString());
    });

    await ft.test([ft.int()], `
    test int_serialize
    func main(a: Int) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    /////////////
    // Bool tests
    /////////////

    await ft.test([ft.bool(), ft.bool()], `
    test bool_and
    func main(a: Bool, b: Bool) -> Bool {
        a && b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() && b.asBool()) === res.asBool());
    });

    // test branch deferral as well
    await ft.test([ft.bool(), ft.bool()], `
    test bool_and_alt
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
    test bool_or
    func main(a: Bool, b: Bool) -> Bool {
        a || b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() || b.asBool()) === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_or_alt
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
    test bool_eq_1
    func main(a: Bool) -> Bool {
        a == a
    }`, ([a], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_eq_2
    func main(a: Bool, b: Bool) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() === b.asBool()) === res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_neq_1
    func main(a: Bool) -> Bool {
        a != a
    }`, ([a], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.bool(), ft.bool()], `
    test bool_neq_2
    func main(a: Bool, b: Bool) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asBool() === b.asBool()) === !res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_not
    func main(a: Bool) -> Bool {
        !a
    }`, ([a], res) => {
        return res.isBool() && (a.asBool() === !res.asBool());
    });

    await ft.test([ft.bool()], `
    test bool_to_int
    func main(a: Bool) -> Int {
        a.to_int()
    }`, ([a], res) => {
        return res.isInt() && ((a.asBool() ? 1n : 0n) === res.asInt());
    });

    await ft.test([ft.bool()], `
    test bool_show
    func main(a: Bool) -> String {
        a.show()
    }`, ([a], res) => {
        return res.isString() && ((a.asBool() ? "true": "false") === res.asString());
    });
    
    await ft.test([ft.bool()], `
    test bool_serialize
    func main(a: Bool) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    ///////////////
    // String tests
    ///////////////

    await ft.test([ft.string()], `
    test string_eq_1
    func main(a: String) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && (true === res.asBool());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_eq_2
    func main(a: String, b: String) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asString() === b.asString()) === res.asBool());
    });

    await ft.test([ft.string()], `
    test string_neq_1
    func main(a: String) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_neq_2
    func main(a: String, b: String) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asString() === b.asString()) === !res.asBool());
    });

    await ft.test([ft.string()], `
    test string_add_1
    func main(a: String) -> String {
        a + ""
    }`, ([a], res) => {
        return res.isString() && (a.asString() === res.asString());
    });

    await ft.test([ft.string()], `
    test string_add_1_alt
    func main(a: String) -> String {
        "" + a
    }`, ([a], res) => {
        return res.isString() && (a.asString() === res.asString());
    });

    await ft.test([ft.string(), ft.string()], `
    test string_add_2
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
    test string_encode_utf8
    func main(a: String) -> ByteArray {
        a.encode_utf8()
    }`, ([a], res) => {
        let aBytes = Array.from((new TextEncoder()).encode(a.asString()));
        return res.isByteArray() && res.equalsByteArray(aBytes);
    });

    await ft.test([ft.string()], `
    test string_serialize
    func main(a: String) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    //////////////////
    // ByteArray tests
    //////////////////

    let testByteArray = true;

    if (testByteArray) {
        await ft.test([ft.bytes()], `
        test bytearray_eq_1
        func main(a: ByteArray) -> Bool {
            a == a
        }`, ([_], res) => {
            return res.isBool() && (true === res.asBool());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_eq_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a == b
        }`, ([a, b], res) => {
            return res.isBool() && (a.equalsByteArray(b.asByteArray()) === res.asBool());
        });

        await ft.test([ft.bytes()], `
        test bytearray_neq_1
        func main(a: ByteArray) -> Bool {
            a != a
        }`, ([_], res) => {
            return res.isBool() && (false === res.asBool());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_neq_2
        func main(a: ByteArray, b: ByteArray) -> Bool {
            a != b
        }`, ([a, b], res) => {
            return res.isBool() && (a.equalsByteArray(b.asByteArray()) === !res.asBool());
        });

        await ft.test([ft.bytes()], `
        test bytearray_add_1
        func main(a: ByteArray) -> ByteArray {
            a + #
        }`, ([a], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray());
        });

        await ft.test([ft.bytes()], `
        test bytearray_add_1_alt
        func main(a: ByteArray) -> ByteArray {
            # + a
        }`, ([a], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray());
        });

        await ft.test([ft.bytes(), ft.bytes()], `
        test bytearray_add_2
        func main(a: ByteArray, b: ByteArray) -> ByteArray {
            a + b
        }`, ([a, b], res) => {
            return res.isByteArray() && res.equalsByteArray(a.asByteArray().concat(b.asByteArray()));
        });

        await ft.test([ft.bytes()], `
        test bytearray_length
        func main(a: ByteArray) -> Int {
            a.length
        }`, ([a], res) => {
            return res.isInt() && (BigInt(a.asByteArray().length) === res.asInt());
        });

        await ft.test([ft.utf8Bytes()], `
        test bytearray_decode_utf8_utf8
        func main(a: ByteArray) -> String {
            a.decode_utf8()
        }`, ([a], res) => {
            return res.isString() && (a.asString() === res.asString());
        });

        await ft.test([ft.bytes()], `
        test bytearray_decode_utf8
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
        test bytearray_sha2
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(55, 70)], `
        test bytearray_sha2_alt
        func main(a: ByteArray) -> ByteArray {
            a.sha2()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(0, 10)], `
        test bytearray_sha3
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        await ft.test([ft.bytes(130, 140)], `
        test bytearray_sha3_alt
        func main(a: ByteArray) -> ByteArray {
            a.sha3()
        }`, ([a], res) => {
            let hasher = crypto.createHash("sha3-256");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        // the crypto library only supports blake2b512 (and not blake2b256), so temporarily set digest size to 64 bytes for testing
        helios_.setBlake2bDigestSize(64);

        await ft.test([ft.bytes(0, 10)], `
        test bytearray_blake2b
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            let hash = Array.from(hasher.digest());

            return res.equalsByteArray(hash);
        });

        await ft.test([ft.bytes(130, 140)], `
        test bytearray_blake2b_alt
        func main(a: ByteArray) -> ByteArray {
            a.blake2b()
        }`, ([a], res) => {
            let hasher = crypto.createHash("blake2b512");

            hasher.update(new DataView((new Uint8Array(a.asByteArray())).buffer));

            return res.equalsByteArray(Array.from(hasher.digest()));
        });

        helios_.setBlake2bDigestSize(32);

        await ft.test([ft.bytes()], `
        test bytearray_show
        func main(a: ByteArray) -> String {
            a.show()
        }`, ([a], res) => {
            let s = Array.from(a.asByteArray(), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

            return res.isString() && (s === res.asString());
        });

        await ft.test([ft.bytes(0, 1024)], `
        test bytearray_serialize
        func main(a: ByteArray) -> ByteArray {
            a.serialize()
        }`, ([a], res) => {
            return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
        });
    }


    /////////////
    // List tests
    /////////////

    let testList = true;

    if (testList) {
        await ft.test([ft.int(-20, 20), ft.int()], `
        test list_new
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
        test list_eq_1
        func main(a: []Int) -> Bool {
            a == a
        }`, ([_], res) => {
            return res.isBool() && (true === res.asBool());
        });

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        test list_eq_2
        func main(a: []Int, b: []Int) -> Bool {
            a == b
        }`, ([a, b], res) => {
            return res.isBool() && (b.equalsList(a.asList()) === res.asBool());
        });

        await ft.test([ft.list(ft.int())], `
        test list_neq_1
        func main(a: []Int) -> Bool {
            a != a
        }`, ([_], res) => {
            return res.isBool() && (false === res.asBool());
        });

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        test list_neq_2
        func main(a: []Int, b: []Int) -> Bool {
            a != b
        }`, ([a, b], res) => {
            return res.isBool() && (b.equalsList(a.asList()) === !res.asBool());
        });

        await ft.test([ft.list(ft.int())], `
        test list_add_1
        func main(a: []Int) -> []Int {
            a + []Int{}
        }`, ([a], res) => {
            return res.isList() && (res.equalsList(a.asList()));
        });

        await ft.test([ft.list(ft.int())], `
        test list_add_1_alt
        func main(a: []Int) -> []Int {
            []Int{} + a
        }`, ([a], res) => {
            return res.isList() && (res.equalsList(a.asList()));
        });

        await ft.test([ft.list(ft.int()), ft.list(ft.int())], `
        test list_add_2
        func main(a: []Int, b: []Int) -> []Int {
            a + b
        }`, ([a, b], res) => {
            return res.isList() && res.equalsList(a.asList().concat(b.asList()));
        });

        await ft.test([ft.list(ft.int(), 0, 50)], `
        test list_length
        func main(a: []Int) -> Int {
            a.length
        }`, ([a], res) => {
            return res.isInt() && (BigInt(a.asList().length) === res.asInt());
        });

        await ft.test([ft.list(ft.int())], `
        test list_head
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
        test list_tail
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

        await ft.test([ft.list(ft.int(), 0, 10)], `
        test list_is_empty
        func main(a: []Int) -> Bool {
            a.is_empty()
        }`, ([a], res) => {
            return res.isBool() && ((a.asList().length == 0) === res.asBool());
        });

        await ft.test([ft.list(ft.int(), 0, 10), ft.int(-5, 15)], `
        test list_get
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
        test list_prepend
        func main(a: []Int, b: Int) -> []Int {
            a.prepend(b)
        }`, ([a, b], res) => {
            let expected = a.asList();
            expected.unshift(b);
            return res.isList() && res.equalsList(expected);
        });

        await ft.test([ft.list(ft.int())], `
        test list_any
        func main(a: []Int) -> Bool {
            a.any((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            return res.isBool() && (a.asList().some((i) => i.asInt() > 0n) === res.asBool());
        });

        await ft.test([ft.list(ft.int())], `
        test list_all
        func main(a: []Int) -> Bool {
            a.all((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            return res.isBool() && (a.asList().every((i) => i.asInt() > 0n) === res.asBool());
        });

        await ft.test([ft.list(ft.int())], `
        test list_find
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
        test list_filter
        func main(a: []Int) -> []Int {
            a.filter((x: Int) -> Bool {x > 0})
        }`, ([a], res) => {
            let aLst = a.asList();
            return res.equalsList(aLst.filter(i => i.asInt() > 0n));
        });

        await ft.test([ft.list(ft.int())], `
        test list_fold
        func main(a: []Int) -> Int {
            a.fold((sum: Int, x: Int) -> Int {sum + x}, 0)
        }`, ([a], res) => {
            let aLst = a.asList();

            return aLst.reduce((sum, i) => sum + i.asInt(), 0n) === res.asInt();
        });

        await ft.test([ft.list(ft.list(ft.int()))], `
        test list_fold_nested
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
        test list_map_fold
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

        await ft.test([ft.list(ft.int())], `
        test list_serialize
        func main(a: []Int) -> ByteArray {
            a.serialize()
        }`, ([a], res) => {
            return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
        });
    }

    ////////////
    // Map tests
    ////////////

    await ft.test([ft.map(ft.int(), ft.int())], `
    test map_eq
    func main(a: Map[Int]Int) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.map(ft.int(), ft.int())], `
    test map_neq
    func main(a: Map[Int]Int) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.map(ft.int(), ft.int())], `
    test map_length
    func main(a: Map[Int]Int) -> Int {
        a.length
    }`, ([a], res) => {
        return res.isInt() && (a.map.length == Number(res.asInt()));
    });

    await ft.test([ft.map(ft.int(), ft.int(), 0, 10)], `
    test map_is_empty
    func main(a: Map[Int]Int) -> Bool {
        a.is_empty()
    }`, ([a], res) => {
        return res.isBool() && ((a.map.length == 0) === res.asBool());
    });

    await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
    test map_get
    func main(a: Int, b: Int, c: Int, d: Int) -> Int {
        m = Map[Int]Int{a: b, c: d};
        m.get(c)
    }`, ([a, b, c, d], res) => {
        return res.isInt() && (d.asInt() === res.asInt());
    });

    await ft.test([ft.map(ft.int(), ft.int())], `
    test map_serialize
    func main(a: Map[Int]Int) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    ///////////////
    // Option tests
    ///////////////

    await ft.test([ft.option(ft.int())], `
    test option_eq_1
    func main(a: Option[Int]) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_eq_2
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_eq_2_alt
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s == b,
            n: None => n == b
        }
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === res.asBool());
    });

    await ft.test([ft.option(ft.int())], `
    test option_neq_1
    func main(a: Option[Int]) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && (false === res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_neq_2
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === !res.asBool());
    });

    await ft.test([ft.option(ft.int(0, 5)), ft.option(ft.int(0, 5))], `
    test option_neq_2_alt
    func main(a: Option[Int], b: Option[Int]) -> Bool {
        a.switch{
            s: Some => s != b,
            n: None => n != b
        }
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsConstr(b) === !res.asBool());
    });

    await ft.test([ft.option(ft.int())], `
    test option_some
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

    await ft.test([ft.option(ft.int())], `
    test option_serialize
    func main(a: Option[Int]) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });

    await ft.test([ft.option(ft.int())], `
    test option_sub_serialize
    func main(a: Option[Int]) -> ByteArray {
        a.switch{
            s: Some => s.serialize(),
            n: None => n.serialize()
        }
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    /////////////
    // Hash tests
    /////////////

    // all hash types are equivalent, so we only need to test one
    
    await ft.test([ft.bytes(0, 1)], `
    test hash_new
    func main(a: PubKeyHash) -> Bool {
        []ByteArray{#70, #71, #72, #73, #74, #75, #76, #77, #78, #79, #7a, #7b, #7c, #7d, #7e, #7f}.any((ba: ByteArray) -> Bool {
            PubKeyHash::new(ba) == a
        })
    }`, ([a], res) => {
        return res.isBool() && ([[0x70], [0x71], [0x72], [0x73], [0x74], [0x75], [0x76], [0x77], [0x78], [0x79], [0x7a], [0x7b], [0x7c], [0x7d], [0x7e], [0x7f]].some(ba => a.equalsByteArray(ba)) === res.asBool());
    });

    await ft.test([ft.bytes()], `
    test hash_eq_1
    func main(a: PubKeyHash) -> Bool {
        a == a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.bytes(), ft.bytes()], `
    test hash_eq_2
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a == b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsByteArray(b.asByteArray()) === res.asBool());
    });

    await ft.test([ft.bytes()], `
    test hash_neq_1
    func main(a: PubKeyHash) -> Bool {
        a != a
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.bytes(), ft.bytes()], `
    test hash_neq_2
    func main(a: PubKeyHash, b: PubKeyHash) -> Bool {
        a != b
    }`, ([a, b], res) => {
        return res.isBool() && (a.equalsByteArray(b.asByteArray()) === !res.asBool());
    });

    await ft.test([ft.bytes(0, 10)], `
    test hash_show
    func main(a: PubKeyHash) -> String {
        a.show()
    }`, ([a], res) => {
        let s = Array.from(a.asByteArray(), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

        return res.isString() && (s === res.asString());
    });

    await ft.test([ft.bytes()], `
    test hash_serialize
    func main(a: PubKeyHash) -> ByteArray {
        a.serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });


    ///////////////////
    // AssetClass tests
    ///////////////////

    await ft.test([ft.bytes(0, 1), ft.string(0, 1)], `
    test assetclass_new
    func main(a: ByteArray, b: String) -> Bool {
        AssetClass::new(a, b) == AssetClass::ADA
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asByteArray().length == 0 && b.asString().length == 0) === res.asBool());
    });

    await ft.test([ft.bytes(0, 1), ft.string(0, 1)], `
    test assetclass_new
    func main(a: ByteArray, b: String) -> Bool {
        AssetClass::new(a, b) != AssetClass::ADA
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asByteArray().length == 0 && b.asString().length == 0) === !res.asBool());
    });

    await ft.test([ft.bytes(), ft.string()], `
    test assetclass_serialize
    func main(a: ByteArray, b: String) -> ByteArray {
        AssetClass::new(a, b).serialize()
    }`, ([a, b], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(helios_.LedgerData.newAssetClass(a.asByteArray(), b.asString()));
    });


    ///////////////////
    // MoneyValue tests
    ///////////////////

    let testValue = true;

    if (testValue) {
        await ft.test([ft.int(-5, 5)], `
        test value_is_zero
        func main(a: Int) -> Bool {
            Value::lovelace(a).is_zero()
        }`, ([a], res) => {
            return res.isBool() && ((a.asInt() === 0n) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_eq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(a)
        }`, ([_], res) => {
            return res.isBool() && res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_eq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_neq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(a)
        }`, ([_], res) => {
            return res.isBool() && !res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_neq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
        });

        await ft.test([ft.int()], `
        test value_add_0
        func main(a: Int) -> Int {
            (Value::lovelace(a) + Value::ZERO).get(AssetClass::ADA)
        }`, ([a], res) => {
            return res.isInt() && (a.asInt() === res.asInt());
        });

        await ft.test([ft.int(), ft.int()], `
        test value_add_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) + Value::lovelace(b)).get(AssetClass::ADA)
        }`, ([a, b], res) => {
            return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
        });

        await ft.test([ft.int()], `
        test value_sub_0
        func main(a: Int) -> Int {
            (Value::lovelace(a) - Value::ZERO).get(AssetClass::ADA)
        }`, ([a], res) => {
            return res.isInt() && (a.asInt() === res.asInt());
        });

        await ft.test([ft.int()], `
        test value_sub_0_alt
        func main(a: Int) -> Int {
            (Value::ZERO - Value::lovelace(a)).get(AssetClass::ADA)
        }`, ([a], res) => {
            return res.isInt() && (a.asInt() === -res.asInt());
        });

        await ft.test([ft.int()], `
        test value_sub_self
        func main(a: Int) -> Bool {
            (Value::lovelace(a) - Value::lovelace(a)).is_zero()
        }`, ([_], res) => {
            return res.isBool() && res.asBool()
        });

        await ft.test([ft.int(), ft.int()], `
        test value_sub_2
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) - Value::lovelace(b)).get(AssetClass::ADA)
        }`, ([a, b], res) => {
            return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
        });

        await ft.test([ft.int()], `
        test value_geq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(a)
        }`, ([_], res) => {
            return res.isBool() && res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_geq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
        });

        await ft.test([ft.int(), ft.int()], `
        test value_contains
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a).contains(Value::lovelace(b))
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_gt_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) > Value::lovelace(a)
        }`, ([_], res) => {
            return res.isBool() && !res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_gt_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) > Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_leq_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) <= Value::lovelace(a)
        }`, ([_], res) => {
            return res.isBool() && res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_leq_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) <= Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_lt_1
        func main(a: Int) -> Bool {
            Value::lovelace(a) < Value::lovelace(a)
        }`, ([a], res) => {
            return res.isBool() && !res.asBool();
        });

        await ft.test([ft.int(), ft.int()], `
        test value_lt_2
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) < Value::lovelace(b)
        }`, ([a, b], res) => {
            return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
        });

        await ft.test([ft.int()], `
        test value_get
        func main(a: Int) -> Int {
            Value::lovelace(a).get(AssetClass::ADA)
        }`, ([a], res) => {
            return res.isInt() && (a.asInt() === res.asInt());
        });

        await ft.test([ft.bytes(10, 10), ft.string(5,5), ft.int(), ft.string(3,3), ft.int()], `
        test value_get_policy
        func main(mph_bytes: ByteArray, tn_a: String, qty_a: Int, tn_b: String, qty_b: Int) -> Bool {
            sum: Value = Value::new(AssetClass::new(mph_bytes, tn_a), qty_a) + Value::new(AssetClass::new(mph_bytes, tn_b), qty_b);
            sum.get_policy(MintingPolicyHash::new(mph_bytes)) == Map[String]Int{tn_a: qty_a, tn_b: qty_b}
        }`, ([_], res) => {    
            return res.isBool() && res.asBool();
        });

        await ft.test([ft.int(), ft.bytes(), ft.string()], `
        test value_serialize
        func main(qty: Int, mph: ByteArray, name: String) -> ByteArray {
            Value::new(AssetClass::new(mph, name), qty).serialize()
        }`, ([qty, mph, name], res) => {
            return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(helios_.LedgerData.newValue(qty.asInt(), mph.asByteArray(), name.asString()));
        });
    }


    ///////////////
    // Ledger tests
    ///////////////
    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx == ctx
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx == ctx
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx != ctx
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx != ctx
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_tx
    func main(ctx: ScriptContext) -> Tx {
        ctx.tx
    }`, ([ctx], res) => {
        return res.isSame(ctx.getParam("tx"));
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_tx
    func main(ctx: ScriptContext) -> Tx {
        ctx.tx
    }`, ([ctx], res) => {
        return res.isSame(ctx.getParam("tx"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_get_spending_purpose_output_id
    func main(ctx: ScriptContext) -> TxOutputId {
        ctx.get_spending_purpose_output_id()
    }`, ([ctx], res) => {
        return res.isSame(ctx.getParam("outputId"));
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_get_spending_purpose_output_id
    func main(ctx: ScriptContext) -> TxOutputId {
        ctx.get_spending_purpose_output_id()
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info == "unexpected constructor index";
    });

    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_get_current_validator_hash
    func main(ctx: ScriptContext) -> ValidatorHash {
        ctx.get_current_validator_hash()
    }`, ([ctx], res) => {
        return res.equalsByteArray(ctx.getParam("scriptHash"));
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_get_current_validator_hash
    func main(ctx: ScriptContext) -> ValidatorHash {
        ctx.get_current_validator_hash()
    }`, ([ctx], res) => {
        return res instanceof helios.UserError && res.info == "unexpected constructor index";
    });


    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_get_current_minting_policy_hash
    func main(ctx: ScriptContext) -> MintingPolicyHash {
        ctx.get_current_minting_policy_hash()
    }`, ([ctx], res) => {
        return res instanceof helios.UserError && res.info == "unexpected constructor index";
    });

    await ft.test([ft.mintingScriptContext()], `
    test scriptcontext_get_current_minting_policy_hash
    func main(ctx: ScriptContext) -> MintingPolicyHash {
        ctx.get_current_minting_policy_hash()
    }`, ([ctx], res) => {
        return res.equalsByteArray(ctx.getParam("scriptHash"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test scriptcontext_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx);
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx == ctx.tx
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.mintingScriptContext()], `
    test tx_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx == ctx.tx
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx != ctx.tx
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.mintingScriptContext()], `
    test tx_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx != ctx.tx
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    // test if transaction is balanced (should always be true)
    await ft.testn(10, [ft.spendingScriptContext()], `
    test tx_outputs_and_fee
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.fold((a: Value, b: TxInput) -> Value {
            a + b.output.value
        }, Value::ZERO) + ctx.tx.minted == ctx.tx.fee + ctx.tx.outputs.fold((a: Value, b: TxOutput) -> Value {
            a + b.value
        }, Value::ZERO)
    }`, ([_], res) => {
        return res.isBool() && res.asBool()
    });

    // test if a signatory also sent some outputs self
    await ft.test([ft.spendingScriptContext()], `
    test tx_signatories
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.signatories.all((s: PubKeyHash) -> Bool {
            ctx.tx.outputs.any((o: TxOutput) -> Bool {
                o.address.credential.switch{
                    c: PubKey => c.hash == s,
                    else => false
                }
            })
        })
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_id
    func main(ctx: ScriptContext) -> TxId {
        ctx.tx.id
    }`, ([ctx], res) => {
        return res.isConstr() && res.fields[0].equalsByteArray(ctx.getParam("tx").getParam("id"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_time_range
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.time_range.contains(ctx.tx.now() + Duration::new(10))
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    })

    await ft.test([ft.spendingScriptContext()], `
    test tx_outputs_sent_to
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.signatories.is_empty()) {
            true
        } else {
            ctx.tx.outputs_sent_to(ctx.tx.signatories.head).length > 0
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_outputs_locked_by
    func main(ctx: ScriptContext) -> Bool {
        h: ValidatorHash = ctx.get_current_validator_hash();
        ctx.tx.outputs_locked_by(h) == ctx.tx.outputs.filter((o: TxOutput) -> Bool {
            o.address.credential.switch{
                Validator => true,
                else => false
            }
        })
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.testn(10, [ft.spendingScriptContext()], `
    test tx_value_sent_to
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.signatories.is_empty()) {
            true
        } else {
            h: PubKeyHash = ctx.tx.signatories.head;
            ctx.tx.value_sent_to(h) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
                sum + if (o.address.credential.switch{p: PubKey => p.hash == h, else => false}) {o.value} else {Value::ZERO}
            }, Value::ZERO)
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.testn(10, [ft.spendingScriptContext()], `
    test tx_value_locked_by
    func main(ctx: ScriptContext) -> Bool {
        h: ValidatorHash = ctx.get_current_validator_hash();
        ctx.tx.value_locked_by(h) == ctx.tx.outputs.fold((sum: Value, o: TxOutput) -> Value {
            sum + if (o.address.credential.switch{v: Validator => v.hash == h, else => false}) {o.value} else {Value::ZERO}
        }, Value::ZERO)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.object(ft.int()), ft.spendingScriptContext()],`
    test tx_value_locked_by_datum
    struct Datum {
        a: Int
    }
    func main(datum: Datum, ctx: ScriptContext) -> Bool {
        h: ValidatorHash = ctx.get_current_validator_hash();
        (ctx.tx.value_locked_by_datum(h, datum) == ctx.tx.outputs.fold((a: Value, o: TxOutput) -> Value {
            a + if (o.address.credential.switch{v: Validator => v.hash == h, else => false}) {o.value} else {Value::ZERO}
        }, Value::ZERO)) && datum.a == datum.a
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_is_signed_by
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.signatories.is_empty()) {
            false
        } else {
            ctx.tx.is_signed_by(ctx.tx.signatories.head)
        }
    }`, ([ctx], res) => {
        return res.isBool() && ((ctx.getParam("tx").getParam("signatories").length > 0) === res.asBool());
    });

    await ft.test([ft.spendingScriptContext()], `
    test tx_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test txid_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.id == ctx.tx.id
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txid_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.id != ctx.tx.id
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txid_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.id.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(helios_.LedgerData.newTxId(ctx.getParam('tx').getParam("id")));
    });

    await ft.test([ft.spendingScriptContext()], `
    test txinput_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.inputs.length == 1) {
            ctx.tx.inputs.head == ctx.tx.inputs.get(0)
        } else {
            ctx.tx.inputs.head != ctx.tx.inputs.get(1)
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txinput_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("inputs")[0]);
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutput_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.outputs.length == 1) {
            ctx.tx.outputs.head == ctx.tx.outputs.get(0)
        } else {
            ctx.tx.outputs.head != ctx.tx.outputs.get(1)
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutput_datum_hash
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.datum_hash.switch{
            s: Some => s.some == s.some,
            n: None => n == n
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutput_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.outputs.head.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("outputs")[0]);
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutputid_eq_neq
    func main(ctx: ScriptContext) -> Bool {
        if (ctx.tx.inputs.length == 1) {
            ctx.tx.inputs.head.output_id == ctx.tx.inputs.get(0).output_id
        } else {
            ctx.tx.inputs.head.output_id != ctx.tx.inputs.get(1).output_id
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutputid_new
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output_id != TxOutputId::new(#123, 0)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test txoutputid_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output_id.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("inputs")[0].getParam("outputId"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test address_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address == ctx.tx.inputs.get(0).output.address
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test address_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address != ctx.tx.inputs.get(0).output.address
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test address_staking_credential
    func main(ctx: ScriptContext) -> Option[StakingCredential] {
        ctx.tx.inputs.head.output.address.staking_credential
    }`, ([a], res) => {

        return res.isSame(helios_.LedgerData.newOption(helios_.LedgerData.newStakingCredential(a.getParam("tx").getParam("inputs")[0].getParam("output").getParam("address").getParam("stakingHash"))));
    });

    await ft.test([ft.spendingScriptContext()], `
    test address_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("inputs")[0].getParam("output").getParam("address"))
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.credential == ctx.tx.inputs.get(0).output.address.credential
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.credential != ctx.tx.inputs.get(0).output.address.credential
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.credential.serialize()
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("inputs")[0].getParam("output").getParam("address").getParam("credential"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_sub_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.address.credential.switch{
            p: PubKey => p == p,
            v: Validator => v == v
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_sub_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.outputs.head.address.credential.switch{
            p: PubKey => p != p,
            v: Validator => v != v
        }
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test credential_sub_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.credential.switch{
            p: PubKey => p.serialize(),
            v: Validator => v.serialize()
        }
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(ctx.getParam("tx").getParam("inputs")[0].getParam("output").getParam("address").getParam("credential"));
    });

    await ft.test([ft.spendingScriptContext()], `
    test staking_credential_eq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some == s.some,
            n: None => n == n
        }
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test staking_credential_neq
    func main(ctx: ScriptContext) -> Bool {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some != s.some,
            n: None => n != n
        }
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.spendingScriptContext()], `
    test staking_credential_serialize
    func main(ctx: ScriptContext) -> ByteArray {
        ctx.tx.inputs.head.output.address.staking_credential.switch{
            s: Some => s.some.serialize(),
            n: None => n.serialize()
        }
    }`, ([ctx], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(helios_.LedgerData.newStakingCredential(ctx.getParam("tx").getParam("inputs")[0].getParam("output").getParam("address").getParam("stakingHash")));
    });

    await ft.test([ft.int()], `
    test time_eq_1
    func main(a: Int) -> Bool {
        Time::new(a) == Time::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_eq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) == Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test time_neq_1
    func main(a: Int) -> Bool {
        Time::new(a) != Time::new(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_neq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) != Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
    });

    await ft.test([ft.int(), ft.int()], `
    test time_add_2
    func main(a: Int, b: Int) -> Time {
        Time::new(a) + Duration::new(b)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test time_sub_0
    func main(a: Int) -> Duration {
        Time::new(a) - Time::new(0)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test time_sub_self
    func main(a: Int) -> Duration {
        Time::new(a) - Time::new(a)
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt())
    });

    await ft.test([ft.int(), ft.int()], `
    test time_sub_2
    func main(a: Int, b: Int) -> Duration {
        Time::new(a) - Time::new(b)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test time_geq_1
    func main(a: Int) -> Bool {
        Time::new(a) >= Time::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_geq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) >= Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test time_gt_1
    func main(a: Int) -> Bool {
        Time::new(a) > Time::new(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_gt_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) > Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test time_leq_1
    func main(a: Int) -> Bool {
        Time::new(a) <= Time::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_leq_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) <= Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test time_lt_1
    func main(a: Int) -> Bool {
        Time::new(a) < Time::new(a)
    }`, ([a], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test time_lt_2
    func main(a: Int, b: Int) -> Bool {
        Time::new(a) < Time::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test time_show
    func main(a: Int) -> String {
        Time::new(a).show()
    }`, ([a], res) => {
        return res.isString() && (a.asInt().toString() === res.asString());
    });

    await ft.test([ft.int()], `
    test time_serialize
    func main(a: Int) -> ByteArray {
        Time::new(a).serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });

    await ft.test([ft.int()], `
    test duration_eq_1
    func main(a: Int) -> Bool {
        Duration::new(a) == Duration::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_eq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) == Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test duration_neq_1
    func main(a: Int) -> Bool {
        Duration::new(a) != Duration::new(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_neq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) != Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() === b.asInt()) === (!res.asBool()));
    });

    await ft.test([ft.int()], `
    test duration_add_0
    func main(a: Int) -> Duration {
        Duration::new(a) + Duration::new(0)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_add_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) + Duration::new(b)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() + b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_sub_0
    func main(a: Int) -> Duration {
        Duration::new(a) - Duration::new(0)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_sub_0_alt
    func main(a: Int) -> Duration {
        Duration::new(0) - Duration::new(a)
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === -res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_sub_self
    func main(a: Int) -> Duration {
        Duration::new(a) - Duration::new(a)
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt())
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_sub_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) - Duration::new(b)
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() - b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_mul_0
    func main(a: Int) -> Duration {
        Duration::new(a)*0
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_mul_1
    func main(a: Int) -> Duration {
        Duration::new(a)*1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_mul_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) * b
    }`, ([a, b], res) => {
        return res.isInt() && (a.asInt() * b.asInt() === res.asInt());
    });

    await ft.test([ft.int()], `
    test duration_div_0
    func main(a: Int) -> Duration {
        Duration::new(a) / 0
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test duration_div_1
    func main(a: Int) -> Duration {
        Duration::new(a) / 1
    }`, ([a], res) => {
        return res.isInt() && (a.asInt() === res.asInt());
    });

    await ft.test([ft.int(-20, 20)], `
    test duration_div_1_self
    func main(a: Int) -> Duration {
        Duration::new(a) / a
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ?
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (1n === res.asInt())
        );
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_div_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) / b
    }`, ([a, b], res) => {
        return (
            b.asInt() === 0n ? 
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (a.asInt() / b.asInt() === res.asInt())
        );
    });

    await ft.test([ft.int()], `
    test duration_mod_0
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(0)
    }`, ([_], res) => {
        return res instanceof helios.UserError && res.info === "division by zero";
    });

    await ft.test([ft.int()], `
    test duration_mod_1
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(1)
    }`, ([_], res) => {
        return res.isInt() && (0n === res.asInt());
    });

    await ft.test([ft.int(-20, 20)], `
    test duration_mod_1_alt
    func main(a: Int) -> Duration {
        Duration::new(1) % Duration::new(a)
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
    test duration_mod_1_self
    func main(a: Int) -> Duration {
        Duration::new(a) % Duration::new(a)
    }`, ([a], res) => {
        return (
            a.asInt() === 0n ?
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (0n === res.asInt())
        );
    });

    await ft.test([ft.int(), ft.int(-10, 10)], `
    test duration_mod_2
    func main(a: Int, b: Int) -> Duration {
        Duration::new(a) % Duration::new(b)
    }`, ([a, b], res) => {
        return (
            b.asInt() === 0n ? 
            res instanceof helios.UserError && res.info === "division by zero" :
            res.isInt() && (a.asInt() % b.asInt() === res.asInt())
        );
    });

    await ft.test([ft.int()], `
    test duration_geq_1
    func main(a: Int) -> Bool {
        Duration::new(a) >= Duration::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_geq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) >= Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() >= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test duration_gt_1
    func main(a: Int) -> Bool {
        Duration::new(a) > Duration::new(a)
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_gt_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) > Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() > b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test duration_leq_1
    func main(a: Int) -> Bool {
        Duration::new(a) <= Duration::new(a)
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_leq_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) <= Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() <= b.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test duration_lt_1
    func main(a: Int) -> Bool {
        Duration::new(a) < Duration::new(a)
    }`, ([a], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test duration_lt_2
    func main(a: Int, b: Int) -> Bool {
        Duration::new(a) < Duration::new(b)
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });
    
    await ft.test([ft.int()], `
    test duration_serialize
    func main(a: Int) -> ByteArray {
        Duration::new(a).serialize()
    }`, ([a], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(a);
    });

    await ft.test([ft.int()], `
    test timerange_always
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.contains(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int()], `
    test timerange_never
    func main(a: Int) -> Bool {
        TimeRange::NEVER.contains(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_from
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).contains(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && ((b.asInt() >= a.asInt()) === res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_to
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).contains(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && ((b.asInt() <= a.asInt()) === res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_eq_1
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) == TimeRange::new(Time::new(a), Time::new(b))
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
    test timerange_eq_2
    func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) == TimeRange::new(Time::new(c), Time::new(d))
    }`, ([a, b, c, d], res) => {
        return res.isBool() && (((a.asInt() == c.asInt()) && (b.asInt() == d.asInt())) === res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_neq_1
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) != TimeRange::new(Time::new(a), Time::new(b))
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int(), ft.int(), ft.int()], `
    test timerange_neq_2
    func main(a: Int, b: Int, c: Int, d: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)) != TimeRange::new(Time::new(c), Time::new(d))
    }`, ([a, b, c, d], res) => {
        return res.isBool() && (((a.asInt() == c.asInt()) && (b.asInt() == d.asInt())) === !res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_contains
    func main(a: Int, b: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).contains(Time::new((a+b)/2))
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt() - 1n) === res.asBool());
    });

    await ft.test([ft.int()], `
    test timerange_is_after_1
    func main(a: Int) -> Bool {
        TimeRange::NEVER.is_after(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int()], `
    test timerange_is_after_2
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.is_after(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_is_after_3
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).is_after(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_is_after_4
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).is_after(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && ((b.asInt() < a.asInt()) === res.asBool());
    });

    await ft.test([ft.int(), ft.int(), ft.int()], `
    test timerange_is_after_5
    func main(a: Int, b: Int, c: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).is_after(Time::new(c))
    }`, ([a, _, c], res) => {
        return res.isBool() && ((c.asInt() < a.asInt()) === res.asBool());
    });

    await ft.test([ft.int()], `
    test timerange_is_before_1
    func main(a: Int) -> Bool {
        TimeRange::NEVER.is_before(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && res.asBool();
    });

    await ft.test([ft.int()], `
    test timerange_is_before_2
    func main(a: Int) -> Bool {
        TimeRange::ALWAYS.is_before(Time::new(a))
    }`, ([_], res) => {
        return res.isBool() && !res.asBool();
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_is_before_3
    func main(a: Int, b: Int) -> Bool {
        TimeRange::to(Time::new(a)).is_before(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && ((a.asInt() < b.asInt()) === res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_is_before_4
    func main(a: Int, b: Int) -> Bool {
        TimeRange::from(Time::new(a)).is_before(Time::new(b))
    }`, ([a, b], res) => {
        return res.isBool() && !res.asBool();
        
    });

    await ft.test([ft.int(), ft.int(), ft.int()], `
    test timerange_is_before_5
    func main(a: Int, b: Int, c: Int) -> Bool {
        TimeRange::new(Time::new(a), Time::new(b)).is_before(Time::new(c))
    }`, ([_, b, c], res) => {
        return res.isBool() && ((b.asInt() < c.asInt()) === res.asBool());
    });

    await ft.test([ft.int(), ft.int()], `
    test timerange_serialize
    func main(a: Int, b: Int) -> ByteArray {
        TimeRange::new(Time::new(a), Time::new(b)).serialize()
    }`, ([a, b], res) => {
        return helios_.PlutusCoreData.decodeCBORData(res.asByteArray()).isSame(helios_.LedgerData.newFiniteTimeRange(a.asInt(), b.asInt() - a.asInt()));
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
    await runTestScript(`test hello_world_true
    func main() -> Bool {
        print("hello world");
        true
    }`, "1{}", ["hello world"]);

    // 2. hello_world_false
    // * __helios__common__unStringData
    // * __helios__common__stringData
    // * __helios__common__boolData
    // * __helios__common__not
    // * __helios__common__unBoolData
    // * __helios__bool____not
    await runTestScript(`test hello_world_false
    func main() -> Bool {
        print("hello world");
        !true
    }`, "0{}", ["hello world"]);

    // 3. hello_number
    // * non-main function statement
    await runTestScript(`test hello_number
    func print_message(a: Int) -> String {
        "hello number " + a.show()
    }
    func main() -> Bool {
        print(print_message(0) + "");
        !true
    }`, "0{}", ["hello number 0"]);

    // 4. my_struct
    // * struct statement
    // * struct literal
    // * struct getters
    await runTestScript(`test my_struct
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
    await runTestScript(`test owner_value
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
    }`, "1{}", ["1234"]);

    // 5. fibonacci
    // * recursive function statement
    await runTestScript(`test fibonacci
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
    await runTestScript(`test fibonacci2
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
    await runTestScript(`test list_get
    func main() -> Bool {
        x: []Int = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(2) == 3
    }`, "1{}", "1");

    // 8. list_get nok
    // * error thrown by builtin
    await runTestScript(`test list_get
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out of range", "1");

    // 9. multiple_args
    // * function that takes more than 1 arguments
    await runTestScript(`test multiple_args
    func concat(a: String, b: String) -> String {
        a + b
    }
    func main() -> Bool {
        print(concat("hello ", "world"));
        true
    }`, "1{}", ["hello world"]);

    // 10. collatz recursion
    // * recursion
    await runTestScript(`test collatz
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
    await runTestScript(`test list_any
    func main_inner(fnAny: ((Int) -> Bool) -> Bool) -> Bool {
        fnAny((i: Int) -> Bool {
            i == 10
        })
    }
    func main() -> Bool {
        main_inner([]Int{1,2,3,4,5,6,10}.any)
    }`, "1{}", []);
    
    // 12. value_get
    await runTestScript(`test value_get
    func main() -> []Int {
        ac1: AssetClass = AssetClass::new(#123, "123");
        ac2: AssetClass = AssetClass::new(#456, "456");
        ac3: AssetClass = AssetClass::new(#789, "789");


        x: Value = Value::new(ac1, 100) + Value::new(ac2, 200) - Value::new(ac1, 50);

        []Int{x.get(ac1), x.get(ac2), x.get(ac3)}
    }`, "[50, 200, 0]", []);

    // 13. switch_redeemer
    await runTestScript(`test staking
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
    }`, "1{}", ["false", "true", "false"]);

    // 14. struct method recursion
    await runTestScript(`
    test fibonacci_struct
    struct Fib {
        a: Int
        b: Int
        func calc_internal(self, n: Int) -> Fib {
            if (n == 0) {
                self
            } else {
                Fib{a: self.b, b: self.a + self.b}.calc_internal(n-1)
            }
        }
        func calc(self, n: Int) -> Int {
            res: Fib = self.calc_internal(n);
            res.a + res.b
        }
    }
    func main() -> Int {
        fib = Fib{a: 0, b: 1};
        fib.calc(5)
    }`, "13", []);

    // 15. enum method recursion
    await runTestScript(`
    test fibonacci_enum
    enum Fib {
        One{
            a: Int
            b: Int
        }
        Two{
            a: Int
            b: Int
        }
        func calc_internal(self, n: Int) -> Fib {
            self.switch{
                o: One => 
                    if (n == 0) {
                        o
                    } else {
                        Fib::One{a: o.b, b: o.a + o.b}.calc_internal(n-1)
                    },
                t: Two =>
                    if (n == 0) {
                        t
                    } else {
                        Fib::Two{a: t.b, b: t.a + t.b}.calc_internal(n-1)
                    }
            }  
        }
        func calc(self, n: Int) -> Int {
            res: Fib = self.calc_internal(n);

            res.switch{
                o: One => o.a + o.b,
                t: Two => t.a + t.b
            }
        }
    }
    func main() -> Int {
        fib = Fib::One{a: 0, b: 1};
        print(fib.calc(5).show());
        Fib::Two{a: 0, b: 1}.calc(6)
    }`, "21", ["13"]);
}

async function main() {
    let stats = new Map();

    helios_.setRawUsageNotifier(function (name, n) {
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
