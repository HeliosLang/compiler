/**
 * Utility functions for working with multi-validator contracts
 * Mostyle used by @helios-lang/contract-utils
 */

import { readHeader } from "@helios-lang/compiler-utils"
import {
    collectParams,
    prepare as prepareIR,
} from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import {
    MintingPolicyHashType,
    ScriptHashType,
    StakingValidatorHashType,
    ValidatorHashType,
    scriptHashType
} from "../typecheck/index.js"
import { Module } from "./Module.js"
import { IR_PARSE_OPTIONS, Program } from "./Program.js"
import { VERSION } from "./version.js"

/**
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 */

/**
 * @typedef {{
 *   name: string
 *   purpose: string
 *   sourceCode: string
 *   moduleDepedencies: string[]
 *   types: {[name: string]: TypeSchema}
 * }} AnalyzedModule
 */

/**
 * @typedef {AnalyzedModule & {
 *   hashDependencies: string[]
 *   Redeemer: TypeSchema
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

        analyzedValidators[p.name] = analyzeValidator(p, dag, allTypes)

        // add any module dependencies that haven't been added before
        const allModules = p.entryPoint.mainImportedModules

        for (let m of allModules) {
            const name = m.name.value

            if (!(name in analyzedModules)) {
                analyzedModules[name] = analyzeModule(m, allModules, allTypes)
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
 * @param {Record<string, string[]>} dag
 * @param {Record<string, Record<string, DataType>>} allTypes
 * @returns {AnalyzedValidator}
 */
function analyzeValidator(program, dag, allTypes) {
    const name = program.name
    const purpose = program.purpose
    const hashDependencies = dag[name]
    const moduleDeps = program.entryPoint.moduleDependencies
    const moduleTypes = allTypes[name]
    const isSpending = purpose == "spending"
    const redeemer =
        program.entryPoint.mainArgTypes[isSpending ? 1 : 0].toSchema()
    const datum = isSpending
        ? program.entryPoint.mainArgTypes[0].toSchema()
        : undefined

    return {
        name: name,
        purpose: purpose,
        hashDependencies: hashDependencies,
        moduleDepedencies: moduleDeps,
        sourceCode: program.entryPoint.mainModule.sourceCode.content,
        types: createTypeSchemas(moduleTypes),
        Redeemer: redeemer,
        Datum: datum
    }
}

/**
 *
 * @param {Module} m
 * @param {Module[]} allModules
 * @param {Record<string, Record<string, DataType>>} allTypes
 * @returns {AnalyzedModule}
 */
function analyzeModule(m, allModules, allTypes) {
    const name = m.name.value

    const moduleDeps = m.filterDependencies(allModules).map((m) => m.name.value)
    const moduleTypes = allTypes[name]

    return {
        name: name,
        purpose: "module",
        moduleDepedencies: moduleDeps,
        sourceCode: m.sourceCode.content,
        types: createTypeSchemas(moduleTypes)
    }
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

    const validatorNames = Object.keys(validatorTypes)

    programs.forEach((v) => {
        const ir = v.toIR({
            optimize: true,
            dependsOnOwnHash: false,
            makeParamSubstitutable: true,
            hashDependencies: Object.fromEntries(
                validatorNames.map((name) => [name, "#"])
            )
        })

        const expr = prepareIR(ir, {
            optimize: true,
            parseOptions: IR_PARSE_OPTIONS
        })

        const params = collectParams(expr)

        dag[v.name] = validatorNames.filter((name) =>
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

        const dependencies = dag[name] ?? []

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
