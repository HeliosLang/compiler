import { describe, it } from "node:test"
import { True, bytes, compileForRun } from "./utils.js"

describe("MintingPolicyHash", () => {
    it("can be converted to ScriptHash and back", () => {
        const runner = compileForRun(`
        testing mph_to_from_script_hash
        func main(mph: MintingPolicyHash) -> Bool {
            sh = mph.to_script_hash();
            mph_ = MintingPolicyHash::from_script_hash(sh);
            mph == mph_
        }`)

        runner(
            [bytes("00112233445566778899aabbccddeeff00112233445566778899aabb")],
            True
        )
    })
})
