import { MintingProgram } from "./MintingProgram.js"
import { DEFAULT_PROGRAM_CONFIG, Program } from "./Program.js"
import { SpendingProgram } from "./SpendingProgram.js"
import { StakingProgram } from "./StakingProgram.js"
import { TestingProgram } from "./TestingProgram.js"

/**
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("./Program.js").ProgramConfig} ProgramConfig
 */

/**
 * Creates  a new program.
 * @param {string} mainSrc
 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
 * @param {ProgramConfig} config
 * @returns {Program}
 */
export function newProgram(
    mainSrc,
    moduleSrcs = [],
    validatorTypes = {},
    config = DEFAULT_PROGRAM_CONFIG
) {
    return newProgramInternal(mainSrc, moduleSrcs, {}, config)
}

/**
 * Creates  a new program.
 * @internal
 * @param {string} mainSrc
 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
 * @param {{[name: string]: Type}} validatorTypes
 * @param {ProgramConfig} config
 * @returns {Program}
 */
function newProgramInternal(
    mainSrc,
    moduleSrcs = [],
    validatorTypes = {},
    config = DEFAULT_PROGRAM_CONFIG
) {
    const [purpose, modules] = Program.parseMain(mainSrc, moduleSrcs)

    /**
     * @type {Program}
     */
    let program

    switch (purpose) {
        case "testing":
            program = new TestingProgram(modules)
            break
        case "spending":
            program = new SpendingProgram(modules, config)
            break
        case "minting":
            program = new MintingProgram(modules, config)
            break
        case "staking":
            program = new StakingProgram(modules, config)
            break
        default:
            throw new Error("unhandled script purpose")
    }

    program.evalTypes(validatorTypes)

    return program
}
