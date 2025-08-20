import {
    makeReferenceError,
    makeSyntaxError,
    makeTypeError,
    makeWord
} from "@helios-lang/compiler-utils"
import { AllType, Common } from "../typecheck/index.js"
import { GlobalScope } from "./GlobalScope.js"

/**
 * @import { ErrorCollector, Site, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 * @typedef {import("../typecheck/index.js").Named} Named
 * @typedef {import("../typecheck/index.js").Namespace} Namespace
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * User scope
 * @implements {EvalEntity}
 */
export class Scope extends Common {
    /**
     * @private
     * @readonly
     * @type {GlobalScope | Scope}
     */
    _parent

    /**
     * TopScope can elverage the _values to store ModuleScopes
     * @private
     * @type {[Word, (EvalEntity | Scope), boolean][]}
     */
    _values

    /**
     * @readonly
     * @type {boolean}
     */
    allowShadowing

    /**
     * @readonly
     * @type {ErrorCollector | undefined}
     */
    errorCollector

    /**
     * @param {GlobalScope | Scope} parent
     * @param {boolean} [allowShadowing]
     * @param {ErrorCollector | undefined} [errorCollector]
     */
    constructor(parent, allowShadowing = false, errorCollector = undefined) {
        super()
        this._parent = parent
        this._values = [] // list of pairs
        this.allowShadowing = allowShadowing
        this.errorCollector = errorCollector
    }

    /**
     * Used by top-scope to loop over all the statements
     * @type {[Word, (EvalEntity | Scope), boolean][]}
     */
    get values() {
        return this._values.slice()
    }

    /**
     * Checks if scope contains a name
     * @param {Word} name
     * @returns {boolean}
     */
    has(name) {
        for (let pair of this._values) {
            if (pair[0].toString() == name.toString()) {
                return true
            }
        }

        if (this._parent) {
            return this._parent.has(name)
        } else {
            return false
        }
    }

    /**
     * Sets a named value. Throws an error if not unique
     * @param {Word} name
     * @param {EvalEntity | Scope} value
     */
    setInternal(name, value, allowShadowing = false) {
        if (value instanceof Scope) {
            if (!name.value.startsWith("__scope__")) {
                throw new Error("unexpected")
            }
        }

        if (this.has(name)) {
            const prevEntity = this.get(name, true)

            if (
                allowShadowing &&
                value.asTyped &&
                prevEntity &&
                !(prevEntity instanceof Scope) &&
                prevEntity.asTyped
            ) {
                if (
                    !(
                        prevEntity.asTyped.type.isBaseOf(value.asTyped.type) &&
                        value.asTyped.type.isBaseOf(prevEntity.asTyped.type)
                    )
                ) {
                    this.addSyntaxError(
                        name.site,
                        `'${name.toString()}' already defined`
                    )
                }
            } else {
                this.addSyntaxError(
                    name.site,
                    `'${name.toString()}' already defined`
                )
            }
        }

        this._values.push([name, value, false])
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} msg
     */
    addReferenceError(site, msg) {
        if (this.errorCollector) {
            this.errorCollector.reference(site, msg)
        } else {
            throw makeReferenceError(site, msg)
        }
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} msg
     */
    addSyntaxError(site, msg) {
        if (this.errorCollector) {
            this.errorCollector.syntax(site, msg)
        } else {
            throw makeSyntaxError(site, msg)
        }
    }

    /**
     * @private
     * @param {Site} site
     * @param {string} msg
     */
    addTypeError(site, msg) {
        if (this.errorCollector) {
            this.errorCollector.type(site, msg)
        } else {
            throw makeTypeError(site, msg)
        }
    }

    /**
     * Sets a named value. Throws an error if not unique
     * @param {Word} name
     * @param {EvalEntity | Scope} value
     */
    set(name, value) {
        this.setInternal(name, value, this.allowShadowing)
    }

    /**
     * @param {Word} name
     */
    remove(name) {
        this._values = this._values.filter(([n, _]) => n.value != name.value)
    }

    /**
     * @param {Word} name
     * @returns {undefined | Scope}
     */
    getScope(name) {
        if (name.value.startsWith("__scope__")) {
            throw new Error("unexpected")
        }

        const entity = this.get(
            makeWord({ value: `__scope__${name.value}`, site: name.site })
        )

        if (entity instanceof Scope) {
            return entity
        } else if (!entity) {
            this.addTypeError(name.site, `expected Scope`)

            return undefined
        } else {
            this.addTypeError(
                name.site,
                `expected Scope, got ${entity.toString()}`
            )

            return undefined
        }
    }

    /**
     * @param {Word} name
     * @returns {(Named & Namespace) | undefined}
     */
    getBuiltinNamespace(name) {
        if (!this._parent) {
            this.addReferenceError(
                name.site,
                `namespace ${name.value} not found`
            )

            return undefined
        } else {
            return this._parent.getBuiltinNamespace(name)
        }
    }

    /**
     * Gets a named value from the scope. Throws an error if not found and no error collector is set, otherwise appends an error and returns undefined
     * @param {Word | string} name
     * @param {boolean} [dryRun] - if false -> don't set used flag
     * @returns {EvalEntity | Scope | undefined}
     */
    get(name, dryRun = false) {
        if (typeof name == "string") {
            name = makeWord({ value: name })
        }

        for (let i = this._values.length - 1; i >= 0; i--) {
            const [key, entity, _] = this._values[i]

            if (key.toString() == name.toString()) {
                if (!dryRun) {
                    this._values[i][2] = true
                }
                return entity
            }
        }

        if (this._parent) {
            if (this._parent instanceof GlobalScope) {
                return this._parent.get(name)
            } else {
                return this._parent.get(name, dryRun)
            }
        } else {
            this.addReferenceError(name.site, `'${name.toString()}' undefined`)

            return undefined
        }
    }

    /**
     * @returns {boolean}
     */
    isStrict() {
        return this._parent.isStrict()
    }

    /**
     * Asserts that all named values are used.
     * Throws an error if some are unused, unless they start with "_"
     * Check is only run if we are in strict mode
     * @param {boolean} onlyIfStrict
     */
    assertAllUsed(onlyIfStrict = true) {
        if (!onlyIfStrict || this.isStrict()) {
            for (let [name, entity, used] of this._values) {
                const flaggedUnused = name.value.startsWith("_")
                if (!used && !(entity instanceof Scope) && !flaggedUnused) {
                    this.addReferenceError(
                        name.site,
                        `'${name.toString()}' unused`
                    )
                }
                if (flaggedUnused && used) {
                    this.addReferenceError(
                        name.site,
                        `_-prefixed variable '${name.toString()}' must be unused`
                    )
                }
            }
        }
    }

    /**
     * @param {Word} name
     * @returns {boolean}
     */
    isUsed(name) {
        for (let [checkName, entity, used] of this._values) {
            if (name.value == checkName.value && !(entity instanceof Scope)) {
                return used
            }
        }

        throw new Error(`${name.value} not found`)
    }

    /**
     * @param {(name: string, type: Type) => void} callback
     */
    loopTypes(callback) {
        this._parent.loopTypes(callback)

        for (let [k, v] of this._values) {
            if (v.asType) {
                callback(k.value, v.asType)
            }
        }
    }
}
