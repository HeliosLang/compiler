import { describe, it } from "node:test"
import { True, bytes, compileAndRunMany } from "./utils.js"

describe("StakingCredential", () => {
    compileAndRunMany([
        {
            description: "can destructure hash from StakingCredential",
            main: `testing staking_cred_destruct
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
            }`,
            inputs: [bytes("abcd")],
            output: True
        }
    ])
})
