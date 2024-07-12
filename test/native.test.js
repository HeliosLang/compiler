//@ts-check

import {
    Address,
    NativeScript,
    Tx,
    ValidatorHash,
    assert,
    bytesToHex
} from "helios"

function checkSerialization(testName, obj, cborHex) {
    try {
        const script = NativeScript.fromCbor(cborHex)

        assert(
            JSON.stringify(script.toJson()) == JSON.stringify(obj),
            "deserialization failed"
        )

        if (cborHex.startsWith("00")) {
            cborHex = cborHex.slice(2)
        }

        assert(
            cborHex == bytesToHex(NativeScript.fromJson(obj).toCbor()),
            "serialization failed"
        )

        const address = Address.fromValidatorHash(
            new ValidatorHash(script.hash()),
            null,
            false
        )

        console.log(`${testName} ok (${address.toBech32()})`)
    } catch (e) {
        console.log(`${testName} nok`)

        throw e
    }
}

async function testTerms() {
    checkSerialization(
        "native script test vector 1",
        {
            type: "sig",
            keyHash: "00000000000000000000000000000000000000000000000000000000"
        },
        "8200581c00000000000000000000000000000000000000000000000000000000"
    )

    checkSerialization(
        "native script test vector 2",
        {
            type: "sig",
            keyHash: "4da965a049dfd15ed1ee19fba6e2974a0b79fc416dd1796a1f97f5e1"
        },
        "8200581c4da965a049dfd15ed1ee19fba6e2974a0b79fc416dd1796a1f97f5e1"
    )

    checkSerialization(
        "native script test vector 3",
        {
            type: "all",
            scripts: [
                {
                    type: "sig",
                    keyHash:
                        "00000000000000000000000000000000000000000000000000000000"
                },
                {
                    type: "any",
                    scripts: [
                        {
                            type: "after",
                            slot: 42
                        },
                        {
                            type: "sig",
                            keyHash:
                                "00000000000000000000000000000000000000000000000000000001"
                        }
                    ]
                }
            ]
        },
        "8201828200581c000000000000000000000000000000000000000000000000000000008202828204182a8200581c00000000000000000000000000000000000000000000000000000001"
    )

    checkSerialization(
        "native script test vector 4",
        {
            type: "before",
            slot: 42
        },
        "8205182a"
    )

    checkSerialization(
        "native script test vector 5",
        {
            type: "atLeast",
            required: 2,
            scripts: [
                {
                    type: "sig",
                    keyHash:
                        "00000000000000000000000000000000000000000000000000000000"
                },
                {
                    type: "sig",
                    keyHash:
                        "00000000000000000000000000000000000000000000000000000001"
                },
                {
                    type: "sig",
                    keyHash:
                        "00000000000000000000000000000000000000000000000000000002"
                }
            ]
        },
        "00830302838200581c000000000000000000000000000000000000000000000000000000008200581c000000000000000000000000000000000000000000000000000000018200581c00000000000000000000000000000000000000000000000000000002"
    )
}

async function testDeserializeTx() {
    const cborHex =
        "84a400818258200000000000000000000000000000000000000000000000000000000000000000000182a300581d603b61a40bc5872219ce830fb9c792d8d53fb87921f590287057e4e3b401821a00152d2ca1581c7292808c44ff8ac77a866a5eadcf8b5463e299e5023a34adc0316269a14a53433030312d3030313001028201d8185847d87b9f9f581c00000000000000000000000000000000000000000000000000000000581c3b61a40bc5872219ce830fb9c792d8d53fb87921f590287057e4e3b40000000000ffff82581d603b61a40bc5872219ce830fb9c792d8d53fb87921f590287057e4e3b41a0090012b021a0002aa6909a1581c7292808c44ff8ac77a866a5eadcf8b5463e299e5023a34adc0316269a14a53433030312d3030313001a101818201818200581c3b61a40bc5872219ce830fb9c792d8d53fb87921f590287057e4e3b4f5f6"

    const tx = Tx.fromCbor(cborHex)

    console.log(JSON.stringify(tx.dump(), null, "    "))
}

export default async function main() {
    await testTerms()

    await testDeserializeTx()
}
