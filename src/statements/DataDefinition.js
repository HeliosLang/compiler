import { bytesToHex, encodeUtf8 } from "@helios-lang/codec-utils"
import { Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
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
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../codegen/index.js").Definitions} Definitions
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
    #site
    #name
    #fields

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {DataField[]} fields
     */
    constructor(site, name, fields) {
        this.#site = site
        this.#name = name
        this.#fields = fields
    }

    /**
     * @type {Site}
     */
    get site() {
        return this.#site
    }

    /**
     * @type {Word}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {DataField[]}
     */
    get fields() {
        return this.#fields.slice()
    }

    hasTags() {
        return this.#fields.some((f) => f.hasTag())
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
        for (let f of this.#fields) {
            if (f.name.toString() == name.toString()) {
                found = i
                break
            }
            i++
        }

        return found
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#fields.map((f) => f.name.value)
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
        return `{${this.#fields.map((f) => f.toString()).join(", ")}}`
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.name.toString()} ${this.toStringFields()}`
    }

    /**
     * @param {Scope} scope
     * @returns {InstanceMembers}
     */
    evalFieldTypes(scope) {
        /**
         * @type {InstanceMembers}
         */
        const fields = {}

        for (let f of this.#fields) {
            const f_ = f.eval(scope)

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
            this.#fields.map((f) => new ArgType(f.name, f.type, true)),
            self
        )
    }

    /**
     * @type {number}
     */
    get nFields() {
        return this.#fields.length
    }

    /**
     * @param {number} i
     * @returns {DataType}
     */
    getFieldType(i) {
        return this.#fields[i].type
    }

    /**
     * @param {string} name
     * @returns {number}
     */
    getFieldIndex(name) {
        const i = this.findField(new Word(name))

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
        return this.#fields[i].name.toString()
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
                this.#fields.map((f) => new ArgType(f.name, f.type, true)),
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
     * @returns {FieldTypeSchema[]}
     */
    fieldsToSchema(parents) {
        const fieldSchemas = []

        this.fieldNames.forEach((fn, i) => {
            const externalName = this.hasTags() ? this.#fields[i].tag : fn
            const ts = expectSome(this.getFieldType(i).toSchema(parents))
            fieldSchemas.push({
                type: ts,
                name: externalName
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
         * @type {SourceMappedString}
         */
        let ir

        if (this.hasTags()) {
            ir = $`__core__mkNilPairData(())`

            for (let i = this.nFields - 1; i >= 0; i--) {
                const f = this.#fields[i]

                ir = $`__core__mkCons(
					__core__mkPairData(
						__core__bData(#${bytesToHex(encodeUtf8(f.tag))}),
						${f.type.path}____to_data(${f.name.value})
					),
					${ir}
				)`
            }

            // TODO: according to https://cips.cardano.org/cips/cip68/#metadata an additional 'extra' (which can be unit)  should be added. Is that really necessary?
            ir = $`__core__constrData(
				0,
				__core__mkCons(
					__core__mapData(${ir}),
					__core__mkCons(
						__core__iData(1),
						__core__mkNilData(())
					)
				)
			)`

            ir = $`(${$(this.#fields.map((f) => $(f.name.value))).join(", ")}) -> {${ir}}`
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
                const f = this.#fields[i]

                ir = $`__core__mkCons(${f.type.path}____to_data(${f.name.value}), ${ir})`
            }

            if (isConstr) {
                ir = $`__core__constrData(${constrIndex}, ${ir})`
            }

            ir = $`(${$(this.#fields.map((f) => $(f.name.value))).join(", ")}) -> {${ir}}`
        }

        const key = `${path}____new`

        map.set(key, ir)
    }

    /**
     * @internal
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
            this.#fields.map((df) => $(df.name.value))
        )

        // wrap with defaults

        for (let i = getterNames.length - 1; i >= 0; i--) {
            const fieldName = this.#fields[i].name.toString()

            ir = FuncArg.wrapWithDefaultInternal(
                ir,
                fieldName,
                $`${getterNames[i]}(self)`
            )
        }

        const args = $(
            this.#fields.map((f) =>
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

        map.set(key, ir)
    }

    /**
     * @param {string} baseName
     * @param {boolean} isEnumMember
     * @returns {SourceMappedString}
     */
    toIR_show(baseName, isEnumMember = false) {
        if (this.hasTags()) {
            if (isEnumMember) {
                throw new Error("unexpected")
            }

            let ir = $`""`

            for (let i = 0; i < this.nFields; i++) {
                const f = this.#fields[i]
                const p = f.type.path

                ir = $`__core__appendString(
					${ir},
					__core__appendString(
						${i > 0 ? `", ${f.name}: "` : `"${f.name}: "`},
						(opt) -> {
							opt(
								(valid, value) -> {
									__core__ifThenElse(
										valid,
										() -> {
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
											}(${p}__from_data_safe(value))
										},
										() -> {
											"<n/a>"
										}
									)()
								}
							)
						}(__helios__common__cip68_field_safe(self, #${bytesToHex(encodeUtf8(f.tag))}))
					)
				)`
            }

            return $`(data) -> {
				__core__chooseData(
					data,
					() -> {
						(fields) -> {
							__core__chooseList(
								fields,
								() -> {"${baseName}{<n/a>}"},
								() -> {
									(data) -> {
										__core__chooseData(
											data,
											() -> {"${baseName}{<n/a>}"},
											() -> {
												(self) -> {
													__core__appendString(
														"${baseName}{",
														__core__appendString(
															${ir},
															"}"
														)
													)
												}(__core__unMapData(data))
											},
											() -> {"${baseName}{<n/a>}"},
											() -> {"${baseName}{<n/a>}"},
											() -> {"${baseName}{<n/a>}"}
										)()
									}(__core__headList__safe(fields))
								}
							)()
						}(__core__sndPair(__core__unConstrData__safe(data)))
					},
					() -> {"${baseName}{<n/a>}"},
					() -> {"${baseName}{<n/a>}"},
					() -> {"${baseName}{<n/a>}"},
					() -> {"${baseName}{<n/a>}"}
				)
			}`
        } else if (this.nFields == 1 && !isEnumMember) {
            return $`${this.#fields[0].type.path}__show`
        } else {
            let ir = $`(fields) -> {""}`

            for (let i = this.nFields - 1; i >= 0; i--) {
                const f = this.#fields[i]
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
     * @returns {SourceMappedString}
     */
    toIR_is_valid_data() {
        if (this.hasTags()) {
            const fields = this.#fields

            let ir = $``

            fields.forEach((f, i) => {
                if (i == 0) {
                    ir = $`__helios__common__test_cip68_field(
						data,
						__core__bData(#${bytesToHex(encodeUtf8(f.tag))}),
						${f.type.path}__is_valid_data	
					)`
                } else {
                    ir = $`__core__ifThenElse(
						__helios__common__test_cip68_field(
							data,
							__core__bData(#${bytesToHex(encodeUtf8(f.tag))}),
							${f.type.path}__is_valid_data	
						),
						() -> {
							${ir}
						},
						() -> {
							false
						}
					)()`
                }
            })

            return $`(data) -> {
				${ir}
			}`
        } else if (this.nFields == 1) {
            return $`${this.#fields[0].type.path}__is_valid_data`
        } else {
            const reversedFields = this.#fields.slice().reverse()

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
     * @param {string} path
     * @returns {SourceMappedString}
     */
    toIR_from_data_fields(path) {
        if (this.hasTags()) {
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
				const f = this.#fields[i]
				const ftPath = f.type.path;

				ir = IR.new`(data) -> {
					__core__mkCons(
						__core__mkPairData(
							__core__bData(#${bytesToHex(textToBytes(f.tag))}),
							${ftPath}____to_data(
								${ftPath}__from_data(
									__helios__common__cip68_field(
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

        if (this.hasTags()) {
            for (let i = 0; i < this.#fields.length; i++) {
                const f = this.#fields[i]
                const key = `${path}__${f.name.value}`

                // equalsData is much more efficient than first converting to byteArray
                const getter = $`(self) -> {${f.type.path}__from_data(__helios__common__cip68_field(self, #${bytesToHex(encodeUtf8(f.tag))}))}`

                map.set(key, getter)
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

                const getter = $`__helios__common__identity${f.site}`

                map.set(key, getter)

                getterNames.push(key)
            } else {
                // add a getter for each field
                for (let i = 0; i < this.#fields.length; i++) {
                    let f = this.#fields[i]
                    let key = `${path}__${f.name.value}`
                    getterNames.push(key)

                    /**
                     * @type {SourceMappedString}
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

                        getter = $`(self) ${null}->${f.site} {${inner}}`
                    }

                    map.set(key, getter)
                }
            }
        }

        this.toIR_new(ctx, path, map, constrIndex)
        this.toIR_copy(ctx, path, map, getterNames)
    }
}
