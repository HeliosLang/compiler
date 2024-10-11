import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { Common } from "../typecheck/index.js"
import { GlobalScope } from "./GlobalScope.js"

/**
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
     * @private
     * @readonly
     * @type {boolean}
     */
    _allowShadowing

    /**
     * @param {GlobalScope | Scope} parent
     * @param {boolean} allowShadowing
     */
    constructor(parent, allowShadowing = false) {
        super()
        this._parent = parent
        this._values = [] // list of pairs
        this._allowShadowing = allowShadowing
    }

    /**
     * @type {boolean}
     */
    get allowShadowing() {
        return this._allowShadowing
    }

    /**
     * Used by top-scope to loop over all the statements
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
                    throw CompilerError.syntax(
                        name.site,
                        `'${name.toString()}' already defined`
                    )
                }
            } else {
                throw CompilerError.syntax(
                    name.site,
                    `'${name.toString()}' already defined`
                )
            }
        }

        this._values.push([name, value, false])
    }

    /**
     * Sets a named value. Throws an error if not unique
     * @param {Word} name
     * @param {EvalEntity | Scope} value
     */
    set(name, value) {
        this.setInternal(name, value, this._allowShadowing)
    }

    /**
     * @param {Word} name
     */
    remove(name) {
        this._values = this._values.filter(([n, _]) => n.value != name.value)
    }

    /**
     * @param {Word} name
     * @returns {null | Scope}
     */
    getScope(name) {
        if (name.value.startsWith("__scope__")) {
            throw new Error("unexpected")
        }

        const entity = this.get(new Word(`__scope__${name.value}`, name.site))

        if (entity instanceof Scope) {
            return entity
        } else if (!entity) {
            throw CompilerError.type(name.site, `expected Scope`)
            return null
        } else {
            throw CompilerError.type(
                name.site,
                `expected Scope, got ${entity.toString()}`
            )
            return null
        }
    }

    /**
     * @param {Word} name
     * @returns {Option<Named & Namespace>}
     */
    getBuiltinNamespace(name) {
        if (!this._parent) {
            throw CompilerError.reference(
                name.site,
                `namespace ${name.value} not found`
            )
        } else {
            return this._parent.getBuiltinNamespace(name)
        }
    }

    /**
     * Gets a named value from the scope. Throws an error if not found
     * @param {Word | string} name
     * @param {boolean} dryRun - if false -> don't set used flag
     * @returns {EvalEntity | Scope}
     */
    get(name, dryRun = false) {
        if (!(name instanceof Word)) {
            name = new Word(name)
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
            throw CompilerError.reference(
                name.site,
                `'${name.toString()}' undefined`
            )
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
                    throw CompilerError.reference(
                        name.site,
                        `'${name.toString()}' unused`
                    )
                }
                if (flaggedUnused && used) {
                    throw CompilerError.reference(
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
