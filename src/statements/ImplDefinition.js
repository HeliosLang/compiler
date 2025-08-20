import { makeErrorCollector } from "@helios-lang/compiler-utils"
import { ToIRContext } from "../codegen/ToIRContext.js"
import { Expr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import { ConstStatement } from "./ConstStatement.js"
import { FuncStatement } from "./FuncStatement.js"

/**
 * @import { Site } from "@helios-lang/compiler-utils"
 * @import { Definitions, TypeCheckContext } from "../index.js"
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
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {TypeMembers}
     */
    genTypeMembers(ctx, scope) {
        /**
         * @type {TypeMembers}
         */
        const typeMembers = {}

        for (let s of this.statements) {
            if (s instanceof ConstStatement) {
                const s_ = s.evalType(ctx, scope)
                if (s_) {
                    typeMembers[s.name.value] = s_.toTyped()
                }
            } else if (!FuncStatement.isMethod(s)) {
                const s_ = s.evalType(ctx, scope)

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
                const s_ = s.evalType(
                    { errors: scope.errorCollector ?? makeErrorCollector() },
                    scope
                )

                if (s_) {
                    instanceMembers[s.name.value] = s_
                }
            }
        }

        return instanceMembers
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     */
    eval(ctx, scope) {
        void this._selfTypeExpr.eval(ctx, scope)

        for (let s of this.statements) {
            if (s instanceof FuncStatement) {
                void s.evalInternal(ctx, scope, true)
            } else {
                void s.evalInternal(ctx, scope)
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
