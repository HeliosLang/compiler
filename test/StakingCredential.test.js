import { describe, it } from "node:test"
import {
    False,
    True,
    bytes,
    compileForRun,
    constr,
    int,
    list,
    map
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
})
