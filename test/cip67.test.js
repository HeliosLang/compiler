import { describe } from "node:test"
import { compileAndRunMany, bytes } from "./utils.js"

describe("Cip67", () => {
    compileAndRunMany([
        {
            description: "reference token label ok",
            main: `testing cip67_ref_token_label
            import Cip67

            func main() -> ByteArray {
                Cip67::reference_token_label
            }`,
            inputs: [],
            output: bytes("000643b0")
        },
        {
            description: "user (nft) token label ok",
            main: `testing cip67_user_token_label
            import { user_token_label } from Cip67

            func main() -> ByteArray {
                user_token_label
            }`,
            inputs: [],
            output: bytes("000de140")
        },
        {
            description: "user (nft) token label ok",
            main: `testing cip67_user_token_label
            import { fungible_token_label as label } from Cip67

            func main() -> ByteArray {
                label
            }`,
            inputs: [],
            output: bytes("0014df10")
        }
    ])
})
