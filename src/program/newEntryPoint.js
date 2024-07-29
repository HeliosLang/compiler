import { CompilerError, ErrorCollector } from "@helios-lang/compiler-utils"
import { parseScript } from "../parse/index.js"
import { MintingEntryPoint } from "./MintingEntryPoint.js"
import { SpendingEntryPoint } from "./SpendingEntryPoint.js"
import { StakingProgram } from "./StakingEntryPoint.js"
import { TestingEntryPoint } from "./TestingEntryPoint.js"
import { Module } from "./Module.js"
import { MainModule } from "./MainModule.js"
import { GenericEntryPoint } from "./GenericEntryPoint.js"
import { MixedEntryPoint } from "./MixedEntryPoint.js"

/**
 * @typedef {import("../typecheck/index.js").ScriptTypes} ScriptTypes
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * Creates a new entry point
 * This function can't be placed inside EntryPoint.js because that would create a circular import dependency
 * @param {string} mainSrc
 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
 * @param {ScriptTypes} validatorTypes
 * @param {ErrorCollector} errorCollector
 * @returns {EntryPoint}
 */
export function newEntryPoint(
    mainSrc,
    moduleSrcs,
    validatorTypes,
    errorCollector
) {
    const [purpose, modules] = parseMain(mainSrc, moduleSrcs, errorCollector)

    /**
     * @type {EntryPoint}
     */
    let entryPoint

    switch (purpose) {
        case "testing":
            entryPoint = new TestingEntryPoint(modules)
            break
        case "spending":
            entryPoint = new SpendingEntryPoint(modules)
            break
        case "minting":
            entryPoint = new MintingEntryPoint(modules)
            break
        case "mixed":
            entryPoint = new MixedEntryPoint(modules)
            break
        case "staking":
            entryPoint = new StakingProgram(modules)
            break
        default:
            entryPoint = new GenericEntryPoint(purpose ?? "unknown", modules)
    }

    // TODO: add type errors directly to ErrorCollector
    try {
        entryPoint.evalTypes(validatorTypes)
    } catch (e) {
        if (e instanceof CompilerError) {
            errorCollector.errors.push(e)
        } else {
            throw e
        }
    }

    return entryPoint
}

/**
 * @param {string} mainSrc
 * @param {string[]} moduleSrcs
 * @param {ErrorCollector} errorCollector
 * @returns {[Option<string>, Module[]]}
 */
function parseMain(mainSrc, moduleSrcs, errorCollector) {
    let [purpose, modules] = parseMainInternal(mainSrc, errorCollector)

    const site = modules[0].name.site

    const imports = parseImports(
        modules[0].name.value,
        moduleSrcs,
        errorCollector
    )

    const mainImports = modules[0].filterDependencies(imports)

    /**
     * @type {Module[]}
     */
    let postImports = []

    if (modules.length > 1) {
        postImports = modules[modules.length - 1]
            .filterDependencies(imports)
            .filter(
                (m) => !mainImports.some((d) => d.name.value == m.name.value)
            )
    }

    // create the final order of all the modules (this is the order in which statements will be added to the IR)
    modules = mainImports
        .concat([modules[0]])
        .concat(postImports)
        .concat(modules.slice(1))

    if (purpose.value == "module") {
        throw CompilerError.syntax(site, "can't use module for main")
    }

    return [purpose.value, modules]
}

/**
 * @param {string} rawSrc
 * @param {ErrorCollector} errorCollector
 * @returns {[purpose, Module[]]}
 */
function parseMainInternal(rawSrc, errorCollector) {
    const { purpose, name, statements, entryPointIndex } = parseScript(
        rawSrc,
        errorCollector
    )

    if (purpose && name) {
        /**
         * @type {Module[]}
         */
        const modules = [
            new MainModule(name, statements.slice(0, entryPointIndex + 1))
        ]

        if (entryPointIndex < statements.length - 1) {
            modules.push(
                new Module(name, statements.slice(entryPointIndex + 1))
            )
        }

        return [purpose, modules]
    } else {
        throw new Error("unexpected") // should've been caught by calling src.throwErrors() above
    }
}

/**
 * @param {string} rawSrc
 * @param {ErrorCollector} errorCollector
 * @returns {Module}
 */
function parseModule(rawSrc, errorCollector) {
    const { purpose, name, statements } = parseScript(rawSrc, errorCollector)

    if (name) {
        return new Module(name, statements)
    } else {
        throw new Error("unexpected") // should've been caught by calling src.throwErrors() above
    }
}

/**
 * @param {string} mainName
 * @param {string[]} moduleSrcs
 * @param {ErrorCollector} errorCollector
 * @returns {Module[]}
 */
function parseImports(mainName, moduleSrcs, errorCollector) {
    let imports = moduleSrcs.map((src) => {
        return parseModule(src, errorCollector)
    })

    /**
     * @type {Set<string>}
     */
    let names = new Set()

    names.add(mainName)

    for (let m of imports) {
        if (names.has(m.name.value)) {
            errorCollector.syntax(
                m.name.site,
                `non-unique module name '${m.name.value}'`
            )
        } else {
            names.add(m.name.value)
        }
    }

    return imports
}
