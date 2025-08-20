import { makeTypeError, makeWord } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined, isDefined } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    AllType,
    AnyType,
    DataEntity,
    TupleType$,
    getTupleItemTypes
} from "../typecheck/index.js"
import { Expr } from "./Expr.js"
import { TypeRefExpr } from "./RefExpr.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * DestructExpr is for the lhs-side of assignments and for switch cases
 * `NameExpr [':' TypeExpr ['{' ... '}']]` or
 * `TypeExpr '{' ... '}'` or
 * `[NameExpr ':'] '(' ... ')'
 */
export class DestructExpr {
    /**
     * @readonly
     * @type {Site}
     */
    site

    /**
     * @readonly
     * @type {Word}
     */
    name

    /**
     * @readonly
     * @type {Expr | undefined}
     */
    typeExpr

    /**
     * @readonly
     * @type {DestructExpr[]}
     */
    destructExprs

    /**
     * @private
     * @readonly
     * @type {boolean}
     */
    _isTuple

    /**
     * @param {Site} site - can be a different location than name
     * @param {Word} name - use an underscore as a sink
     * @param {Expr | undefined} typeExpr
     * @param {DestructExpr[]} destructExprs
     * @param {boolean} isTuple typeExpr must be `null` if isTuple is `true` and `destructExpr.length` must be `> 0`
     */
    constructor(
        site,
        name,
        typeExpr = undefined,
        destructExprs = [],
        isTuple = false
    ) {
        this.site = site
        this.name = name
        this.typeExpr = typeExpr
        this.destructExprs = destructExprs
        this._isTuple = isTuple

        if (isTuple) {
            if (!(this.destructExprs.length > 0 && !this.typeExpr)) {
                throw new Error("unexpected")
            }
        } else {
            if (!this.typeExpr && this.destructExprs.length > 0) {
                throw new Error(`unexpected syntax: ${this.toString()}`)
            }
        }
    }

    /**
     * @type {DestructExpr[]}
     */
    get children() {
        return this.destructExprs
    }

    /**
     * @returns {boolean}
     */
    isTuple() {
        return this._isTuple
    }

    /**
     * @returns {boolean}
     */
    hasDestructExprs() {
        return this.destructExprs.length > 0
    }

    /**
     * @returns {boolean}
     */
    isIgnored() {
        return this.name.value.startsWith("_")
    }

    /**
     * @returns {boolean}
     */
    hasType() {
        return isDefined(this.typeExpr)
    }

    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type() {
        if (!this.typeExpr) {
            if (this._isTuple) {
                const nestedTypes = this.destructExprs.map((e) => e.type)

                if (!nestedTypes) {
                    throw makeTypeError(
                        this.site,
                        `invalid nested tuple in in destruct expression`
                    )
                }

                return TupleType$(nestedTypes)
            } else if (this.isIgnored()) {
                return new AllType()
            } else {
                return new AnyType()
            }
        } else {
            if (!this.typeExpr.cache?.asType) {
                throw makeTypeError(
                    this.typeExpr.site,
                    `invalid type '${expectDefined(this.typeExpr.cache, "cache unset").toString()}'`
                )
            } else {
                return this.typeExpr.cache.asType
            }
        }
    }

    /**
     * @type {Word}
     */
    get typeName() {
        if (!this.typeExpr) {
            return makeWord({ value: "", site: this.site })
        } else {
            return makeWord({
                value: this.typeExpr.toString(),
                site: this.typeExpr.site
            })
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        if (!this.typeExpr) {
            if (this.destructExprs.length > 0 && this._isTuple) {
                return `${this.name.toString()}: (${this.destructExprs.map((de) => de.toString()).join(", ")})`
            } else {
                return this.name.toString()
            }
        } else {
            let destructStr = ""

            if (this.destructExprs.length > 0) {
                destructStr = `{${this.destructExprs.map((de) => de.toString()).join(", ")}}`
            }

            if (this.isIgnored()) {
                return `${this.typeExpr.toString()}${destructStr}`
            } else {
                return `${this.name.toString()}: ${this.typeExpr.toString()}${destructStr}`
            }
        }
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {Type | undefined} upstreamType
     * @param {Type | undefined} downstreamType - could be enum variant
     * @param {boolean} castEnumVariantToParent - set to false in assignments where the full typeExpr information is needed
     * @returns {Type | undefined}
     */
    evalType(
        ctx,
        scope,
        upstreamType = undefined,
        downstreamType = undefined,
        castEnumVariantToParent = true
    ) {
        if (!this.typeExpr) {
            if (this._isTuple) {
                const upstreamItemTypes = upstreamType
                    ? getTupleItemTypes(upstreamType)
                    : undefined
                const downStreamItemTypes = downstreamType
                    ? getTupleItemTypes(downstreamType)
                    : undefined
                const nestedTypes = this.destructExprs.map((e, i) => {
                    const de = e.evalType(
                        ctx,
                        scope,
                        upstreamItemTypes ? upstreamItemTypes[i] : undefined,
                        downStreamItemTypes ? downStreamItemTypes[i] : undefined
                    )

                    if (!de) {
                        throw makeTypeError(
                            this.site,
                            `invalid nested tuple in in destruct expression`
                        )
                    }
                    return de
                })

                return TupleType$(nestedTypes)
            } else if (upstreamType) {
                return upstreamType
            } else if (this.isIgnored()) {
                return new AllType()
            } else {
                throw new Error("typeExpr not set")
            }
        } else if (
            // could be an implicit enum variant, which requires special treatment (evaluating the type directly would fail because it wouldn't find the variant name in the scope)
            this.typeExpr instanceof TypeRefExpr &&
            upstreamType &&
            !downstreamType &&
            this.typeExpr.name.value in upstreamType.typeMembers &&
            upstreamType.typeMembers[this.typeExpr.name.value].asEnumMemberType
        ) {
            const variant = expectDefined(
                upstreamType.typeMembers[this.typeExpr.name.value]
                    .asEnumMemberType
            )
            this.typeExpr.cache = variant
            return variant
        } else if (
            // could be the same implicit enum variant
            this.typeExpr instanceof TypeRefExpr &&
            upstreamType &&
            !downstreamType &&
            upstreamType.asEnumMemberType &&
            upstreamType.asEnumMemberType.name == this.typeExpr.name.value
        ) {
            this.typeExpr.cache = upstreamType
            return upstreamType
        } else {
            const t = downstreamType ?? this.typeExpr.evalAsType(ctx, scope)

            if (
                t &&
                upstreamType &&
                !upstreamType.asEnumMemberType &&
                t.asEnumMemberType &&
                castEnumVariantToParent
            ) {
                // this is important when used as the type against which the rhs is checked
                return t.asEnumMemberType.parentType
            } else {
                return t
            }
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {Type} upstreamType
     * @returns {void}
     */
    evalDestructExprs(ctx, scope, upstreamType) {
        if (this.destructExprs.length > 0) {
            if (this._isTuple) {
                const tupleItemTypes = getTupleItemTypes(upstreamType)

                if (!tupleItemTypes) {
                    ctx.errors.type(
                        this.site,
                        "upstream value isn't a tuple, can't destruct"
                    )
                    return
                }

                if (tupleItemTypes.length != this.destructExprs.length) {
                    ctx.errors.type(
                        this.site,
                        `wrong number of destruct tuple fields, expected ${tupleItemTypes.length}, got ${this.destructExprs.length}`
                    )
                    return
                }

                for (let i = 0; i < this.destructExprs.length; i++) {
                    this.destructExprs[i].evalInternal(
                        ctx,
                        scope,
                        tupleItemTypes[i],
                        i
                    )
                }
            } else {
                if (!upstreamType.asDataType) {
                    ctx.errors.type(this.site, "can't destruct a function")
                    return
                }

                const upstreamFieldNames = upstreamType.asDataType.fieldNames

                if (upstreamFieldNames.length != this.destructExprs.length) {
                    ctx.errors.type(
                        this.site,
                        `wrong number of destruct fields, expected ${upstreamFieldNames.length} (${upstreamType.toString()}), got ${this.destructExprs.length}`
                    )
                    return
                }

                for (let i = 0; i < this.destructExprs.length; i++) {
                    this.destructExprs[i].evalInternal(
                        ctx,
                        scope,
                        expectDefined(
                            upstreamType.instanceMembers[upstreamFieldNames[i]]
                                .asDataType
                        ), // we `asDataType` because methods can't be destructed
                        i
                    )
                }
            }
        }
    }

    /**
     * @private
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {Type} upstreamType
     * @param {number} i
     * @returns {void}
     */
    evalInternal(ctx, scope, upstreamType, i) {
        if (this.hasType()) {
            const t = this.evalType(ctx, scope, upstreamType, undefined, false)
            if (!t) {
                return
            }

            // differs from upstreamType because can be enum parent
            let checkType = t

            // if t is enum variant, get parent instead (exact variant is checked at runtime instead)
            if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
                checkType = t.asEnumMemberType.parentType
            }

            if (!checkType.isBaseOf(upstreamType)) {
                ctx.errors.type(
                    this.site,
                    `expected ${checkType.toString()} for destructure field ${i + 1}, got ${upstreamType.toString()}`
                )
                return
            }

            if (!this.isIgnored()) {
                // TODO: take into account ghost type parameters
                scope.set(this.name, t.toTyped())
            }

            this.evalDestructExprs(ctx, scope, t)
        } else {
            if (!this.isIgnored()) {
                // TODO: take into account ghost type parameters
                scope.set(this.name, upstreamType.toTyped())
            }

            this.evalDestructExprs(ctx, scope, upstreamType)
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {DataType[]} caseTypes
     */
    evalInSwitchCase(ctx, scope, caseTypes) {
        if (caseTypes.length != 1) {
            if (caseTypes.length != this.destructExprs.length) {
                throw new Error("unexpected")
            }

            caseTypes.forEach((caseType, i) => {
                this.destructExprs[i].evalInSwitchCase(ctx, scope, [caseType])
            })
        } else {
            const caseType = caseTypes[0]
            if (!this.isIgnored()) {
                scope.set(this.name, caseType.toTyped())
            }

            if (this.typeExpr) {
                this.typeExpr.cache = caseType
            }

            this.evalDestructExprs(ctx, scope, caseType)
        }
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @param {Type | undefined} upstreamType
     * @param {number} i
     */
    evalInAssignExpr(ctx, scope, upstreamType, i) {
        /**
         * @type {Type | undefined}
         */
        const t = this.evalType(ctx, scope, upstreamType, undefined, false)

        if (!t) {
            if (!this.isIgnored()) {
                scope.set(this.name, new DataEntity(new AnyType()))
            }
            return
        }

        // differs from upstreamType because can be enum parent
        // if t is enum variant, get parent instead (exact variant is checked at runtime instead)
        // also do this for nested as well
        const checkType = this.evalType(ctx, scope, upstreamType, t)

        if (checkType && upstreamType) {
            if (!checkType.isBaseOf(upstreamType)) {
                throw makeTypeError(
                    this.site,
                    `expected ${checkType.toString()} for rhs ${i + 1}, got ${upstreamType.toString()}`
                )
            }
        }

        if (!this.isIgnored()) {
            // TODO: take into account ghost type parameters
            scope.set(this.name, t.toTyped())
        }

        this.evalDestructExprs(ctx, scope, t)
    }

    /**
     * @param {number} argIndex
     * @returns {SourceMappedStringI}
     */
    toNameIR(argIndex) {
        if (this.isIgnored()) {
            return $(`__lhs_${argIndex}`)
        } else {
            return $(
                this.name.toString(),
                this.name.site.withDescription(this.name.value)
            )
        }
    }

    /**
     * @param {number} fieldIndex
     * @returns {string}
     */
    getFieldFn(fieldIndex) {
        const type = this.type

        if (type.asDataType) {
            return `${type.asDataType.path}__${type.asDataType.fieldNames[fieldIndex]}`
        } else {
            return ""
        }
    }

    /**
     * @private
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} inner
     * @param {string} objName
     * @param {number} fieldIndex
     * @param {string} fieldGetter
     * @returns {SourceMappedStringI}
     */
    wrapDestructIRInternal(ctx, inner, objName, fieldIndex, fieldGetter) {
        if (this.isIgnored() && this.destructExprs.length == 0) {
            return inner
        } else {
            const baseName = this.isIgnored()
                ? `${objName}_${fieldIndex}`
                : this.name.toString()

            for (let i = this.destructExprs.length - 1; i >= 0; i--) {
                const de = this.destructExprs[i]

                const innerGetter = this._isTuple
                    ? de.toNameIR(i).toString()
                    : `${this.getFieldFn(i)}(${baseName})`

                inner = de.wrapDestructIRInternal(
                    ctx.tab(),
                    inner,
                    baseName,
                    i,
                    innerGetter
                )
            }

            if (this._isTuple) {
                inner = $`${baseName}(
					(${$(this.destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`
            }

            let getter = fieldGetter

            const t = this.type

            // assert correct constructor index
            if (this.typeExpr && t && t.asEnumMemberType) {
                const constrIdx = t.asEnumMemberType.constrIndex

                getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`
            }

            return $([
                $("("),
                $(baseName, this.name.site),
                $(") "),
                $("->", this.site.withDescription("<destruct>")),
                $(` {\n${ctx.indent}${TAB}`),
                inner,
                $(`\n${ctx.indent}}(${getter})`)
            ])
        }
    }

    /**
     *
     * @param {ToIRContext} ctx
     * @param {SourceMappedStringI} inner - downstream IR expression
     * @param {number} argIndex
     * @returns {SourceMappedStringI}
     */
    wrapDestructIR(ctx, inner, argIndex) {
        if (this.destructExprs.length == 0) {
            return inner
        } else {
            /**
             * same as this.toNameIR()
             * TODO: can __lhs be changed to underscore?
             */
            const baseName = this.isIgnored()
                ? `__lhs_${argIndex}`
                : this.name.toString()

            for (let i = this.destructExprs.length - 1; i >= 0; i--) {
                const de = this.destructExprs[i]

                const getter = this._isTuple
                    ? de.toNameIR(i).toString()
                    : `${this.getFieldFn(i)}(${baseName})`

                inner = de.wrapDestructIRInternal(
                    ctx.tab(),
                    inner,
                    baseName,
                    i,
                    getter
                )
            }

            if (this._isTuple) {
                return $`${baseName}(
					(${$(this.destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`
            } else {
                return inner
            }
        }
    }

    /**
     * @returns {SourceMappedStringI}
     */
    toIR() {
        return $(this.name.toString(), this.name.site)
    }
}
