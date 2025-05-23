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
import { encodeUtf8 } from "@helios-lang/codec-utils"

describe("ByteArray", () => {
    describe("ByteArray::is_valid_data", () => {
        const runner = compileForRun(`
        testing bytearray_is_valid_data
        func main(a: Data) -> Bool {
            ByteArray::is_valid_data(a)
        }`)

        it("returns true for empty bData", () => {
            runner([bytes([])], True)
        })

        it('returns true for ascii "Hello World"', () => {
            runner([bytes(encodeUtf8("Hello World"))], True)
        })

        it("returns true for #ffff", () => {
            runner([bytes([255, 255])], True)
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

    describe("ByteArray.show()", () => {
        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing bytearray_show_in_print_actual
                func main(bytes: ByteArray) -> () {
                    print(bytes.show())
                }`,
                `testing bytearray_show_in_print_expected_optimized
                func main(_: ByteArray) -> () {
                    ()
                }`
            )
        })
    })

    describe("ByteArray.decode_utf8_safe", () => {
        const runner = compileForRun(`
            testing bytearray_decode_utf8_safe
            
            func main(bytes: ByteArray) -> String {
                bytes.decode_utf8_safe()
            }`)

        it("returns 'ffff' for #ffff", () => {
            runner([bytes("ffff")], str("ffff"))
        })

        it("returns 'Hello World' for #48656c6c6f20576f726c64", () => {
            runner([bytes("48656c6c6f20576f726c64")], str("Hello World"))
        })

        it("is optimized out in print", () => {
            assertOptimizedAs(
                `testing bytearray_decode_utf8_safe_in_print_actual
                func main(bytes: ByteArray) -> () {
                    print(bytes.decode_utf8_safe())
                }`,
                `testing bytearray_decode_utf8_safe_in_print_expected_optimized
                func main(_: ByteArray) -> () {
                    ()
                }`
            )
        })
    })
})
