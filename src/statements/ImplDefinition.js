import { ToIRContext } from "../codegen/ToIRContext.js"
import { Expr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { ConstStatement } from "./ConstStatement.js"
import { FuncStatement } from "./FuncStatement.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").InstanceMembers} InstanceMembers
 * @typedef {import("../typecheck/index.js").TypeMembers} TypeMembers
 */

/**
 * Impl statements, which add functions and constants to registry of user types (Struct, Enum Member and Enums)
 */
export class ImplDefinition {
    /**
     * @readonly
     * @type {(FuncStatement | ConstStatement)[]}
     */
    statements

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _selfTypeExpr

    /**
     * @param {Expr} selfTypeExpr;
     * @param {(FuncStatement | ConstStatement)[]} statements
     */
    constructor(selfTypeExpr, statements) {
        this._selfTypeExpr = selfTypeExpr
        this.statements = statements
    }

    /**
     * @type {Site}
     */
    get site() {
        return this._selfTypeExpr.site
    }

    /**
     * @param {string} basePath
     */
    setBasePath(basePath) {
        for (let s of this.statements) {
            s.setBasePath(basePath)
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.statements.map((s) => s.toString()).join("\n")}`
    }

    /**
     * @param {Scope} scope
     * @returns {TypeMembers}
     */
    genTypeMembers(scope) {
        /**
         * @type {TypeMembers}
         */
        const typeMembers = {}

        for (let s of this.statements) {
            if (s instanceof ConstStatement) {
                const s_ = s.evalType(scope)
                if (s_) {
                    typeMembers[s.name.value] = s_.toTyped()
                }
            } else if (!FuncStatement.isMethod(s)) {
                const s_ = s.evalType(scope)

                if (s_) {
                    typeMembers[s.name.value] = s_
                }
            }
        }

        return typeMembers
    }

    /**
     * Doesn't add the common types
     * @param {Scope} scope
     * @returns {InstanceMembers}
     */
    genInstanceMembers(scope) {
        /**
         * @type {InstanceMembers}
         */
        const instanceMembers = {}

        for (let s of this.statements) {
            if (FuncStatement.isMethod(s)) {
                const s_ = s.evalType(scope)

                if (s_) {
                    instanceMembers[s.name.value] = s_
                }
            }
        }

        return instanceMembers
    }

    /**
     * @param {Scope} scope
     */
    eval(scope) {
        void this._selfTypeExpr.eval(scope)

        for (let s of this.statements) {
            if (s instanceof FuncStatement) {
                void s.evalInternal(scope, true)
            } else {
                void s.evalInternal(scope)
            }
        }
    }

    /**
     * Returns IR of all impl members
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        for (let s of this.statements) {
            s.toIR(ctx, map)
        }
    }
}
