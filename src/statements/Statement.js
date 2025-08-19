import { ToIRContext } from "../codegen/index.js"
import { ModuleScope } from "../scopes/index.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { Definitions } from "../index.js"
 */

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 */
export class Statement {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @type {string}
     */
    basePath // set by the parent Module

    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _name

    /**
     * @param {Site} site
     * @param {Word} name
     */
    constructor(site, name) {
        this.site = site
        this.basePath = "__user"
        this._name = name
    }

    /**
     * @type {Word}
     */
    get name() {
        return this._name
    }

    /**
     * @type {string}
     */
    get path() {
        return `${this.basePath}__${this.name.toString()}`
    }

    /**
     * @type {Statement[]}
     */
    get statements() {
        return []
    }

    /**
     * @param {ModuleScope} scope
     */
    eval(scope) {
        throw new Error("not yet implemented")
    }

    /**
     * @param {string} basePath
     */
    setBasePath(basePath) {
        this.basePath = basePath
    }

    /**
     * Returns IR of statement.
     * No need to specify indent here, because all statements are top-level
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        throw new Error("not yet implemented")
    }

    /**
     * @returns {string}
     */
    toString() {
        throw new Error("not yet implemented")
    }
}
