import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import { Expr } from "./Expr.js"
import { AllType, AnyEntity, AnyType, DataEntity } from "../typecheck/common.js"
import { AnyTypeClass } from "../typecheck/parametric.js"

/**
 * @import { Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").EvalEntity} EvalEntity
 */

/**
 * Simple reference class (i.e. using a Word)
 */
class RefExpr extends Expr {
    /**
     * @readonly
     * @type {Word}
     */
    name

    /**
     * @param {Word} name
     */
    constructor(name) {
        super(name.site)
        this.name = name
    }

    /**
     * @param {ToIRContext} _ctx
     * @returns {SourceMappedStringI}
     */
    toIR(_ctx) {
        const path = this.cache?.asNamed
            ? this.cache.asNamed.path
            : this.name.value

        return $(path, this.site)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.name.toString()
    }
}

export class ValueRefExpr extends RefExpr {
    /**
     * @param {import("../index.js").TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(ctx, scope) {
        const value = scope.get(this.name)

        if (value) {
            return value
        } else {
            return new DataEntity(new AnyType())
        }
    }
}

export class TypeRefExpr extends RefExpr {
    /**
     * @param {TypeCheckContext} _ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, scope) {
        const value = scope.get(this.name)

        if (value) {
            return value
        } else {
            return new AllType()
        }
    }
}

export class TypeClassRefExpr extends RefExpr {
    /**
     * @param {TypeCheckContext} _ctx
     * @param {Scope} scope
     * @returns {EvalEntity}
     */
    evalInternal(_ctx, scope) {
        const value = scope.get(this.name)

        if (value) {
            return value
        } else {
            return new AnyTypeClass()
        }
    }
}
