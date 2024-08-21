/**
 * Utility functions for working with multi-validator contracts
 * Mostyle used by @helios-lang/contract-utils
 */

import { readHeader } from "@helios-lang/compiler-utils"
import { collectParams, prepare as prepareIR } from "@helios-lang/ir"
import { None, expectSome } from "@helios-lang/type-utils"
import { IR_PARSE_OPTIONS } from "../parse/index.js"
import {
    MintingPolicyHashType,
    ScriptHashType,
    StakingValidatorHashType,
    ValidatorHashType,
    scriptHashType
} from "../typecheck/index.js"
import { Module } from "./Module.js"
import { Program } from "./Program.js"
import { VERSION } from "./version.js"
import { UserFunc } from "./UserFunc.js"

/**
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 * @typedef {import("./EntryPoint.js").EntryPoint} EntryPoint
 */

/**
 * @typedef {{
 *   requiresScriptContext: boolean
 *   requiresCurrentScript: boolean
 *   arguments: {
 *     name: string
 *     type: TypeSchema
 *   }[]
 *   returns: TypeSchema
 * }} AnalyzedFunction
 */

/**
 * @typedef {{
 *   name: string
 *   purpose: string
 *   sourceCode: string
 *   moduleDepedencies: string[]
 *   types: Record<string, TypeSchema>
 *   functions: Record<string, AnalyzedFunction>
 * }} AnalyzedModule
 */

/**
 * Note: `hashDependencies` doesn't contain the indirect dependencies! It must be kept to a minimum in order to inform in which order the validators must be compiled
 * @typedef {AnalyzedModule & {
 *   hashDependencies: string[]
 *   Redeemer: TypeSchema
 *   currentScriptIndex?: number
 *   Datum?: TypeSchema
 * }} AnalyzedValidator
 */

/**
 * Maps purposes to concreate ScriptHashTypes
 * @param {string} purpose
 * @returns {ScriptHashType}
 */
export function getScriptHashType(purpose) {
    switch (purpose) {
        case "spending":
            return ValidatorHashType
        case "minting":
            return MintingPolicyHashType
        case "staking":
            return StakingValidatorHashType
        case "mixed":
            return scriptHashType
        default:
            throw new Error(
                `Helios v${VERSION} doesn't support validator purpose '${purpose}' (hint: supported purposes are 'spending', 'minting', 'staking' and 'mixed')`
            )
    }
}

/**
 * @param {string[]} validatorSources
 * @param {string[]} moduleSources
 * @returns {{
 *   modules: Record<string, AnalyzedModule>,
 *   validators: Record<string, AnalyzedValidator>
 * }}
 */
export function analyzeMulti(validatorSources, moduleSources) {
    /**
     * @type {Record<string, ScriptHashType>}
     */
    const validatorTypes = getValidatorTypes(validatorSources)

    const validatorPrograms = createPrograms(
        validatorSources,
        moduleSources,
        validatorTypes
    )
    const dag = buildDag(validatorPrograms)

    /**
     * @type {Record<string, AnalyzedValidator>}}
     */
    const analyzedValidators = {}

    /**
     * @type {Record<string, AnalyzedModule>}}
     */
    const analyzedModules = {}

    // collect the validators and the modules from the typechecked programs
    for (let p of validatorPrograms) {
        const allTypes = p.userTypes
        const allFunctions = p.userFunctions

        analyzedValidators[p.name] = analyzeValidator(
            p,
            validatorTypes,
            dag,
            allTypes,
            allFunctions
        )

        // add any module dependencies that haven't been added before
        const allModules = p.entryPoint.mainImportedModules

        for (let m of allModules) {
            const name = m.name.value

            if (!(name in analyzedModules)) {
                analyzedModules[name] = analyzeModule(
                    m,
                    validatorTypes,
                    allModules,
                    allTypes,
                    allFunctions
                )
            }
        }
    }

    return {
        modules: analyzedModules,
        validators: analyzedValidators
    }
}

/**
 * @param {Program} program
 * @param {Record<string, ScriptHashType>} validatorTypes
 * @param {Record<string, string[]>} dag
 * @param {Record<string, Record<string, DataType>>} allTypes
 * @param {Record<string, Record<string, UserFunc>>} allFunctions
 * @returns {AnalyzedValidator}
 */
function analyzeValidator(
    program,
    validatorTypes,
    dag,
    allTypes,
    allFunctions
) {
    const name = program.name
    const purpose = program.purpose
    const hashDependencies = dag[name]
    const moduleDeps = program.entryPoint.moduleDependencies
    const moduleTypes = allTypes[name]
    const moduleFunctions = allFunctions[name] ?? {}
    const isSpending = purpose == "spending"
    const redeemer =
        purpose == "mixed"
            ? { kind: /** @type {const} */ ("internal"), name: "Data" }
            : program.entryPoint.mainArgTypes[isSpending ? 1 : 0].toSchema()
    const datum =
        purpose == "mixed"
            ? { kind: /** @type {const} */ ("internal"), name: "Data" }
            : isSpending
              ? program.entryPoint.mainArgTypes[0].toSchema()
              : undefined

    return {
        name: name,
        purpose: purpose,
        hashDependencies: hashDependencies,
        moduleDepedencies: moduleDeps,
        sourceCode: program.entryPoint.mainModule.sourceCode.content,
        types: createTypeSchemas(moduleTypes),
        functions: analyzeFunctions(moduleFunctions, validatorTypes),
        Redeemer: redeemer,
        Datum: datum,
        currentScriptIndex: program.currentScriptIndex ?? undefined
    }
}

