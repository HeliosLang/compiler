import { Common, ErrorType, FuncType, VoidType } from "./common.js"
import { BoolType, StringType } from "./primitives.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("./common.js").Func} Func
 * @typedef {import("./common.js").Named} Named
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").Typed} Typed
 */

/**
 * Used by print, error, and assert
 * @implements {Func}
 * @implements {Named}
 */
export class BuiltinFunc extends Common {
    /**
     * @private
     * @readonly
     * @type {string}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {FuncType}
     */
    _type

    /**
     *
     * @param {{
     *   name: string,
     *   type: FuncType
     * }} props
     */
    constructor({ name, type }) {
        super()
        this._name = name
        this._type = type
    }

    /**
     * @type {string}
     */
    get name() {
        return this._name
    }

    /**
     * @type {string}
     */
    get path() {
        return `__helios__${this._name}`
    }

    /**
     * @type {Type}
     */
    get type() {
        return this._type
    }

    /**
     * @type {FuncType}
     */
    get funcType() {
        return this._type
    }

    /**
     * @type {Func}
     */
    get asFunc() {
        return this
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this
    }

    /**
     * @type {Typed}
     */
    get asTyped() {
        return this
    }

    /**
     * Can mutate the args and the namedArgs in case of casting
     * @param {TypeCheckContext} ctx
     * @param {Site} site
     * @param {Typed[]} args
     * @param {{[name: string]: Typed}} namedArgs
     * @returns {Typed}
     */
    call(ctx, site, args, namedArgs = {}) {
        const res = this._type.checkCall(ctx, site, args, namedArgs)

        return res.toTyped()
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name
    }
}

/**
 * Special builtin function that throws an error if condition is false and returns Void
 */
export const AssertFunc = new BuiltinFunc({
    name: "assert",
    type: new FuncType([BoolType, StringType], new VoidType())
})

/**
 * Special builtin function that throws an error and returns ErrorInstance (special case of Void)
 */
export const ErrorFunc = new BuiltinFunc({
    name: "error",
    type: new FuncType([StringType], new ErrorType())
})

/**
 * Special builtin function that prints a message and returns void
 */
export const PrintFunc = new BuiltinFunc({
    name: "print",
    type: new FuncType([StringType], new VoidType())
})
