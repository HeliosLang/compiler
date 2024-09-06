import { describe, it } from "node:test"
import { True, bytes, compileForRun } from "./utils.js"

describe("StakingCredential", () => {
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