/**
 * @param {Module} m
 * @param {Record<string, ScriptHashType>} validatorTypes
 * @param {Module[]} allModules
 * @param {Record<string, Record<string, DataType>>} allTypes
 * @param {Record<string, Record<string, UserFunc>>} allFunctions
 * @returns {AnalyzedModule}
 */
function analyzeModule(m, validatorTypes, allModules, allTypes, allFunctions) {
    const name = m.name.value

    const moduleDeps = m.filterDependencies(allModules).map((m) => m.name.value)
    const moduleTypes = allTypes[name]
    const moduleFunctions = allFunctions[name] ?? {}

    return {
        name: name,
        purpose: "module",
        moduleDepedencies: moduleDeps,
        sourceCode: m.sourceCode.content,
        types: createTypeSchemas(moduleTypes),
        functions: analyzeFunctions(moduleFunctions, validatorTypes)
    }
}

/**
 * @param {Record<string, UserFunc>} fns
 * @param {Record<string, ScriptHashType>} validatorTypes
 * @returns {Record<string, AnalyzedFunction>}
 */
function analyzeFunctions(fns, validatorTypes) {
    return Object.fromEntries(
        Object.entries(fns).map(([key, fn]) => {
            const main = fn.mainFunc
            const { requiresCurrentScript, requiresScriptContext } = fn.toIR({
                validatorTypes,
                currentScriptValue: "#"
            })

            return [
                key,
                {
                    requiresCurrentScript: requiresCurrentScript,
                    requiresScriptContext: requiresScriptContext,
                    arguments: main.argNames.map((name, i) => {
                        const type = main.argTypes[i]

                        return {
                            name: name,
                            type: expectSome(type.asDataType).toSchema()
                        }
                    }),
                    returns: expectSome(main.retType.asDataType).toSchema()
                }
            ]
        })
    )
}

/**
 * @param {Program[]} programs
 * @returns {Option<Record<string, number>>}
 */
function getValidatorIndices(programs) {
    /**
     * @type {Record<string, number>}
     */
    const indices = {}

    for (let p of programs) {
        if (p.currentScriptIndex) {
            indices[p.name] = p.currentScriptIndex
        } else {
            return None
        }
    }

    return indices
}

/**
 * Creates a Directed Acyclical Graph of inter-validator dependencies of a multi-validator contract
 * @param {Program[]} programs
 * @returns {Record<string, string[]>}
 */
function buildDag(programs) {
    if (programs.length == 0) {
        throw new Error("expected at least 1 program")
    }

    /**
     * @type {Record<string, string[]>}
     */
    const dag = {}

    const validatorTypes = expectSome(
        programs[0].props.validatorTypes,
        "validatorTypes unset"
    )

    const validatorIndices = getValidatorIndices(programs)

    const validatorNames = Object.keys(validatorTypes)

    programs.forEach((p) => {
        const ir = p.toIR({
            optimize: true,
            dependsOnOwnHash: false,
            makeParamSubstitutable: true,
            validatorIndices: validatorIndices ?? undefined,
            hashDependencies: Object.fromEntries(
                validatorNames.map((name) => [name, "#"])
            )
        })

        const expr = prepareIR(ir, {
            optimize: true,
            parseOptions: IR_PARSE_OPTIONS
        })

        const params = collectParams(expr)

        dag[p.name] = validatorNames.filter((name) =>
            params.has(`__helios__scripts__${name}`)
        )
    })

    assertNonCircularDag(dag)

    return dag
}

/**
 * Throws an error if the DAG has a circular dependency (and thus isn't actually a DAG)
 * @param {Record<string, string[]>} dag
 */
function assertNonCircularDag(dag) {
    /**
     * Simply recursive algorithms
     * @param {string} name
     * @param {string[]} dependents
     */
    function assertNonCircular(name, dependents) {
        const i = dependents.findIndex((d) => d == name)

        if (i != -1) {
            throw new Error(
                `invalid DAG, circular dependecy detected: ${dependents.slice(i).join(" -> ")} -> ${name}`
            )
        }

        // depending on itself doesn't create a problem
        const dependencies = (dag[name] ?? []).filter((n) => n != name)

        dependencies.forEach((d) => {
            assertNonCircular(d, dependents.concat([name]))
        })
    }

    for (let name in dag) {
        assertNonCircular(name, [])
    }
}

/**
 * @param {string[]} validators
 * @param {string[]} modules
 * @param {{[name: string]: ScriptHashType}} validatorTypes
 * @returns {Program[]}
 */
function createPrograms(validators, modules, validatorTypes) {
    return validators.map((v) => {
        return new Program(v, {
            moduleSources: modules,
            validatorTypes: validatorTypes,
            isTestnet: false,
            throwCompilerErrors: true
        })
    })
}

/**
 *
 * @param {Record<string, DataType>} types
 * @returns {Record<string, TypeSchema>}
 */
function createTypeSchemas(types) {
    return Object.fromEntries(
        Object.entries(types).map(([typeName, dataType]) => [
            typeName,
            dataType.toSchema()
        ])
    )
}

/**
 * @param {string[]} validators
 * @returns {{[name: string]: ScriptHashType}}
 */
function getValidatorTypes(validators) {
    return Object.fromEntries(
        validators.map((src) => {
            const [purpose, name] = readHeader(src)
            return [name, getScriptHashType(purpose)]
        })
    )
}
