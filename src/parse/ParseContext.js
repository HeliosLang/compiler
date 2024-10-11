import { Group, StringLiteral } from "@helios-lang/compiler-utils"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("@helios-lang/compiler-utils").ErrorCollectorI} ErrorCollectorI
 * @typedef {import("@helios-lang/compiler-utils").TokenReaderI} TokenReaderI
 */

/**
 * @typedef {(path: StringLiteral) => Option<string>} ImportPathTranslator
 */

/**
 * @typedef {{
 *   currentSite?: Site
 *   importPathTranslator?: Option<ImportPathTranslator>
 * }} ParseContextOptions
 */

export class ParseContext {
    /**
     * @readonly
     * @type {TokenReaderI}
     */
    reader

    /**
     * @readonly
     * @type {Site}
     */
    currentSite

    /**
     * @readonly
     * @type {Option<ImportPathTranslator>}
     */
    importPathTranslator

    /**
     * @param {TokenReaderI} reader
     * @param {ParseContextOptions} options
     */
    constructor(reader, options = {}) {
        this.reader = reader
        this.currentSite = options.currentSite ?? reader.tokens[0].site
        this.importPathTranslator = options.importPathTranslator
    }

    /**
     * @type {ErrorCollectorI}
     */
    get errors() {
        return this.reader.errors
    }

    /**
     * @param {Site} site
     * @returns {ParseContext}
     */
    atSite(site) {
        return new ParseContext(this.reader, {
            currentSite: site,
            importPathTranslator: this.importPathTranslator
        })
    }

    /**
     * @param {Group<TokenReaderI>} group
     * @param {number} fieldIndex
     * @returns {ParseContext}
     */
    inGroup(group, fieldIndex = 0) {
        return this.atSite(group.site).withReader(group.fields[fieldIndex])
    }

    /**
     * @param {TokenReaderI} r
     * @returns {ParseContext}
     */
    withReader(r) {
        return new ParseContext(r, {
            currentSite: this.currentSite,
            importPathTranslator: this.importPathTranslator
        })
    }
}
