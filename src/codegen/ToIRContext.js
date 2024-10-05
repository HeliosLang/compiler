import { SourceMappedString } from "@helios-lang/ir"
import { ParametricName } from "./ParametricName.js"
import { RawFunc, matchBuiltins } from "./RawFunc.js"
import { makeRawFunctions } from "./makeRawFuncs.js"
import { wrapWithDefs, TAB } from "./Definitions.js"

/**
 * @typedef {import("./Definitions.js").Definitions} Definitions
 */

/**
 * @typedef {{
 *   optimize: boolean
 *   isTestnet: boolean
 *   makeParamsSubstitutable?: boolean
 *   aliasNamespace?: string
 * }} ToIRContextProps
 */

export class ToIRContext {
    /**
     * @readonly
     * @type {ToIRContextProps}
     */
    props

    /**
     * @readonly
     * @type {string}
     */
    indent

    /**
     * @type {Map<string, RawFunc>}
     */
    _db

    /**
     * @param {ToIRContextProps} props
     * @param {string} indent
     * @param {Map<string, RawFunc>} db
     */
    constructor(props, indent = "", db = new Map()) {
        this.props = props
        this.indent = indent
        this._db = db
    }

    /**
     * @type {Option<string>}
     */
    get aliasNamespace() {
        return this.props?.aliasNamespace
    }

    /**
     * @type {Map<string, RawFunc>}
     */
    get db() {
        if (this._db.size == 0) {
            this._db = makeRawFunctions(this.optimize, this.isTestnet)
        }

        return this._db
    }

    /**
     * TODO: rename to isMainnet()
     * @type {boolean}
     */
    get isTestnet() {
        return this.props.isTestnet
    }

    /**
     * @type {boolean}
     */
    get optimize() {
        return this.props.optimize
    }

    /**
     * @type {boolean}
     */
    get paramsSubsitutable() {
        return this.props.makeParamsSubstitutable ?? false
    }

    /**
     * @returns {ToIRContext}
     */
    tab() {
        return new ToIRContext(this.props, this.indent + TAB, this._db)
    }

    /**
     * Load all raw generics so all possible implementations can be generated correctly during type parameter injection phase
     * @returns {Map<string, ((ttp: string[], ftp: string[]) => SourceMappedString)>}
     */
    fetchRawGenerics() {
        /**
         * @type {Map<string, ((ttp: string[], ftp: string[]) => SourceMappedString)>}
         */
        const map = new Map()

        for (let [k, v] of this.db) {
            if (ParametricName.matches(k)) {
                // load without dependencies
                /**
                 *
                 * @param {string[]} ttp
                 * @param {string[]} ftp
                 * @returns {SourceMappedString}
                 */
                const fn = (ttp, ftp) => v.toIR(ttp, ftp)
                map.set(k, fn)
            }
        }

        return map
    }

    /**
     * Doesn't add templates
     * @param {SourceMappedString} ir
     * @param {Option<Definitions>} userDefs - some userDefs might have the __helios prefix
     * @returns {Definitions}
     */
    fetchRawFunctions(ir, userDefs = null) {
        let [src, _] = ir.toStringWithSourceMap()

        /**
         * @type {Definitions}
         */
        const map = new Map()

        matchBuiltins(src, (m) => {
            if (
                !ParametricName.matches(m) &&
                !map.has(m) &&
                (!userDefs || !userDefs.has(m))
            ) {
                const builtin = this.db.get(m)

                if (!builtin) {
                    throw new Error(`builtin ${m} not found`)
                }

                builtin.load(this.db, map)
            }
        })

        return map
    }

    /**
     * Appends parent debugging information which should be passed into IR via site.alias
     * @param {string} alias
     * @returns {ToIRContext}
     */
    appendAliasNamespace(alias) {
        const prev = this.aliasNamespace

        return new ToIRContext(
            {
                ...this.props,
                aliasNamespace: prev ? `${prev}::${alias}` : alias
            },
            this.indent,
            this.db
        )
    }

    /**
     * Adds parent debugging information which should be passed into IR via site.alias
     * @param {string} alias
     * @returns {ToIRContext}
     */
    withAliasNamespace(alias) {
        return new ToIRContext(
            {
                ...this.props,
                aliasNamespace: alias
            },
            this.indent,
            this.db
        )
    }

    /**
     * @param {SourceMappedString} ir
     * @returns {SourceMappedString}
     */
    wrapWithRawFunctions(ir) {
        const map = this.fetchRawFunctions(ir)

        return wrapWithDefs(ir, map)
    }
}
