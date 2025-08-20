import { bytesToHex, encodeUtf8 } from "@helios-lang/codec-utils"
import { makeWord } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { FuncArg, StructLiteralExpr } from "../expressions/index.js"
import { Scope } from "../scopes/index.js"
import {
    ArgType,
    FuncType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "../typecheck/index.js"
import { DataField } from "./DataField.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { SourceMappedStringI } from "@helios-lang/ir"
 * @import { Definitions, TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").InstanceMembers} InstanceMembers
 * @typedef {import("../typecheck/index.js").FieldTypeSchema} FieldTypeSchema
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").TypeMembers} TypeMembers
 */

/**
 * Base class for struct and enum member
 * @internal
 */
export class DataDefinition {
    /**
     * @private
     * @readonly
     * @type {Site}
     */
    _site

    /**
     * @private
     * @readonly
     * @type {Word}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {DataField[]}
     */
    _fields

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {DataField[]} fields
     */
    constructor(site, name, fields) {
        this._site = site
        this._name = name
        this._fields = fields
    }

    /**
     * @type {Site}
     */
    get site() {
        return this._site
    }

    /**
     * @type {Word}
     */
    get name() {
        return this._name
    }

    /**
     * @type {DataField[]}
     */
    get fields() {
        return this._fields.slice()
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this._fields.map((f) => f.name.value)
    }

    isMappedStruct() {
        return this._fields.some((f) => f.hasEncodingKey())
    }

    /**
     * Returns index of a field.
     * Returns -1 if not found.
     * @param {Word} name
     * @returns {number}
     */
    findField(name) {
        let found = -1
        let i = 0
        for (let f of this._fields) {
            if (f.name.toString() == name.toString()) {
                found = i
                break
            }
            i++
        }

        return found
    }

    /**
     * @param {Word} name
     * @returns {boolean}
     */
    hasField(name) {
        return this.findField(name) != -1
    }

    /**
     * @param {Word} name
     * @returns {boolean}
     */
    hasMember(name) {
        return this.hasField(name) || name.value == "copy"
    }

    /**
     * @returns {string}
     */
    toStringFields() {
        return `{${this._fields.map((f) => f.toString()).join(", ")}}`
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.name.toString()} ${this.toStringFields()}`
    }

    /**
     * @param {TypeCheckContext} ctx
     * @param {Scope} scope
     * @returns {InstanceMembers}
     */
    evalFieldTypes(ctx, scope) {
        /**
         * @type {InstanceMembers}
         */
        const fields = {}

        for (let f of this._fields) {
            const f_ = f.eval(ctx, scope)

            if (f_) {
                fields[f.name.value] = f_
            }
        }

        return fields
    }

    /**
     * @param {Type} self
     * @returns {Type}
     */
    genCopyType(self) {
        return new FuncType(
            this._fields.map((f) => new ArgType(f.name, f.type, true)),
            self
        )
    }

    /**
     * @type {number}
     */
    get nFields() {
        return this._fields.length
    }

    /**
     * @param {number} i
     * @returns {DataType}
     */
    getFieldType(i) {
        return this._fields[i].type
    }

    /**
     * @param {string} name
     * @returns {number}
     */
    getFieldIndex(name) {
        const i = this.findField(makeWord({ value: name }))

        if (i == -1) {
            throw new Error(`field ${name} not find in ${this.toString()}`)
        } else {
            return i
        }
    }

    /**
     * @param {number} i
     * @returns {string}
     */
    getFieldName(i) {
        return this._fields[i].name.toString()
    }

    /**
     * Gets insance member value.
     * @param {Type} self
     * @returns {InstanceMembers}
     */
    genInstanceMembers(self) {
        const members = {
            ...genCommonInstanceMembers(self),
            copy: new FuncType(
                this._fields.map((f) => new ArgType(f.name, f.type, true)),
                self
            )
        }

        for (let f of this.fields) {
            members[f.name.value] = f.type
        }

        return members
    }

    /**
     * @param {Type} self
     * @returns {TypeMembers}
     */
    genTypeMembers(self) {
        return {
            ...genCommonTypeMembers(self)
        }
    }

    /**
     * @param {Set<string>} parents
     * @returns {(FieldTypeSchema)[]}
     */
    fieldsToSchema(parents) {
        /**
         * @type {FieldTypeSchema[]}
         */
        const fieldSchemas = []

        this._fields.forEach((f) => {
            // change to encodingKey
            const externalName = f.name.value
            const encodingKey =
                (f.hasEncodingKey() && f.encodedFieldName) || null

            const ts = expectDefined(f.type.toSchema(parents))
            fieldSchemas.push({
                name: externalName,
                type: ts,
                ...(encodingKey
                    ? {
                          // schemas use shorter key name to a) be concise in that context
                          //  ... and b) add distinction for that separate context
                          key: encodingKey
                      }
                    : {})
                // ...  alt location for the comment?
            })
        })

        return fieldSchemas
    }

    /**
     * @param {ToIRContext} ctx
     * @param {string} path
     * @param {Definitions} map
     * @param {number} constrIndex
     */
    toIR_new(ctx, path, map, constrIndex) {
        const isConstr = constrIndex != -1

        /**
         * @type {SourceMappedStringI}
         */
        let ir

        if (this.isMappedStruct()) {
            ir = $`__core__mkNilPairData(())`

            for (let i = this.nFields - 1; i >= 0; i--) {
                const f = this._fields[i]

                ir = $`__core__mkCons(
					__core__mkPairData(
						__core__bData(#${bytesToHex(encodeUtf8(f.encodedFieldName))}),
						${f.type.path}____to_data(${f.name.value})
					),
					${ir}
				)`
            }

            ir = $`(${$(this._fields.map((f) => $(f.name.value))).join(", ")}) -> {
                __core__mapData(${ir})
            }`
        } else if (this.nFields == 1) {
            if (isConstr) {
                ir = $(
                    `(self) -> {
					__core__constrData(${constrIndex}, __helios__common__list_1(${this.getFieldType(0).path}____to_data(self)))
				}`,
                    this.site
                )
            } else {
                ir = $`__helios__common__identity`
            }
        } else {
            ir = $`__core__mkNilData(())`

            for (let i = this.nFields - 1; i >= 0; i--) {
                const f = this._fields[i]

                ir = $`__core__mkCons(${f.type.path}____to_data(${f.name.value}), ${ir})`
            }

            if (isConstr) {
                ir = $`__core__constrData(${constrIndex}, ${ir})`
            }

            ir = $`(${$(this._fields.map((f) => $(f.name.value))).join(", ")}) -> {${ir}}`
        }

        const key = `${path}____new`

        map.set(key, { content: ir })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {string} path
     * @param {Definitions} map
     * @param {string[]} getterNames
     * @param {number} constrIndex
     */
    toIR_copy(ctx, path, map, getterNames, constrIndex = -1) {
        const key = `${path}__copy`

        let ir = StructLiteralExpr.toIRInternal(
            ctx,
            this.site,
            path,
            this._fields.map((df) => $(df.name.value))
        )

        // wrap with defaults

        for (let i = getterNames.length - 1; i >= 0; i--) {
            const fieldName = this._fields[i].name.toString()

            ir = FuncArg.wrapWithDefaultInternal(
                ir,
                fieldName,
                $`${getterNames[i]}(self)`
            )
        }

        const args = $(
            this._fields.map((f) =>
                $([
                    $(`__useopt__${f.name.toString()}`),
                    $(", "),
                    $(`${f.name.toString()}`)
                ])
            )
        ).join(", ")

        ir = $`(self) -> {
			(${args}) -> {
				${ir}
			}
		}`

        map.set(key, { content: ir })
    }

    /**
     * @param {string} baseName
     * @param {boolean} isEnumMember
     * @returns {SourceMappedStringI}
     */
    toIR_show(baseName, isEnumMember = false) {
        if (this.isMappedStruct()) {
            if (isEnumMember) {
                throw new Error("unexpected")
            }

            let ir = $`""`

            for (let i = 0; i < this.nFields; i++) {
                const f = this._fields[i]
                const p = f.type.path

                ir = $`__core__appendString(
					${ir},
					__core__appendString(
						"${i > 0 ? "," : ""}${f.name.value}:",
						option = __helios__common__mStruct_field_safe(self, #${bytesToHex(encodeUtf8(f.encodedFieldName))});
                        option_pair = __core__unConstrData__safe(option);
                        option_tag = __core__fstPair(option_pair);
                        __core__ifThenElse(
                            __core__equalsInteger(option_tag, 1),
                            () -> {
                                "<n/a>"
                            },
                            () -> {
                                option_value = __core__sndPair(option_pair);
                                inner_option = ${p}__from_data_safe(option_value);
                                inner_option(
                                    (valid, value) -> {
                                        __core__ifThenElse(
                                            valid,
                                            () -> {
                                                ${p}__show(value)()
                                            },
                                            () -> {
                                                "<n/a>"
                                            }
                                        )()
                                    }
                                )
                            }
                        )()
					)
				)`
            }

            return $`(self) -> {
                () -> {
                    __core__appendString(
                        "{",
                        __core__appendString(
                            ${ir},
                            "}"
                        )
                    )
                }
            }`
        } else if (this.nFields == 1 && !isEnumMember) {
            return $`${this._fields[0].type.path}__show`
        } else {
            let ir = $`(fields) -> {""}`

            for (let i = this.nFields - 1; i >= 0; i--) {
                const f = this._fields[i]
                const p = f.type.path

                ir = $`(fields) -> {
					__core__chooseList(
						fields,
						() -> {""},
						() -> {
							__core__appendString(
								${i > 0 ? `", ${f.name}: "` : `"${f.name}: "`},
								__core__appendString(
									(opt) -> {
										opt(
											(valid, value) -> {
												__core__ifThenElse(
													valid,
													() -> {
														${p}__show(value)()
													},
													() -> {
														"<n/a>"
													}
												)()
											}
										)
									}(${p}__from_data_safe(__core__headList__safe(fields))),
									${ir}(__core__tailList__safe(fields))
								)
							)
						}
					)()
				}`
            }

            return $`(self) -> {
				() -> {
					__core__appendString(
						"${baseName}{",
						__core__appendString(
							${ir}(self),
							"}"
						)
					)
				}
			}`
        }
    }

    /**
     * @param {boolean} argIsConstrFields - true in case of sndPair(unConstrData(...)) call for enum variant
     * @returns {SourceMappedStringI}
     */
    toIR_is_valid_data(argIsConstrFields = false) {
        if (this.isMappedStruct()) {
            const fields = this._fields

            const mStructName = this._name.value
            let ir = $`true`

            fields.forEach((f, i) => {
                ir = $`__core__ifThenElse(
						__helios__common__test_mStruct_field(
							data,
							__core__bData(#${bytesToHex(encodeUtf8(f.encodedFieldName))}),
							${f.type.path}__is_valid_data	
						),
						() -> {
							${ir}
						},
						() -> {
                            __core__trace("Warning: invalid data in ${mStructName}.${f.encodedFieldName}", 
                                () -> { 
                                    false 
                                }
                            )()
						}
					)()`
            })

            return $`(data) -> { 
                ${ir}
            }`
        } else if (this.nFields == 1 && !argIsConstrFields) {
            return $`${this._fields[0].type.path}__is_valid_data`
        } else {
            const reversedFields = this._fields.slice().reverse()

            let ir = $`(fields) -> {
				__core__chooseList(
					fields,
					true,
					false
				)
			}`

            reversedFields.forEach((f) => {
                ir = $`(fields) -> {
					__core__chooseList(
						fields,
						() -> {
							false
						},
						() -> {
							(head) -> {
								__core__ifThenElse(
									${f.type.path}__is_valid_data(head),
									() -> {${ir}(__core__tailList__safe(fields))},
									() -> {false}
								)()
							}(__core__headList__safe(fields))
						}
					)()
				}`
            })

            return $`(data) -> {
				__core__chooseData(
					data,
					() -> {false},
					() -> {false},
					() -> {
						${ir}(__core__unListData__safe(data))
					},
					() -> {false},
					() -> {false}
				)()
			}`
        }
    }

    /**
     * @param {Site} site
     * @returns {SourceMappedStringI}
     */
    toIR_mStructEq(site) {
        // the expected fields must exist in both
        let irInner = $`true`

        // same as reversing the fields:
        const n = this._fields.length - 1
        for (let i = 0; i < this._fields.length; i++) {
            const f = this._fields[n - i]
            // builds the innermost field comparison from the LAST field,
            // so the outermost is likely to be the cheapest to find, given
            // the fields are stored in the same order they're defined in the struct.
            irInner = $`__core__ifThenElse(
                __core__equalsData(
                    __helios__common__mStruct_field_internal(aFields, #${bytesToHex(encodeUtf8(f.encodedFieldName))}),
                    __helios__common__mStruct_field_internal(bFields, #${bytesToHex(encodeUtf8(f.encodedFieldName))})
                ),
                () -> {${irInner}},
                () -> {false}
            )()`
        }

        let irOuter = $(
            `(a, b) -> {
            aFields = __core__unMapData(a);
            bFields = __core__unMapData(b);

            ${irInner}
        }`,
            site
        )

        return irOuter
    }

    /**
     * @param {string} path
     * @returns {SourceMappedStringI}
     */
    toIR_from_data_fields(path) {
        if (this.isMappedStruct()) {
            //let ir = IR.new`(data) -> {__core__mkNilPairData(())}`;

            let ir = $`(data) -> {
				(ignore) -> {
					data
				}(
					__core__ifThenElse(
						${path}__is_valid_data(data),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`
            /*for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this._fields[i]
				const ftPath = f.type.path;

				ir = IR.new`(data) -> {
					__core__mkCons(
						__core__mkPairData(
							__core__bData(#${bytesToHex(textToBytes(f.tag))}),
							${ftPath}____to_data(
								${ftPath}__from_data(
									__helios__common__mStruct_field(
										data, 
										#${bytesToHex(textToBytes(f.tag))}
									)
								)
							)
						),
						${ir}(data)
					)
				}`;
			}

			ir = IR.new`(data) -> {
				__core__constrData(
					0, 
					__core__mkCons(
						__core__mapData(${ir}(data)),
						__core__mkCons(
							__core__iData(1),
							__core__mkNilData(())
						)
					)
				)
			}`;*/

            return ir
        } else {
            let ir = $`(fields) -> {
				(ignore) -> {
					fields
				}(
					__core__ifThenElse(
						${path}__is_valid_data(__core__listData(fields)),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`

            return ir

            /*let ir = IR.new`(fields) -> {__core__mkNilData(())}`;

			for (let i = this.nFields - 1; i >= 0; i--) {
				const ftPath = this.getFieldType(i).path;

				ir = IR.new`(fields) -> {
					__core__mkCons(
						${ftPath}____to_data(
							${ftPath}__from_data(
								__core__headList(fields)
							)
						), 
						${ir}(__core__tailList(fields))
					)
				}`;
			}

			return ir;*/
        }
    }

    /**
     * Doesn't return anything, but sets its IRdef in the map
     * @param {ToIRContext} ctx
     * @param {string} path
     * @param {Definitions} map
     * @param {number} constrIndex
     */
    toIR(ctx, path, map, constrIndex) {
        /**
         * @type {string[]}
         */
        const getterNames = []

        if (this.isMappedStruct()) {
            for (let i = 0; i < this._fields.length; i++) {
                const f = this._fields[i]
                const key = `${path}__${f.name.value}`

                // equalsData is much more efficient than first converting to byteArray
                const getter = $`(self) -> {${f.type.path}__from_data(__helios__common__mStruct_field(self, #${bytesToHex(encodeUtf8(f.encodedFieldName))}))}`

                map.set(key, { content: getter })
                getterNames.push(key)
            }
        } else {
            const isConstr = constrIndex != -1

            const getterBaseName = isConstr
                ? "__helios__common__enum_field"
                : "__helios__common__struct_field"

            if (this.fields.length == 1 && !isConstr) {
                const f = this.fields[0]
                const key = `${path}__${f.name.value}`

                const getter = $(`__helios__common__identity`, f.site)

                map.set(key, { content: getter })

                getterNames.push(key)
            } else {
                // add a getter for each field
                for (let i = 0; i < this._fields.length; i++) {
                    let f = this._fields[i]
                    let key = `${path}__${f.name.value}`
                    getterNames.push(key)

                    /**
                     * @type {SourceMappedStringI}
                     */
                    let getter

                    if (i < 20) {
                        getter = $`(self) ${$("->", f.site)} {
							${f.type.path}__from_data(${getterBaseName}_${i}(self))
						}`
                    } else {
                        let inner = $("self")

                        if (isConstr) {
                            inner = $`__core__sndPair(__core__unConstrData(${inner}))`
                        }

                        for (let j = 0; j < i; j++) {
                            inner = $`__core__tailList(${inner})`
                        }

                        inner = $`${f.type.path}__from_data(__core__headList(${inner}))`

                        getter = $`(self) ${$("->", f.site)} {${inner}}`
                    }

                    map.set(key, { content: getter })
                }
            }
        }

        this.toIR_new(ctx, path, map, constrIndex)
        this.toIR_copy(ctx, path, map, getterNames)
    }
}
