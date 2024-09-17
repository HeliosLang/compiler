import { describe, it } from "node:test"
import {
    False,
    True,
    assetclass,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map
} from "./utils.js"

describe("Value", () => {
    describe("Value.is_zero", () => {
        const runner = compileForRun(`testing lovelace_is_zero
        func main(a: Int) -> Bool {
            Value::lovelace(a).is_zero()
        }`)

        it("1 lovelace isn't zero", () => {
            runner([int(1)], False)
        })

        it("0 lovelace is zero", () => {
            runner([int(0)], True)
        })
    })

    describe("Value == Value", () => {
        const runner1 = compileForRun(`testing lovelace_dummy_eq
        func main(a: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(a)
        }`)

        it("lovelace comparison to self is always true", () => {
            runner1([int(-100)], True)
        })

        const runner2 = compileForRun(`testing lovelace_eq
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) == Value::lovelace(b)
        }`)

        it("1000000 lovelace is equal to 1000000 lovelace", () => {
            runner2([int(1_000_000), int(1_000_000)], True)
        })

        it("1000001 lovelace isn't equal to 1000000 lovelace", () => {
            runner2([int(1_000_001), int(1_000_000)], False)
        })
    })

    describe("Value != Value", () => {
        const runner1 = compileForRun(`testing lovelace_dummy_neq
        func main(a: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(a)
        }`)

        it("lovelace neq comparison with self is always false", () => {
            runner1([int(0)], False)
        })

        const runner2 = compileForRun(`testing lovelace_neq
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) != Value::lovelace(b)
        }`)

        it("1_000_000 lovelace neq to 1_000_000 returns false", () => {
            runner2([int(1_000_000), int(1_000_000)], False)
        })

        it("1_000_001 lovelace neq to 1_000_000 returns true", () => {
            runner2([int(1_000_001), int(1_000_000)], True)
        })
    })

    describe("Value + Value", () => {
        const runner1 = compileForRun(`testing lovelace_add_zero
        func main(a: Int) -> Int {
            (Value::lovelace(a) + Value::ZERO).get(AssetClass::ADA)
        }`)

        it("adding zero to 1_000_000 lovelace returns 1_000_000 lovelace", () => {
            runner1([int(1_000_000)], int(1_000_000))
        })

        const runner2 = compileForRun(`testing lovelace_add
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) + Value::lovelace(b)).get(AssetClass::ADA)
        }`)

        it("adding 1 to 1_000_000 lovelace returns 1_000_001 lovelace", () => {
            runner2([int(1), int(1_000_000)], int(1_000_001))
        })
    })

    describe("Value::sum", () => {
        const runner = compileForRun(`testing lovelace_sum
        func main(a: Int, b: Int) -> Int {
            Value::sum([]Value{Value::lovelace(a), Value::lovelace(b)}).get(AssetClass::ADA)
        }`)

        it("summing 1 and 1_000_000 lovelace returns 1_000_001 lovelace", () => {
            runner([int(1), int(1_000_000)], int(1_000_001))
        })
    })

    describe("Value - Value", () => {
        const runner1 = compileForRun(`testing lovelace_sub_zero
        func main(a: Int) -> Int {
            (Value::lovelace(a) - Value::ZERO).get(AssetClass::ADA)
        }`)

        it("subtracting zero from 1_000_000 lovelace returns 1_000_000 lovelace", () => {
            runner1([int(1_000_000)], int(1_000_000))
        })

        const runner2 = compileForRun(`testing zero_sub_lovelace
        func main(a: Int) -> Int {
            (Value::ZERO - Value::lovelace(a)).get(AssetClass::ADA)
        }`)

        it("subtracting 1_000_000 from zero returns -1_000_000", () => {
            runner2([int(1_000_000)], int(-1_000_000))
        })

        const runner3 = compileForRun(`testing dummy_lovelace_sub
        func main(a: Int) -> Bool {
            (Value::lovelace(a) - Value::lovelace(a)).is_zero()
        }`)

        it("lovelace subtracted from self is always zero", () => {
            runner3([int(-1_000_001)], True)
        })

        const runner4 = compileForRun(`testing lovelace_sub
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a) - Value::lovelace(b)).get(AssetClass::ADA)
        }`)

        it("subtracting 1_000_000 from 1_000_001 returns 1", () => {
            runner4([int(1_000_001), int(1_000_000)], int(1))
        })
    })

    describe("Value * Int", () => {
        const runner1 = compileForRun(`testing dummy_lovelace_mul
        func main(a: Int) -> Int {
            (Value::lovelace(a)*1).get(AssetClass::ADA)
        }`)

        it("1_000_000 lovelace multiplied by 1 returns 1_000_000", () => {
            runner1([int(1_000_000)], int(1_000_000))
        })

        const runner2 = compileForRun(`testing lovelace_mul
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a)*b).get(AssetClass::ADA)
        }`)

        it("1_000_000 lovelace multiplied by 3 returns 3_000_000 lovelace", () => {
            runner2([int(1_000_000), int(3)], int(3_000_000))
        })

        const runner3 = compileForRun(`testing value_add_mul
        const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abcd), #abcd)
        func main(a: Int, b: Int, c: Int) -> Int {
            ((Value::lovelace(a) + Value::new(MY_NFT, b))*c).get(AssetClass::ADA)
        }`)

        it("1_000_000 lovelace multiplied by 3 after adding an NFT returns 3_000_000 lovelace as well", () => {
            runner3([int(1_000_000), int(1), int(3)], int(3_000_000))
        })
    })

    describe("Value / Int", () => {
        const runner1 = compileForRun(`testing dummy_lovelace_div
        func main(a: Int) -> Int {
            (Value::lovelace(a)/1).get(AssetClass::ADA)
        }`)

        it("1_000_000 lovelace divided by 1 returns 1_000_000 lovelace", () => {
            runner1([int(1_000_000)], int(1_000_000))
        })

        const runner2 = compileForRun(`testing lovelace_div
        func main(a: Int, b: Int) -> Int {
            (Value::lovelace(a)/b).get(AssetClass::ADA)
        }`)

        it("1_000_000 lovelace divided by zero throws error", () => {
            runner2([int(1_000_000), int(0)], { error: "" })
        })

        it("1_000_000 lovelace divided by -1 returns -1_000_000 lovelace", () => {
            runner2([int(1_000_000), int(-1)], int(-1_000_000))
        })

        const runner3 = compileForRun(`testing value_add_div
        const MY_NFT: AssetClass = AssetClass::new(MintingPolicyHash::new(#abcd), #abcd)
        func main(a: Int, b: Int, c: Int) -> Int {
            ((Value::lovelace(a) + Value::new(MY_NFT, b))/c).get(AssetClass::ADA)
        }`)

        it("3_000_000 lovelace divided by -3 after adding an NFT still returns -1_000_000 lovelace", () => {
            runner3([int(3_000_000), int(1), int(-3)], int(-1_000_000))
        })
    })

    describe("Value >= Value", () => {
        const runner1 = compileForRun(`testing dummy_lovelace_geq
        func main(a: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(a)
        }`)

        it("lovelace >= self always returns true", () => {
            runner1([int(1_000_000)], True)
        })

        const runner2 = compileForRun(`testing lovelace_geq
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a) >= Value::lovelace(b)
        }`)

        it("0 lovelace >= 0 lovelace return true", () => {
            runner2([int(0), int(0)], True)
        })

        it("-1 lovelace >= 0 lovelace return false", () => {
            runner2([int(-1), int(0)], False)
        })

        it("1 lovelace >= 0 lovelace return true", () => {
            runner2([int(1), int(0)], True)
        })
    })

    describe("Value.contains", () => {
        const runner = compileForRun(`testing lovelace_contains
        func main(a: Int, b: Int) -> Bool {
            Value::lovelace(a).contains(Value::lovelace(b))
        }`)

        it("1_000_000 lovelace contains 999_999 lovelace", () => {
            runner([int(1_000_000), int(999_999)], True)
        })
    })

    describe("Value.get_singleton_asset_class", () => {
        const runner1 = compileForRun(`testing value_singleton
        func main(value: Value) -> AssetClass {
            value.get_singleton_asset_class()
        }`)

        it("ok for singleton", () => {
            runner1(
                [
                    map([
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [bytes("abcd"), map([[bytes("abcd"), int(1)]])]
                    ])
                ],
                assetclass("abcd", "abcd")
            )
        })

        it("ok for singleton for zero lovelace", () => {
            runner1(
                [map([[bytes("abcd"), map([[bytes("abcd"), int(1)]])]])],
                assetclass("abcd", "abcd")
            )
        })

        it("fails for lovelace only", () => {
            runner1([map([[bytes(""), map([[bytes(""), int(1_000_000)]])]])], {
                error: ""
            })
        })

        it("fails for non-singleton", () => {
            runner1([map([[bytes("abcd"), map([[bytes("abcd"), int(2)]])]])], {
                error: ""
            })
        })

        it("fails for negative qty singleton", () => {
            runner1(
                [
                    map([
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])]
                    ])
                ],
                { error: "" }
            )
        })

        it("fails for two different asset classes", () => {
            runner1(
                [
                    map([
                        [bytes("abcd"), map([[bytes("abcd"), int(1)]])],
                        [bytes("abcdef"), map([[bytes(""), int(1)]])]
                    ])
                ],
                { error: "" }
            )
        })

        it("fails for two different token names", () => {
            runner1(
                [
                    map([
                        [bytes("abcd"), map([[bytes("abcd"), int(1)]])],
                        [bytes("abcd"), map([[bytes(""), int(1)]])]
                    ])
                ],
                { error: "" }
            )
        })

        const runner2 = compileForRun(`testing valuable_singleton_script
    
        func get_singleton_wrapper[V: Valuable](v: V) -> AssetClass {
            v.value.get_singleton_asset_class()
        }
        
        func main(lovelace: Int) -> Bool {
            pub_key_hash_bytes = #01234567890123456789012345678901234567890123456789012345;
            address = Address::new(SpendingCredential::new_pubkey(PubKeyHash::new(pub_key_hash_bytes)), Option[StakingCredential]::None);
            asset_class = AssetClass::new(MintingPolicyHash::new(#abcd), #abcd);
            value = Value::lovelace(lovelace) + Value::new(asset_class, 1);
            output = TxOutput::new(
                address, 
                value, 
                TxOutputDatum::new_none()
            );
    
            get_singleton_wrapper(output) == asset_class
        }`)

        it("ok on Valuable.value", () => {
            runner2([int(1_000_000)], True)
        })
    })

    describe("Value.get_singleton_policy", () => {
        const runner = compileForRun(`testing value_get_singleton_policy
        func main(v: Value) -> MintingPolicyHash {
            v.get_singleton_policy()
        }`)

        it("fails for pure lovelace", () => {
            runner([map([[bytes(""), map([[bytes(""), int(1_000_000)]])]])], {
                error: ""
            })
        })

        it("fails for two mphs before lovelace", () => {
            runner(
                [
                    map([
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])],
                        [bytes("abcdef"), map([[bytes("abcd"), int(-1)]])],
                        [bytes(""), map([[bytes(""), int(1_000_000)]])]
                    ])
                ],
                { error: "" }
            )
        })

        it("fails for one mph before lovelace and another after lovelace", () => {
            runner(
                [
                    map([
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])],
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [bytes("abcdef"), map([[bytes("abcd"), int(-1)]])]
                    ])
                ],
                { error: "" }
            )
        })

        it("fails for two mphs after lovelace", () => {
            runner(
                [
                    map([
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])],
                        [bytes("abcdef"), map([[bytes("abcd"), int(-1)]])]
                    ])
                ],
                { error: "" }
            )
        })

        it("returns mph if only one token is included without lovelace", () => {
            runner(
                [map([[bytes("abcd"), map([[bytes("abcd"), int(-1)]])]])],
                bytes("abcd")
            )
        })

        it("returns mph if only multiple tokens with same mph are included without lovelace", () => {
            runner(
                [
                    map([
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes("abcdef"), int(1)]
                            ])
                        ]
                    ])
                ],
                bytes("abcd")
            )
        })

        it("returns mph if only one token is included before lovelace", () => {
            runner(
                [
                    map([
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])],
                        [bytes(""), map([[bytes(""), int(1_000_000)]])]
                    ])
                ],
                bytes("abcd")
            )
        })

        it("returns mph if multiple tokens with same mph are included before lovelace", () => {
            runner(
                [
                    map([
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes("abcdef"), int(1)]
                            ])
                        ],
                        [bytes(""), map([[bytes(""), int(1_000_000)]])]
                    ])
                ],
                bytes("abcd")
            )
        })

        it("returns mph if only one token is included after lovelace", () => {
            runner(
                [
                    map([
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [bytes("abcd"), map([[bytes("abcd"), int(-1)]])]
                    ])
                ],
                bytes("abcd")
            )
        })

        it("returns mph if only multiple tokens with same mph are included after lovelace", () => {
            runner(
                [
                    map([
                        [bytes(""), map([[bytes(""), int(1_000_000)]])],
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes("abcdef"), int(1)]
                            ])
                        ]
                    ])
                ],
                bytes("abcd")
            )
        })
    })

    describe("Value.flatten", () => {
        const runner = compileForRun(`testing value_flatten
        func main(n_lovelace: Int, mph1: MintingPolicyHash, name1: ByteArray, qty1: Int, mph2: MintingPolicyHash, name2: ByteArray, qty2: Int) -> Map[AssetClass]Int {
            asset_class1 = AssetClass::new(mph1, name1);
            asset_class2 = AssetClass::new(mph2, name2);
            value = Value::lovelace(n_lovelace) + Value::new(asset_class1, qty1) + Value::new(asset_class2, qty2);
    
            value.flatten()
        }`)

        it("ok for 0 entries", () => {
            runner(
                [
                    int(0),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(0),
                    bytes("abcdef"),
                    bytes(""),
                    int(0)
                ],
                map([])
            )
        })

        it("ok for 3 entries", () => {
            runner(
                [
                    int(2_000_000),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(1),
                    bytes("abcdef"),
                    bytes(""),
                    int(1)
                ],
                map([
                    [assetclass("", ""), int(2_000_000)],
                    [assetclass("abcd", "abcd"), int(1)],
                    [assetclass("abcdef", ""), int(1)]
                ])
            )
        })
    })

    describe("Value.delete_policy", () => {
        const runner = compileForRun(`testing value_delete_policy
        func  main(
            n_lovelace: Int, 
            mph1: MintingPolicyHash, 
            name1: ByteArray, 
            qty1: Int, 
            mph2: MintingPolicyHash, 
            name2: ByteArray, 
            qty2: Int, 
            mph_to_delete: MintingPolicyHash
        ) -> Map[AssetClass]Int {
            asset_class1 = AssetClass::new(mph1, name1);
            asset_class2 = AssetClass::new(mph2, name2);
            value = Value::lovelace(n_lovelace) + Value::new(asset_class1, qty1) + Value::new(asset_class2, qty2);
    
            value.delete_policy(mph_to_delete).flatten()
        }`)

        it("doesn't change anything for 0 entries", () => {
            runner(
                [
                    int(0),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(0),
                    bytes("abcdef"),
                    bytes(""),
                    int(0),
                    bytes("")
                ],
                map([])
            )
        })

        it("removes multiple tokens with same policy", () => {
            runner(
                [
                    int(1_000_000),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(1),
                    bytes("abcd"),
                    bytes(""),
                    int(1),
                    bytes("abcd")
                ],
                map([[assetclass("", ""), int(1_000_000)]])
            )
        })

        it("can delete lovelace", () => {
            runner(
                [
                    int(1_000_000),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(1),
                    bytes("abcd"),
                    bytes(""),
                    int(1),
                    bytes("")
                ],
                map([
                    [assetclass("abcd", "abcd"), int(1)],
                    [assetclass("abcd", ""), int(1)]
                ])
            )
        })
    })

    describe("Value.delete_lovelace", () => {
        const runner = compileForRun(`testing value_delete_lovelace
        func  main(
            n_lovelace: Int, 
            mph1: MintingPolicyHash, 
            name1: ByteArray, 
            qty1: Int, 
            mph2: MintingPolicyHash, 
            name2: ByteArray, 
            qty2: Int
        ) -> Map[AssetClass]Int {
            asset_class1 = AssetClass::new(mph1, name1);
            asset_class2 = AssetClass::new(mph2, name2);
            value = Value::lovelace(n_lovelace) + Value::new(asset_class1, qty1) + Value::new(asset_class2, qty2);
    
            value.delete_lovelace().flatten()
        }`)

        it("deletes lovelace from value with two tokens", () => {
            runner(
                [
                    int(1_000_000),
                    bytes("abcd"),
                    bytes("abcd"),
                    int(1),
                    bytes("abcd"),
                    bytes(""),
                    int(1)
                ],
                map([
                    [assetclass("abcd", "abcd"), int(1)],
                    [assetclass("abcd", ""), int(1)]
                ])
            )
        })
    })

    describe("Value::from_flat", () => {
        const runner = compileForRun(`testing value_from_flat_map
        func main(mp: Map[AssetClass]Int) -> Value {
            Value::from_flat(mp)
        }`)

        it("ok for empty map", () => {
            runner([map([])], map([]))
        })

        it("ok for a single entry", () => {
            runner(
                [map([[assetclass("abcd", "abcd"), int(1)]])],
                map([[bytes("abcd"), map([[bytes("abcd"), int(1)]])]])
            )
        })

        it("throws error for duplicate entry", () => {
            runner(
                [
                    map([
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", "abcd"), int(1)]
                    ])
                ],
                { error: "" }
            )
        })

        it("ok for two tokens with the same policy (sorted output)", () => {
            runner(
                [
                    map([
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)]
                    ])
                ],
                map([
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ]
                ])
            )
        })

        it("ok for two tokens with the same policy and another third token (sorted output)", () => {
            runner(
                [
                    map([
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)],
                        [assetclass("", ""), int(1_000_000)]
                    ])
                ],
                map([
                    [bytes(""), map([[bytes(""), int(1_000_000)]])],
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ]
                ])
            )
        })

        it("ok for two tokens with same policy and another third token before", () => {
            runner(
                [
                    map([
                        [assetclass("", ""), int(1_000_000)],
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)]
                    ])
                ],
                map([
                    [bytes(""), map([[bytes(""), int(1_000_000)]])],
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ]
                ])
            )
        })

        it("fails for duplicate and another third token before", () => {
            runner(
                [
                    map([
                        [assetclass("", ""), int(1_000_000)],
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", "abcd"), int(1)]
                    ])
                ],
                { error: "" }
            )
        })

        it("ok for two tokens with same policy and another third token that sorts after", () => {
            runner(
                [
                    map([
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)],
                        [assetclass("ef01", ""), int(2)]
                    ])
                ],
                map([
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ],
                    [bytes("ef01"), map([[bytes(""), int(2)]])]
                ])
            )
        })

        it("ignores 0s", () => {
            runner(
                [
                    map([
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(0)],
                        [assetclass("ef01", ""), int(2)]
                    ])
                ],
                map([
                    [bytes("abcd"), map([[bytes("abcd"), int(1)]])],
                    [bytes("ef01"), map([[bytes(""), int(2)]])]
                ])
            )
        })

        it("fails for two tokens with same policy but different name, and other pair with same asset class that sorts after", () => {
            runner(
                [
                    map([
                        [assetclass("ef01", ""), int(2)],
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)],
                        [assetclass("ef01", ""), int(2)]
                    ])
                ],
                { error: "" }
            )
        })
    })

    describe("Value::from_flat_safe", () => {
        const runner = compileForRun(`testing value_from_flat_safe
        func main(v: Map[AssetClass]Int) -> Value {
            Value::from_flat_safe(v)
        }`)

        it("ok for two tokens with same policy but different name, and other pair with same asset class that sorts after", () => {
            runner(
                [
                    map([
                        [assetclass("ef01", ""), int(2)],
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)],
                        [assetclass("ef01", ""), int(2)]
                    ])
                ],
                map([
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ],
                    [bytes("ef01"), map([[bytes(""), int(4)]])]
                ])
            )
        })

        it("ignores tokens that sum to 0", () => {
            runner(
                [
                    map([
                        [assetclass("ef01", ""), int(2)],
                        [assetclass("abcd", "abcd"), int(1)],
                        [assetclass("abcd", ""), int(1)],
                        [assetclass("ef01", ""), int(-2)]
                    ])
                ],
                map([
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ]
                ])
            )
        })
    })

    describe("Value.get_policy", () => {
        const runner = compileForRun(`testing value_get_policy
        func main(v: Value, mph: MintingPolicyHash) -> Map[ByteArray]Int {
            v.get_policy(mph)
        }`)

        it("fails if policy not found", () => {
            runner([map([]), bytes([])], { error: "" })
        })

        it("ok if policy found", () => {
            runner(
                [
                    map([[bytes("0123"), map([[bytes("abcd"), int(1)]])]]),
                    bytes("0123")
                ],
                map([[bytes("abcd"), int(1)]])
            )
        })
    })

    describe("Value.get_policy_safe", () => {
        const runner = compileForRun(`testing value_get_policy_safe
        func main(v: Value, mph: MintingPolicyHash) -> Map[ByteArray]Int {
            v.get_policy_safe(mph)
        }`)

        it("returns empty map if policy isn't found", () => {
            runner([map([]), bytes([])], map([]))
        })

        it("ok if policy found", () => {
            runner(
                [
                    map([[bytes("0123"), map([[bytes("abcd"), int(1)]])]]),
                    bytes("0123")
                ],
                map([[bytes("abcd"), int(1)]])
            )
        })
    })

    describe("Value.sort", () => {
        const runner = compileForRun(`testing value_sort
        func main(v: Value) -> Value {
            v.sort()
        }`)

        it("ok for empty", () => {
            runner([map([])], map([]))
        })

        it("ok for single mph with two different tokens", () => {
            runner(
                [
                    map([
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes(""), int(1)]
                            ])
                        ]
                    ])
                ],
                map([
                    [
                        bytes("abcd"),
                        map([
                            [bytes(""), int(1)],
                            [bytes("abcd"), int(1)]
                        ])
                    ]
                ])
            )
        })

        it("ok for single mph with two identical tokens", () => {
            runner(
                [
                    map([
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes("abcd"), int(1)]
                            ])
                        ]
                    ])
                ],
                map([[bytes("abcd"), map([[bytes("abcd"), int(2)]])]])
            )
        })

        it("ignores quantities that sum to 0", () => {
            runner(
                [
                    map([
                        [
                            bytes("abcd"),
                            map([
                                [bytes("abcd"), int(1)],
                                [bytes("abcd"), int(-1)]
                            ])
                        ]
                    ])
                ],
                map([])
            )
        })
    })

    describe("Value::is_valid_data", () => {
        const runner = compileForRun(`testing value_is_valid_data
        func main(d: Data) -> Bool {
            Value::is_valid_data(d)
        }`)

        it("returns true for empty mapData", () => {
            runner([map([])], True)
        })

        it("returns true for mapData with a nested single token", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ]
                    ])
                ],
                True
            )
        })

        it("returns false if mph key has 29 bytes", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(29).fill(0)),
                            map([[bytes([]), int(0)]])
                        ]
                    ])
                ],
                False
            )
        })

        it("returns false if mph key has 27 bytes", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(27).fill(0)),
                            map([[bytes([]), int(0)]])
                        ]
                    ])
                ],
                False
            )
        })

        it("returns false if tokenName key isn't a bytearray", () => {
            runner(
                [
                    map([
                        [bytes(new Array(28).fill(0)), map([[list(), int(0)]])]
                    ])
                ],
                False
            )
        })

        it("returns false if quantity value isn't iData", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), bytes([])]])
                        ]
                    ])
                ],
                False
            )
        })

        it("returns false if token name has 33 bytes", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes(new Array(33).fill(0)), int(0)]])
                        ]
                    ])
                ],
                False
            )
        })

        it("returns false if second inner map is empty", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ],
                        [bytes([]), map([])]
                    ])
                ],
                False
            )
        })

        it("returns true if second inner map contains another token", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ],
                        [bytes([]), map([[bytes([]), int(100)]])]
                    ])
                ],
                True
            )
        })

        it("returns false if second inner map mph has 1 byte", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ],
                        [bytes([1]), map([[bytes([]), int(100)]])]
                    ])
                ],
                False
            )
        })

        it("returns true if second inner map mph has 28 bytes", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ],
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(100)]])
                        ]
                    ])
                ],
                True
            )
        })

        it("returns false if second token quantity is not iData", () => {
            runner(
                [
                    map([
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), int(0)]])
                        ],
                        [
                            bytes(new Array(28).fill(0)),
                            map([[bytes([]), list()]])
                        ]
                    ])
                ],
                False
            )
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for bData", () => {
            runner([bytes([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })

        it("returns false for constrData", () => {
            runner([constr(0)], False)
        })
    })
})
