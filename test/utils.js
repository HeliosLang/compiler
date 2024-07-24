import assert, { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { bytesToHex, encodeUtf8 } from "@helios-lang/codec-utils"
import { isLeft } from "@helios-lang/type-utils"
import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    UplcDataValue
} from "@helios-lang/uplc"
import { Program } from "../src/program/Program.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").CekResult} CekResult
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {{error: string} | UplcData} HeliosTestOutput
 */

/**
 * @typedef {{
 *   description: string
 *   main: string
 *   modules?: string[]
 *   inputs: UplcData[]
 *   output: HeliosTestOutput
 * }} HeliosTest
 */

/**
 * @param {HeliosTest[]} testVector
 */
export function compileAndRunMany(testVector) {
    testVector.forEach((t) => compileAndRun(t))
}

/**
 * Syntax errors should be tested elsewhere
 * @param {HeliosTest} test
 */
export function compileAndRun(test) {
    it(test.description, () => {
        const program = new Program(test.main, {
            moduleSources: test.modules,
            isTestnet: true
        })

        const uplc0 = program.compile(false)

        const args = test.inputs.map((d) => new UplcDataValue(d))
        const result0 = uplc0.eval(args)

        resultEquals(result0, test.output)

        const hash0 = bytesToHex(uplc0.hash())

        const uplc1 = program.compile(true)

        const hash1 = bytesToHex(uplc1.hash())

        if (hash1 != hash0) {
            const result1 = uplc1.eval(args)

            resultEquals(result1, test.output)

            // also make sure the costs and size are smaller
            const size0 = uplc0.toCbor().length
            const size1 = uplc1.toCbor().length

            assert(
                size1 < size0,
                `optimization didn't improve size (!(${size1} < ${size0}))`
            )

            const costMem0 = result0.cost.mem
            const costMem1 = result1.cost.mem

            assert(
                costMem1 < costMem0,
                `optimization didn't improve mem cost (!(${costMem1.toString()} < ${costMem0.toString()}))`
            )

            const costCpu0 = result0.cost.cpu
            const costCpu1 = result1.cost.cpu

            assert(
                costCpu1 < costCpu0,
                `optimization didn't improve cpu cost (!(${costCpu1.toString()} < ${costCpu0.toString()}))`
            )
        }
    })
}

/**
 * @param {boolean} b
 * @returns {UplcData}
 */
export function bool(b) {
    return new ConstrData(b ? 1 : 0, [])
}

export const False = bool(false)
export const True = bool(true)

/**
 *
 * @param {ByteArrayLike} bs
 * @returns {UplcData}
 */
export function bytes(bs) {
    return new ByteArrayData(bs)
}

/**
 * @param {UplcData} d
 * @returns {UplcData}
 */
export function cbor(d) {
    return new ByteArrayData(d.toCbor())
}

/**
 * @param {number | bigint} i
 * @returns {UplcData}
 */
export function int(i) {
    return new IntData(i)
}

/**
 * @param {number} top
 * @param {number} bottom
 * @returns {UplcData}
 */
export function ratio(top, bottom) {
    return new ListData([new IntData(top), new IntData(bottom)])
}

/**
 * @param {number} i
 * @returns {UplcData}
 */
export function real(i) {
    return new IntData(Math.trunc(i * 1000000))
}

/**
 * @param {string} s
 * @returns {UplcData}
 */
export function str(s) {
    return new ByteArrayData(encodeUtf8(s))
}

/**
 * @param {CekResult} cekResult
 * @returns {string}
 */
function cekResultToString(cekResult) {
    const output = cekResult.result

    if (isLeft(output)) {
        console.error(output.left.error)
        return "error"
    } else {
        if (typeof output.right == "string") {
            return output.right
        } else if (output.right instanceof UplcDataValue) {
            return output.right.value.toString()
        } else {
            return output.right.toString()
        }
    }
}

/**
 * @param {HeliosTestOutput} result
 * @returns {string}
 */
function expectedResultToString(result) {
    if ("error" in result) {
        return "error"
    } else {
        return result.toString()
    }
}

/**
 * @param {CekResult} actual
 * @param {HeliosTestOutput} expected
 */
function resultEquals(actual, expected) {
    strictEqual(cekResultToString(actual), expectedResultToString(expected))
}

describe("utils", () => {
    it("dummy", () => {})
})
