import {
    makeTokenReader,
    makeWord,
    anyWord,
    boollit,
    byteslit,
    group,
    intlit,
    oneOf,
    reallit,
    strlit,
    symbol,
    word
} from "@helios-lang/compiler-utils"
import {
    AnyValueExpr,
    CallArgExpr,
    CallExpr,
    DestructExpr,
    EnumSwitchExpr,
    Expr,
    IfElseExpr,
    ListLiteralExpr,
    MapLiteralExpr,
    MemberExpr,
    ParametricExpr,
    ParensExpr,
    PrimitiveLiteralExpr,
    TypeRefExpr,
    StructLiteralExpr,
    StructLiteralField,
    SwitchCase,
    SwitchDefault,
    ValuePathExpr,
    ValueRefExpr,
    VoidExpr
} from "../expressions/index.js"
import { ParseContext } from "./ParseContext.js"
import { makeFuncLiteralExprParser } from "./parseFuncLiteralExpr.js"
import { parseTypeExpr } from "./parseTypeExpr.js"
import { anyName } from "./parseName.js"
import { parseDestructExpr } from "./parseDestructExpr.js"

/**
 * @import { GenericGroup, Site, SymbolToken, Token, TokenReader, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("./ValueExprParser.js").ValueExprParser} ValueExprParser
 */

/**
 * @param {ValueExprParser} parseValueExpr
 * @returns {ValueExprParser}
 */
