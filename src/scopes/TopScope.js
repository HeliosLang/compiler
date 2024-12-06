import { makeWord } from "@helios-lang/compiler-utils"
import { GlobalScope } from "./GlobalScope.js"
import { ModuleScope } from "./ModuleScope.js"
import { Scope } from "./Scope.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * TopScope is a special scope that can contain UserTypes
 * @internal
 */
export class TopScope extends Scope {
    /**
     * @private
     * @type {boolean}
     */
    _strict

    /**
     * @param {GlobalScope} parent
     * @param {boolean} strict
     */
    constructor(parent, strict = true) {
        super(parent)
        this._strict = strict
    }

    /**
     * Prepends "__scope__" to name before actually setting scope
     * @param {Word} name
     * @param {Scope} value
     */
    setScope(name, value) {
        if (name.value.startsWith("__scope__")) {
            throw new Error("unexpected")
        }

        this.set(
            makeWord({ value: `__scope__${name.value}`, site: name.site }),
            value
        )
    }

    /**
     * @param {Word} name
     * @param {EvalEntity | Scope} value
     */
    set(name, value) {
        super.setInternal(name, value, false)
    }

    /**
     * @param {boolean} s
     */
    setStrict(s) {
        this._strict = s
    }

    /**
     * @returns {boolean}
     */
    isStrict() {
        return this._strict
    }

    /**
     * @param {Word} name
     * @returns {ModuleScope}
     */
    getModuleScope(name) {
        if (name.value.startsWith("__scope__")) {
            throw new Error("unexpected")
        }

        const maybeModuleScope = this.get(
            makeWord({ value: `__scope__${name.value}`, site: name.site })
        )

        if (maybeModuleScope instanceof ModuleScope) {
            return maybeModuleScope
        } else {
            throw new Error("expected ModuleScope")
        }
    }
}
