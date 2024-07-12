import {
    StringLiteral,
    Word,
    strlit,
    symbol
} from "@helios-lang/compiler-utils"
import { None } from "@helios-lang/type-utils"
import { DataField } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"
import { parseTypeExpr } from "./parseTypeExpr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 */

/**
 * @param {ParseContext} ctx
 * @param {boolean} allowTags
 * @returns {DataField[]}
 */
export function parseDataFields(ctx, allowTags = false) {
    const r = ctx.reader

    /**
     * @type {DataField[]}
     */
    const fields = []

    /**
     * @type {Map<string, StringLiteral>}
     */
    const tags = new Map()

    /**
     * @param {Word} fieldName
     */
    function assertUniqueField(fieldName) {
        if (
            fields.findIndex(
                (f) => f.name.toString() == fieldName.toString()
            ) != -1
        ) {
            ctx.errors.syntax(
                fieldName.site,
                `duplicate field \'${fieldName.toString()}\'`
            )
        }
    }

    /**
     * @param {Site} site
     * @param {string} tag
     */
    function assertUniqueTag(site, tag) {
        if (tags.has(tag)) {
            ctx.errors.syntax(site, `duplicate tag '${tag}'`)
        }
    }

    /**
     * @param {Word} fieldName
     * @returns {Option<StringLiteral>}
     */
    function getTag(fieldName) {
        const tag = tags.get(fieldName.value)

        if (tag) {
            return tag
        } else if (tags.size == 0) {
            return None
        } else if (tags.has(fieldName.value)) {
            ctx.errors.syntax(
                fieldName.site,
                `duplicate tag '${fieldName.value}' (created implicitly)`
            )
            return new StringLiteral(fieldName.value, fieldName.site)
        }
    }

    while (!r.isEof()) {
        let m

        if ((m = r.matches(anyName, symbol(":")))) {
            const [name, colon] = m

            assertUniqueField(name)

            let typeReader = r.readUntil(anyName, symbol(":"))

            if ((m = typeReader.findLastMatch(strlit()))) {
                const [before, tag] = m
                typeReader.end()
                typeReader = before

                if (!allowTags) {
                    ctx.errors.syntax(tag.site, "unexpected tag")
                } else {
                    assertUniqueTag(tag.site, tag.value)
                }

                tags.set(name.value, tag.value)
            } else {
                r.endMatch(false)

                if (tags.size > 0) {
                    assertUniqueTag(name.site, name.value)
                }
            }

            const typeExpr = parseTypeExpr(
                ctx.atSite(colon.site).withReader(typeReader)
            )

            fields.push(new DataField(name, typeExpr, getTag(name)))
        } else {
            r.endMatch()
            r.end()
        }
    }

    return fields
}