export function makeChainedExprParser(parseValueExpr) {
    const parseFuncLiteralExpr = makeFuncLiteralExprParser(parseValueExpr)

    /**
     * @param {ParseContext} ctx
     * @returns {Expr}
     */
    function parseChainedExpr(ctx) {
        const expr = parseChainStartExpr(ctx)

        return parseRemainingChainedExpr(ctx, expr)
    }

    /**
     * @param {ParseContext} ctx
     * @returns {Expr}
     */
    function parseChainStartExpr(ctx) {
        const r = ctx.reader

        let m

        if ((m = r.matches(group("("), symbol("->")))) {
            const [ag, arrow] = m

            return parseFuncLiteralExpr(ctx.atSite(arrow.site), ag)
        } else if (
            (m = r.matches(
                word("if"),
                group("(", { length: 1 }),
                group("{", { length: 1 })
            ))
        ) {
            const [kw, firstCond, firstBranch] = m

            return parseIfElseExpr(ctx, kw, firstCond, firstBranch)
        } else if (
            (m = r.matches(
                oneOf([intlit(), boollit(), reallit, strlit(), byteslit()])
            ))
        ) {
            return new PrimitiveLiteralExpr(m)
        } else if ((m = r.matches(group("(", { length: 0 })))) {
            return new VoidExpr(m.site)
        } else if ((m = r.matches(group("(", { minLength: 1 })))) {
            const fieldExprs = m.fields.map((f, i) =>
                parseValueExpr(ctx.inGroup(m, i), 0)
            )

            return new ParensExpr(m.site, fieldExprs)
        } else if (
            (m = r.findNextMatch(symbol("."), word("switch"), group("{")))
        ) {
            const [before, dot, kw, body] = m
            const beforeExpr = parseChainedExpr(ctx.withReader(before))

            return parseSwitchExpr(ctx, beforeExpr, dot, kw, body)
        } else if ((m = r.findNextMatch(group("{")))) {
            const [before, g] = m

            if ((m = before.matches(group("[", { length: 0 })))) {
                return parseListLiteralExpr(ctx.atSite(m.site), before, g)
            } else if (
                (m = before.matches(word("Map"), group("[", { length: 1 })))
            ) {
                const [kw, pg] = m
                return parseMapLiteralExpr(
                    ctx.atSite(kw.site),
                    pg.fields[0],
                    before,
                    g
                )
            } else {
                before.endMatch(false)

                return parseStructLiteralExpr(ctx.atSite(g.site), before, g)
            }
        } else if ((m = r.findLastMatch(symbol("::"), anyWord))) {
            const [before, dcolon, memberName] = m

            const typeExpr = parseTypeExpr(ctx.withReader(before))

            return new ValuePathExpr(dcolon.site, typeExpr, memberName)
        } else if ((m = r.matches(anyName))) {
            return new ValueRefExpr(m)
        } else {
            r.endMatch()

            return new AnyValueExpr(ctx.currentSite)
        }
    }

    /**
     *
     * @param {ParseContext} ctx
     * @param {Expr} expr
     */
    function parseRemainingChainedExpr(ctx, expr) {
        const r = ctx.reader

        while (!r.isEof()) {
            let m

            if ((m = r.matches(group("(")))) {
                expr = parseCallExpr(ctx.atSite(m.site), expr, m)
            } else if ((m = r.matches(group("[", { minLength: 1 })))) {
                expr = parseParametricValueExpr(ctx.atSite(m.site), expr, m)
            } else if (
                (m = r.matches(symbol("."), word("switch"), group("{")))
            ) {
                const [dot, kw, braces] = m

                expr = parseSwitchExpr(
                    ctx.atSite(kw.site),
                    expr,
                    dot,
                    kw,
                    braces
                )
            } else if ((m = r.matches(symbol("."), anyWord))) {
                const [dot, memberName] = m

                expr = new MemberExpr(dot.site, expr, memberName)
            } else {
                r.endMatch()

                r.end()
            }
        }

        return expr
    }

    /**
     * @param {ParseContext} ctx
     * @param {Expr} fnExpr
     * @param {GenericGroup<TokenReader>} argGroup
     * @returns {CallExpr}
     */
    function parseCallExpr(ctx, fnExpr, argGroup) {
        /**
         * @type {CallArgExpr[]}
         */
        const argExprs = argGroup.fields.map((f) => {
            let m

            /**
             * @type {Site}
             */
            let site = argGroup.site

            /**
             * @type {Word | undefined}
             */
            let argName = undefined

            if ((m = f.matches(anyName, symbol(":")))) {
                argName = m[0]
                site = m[1].site
            } else {
                f.endMatch(false)
            }

            const valueExpr = parseValueExpr(ctx.atSite(site).withReader(f), 0)

            return new CallArgExpr(site, argName, valueExpr)
        })

        return new CallExpr(ctx.currentSite, fnExpr, argExprs)
    }

    /**
     * @param {ParseContext} ctx
     * @param {Expr} baseExpr
     * @param {GenericGroup<TokenReader>} pg
     * @returns {ParametricExpr}
     */
    function parseParametricValueExpr(ctx, baseExpr, pg) {
        const typeExprs = pg.fields.map((f, i) =>
            parseTypeExpr(ctx.inGroup(pg, i))
        )

        return new ParametricExpr(ctx.currentSite, baseExpr, typeExprs)
    }

    /**
     * @param {ParseContext} ctx
     * @param {Word} keyword
     * @param {GenericGroup<TokenReader>} firstCond
     * @param {GenericGroup<TokenReader>} firstBranch
     * @returns {IfElseExpr}
     */
    function parseIfElseExpr(ctx, keyword, firstCond, firstBranch) {
        const r = ctx.reader

        const firstCondExpr = parseValueExpr(ctx.inGroup(firstCond), 0)
        const condExprs = [firstCondExpr]

        const firstBranchExpr = parseValueExpr(ctx.inGroup(firstBranch), 0)
        const branchExprs = [firstBranchExpr]

        let m

        while ((m = r.matches(word("else")))) {
            const kw = m

            if (
                (m = r.matches(
                    word("if"),
                    group("(", { length: 1 }),
                    group("{", { length: 1 })
                ))
            ) {
                const [_, cond, branch] = m
                condExprs.push(parseValueExpr(ctx.inGroup(cond), 0))

                branchExprs.push(parseValueExpr(ctx.inGroup(branch), 0))
            } else if ((m = r.matches(group("{")))) {
                branchExprs.push(parseValueExpr(ctx.inGroup(m), 0))
            } else {
                r.endMatch()
            }
        }

        r.endMatch(false)

        if (condExprs.length == branchExprs.length) {
            // add a final unit branch
            branchExprs.push(new VoidExpr(keyword.site))
        }

        if (condExprs.length != branchExprs.length - 1) {
            ctx.errors.syntax(keyword.site, "missing final else branch")
        }

        return new IfElseExpr(keyword.site, condExprs, branchExprs)
    }

    /**
     *
     * @param {ParseContext} ctx
     * @param {Expr} objExpr
     * @param {SymbolToken} dot
     * @param {Word} kw
     * @param {GenericGroup<TokenReader>} braces
     * @returns {EnumSwitchExpr}
     */
    function parseSwitchExpr(ctx, objExpr, dot, kw, braces) {
        /**
         * @type {SwitchCase[]}
         */
        const cases = []

        /**
         * @type {SwitchDefault | undefined}
         */
        let def = undefined

        braces.fields.forEach((f) => {
            let m

            if (
                (m = f.matches(oneOf([word("else"), word("_")]), symbol("=>")))
            ) {
                const [kw, darrow] = m

                if (def) {
                    ctx.errors.syntax(
                        kw.site,
                        "can't have more than 1 default switch case"
                    )
                }

                const bodyExpr = parseBracedValueExpr(
                    ctx.atSite(darrow.site).withReader(f)
                )

                def = new SwitchDefault(darrow.site, bodyExpr)
            } else if ((m = f.findNextMatch(symbol("=>")))) {
                const [before, darrow] = m

                let destructExpr = parseDestructExpr(
                    ctx.atSite(darrow.site).withReader(before),
                    2
                )

                const prevCase = cases[cases.length - 1]

                destructExpr = assertValidCaseLhs(
                    ctx,
                    destructExpr,
                    prevCase?.lhs
                )

                const bodyExpr = parseBracedValueExpr(
                    ctx.atSite(darrow.site).withReader(f)
                )
                const cs = new SwitchCase(darrow.site, destructExpr, bodyExpr)

                cases.push(cs)
            } else {
                f.endMatch()
                ctx.errors.syntax(braces.site, "missing '=>'")
            }
        })

        return new EnumSwitchExpr(kw.site, dot.site, objExpr, cases, def)
    }

    /**
     * @param {number} n
     * @param {Site} site
     * @returns {DestructExpr[]}
     */
    function createDummyDestructExprs(n, site) {
        /**
         * @type {DestructExpr[]}
         */
        const additional = []

        for (let i = 0; i < n; i++) {
            additional.push(
                new DestructExpr(site, makeWord({ value: "_", site }))
            )
        }

        return additional
    }

    /**
     * @param {ParseContext} ctx
     * @param {DestructExpr} destructExpr
     * @param {DestructExpr | undefined} prevDestructExpr
     * @returns {DestructExpr} - can return a modified destructexpr in order to accomodate errors
     */
    function assertValidCaseLhs(ctx, destructExpr, prevDestructExpr) {
        if (destructExpr.isTuple()) {
            if (!destructExpr.isIgnored()) {
                ctx.errors.syntax(destructExpr.site, "invalid syntax")
                destructExpr = new DestructExpr(
                    destructExpr.site,
                    makeWord({ value: "_", site: destructExpr.name.site }),
                    destructExpr.typeExpr,
                    destructExpr.destructExprs,
                    true
                )
            }

            destructExpr.destructExprs.forEach((destructExpr) => {
                if (destructExpr.typeExpr) {
                    if (!(destructExpr.typeExpr instanceof TypeRefExpr)) {
                        ctx.errors.syntax(
                            destructExpr.typeExpr.site,
                            "invalid case name syntax"
                        )
                    }
                } else if (!destructExpr.isIgnored()) {
                    ctx.errors.syntax(destructExpr.site, "missing case name")
                }
            })

            if (prevDestructExpr) {
                if (!prevDestructExpr.isTuple()) {
                    ctx.errors.syntax(
                        destructExpr.site,
                        "inconsistent switch case condition"
                    )
                    destructExpr = destructExpr.destructExprs[0]
                } else {
                    const nDiff =
                        prevDestructExpr.destructExprs.length -
                        destructExpr.destructExprs.length
                    if (nDiff < 0) {
                        ctx.errors.syntax(
                            destructExpr.site,
                            "inconsistent switch case condition"
                        )
                        destructExpr = new DestructExpr(
                            destructExpr.site,
                            destructExpr.name,
                            undefined,
                            destructExpr.destructExprs.slice(
                                0,
                                prevDestructExpr.destructExprs.length
                            ),
                            true
                        )
                    } else if (nDiff) {
                        ctx.errors.syntax(
                            destructExpr.site,
                            "inconsistent switch case condition"
                        )
                        destructExpr = new DestructExpr(
                            destructExpr.site,
                            destructExpr.name,
                            undefined,
                            destructExpr.destructExprs.concat(
                                createDummyDestructExprs(
                                    nDiff,
                                    destructExpr.site
                                )
                            ),
                            true
                        )
                    }
                }
            }
        } else {
            if (destructExpr.typeExpr) {
                if (!(destructExpr.typeExpr instanceof TypeRefExpr)) {
                    ctx.errors.syntax(
                        destructExpr.typeExpr.site,
                        "invalid case name syntax"
                    )
                }
            } else {
                ctx.errors.syntax(destructExpr.site, "missing case name")
            }

            if (prevDestructExpr && prevDestructExpr.isTuple()) {
                ctx.errors.syntax(
                    destructExpr.site,
                    "inconsistent switch case condition"
                )
                const nDiff = prevDestructExpr.destructExprs.length - 1
                destructExpr = new DestructExpr(
                    destructExpr.site,
                    makeWord({ value: "_", site: destructExpr.name.site }),
                    undefined,
                    [destructExpr].concat(
                        createDummyDestructExprs(nDiff, destructExpr.site)
                    ),
                    true
                )
            }
        }

        return destructExpr
    }

    /**
     * @param {ParseContext} ctx
     * @returns {Expr}
     */
    function parseBracedValueExpr(ctx) {
        const r = ctx.reader

        let m

        if ((m = r.matches(group("{")))) {
            r.end()

            return parseValueExpr(ctx.inGroup(m), 0)
        } else {
            r.endMatch(false)

            return parseValueExpr(ctx, 0)
        }
    }

    /**
     *
     * @param {ParseContext} ctx
     * @param {TokenReader} itemTypeReader
     * @param {GenericGroup<TokenReader>} braces
     * @returns {ListLiteralExpr}
     */
    function parseListLiteralExpr(ctx, itemTypeReader, braces) {
        const itemTypeTokens = itemTypeReader.rest
        const itemTypeExpr = parseTypeExpr(ctx.withReader(itemTypeReader))

        const itemExprs = braces.fields.map((f) => {
            return parseInferrableItem(
                ctx.atSite(braces.site),
                itemTypeTokens,
                f
            )
        })

        return new ListLiteralExpr(ctx.currentSite, itemTypeExpr, itemExprs)
    }

    /**
     * @param {ParseContext} ctx
     * @param {Token[]} itemTypeTokens
     * @param {TokenReader} itemReader
     * @returns {Expr}
     */
    function parseInferrableItem(ctx, itemTypeTokens, itemReader) {
        if (itemReader.matches(group("{"))) {
            // TODO: this is ugly, find a better approach
            const readerWithItemTypeTokens = makeTokenReader({
                tokens: itemTypeTokens.concat(itemReader.tokens),
                errors: ctx.errors,
                ignoreNewlines: true
            })

            return parseValueExpr(ctx.withReader(readerWithItemTypeTokens), 0)
        } else {
            itemReader.endMatch(false)

            return parseValueExpr(ctx.withReader(itemReader), 0)
        }
    }

    /**
     * @param {ParseContext} ctx
     * @param {TokenReader} keyTypeReader
     * @param {TokenReader} valueTypeReader
     * @param {GenericGroup<TokenReader>} braces
     * @returns {MapLiteralExpr}
     */
    function parseMapLiteralExpr(ctx, keyTypeReader, valueTypeReader, braces) {
        const keyTypeTokens = keyTypeReader.rest
        const keyTypeExpr = parseTypeExpr(ctx.withReader(keyTypeReader))

        const valueTypeTokens = valueTypeReader.rest
        const valueTypeExpr = parseTypeExpr(ctx.withReader(valueTypeReader))

        /**
         * @type {[Expr, Expr][]}
         */
        const pairs = braces.fields.reduce((pairs, f) => {
            let m

            if ((m = f.findNextMatch(symbol(":")))) {
                const [before, colon] = m

                /**
                 * @type {Expr}
                 */
                let keyExpr = new AnyValueExpr(colon.site)

                /**
                 * @type {Expr}
                 */
                let valueExpr = new AnyValueExpr(colon.site)

                if (before.isEof()) {
                    ctx.errors.syntax(
                        colon.site,
                        "expected expression before ':'"
                    )
                } else {
                    keyExpr = parseInferrableItem(
                        ctx.atSite(braces.site),
                        keyTypeTokens,
                        before
                    )
                }

                if (f.isEof()) {
                    ctx.errors.syntax(
                        colon.site,
                        "expected expression after ':'"
                    )
                } else {
                    valueExpr = parseInferrableItem(
                        ctx.atSite(braces.site),
                        valueTypeTokens,
                        f
                    )
                }

                pairs.push([keyExpr, valueExpr])
            } else {
                ctx.errors.syntax(braces.site, "expected ':' in every field")
            }

            return pairs
        }, /** @type {[Expr, Expr][]} */ ([]))

        return new MapLiteralExpr(
            ctx.currentSite,
            keyTypeExpr,
            valueTypeExpr,
            pairs
        )
    }

    /**
     * @param {ParseContext} ctx
     * @param {TokenReader} typeReader
     * @param {GenericGroup<TokenReader>} braces
     */
    function parseStructLiteralExpr(ctx, typeReader, braces) {
        const typeExpr = parseTypeExpr(ctx.withReader(typeReader))

        const fields = braces.fields.map((f) => {
            let m

            /**
             * @type {Word | undefined}
             */
            let fieldName = undefined

            /**
             * @type {Expr}
             */
            let valueExpr = new AnyValueExpr(ctx.currentSite)

            if ((m = f.matches(anyWord, symbol(":")))) {
                fieldName = m[0]
                const colon = m[1]

                ctx = ctx.atSite(colon.site)
            } else {
                f.endMatch(false)
            }

            if (f.isEof()) {
                ctx.errors.syntax(
                    ctx.currentSite,
                    "expected expression after ':'"
                )
            } else {
                valueExpr = parseValueExpr(ctx.withReader(f), 0)
            }

            return new StructLiteralField(fieldName, valueExpr)
        })

        return new StructLiteralExpr(typeExpr, fields)
    }

    return parseChainedExpr
}
