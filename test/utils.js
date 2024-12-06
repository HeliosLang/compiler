import assert, { strictEqual, throws } from "node:assert"
import { it } from "node:test"
import { bytesToHex, encodeUtf8 } from "@helios-lang/codec-utils"
import { isLeft, isRight, isString } from "@helios-lang/type-utils"
import {
    makeByteArrayData,
    makeConstrData,
    makeIntData,
    makeListData,
    makeMapData,
    makeUplcDataValue
} from "@helios-lang/uplc"
import { Program } from "../src/program/Program.js"
import { $ } from "@helios-lang/ir"

/**
 * @typedef {import("@helios-lang/codec-utils").BytesLike} BytesLike
 * @typedef {import("@helios-lang/uplc").CekResult} CekResult
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("@helios-lang/uplc").UplcLogger} UplcLogger
 * @typedef {import("@helios-lang/uplc").UplcProgramV2} UplcProgramV2
 */

/**
 * @typedef {{error: string} | UplcData | string} HeliosTestOutput
 */

/**
 * Runs the nested IR expression after emitting a trace message.  If the
 * optional second arg contains an IR string expression, it is evaluated
 * and added to the trace message.
 * @example
 * $testTrace(`some Message`, $`...nestedIrExpression`)
 * $testTrace(`some Message`, $`optionalIrStringExpression`, $`...nestedIrExpression`)
 */
export function $testTrace(traceMessage, ...args) {
    const ir = args.pop()
    if (args.length > 1) {
        throw new Error(
            `only 2 or 3 args for $testTrace(message [String], [extraTraceExpr [String expr]], nestedIr), please`
        )
    }
    let [extraTraceExpr] = args
    if (!process.env.HL_TEST_TRACE) {
        throw new Error(
            `use of $testTrace() should be limited to local troubleshooting using 'pnpm testing'`
        )
    }
    let tmExpr = `"  -- ${traceMessage.replace(/"/g, '\\"')}"`
    if (extraTraceExpr) {
        tmExpr = `__helios__string____add(
            ${tmExpr}, ${extraTraceExpr})`
    }
    const t = $`__core__trace(${tmExpr}, () -> { 
        ${ir} 
    })()`
    // console.log(t.toString())
    return t
}

/**
 * @typedef {{
 *   description: string
 *   main: string
 *   modules?: string[]
 *   inputs: UplcData[]
 *   output: HeliosTestOutput
 *    fails?: boolean | RegExp
 * }} HeliosTest
 */

/**
 * @typedef {{
 *   description: string
 *   main: string
 *   modules?: string[]
 *   fails?: boolean
 * }} HeliosTypeTest
 */

/**
 * @typedef {(
 *    (inputs: UplcData[], output: HeliosTestOutput) => [ CekResult, CekResult | undefined ]
 *  ) & { program: Program }
 * } RunnerFunction
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
        /**
         *
         * @returns {[Program, UplcProgramV2]}
         */
        const initialTest = () => {
            const program = new Program(test.main, {
                moduleSources: test.modules,
                isTestnet: true
            })

            const uplc0 = program.compile(false)
            return [program, uplc0]
        }
        if (true == test.fails) {
            throws(initialTest)
            return
        } else if (test.fails) {
            // console.log("checking for failure message", test.fails)
            // NOTE: node's test library doesn't seem to correctly check for throwing with string input
            // ... despite claiming to do so.  When it works, we can update the type of test.fails above
            // ... to include string.  Meanwhile, pass a RegExp to check for the error message.
            throws(initialTest, test.fails)
            return
        }
        const [program, uplc0] = initialTest()
        const args = test.inputs.map((d) => makeUplcDataValue(d))
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
 * @typedef {{
 *   moduleSources?: string[]
 *   dumpIR?: boolean
 *   dumpCostPrefix?: string
 * }} CompileForRunOptions
 */
/**
 * @param {string} mainSrc
 * @param {CompileForRunOptions} options
 * @returns { RunnerFunction }
 */
export function compileForRun(mainSrc, options = {}) {
    const program = new Program(mainSrc, {
        moduleSources: options.moduleSources ?? [],
        isTestnet: true
    })

    if (options.dumpIR) {
        const ir = program.toIR({
            dependsOnOwnHash: false,
            hashDependencies: {},
            optimize: false
        })

        console.log(ir.toString())
    }

    const uplcUnopt = program.compile(false)
    const hashUnopt = bytesToHex(uplcUnopt.hash())
    const uplcOptimized = program.compile(true)
    const hashOptimized = bytesToHex(uplcOptimized.hash())

    /**
     * @type {RunnerFunction}
     */
    const runner = (inputs, output) => {
        if (!output)
            throw new Error(
                "must specify arg2: a HeliosTestOutput result to test against for this run"
            )
        const args = inputs.map((d) => makeUplcDataValue(d))

        const result0 = uplcUnopt.eval(args)

        try {
            resultEquals(result0, output)
        } catch (e) {
            const failureLog =
                result0.logs.map((l) => `---> ${l}`).join("\n") +
                `\n---- ^^^ test failure log: ${program.name} (unoptimized) -----------\n`
            console.error(failureLog)
            e.NOTE = "See failure log above"
            throw e
        }

        if (hashOptimized != hashUnopt) {
            const result1 = uplcOptimized.eval(args)
            try {
                resultEquals(result1, output)
            } catch (e) {
                const failureLog =
                    result1.logs.map((l) => `--->: > ${l}`).join("\n") +
                    `\n---- ^^^ test failure log: ${program.name} (optimized) -----------\n`
                console.error(failureLog)
                e.NOTE = "See failure log above"
                throw e
            }
            // also make sure the costs and size are smaller
            const size0 = uplcUnopt.toCbor().length
            const size1 = uplcOptimized.toCbor().length

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

            if (options.dumpCostPrefix) {
                console.log(
                    `Cost of ${options.dumpCostPrefix}: mem=${costMem1}, cpu=${costCpu1}, lovelace=${Number(costMem1) * 0.0577 + Number(costCpu1) * 0.0000721}`
                )
            }
            return [result0, result1]
        }
        return [result0, undefined]
    }
    runner.program = program // expose for layering more functionality in contract-utils tests
    return runner
}

