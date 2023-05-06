#!/usr/bin/env node
//@ts-check

import * as helios from "../helios.js";
import { assert, runIfEntryPoint } from "./util.js";

function checkSerialization(testName, obj, cborHex) {
    try {
        const script = helios.NativeScript.fromCbor(cborHex);
        //console.log(helios.NativeScript.fromCbor(cborHex).toJson(), obj);

        assert(
            JSON.stringify(script.toJson()) ==
            JSON.stringify(obj)
        , "deserialization failed");

        //console.log(cborHex, helios.bytesToHex(helios.NativeScript.fromJson(obj).toCbor()))

        if (cborHex.startsWith("00")) {
            cborHex = cborHex.slice(2);
        }

        assert(
            cborHex == 
            helios.bytesToHex(helios.NativeScript.fromJson(obj).toCbor())
        , "serialization failed");

        const address = helios.Address.fromValidatorHash(new helios.ValidatorHash(script.hash()), null, false);

        console.log(`${testName} ok (${address.toBech32()})`);
    } catch (e) {
        console.log(`${testName} nok`);

        throw e;
    }
}

export default async function main() {
    checkSerialization(
        "native script test vector 1",
        {
            type: "sig", 
            keyHash: "00000000000000000000000000000000000000000000000000000000"
        },
        "8200581c00000000000000000000000000000000000000000000000000000000"
    );

    checkSerialization(
        "native script test vector 2",
        {
            type: "sig", 
            keyHash: "4da965a049dfd15ed1ee19fba6e2974a0b79fc416dd1796a1f97f5e1"
        },
        "8200581c4da965a049dfd15ed1ee19fba6e2974a0b79fc416dd1796a1f97f5e1"
    );

    checkSerialization(
        "native script test vector 3",
        {
            type: "all", 
            scripts: [ 
                { 
                    type: "sig", 
                    keyHash: "00000000000000000000000000000000000000000000000000000000"
                }, { 
                    type: "any", 
                    scripts: [ 
                        { 
                            type: "after", 
                            slot: 42
                        }, {
                            type: "sig", 
                            keyHash: "00000000000000000000000000000000000000000000000000000001"
                        }
                    ]
                }
            ]
        },
        "8201828200581c000000000000000000000000000000000000000000000000000000008202828204182a8200581c00000000000000000000000000000000000000000000000000000001"
    );

    checkSerialization(
        "native script test vector 4",
        {
            type: "before",
            slot: 42
        },
        "8205182a"
    );

    checkSerialization(
        "native script test vector 5",
        {
            type: "atLeast", 
            required: 2, 
            scripts: [ 
                { 
                    type: "sig", 
                    keyHash: "00000000000000000000000000000000000000000000000000000000" 
                }, {
                    type: "sig", 
                    keyHash: "00000000000000000000000000000000000000000000000000000001" 
                }, { 
                    type: "sig", 
                    keyHash: "00000000000000000000000000000000000000000000000000000002" 
                }
            ]
        },
        "00830302838200581c000000000000000000000000000000000000000000000000000000008200581c000000000000000000000000000000000000000000000000000000018200581c00000000000000000000000000000000000000000000000000000002"
    );
}

runIfEntryPoint(main, "native.js");