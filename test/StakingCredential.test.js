import { describe, it } from "node:test"
import {
    False,
    True,
    assertOptimizedAs,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map,
    str
} from "./utils.js"

describe("StakingCredential", () => {
    describe("destructure StakingCredential", () => {
        it("can destructure hash from StakingCredential", () => {
            const runner = compileForRun(`testing staking_cred_destruct
            func main(pkh: PubKeyHash) -> Bool {
                h_ = StakingHash::new_stakekey(pkh);
                cred = StakingCredential::new_hash(h_);
    
                cred.switch{
                    Hash{h} => h.switch{
                        StakeKey{p} => p == pkh,
                        else => error("unexpected")
                    },
                    else => error("unexpected")
                }
            }`)

            runner([bytes("abcd")], True)
        })
    })

    describe("StakingCredential::is_valid_data", () => {
        const runner = compileForRun(`testing staking_cred_is_valid_data
        func main(d: Data) -> Bool {
            StakingCredential::is_valid_data(d)
        }`)

        it("returns true for constrData with tag 0 and one pubkey staking hash field", () => {
            runner([constr(0, constr(0, bytes(new Array(28).fill(0))))], True)
        })

        it("returns false for constrData with tag 0 and one pubkey staking hash field with 27 bytes", () => {
            runner([constr(0, constr(0, bytes(new Array(27).fill(0))))], False)
        })

        it("returns false for constrData with tag 0 and one pubkey staking hash field with 29 bytes", () => {
            runner([constr(0, constr(0, bytes(new Array(29).fill(0))))], False)
        })

        it("returns false for constrData with tag 1 and one pubkey staking hash field", () => {
            runner([constr(1, constr(0, bytes(new Array(28).fill(0))))], False)
        })

        it("returns true for constrData with tag 1 and the staking ptr fields", () => {
            runner([constr(1, int(0), int(0), int(0))], True)
        })

        it("returns false for constrData with tag 1 and too few staking ptr fields", () => {
            runner([constr(1, int(0), int(0))], False)
        })

        it("returns false for constrData with tag 1 and too many staking ptr fields", () => {
            runner([constr(1, int(0), int(0), int(0), int(0))], False)
        })

        it("returns false for constrData with tag 2 and one pubkey staking hash field", () => {
            runner([constr(2, constr(0, bytes(new Array(28).fill(0))))], False)
        })

        it("returns false for constrData with tag 0 and no fields", () => {
            runner([constr(0)], False)
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

        it("returns false for mapData", () => {
            runner([map([])], False)
        })
    })

    describe("StakingCredential.show", () => {
        const runner = compileForRun(`testing spendingcredential_show
        func main(cred: StakingCredential) -> String {
            cred.show()
        }`)

        it('StakingCredential::Hash{StakeKey{#}}.show() == "Hash{hash:StakeKey{hash:}}"', () => {
            runner(
                [constr(0, constr(0, bytes("")))],
                str("Hash{hash:StakeKey{hash:}}")
            )
        })

        it('StakingCredential::Hash{StakeKey{#01020304050607080910111213141516171819202122232425262728}}.show() == "Hash{hash:StakeKey{hash:01020304050607080910111213141516171819202122232425262728}}"', () => {
            runner(
                [
                    constr(
                        0,
                        constr(
                            0,
                            bytes(
                                "01020304050607080910111213141516171819202122232425262728"
                            )
                        )
                    )
                ],
                str(
                    "Hash{hash:StakeKey{hash:01020304050607080910111213141516171819202122232425262728}}"
                )
            )
        })

        it('StakingCredential::Hash{Validator{#01020304050607080910111213141516171819202122232425262728}}.show() == "Hash{hash:Validator{hash:01020304050607080910111213141516171819202122232425262728}}"', () => {
            runner(
                [
                    constr(
                        0,
                        constr(
                            1,
                            bytes(
                                "01020304050607080910111213141516171819202122232425262728"
                            )
                        )
                    )
                ],
                str(
                    "Hash{hash:Validator{hash:01020304050607080910111213141516171819202122232425262728}}"
                )
            )
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing stakingcredential_show_in_print_actual
                func main(cred: StakingCredential) -> () {
                    print(cred.show())
                }`,
                `testing stakingcredential_show_in_print_expected_optimized
                func main(_: StakingCredential) -> () {
                    ()
                }`
            )
        })
    })
})