/**
 * @param {string} src
 * @param {UplcData[]} dataArgs
 * @returns {UplcData}
 */
export function evalSingle(src, dataArgs = []) {
    const program = new Program(src, {
        moduleSources: [],
        isTestnet: true
    })

    const uplc = program.compile(false)

    const args = dataArgs.map((d) => makeUplcDataValue(d))
    const res = uplc.eval(args)

    if (isRight(res.result)) {
        const resData = res.result.right

        if (!isString(resData) && resData.kind == "data") {
            return resData.value
        }
    } else {
        throw new Error(res.result.left.error ?? "unexpected")
    }

    throw new Error("unexpected")
}

/**
 * Throws an error if the syntax or the types are wrong
 * @param {HeliosTypeTest} test
 */
export function evalTypes(test) {
    it(test.description, () => {
        const construct = () => {
            new Program(test.main, {
                moduleSources: test.modules,
                isTestnet: true,
                throwCompilerErrors: true
            })
        }

        if (true === test.fails) {
            throws(construct)
        } else if (test.fails) {
            throws(construct, test.fails)
        } else {
            construct()
        }
    })
}

/**
 *
 * @param {HeliosTypeTest[]} tests
 */
export function evalTypesMany(tests) {
    tests.forEach((test) => evalTypes(test))
}

/**
 * @param {boolean} b
 * @returns {UplcData}
 */
export function bool(b) {
    return makeConstrData(b ? 1 : 0, [])
}

export const False = bool(false)
export const True = bool(true)

/**
 * @param {BytesLike} mph
 * @param {BytesLike} name
 */
export function assetclass(mph, name) {
    return constr(0, bytes(mph), bytes(name))
}

/**
 *
 * @param {BytesLike} bs
 * @returns {UplcData}
 */
export function bytes(bs) {
    return makeByteArrayData(bs)
}

/**
 * @param {UplcData} d
 * @returns {UplcData}
 */
export function cbor(d) {
    return makeByteArrayData(d.toCbor())
}

/**
 * @param {number} tag
 * @param  {...UplcData} fields
 * @returns {UplcData}
 */
export function constr(tag, ...fields) {
    return makeConstrData(tag, fields)
}

/**
 * @param {number | bigint} i
 * @returns {UplcData}
 */
export function int(i) {
    return makeIntData(i)
}

/**
 * @param {[UplcData, UplcData][]} pairs
 * @returns {UplcData}
 */
export function map(pairs) {
    return makeMapData(pairs)
}

/**
 * @param  {...UplcData} d
 * @returns {UplcData}
 */
export function list(...d) {
    return makeListData(d)
}

/**
 * @param {UplcData} d
 * @returns {UplcData}
 */
export function mixedOther(d) {
    return makeConstrData(0, [d])
}

/**
 * @param {UplcData} d
 * @returns {UplcData}
 */
export function mixedSpending(d) {
    return makeConstrData(1, [d])
}

/**
 * @param {number} top
 * @param {number} bottom
 * @returns {UplcData}
 */
export function ratio(top, bottom) {
    if (bottom < 0) {
        return makeListData([makeIntData(-top), makeIntData(-bottom)])
    } else {
        return makeListData([makeIntData(top), makeIntData(bottom)])
    }
}

/**
 * @param {number} i
 * @returns {UplcData}
 */
export function real(i) {
    return makeIntData(Math.trunc(i * 1000000))
}

/**
 * @param {string} s
 * @returns {UplcData}
 */
export function str(s) {
    return makeByteArrayData(encodeUtf8(s))
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
        if (isString(output.right)) {
            return output.right
        } else if (output.right.kind == "data") {
            const str = output.right.value.toString()

            if (!str) {
                debugger // keep-debugger to help troubleshoot this wrong case
                output.right.value.toString()
            }
            return str
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
    if (!result) {
        debugger // keep-debugger to help troubleshoot this wrong case
        throw new Error(
            `can't convert ${result} to string for result comparison`
        )
    }
    if (typeof result == "string") {
        return result
    } else if ("error" in result) {
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
