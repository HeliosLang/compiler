import { Expr } from "./Expr.js"
import { SwitchCase } from "./SwitchCase.js"
import { SwitchDefault } from "./SwitchDefault.js"
import { VoidExpr } from "./VoidExpr.js"
/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 */

/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
export class SwitchExpr extends Expr {
    /**
     * @type {Site}
     */
    dotSite

    /**
     * @private
     * @readonly
     * @type {Expr}
     */
    _controlExpr

    /**
     * @private
     * @readonly
     * @type {SwitchCase[]}
     */
    _cases

    /**
     * @private
     * @type {SwitchDefault | undefined}
     */
    _defaultCase

    /**
     * @param {Site} site
     * @param {Site} dotSite
     * @param {Expr} controlExpr - input value of the switch
     * @param {SwitchCase[]} cases
     * @param {SwitchDefault | undefined} defaultCase
     */
    constructor(site, dotSite, controlExpr, cases, defaultCase = undefined) {
        super(site)
        this.dotSite = dotSite
        this._controlExpr = controlExpr
        this._cases = cases
        this._defaultCase = defaultCase
    }

    get controlExpr() {
        return this._controlExpr
    }

    get cases() {
        return this._cases
    }

    /**
     * @type {SwitchDefault | undefined}
     */
    get defaultCase() {
        return this._defaultCase
    }

    /**
     * If there isn't enough coverage then we can simply set the default case to void, so the other branches can be error, print or assert
     */
    setDefaultCaseToVoid() {
        this._defaultCase = new SwitchDefault(
            this.site,
            new VoidExpr(this.site)
        )
    }

    toString() {
        return `${this._controlExpr.toString()}.switch{${this._cases.map((c) => c.toString()).join(", ")}${this._defaultCase ? ", " + this._defaultCase.toString() : ""}}`
    }
}
