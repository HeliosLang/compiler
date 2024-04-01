export * from "@hyperionbt/helios"

import { Program } from "@hyperionbt/helios"
import { getShebang } from "typescript"

/**
 * @typedef {{
 * }} TypeCheckOptions
 */


/**
 * `ref` can be used for recursive types (eg. Trees)
 * @typedef {{
*     ref: string
* } | {
*     kind: "internal"
*     internal: string
*     id?: string
* } | {
*     kind: "list"
*     item: TypeSchema
*     id?: string
* } | {
*     kind: "map"
*     key: TypeSchema
*     value: TypeSchema
*     id?: string
* } | {
*     kind: "option"
*     some: TypeSchema
*     id?: string
* } | {
*     kind: "struct"
*     fields: {
*         name: string
*         type: TypeSchema
*     }[]
*     id?: string
* } | {
*     kind: "enum"
*     variants: {
*          name: string,
*          fieldTypes: {
*              name: string
*              type: TypeSchema
*          }[]
*     }[]
*     id?: string
* }} TypeSchema
*/

/**
 * @typedef {{
 *   arguments?: TypeSchema[]
 *   parameters?: {
 *     [name: string]: TypeSchema
 *   }
 * }} TypeCheckOutput
 */

/**
 * @param {string} main
 * @param {string[]} modules
 * @param {TypeCheckOptions} options
 * @returns {TypeCheckOutput}
 */
export function check(main, modules = [], options = {}) {
    const program = Program.new(main, modules)

    /**
     * @param {any} type 
     * @returns {TypeSchema}
     */
    function getSchema(type) {
        if (type.path.includes("scriptcontext")) {
            return {kind: "internal", internal: "ScriptContext"}
        } else {
            return {kind: "internal", internal: "Data"}
        }
    }

    const paramTypes = program.paramTypes

    return {
        arguments: program.mainFunc.argTypes.map(at => getSchema(at)),
        parameters: Object.fromEntries(Object.keys(paramTypes).map(k => [k, getSchema(paramTypes[k])]))
    }
}

/**
 * @typedef {{
 *   optimize?: boolean
 *   modules?: string[]
 *   parameters?: {
 *     [name: string]: any
 *   }
 * }} CompileOptions
 */

/**
 * arguments: 2 (redeemer and ScriptContext) or 3 (datum, redeemer and ScriptContext)
 * @typedef {{
 *   type: string
 *   description?: string
 *   cborHex: string
 * }} CompileOutput
 */

/**
 * @param {string} main 
 * @param {CompileOptions} options 
 * @returns {CompileOutput}
 */
export function compile(main, options = {}) {
    const optimize = options.optimize ?? false

    const program = Program.new(main, options?.modules ?? [])

    const params = options?.parameters ?? {}

    program.parameters = params

    return JSON.parse(program.compile(optimize).serialize())
}