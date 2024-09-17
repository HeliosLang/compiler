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
})
