import { describe, it } from "node:test"
import { bytes, compileForRun } from "./utils.js"

describe("Cip67", () => {
    describe("Cip67::reference_token_label", () => {
        it("via namespace import", () => {
            const runner =
                compileForRun(`testing cip67_ref_token_label_namespace_import
            import Cip67
    
            func main() -> ByteArray {
                Cip67::reference_token_label
            }`)

            runner([], bytes("000643b0"))
        })

        it("via plain import", () => {
            const runner =
                compileForRun(`testing cip67_ref_token_label_plain_import
            import {reference_token_label} from Cip67
    
            func main() -> ByteArray {
                reference_token_label
            }`)

            runner([], bytes("000643b0"))
        })

        it("via aliasing import", () => {
            const runner =
                compileForRun(`testing cip67_ref_token_label_aliasing_import
            import {reference_token_label as label} from Cip67
    
            func main() -> ByteArray {
                label
            }`)

            runner([], bytes("000643b0"))
        })
    })

    describe("Cip67::user_token_label", () => {
        it("via namespace import", () => {
            const runner =
                compileForRun(`testing cip67_user_token_label_namespace_import
            import Cip67
    
            func main() -> ByteArray {
                Cip67::user_token_label
            }`)

            runner([], bytes("000de140"))
        })

        it("via plain import", () => {
            const runner =
                compileForRun(`testing cip67_user_token_label_plain_import
            import { user_token_label } from Cip67
    
            func main() -> ByteArray {
                user_token_label
            }`)

            runner([], bytes("000de140"))
        })

        it("via aliasing import", () => {
            const runner =
                compileForRun(`testing cip67_user_token_label_aliasing_import
            import { user_token_label as label } from Cip67
    
            func main() -> ByteArray {
                label
            }`)

            runner([], bytes("000de140"))
        })
    })

    describe("Cip67::fungible_token_label", () => {
        it("via namespace import", () => {
            const runner =
                compileForRun(`testing cip67_fungible_token_label_namespace_import
            import Cip67
    
            func main() -> ByteArray {
                Cip67::fungible_token_label
            }`)

            runner([], bytes("0014df10"))
        })

        it("via plain import", () => {
            const runner =
                compileForRun(`testing cip67_fungible_token_label_aliasing_import
            import { fungible_token_label } from Cip67
    
            func main() -> ByteArray {
                fungible_token_label
            }`)

            runner([], bytes("0014df10"))
        })

        it("via aliasing import", () => {
            const runner =
                compileForRun(`testing cip67_fungible_token_label_aliasing_import
            import { fungible_token_label as label } from Cip67
    
            func main() -> ByteArray {
                label
            }`)

            runner([], bytes("0014df10"))
        })
    })
})
