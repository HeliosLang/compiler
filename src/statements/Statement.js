import { Word } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/index.js"
import { ModuleScope } from "../scopes/index.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").Token} Token
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 */

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @implements {Token}
 */
export class Statement {
    /**
     * @readonly
     * @type {Site}
     */
    site

    #name

    /**
     * @type {string}
     */
    basePath // set by the parent Module

    /**
     * @param {Site} site
     * @param {Word} name
     */
    constructor(site, name) {
        this.site = site
        this.#name = name
        this.basePath = "__user"
    }

    /**
     * @type {Word}
     */
    get name() {
        return this.#name
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
