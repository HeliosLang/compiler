import { makeStringLiteral, strlit, symbol } from "@helios-lang/compiler-utils"
import { DataField } from "../statements/index.js"
import { ParseContext } from "./ParseContext.js"
import { anyName } from "./parseName.js"
import { parseTypeExpr } from "./parseTypeExpr.js"

/**
 * @import { Site, StringLiteral, TokenReader, Word } from "@helios-lang/compiler-utils"
 */

/**
 * @param {ParseContext} ctx
 * @param {boolean} allowEncodingKeys
 * @returns {DataField[]}
 */
export function parseDataFields(ctx, allowEncodingKeys = false) {
    const r = ctx.reader

    /**
     * @type {DataField[]}
     */
    const fields = []

    /**
     * @type {Map<string, StringLiteral>}
     */
    const encodingKeys = new Map()

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
     * @param {string} key
     */
    function assertUniqueEncodingKey(site, key) {
        if (encodingKeys.has(key)) {
            ctx.errors.syntax(site, `duplicate encoding-key '${key}'`)
        }
    }

    /**
     * @param {Word} fieldName
     * @returns {StringLiteral | undefined}
     */
    function getFieldEncodingKey(fieldName) {
        const fieldKey = encodingKeys.get(fieldName.value)

        if (fieldKey) {
            return fieldKey
        } else if (encodingKeys.size == 0) {
            return undefined
        } else if (encodingKeys.has(fieldName.value)) {
            ctx.errors.syntax(
                fieldName.site,
                `duplicate tag '${fieldName.value}' (created implicitly)`
            )
            return makeStringLiteral({
                value: fieldName.value,
                site: fieldName.site
            })
        }
    }

    while (!r.isEof()) {
        let m

        if ((m = r.matches(anyName, symbol(":")))) {
            const [name, colon] = m

            assertUniqueField(name)

            let typeReader = r.readUntil(anyName, symbol(":"))

            /* @type{string} */
            let encodingKey

            if ((m = typeReader.findLastMatch(strlit()))) {
                /**
                 * @satisfies {[TokenReader, StringLiteral]}
                 */
                const [before, tag] = m
                typeReader.end()
                typeReader = before

                if (!allowEncodingKeys) {
                    ctx.errors.syntax(
                        tag.site,
                        "encodingKey tag not valid in this context"
                    )
                } else {
                    assertUniqueEncodingKey(tag.site, tag.value)
                }
                encodingKey = tag.value
                encodingKeys.set(name.value, tag)
            } else {
                r.endMatch(false)

                if (encodingKeys.size > 0) {
                    assertUniqueEncodingKey(name.site, name.value)
                }
            }

            const typeExpr = parseTypeExpr(
                ctx.atSite(colon.site).withReader(typeReader)
            )
            fields.push(
                new DataField(name, typeExpr, getFieldEncodingKey(name))
            )
        } else {
            r.endMatch()
            r.end()
        }
    }

    return fields
}
