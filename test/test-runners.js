import {
    Program,
    RuntimeError,
    UplcProgram,
    UserError,
    extractScriptPurposeAndName
} from "helios"

/**
 * @param {string} src
 * @param {string[]} argNames
 * @param {string} expectedResult
 * @param {string[]} expectedMessages
 * @returns {Promise<void>}
 */
export async function runTestScriptWithArgs(
    src,
    argNames,
    expectedResult,
    expectedMessages
) {
    let purposeName = extractScriptPurposeAndName(src)

    if (purposeName == null) {
        throw new Error("invalid header")
    }

    let [purpose, name] = purposeName

    if (purpose != "testing") {
        throw new Error(`${name} is not a test script`)
    }

    function checkResult(result_, simplified = false) {
        if (result_ instanceof Error && simplified) {
            return
        }

        let resStr = result_.toString()

        if (!resStr.includes(expectedResult)) {
            throw new Error(
                `unexpected result in ${name}: expected "${expectedResult}", got "${resStr}"`
            )
        }
    }

    let program

    try {
        program = Program.new(src)

        let args = argNames.map((n) => program.evalParam(n))

        // test the transfer() function as well
        let [result, messages] = await program
            .compile(false)
            .transfer(UplcProgram)
            .runWithPrint(args)

        if (
            expectedMessages.length > 0 &&
            !expectedMessages.every((em) =>
                messages.some((m) => m.includes(em))
            )
        ) {
            throw new Error(
                `didn't find expected message ${expectedMessages} in ${messages}`
            )
        }

        checkResult(result)

        console.log(`integration test '${name}' succeeded`)

        // also try the simplified version (don't check for the message though because all trace calls will've been eliminated)

        // test the transfer() function as well
        ;[result, messages] = await program
            .compile(true)
            .transfer(UplcProgram)
            .runWithPrint(args)

        if (messages.length != 0) {
            console.log(program.dumpIR(true, true))
            throw new Error("unexpected messages:" + messages.join(","))
        }

        checkResult(result, true)
    } catch (e) {
        if (!(e instanceof RuntimeError || e instanceof UserError)) {
            if (program) {
                console.log(program.dumpIR(true, true))
            }
            throw e
        } else {
            try {
                checkResult(e)
            } catch (e) {
                if (program) {
                    console.log(program.dumpIR(true, true))
                }
                throw e
            }
        }
    }

    console.log(`integration test '${name}' succeeded (simplified)`)
}

/**
 *
 * @param {string} src
 * @param {string} expectedResult
 * @param {string[]} expectedMessages
 * @returns {Promise<void>}
 */
export async function runTestScript(src, expectedResult, expectedMessages) {
    await runTestScriptWithArgs(src, [], expectedResult, expectedMessages)
}
