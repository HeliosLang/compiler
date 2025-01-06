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
    map
} from "./utils.js"

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

    describe("MintingPolicyHash::is_valid_data", () => {
        const runner = compileForRun(`
        testing mintingpolicyhash_is_valid_data
        func main(a: Data) -> Bool {
            MintingPolicyHash::is_valid_data(a)
        }`)

        it("returns true for empty bData (ADA", () => {
            runner([bytes([])], True)
        })

        it("returns false for #ffff", () => {
            runner([bytes([255, 255])], False)
        })

        it("returns true for bData with 28 bytes", () => {
            runner([bytes(new Array(28).fill(255))], True)
        })

        it("returns false for bData with 29 bytes", () => {
            runner([bytes(new Array(29).fill(255))], False)
        })

        it("returns false for iData", () => {
            runner([int(0)], False)
        })

        it("returns false for constrData", () => {
            runner([constr(0)], False)
        })

        it("returns false for mapData", () => {
            runner([map([])], False)
        })

        it("returns false for listData", () => {
            runner([list()], False)
        })
    })

    describe("MintingPolicyHash.show()", () => {
        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing mintingpolicyhash_show_in_print_actual
                func main(mph: MintingPolicyHash) -> () {
                    print(mph.show())
                }`,
                `testing mintingpolicyhash_show_in_print_expected_optimized
                func main(_: MintingPolicyHash) -> () {
                    ()
                }`
            )
        })
    })
})
