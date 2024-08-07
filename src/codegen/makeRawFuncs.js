import { REAL_PRECISION } from "@helios-lang/compiler-utils"
import { expectSome } from "@helios-lang/type-utils"
import { FTPP, TTPP } from "./ParametricName.js"
import { RawFunc } from "./RawFunc.js"

/**
 * Initializes the db containing all the builtin functions
 * @param {boolean} simplify
 * @param {boolean} isTestnet // needed for Address.to_bytes() and Address.to_hex()
 * @returns {Map<string, RawFunc>}
 */
// only need to wrap these source in IR right at the very end
export function makeRawFunctions(simplify, isTestnet) {
    /** @type {Map<string, RawFunc>} */
    let db = new Map()

    // local utility functions

    /**
     * @param {RawFunc} fn
     */
    function add(fn) {
        if (db.has(fn.name)) {
            throw new Error(`builtin ${fn.name} duplicate`)
        }
        db.set(fn.name, fn)
    }

    /**
     * @param {string} ns
     */
    function addNeqFunc(ns) {
        add(
            new RawFunc(
                `${ns}____neq`,
                `(self, other) -> {
			__helios__bool____not(${ns}____eq(self, other))
		}`
            )
        )
    }

    /**
     * @param {string} ns
     */
    function addDataLikeEqFunc(ns) {
        add(
            new RawFunc(
                `${ns}____eq`,
                `(self, other) -> {
			__core__equalsData(${ns}____to_data(self), ${ns}____to_data(other))
		}`
            )
        )
    }

    /**
     * @param {string} ns
     */
    function addSerializeFunc(ns) {
        add(
            new RawFunc(
                `${ns}__serialize`,
                `(self) -> {
			() -> {
				__core__serialiseData(${ns}____to_data(self))
			}
		}`
            )
        )
    }

    /**
     * @param {string} ns
     */
    function addIntLikeFuncs(ns) {
        add(new RawFunc(`${ns}____eq`, "__helios__int____eq"))
        add(new RawFunc(`${ns}____neq`, "__helios__int____neq"))
        add(new RawFunc(`${ns}__serialize`, "__helios__int__serialize"))
        add(new RawFunc(`${ns}__from_data`, "__helios__int__from_data"))
        add(
            new RawFunc(
                `${ns}__from_data_safe`,
                "__helios__int__from_data_safe"
            )
        )
        add(new RawFunc(`${ns}____to_data`, "__helios__int____to_data"))
    }

    /**
     * @param {string} ns
     */
    function addByteArrayLikeFuncs(ns) {
        add(new RawFunc(`${ns}____eq`, "__helios__bytearray____eq"))
        add(new RawFunc(`${ns}____neq`, "__helios__bytearray____neq"))
        add(new RawFunc(`${ns}__serialize`, "__helios__bytearray__serialize"))
        add(new RawFunc(`${ns}__from_data`, "__helios__bytearray__from_data"))
        add(
            new RawFunc(
                `${ns}__from_data_safe`,
                "__helios__bytearray__from_data_safe"
            )
        )
        add(new RawFunc(`${ns}____to_data`, "__helios__bytearray____to_data"))
        add(new RawFunc(`${ns}____lt`, "__helios__bytearray____lt"))
        add(new RawFunc(`${ns}____leq`, "__helios__bytearray____leq"))
        add(new RawFunc(`${ns}____gt`, "__helios__bytearray____gt"))
        add(new RawFunc(`${ns}____geq`, "__helios__bytearray____geq"))
        add(new RawFunc(`${ns}__new`, `__helios__common__identity`))
        add(new RawFunc(`${ns}__bytes`, "__helios__common__identity"))
        add(new RawFunc(`${ns}__show`, "__helios__bytearray__show"))
    }

    /**
     * Adds basic auto members to a fully named type
     * TODO: many types that are currently treated as Data could in fact be treated as something slighly better (eg. lists or pairs)
     * @param {string} ns
     * @param {{
     *   eq?: string,
     *   neq?: string,
     *   serialize?: string,
     *   from_data?: string,
     *   from_data_safe?: string,
     *   to_data?: string
     * }} custom
     */
    function addDataFuncs(ns, custom = {}) {
        add(new RawFunc(`${ns}____eq`, custom?.eq ?? "__helios__common____eq"))
        add(
            new RawFunc(
                `${ns}____neq`,
                custom?.neq ?? "__helios__common____neq"
            )
        )
        add(
            new RawFunc(
                `${ns}__serialize`,
                custom?.serialize ?? "__helios__common__serialize"
            )
        )
        add(
            new RawFunc(
                `${ns}__from_data`,
                custom?.from_data ?? "__helios__common__identity"
            )
        )
        add(
            new RawFunc(
                `${ns}__from_data_safe`,
                custom?.from_data_safe ??
                    `(data) -> {__helios__option__SOME_FUNC(data)}`
            )
        )
        add(
            new RawFunc(
                `${ns}____to_data`,
                custom?.to_data ?? "__helios__common__identity"
            )
        )
    }

    /**
     * Adds basic auto members to a fully named enum type
     * @param {string} ns
     * @param {number} constrIndex
     */
    function addEnumDataFuncs(ns, constrIndex) {
        add(new RawFunc(`${ns}____eq`, "__helios__common____eq"))
        add(new RawFunc(`${ns}____neq`, "__helios__common____neq"))
        add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"))
        add(new RawFunc(`${ns}____to_data`, "__helios__common__identity"))
        add(
            new RawFunc(
                `${ns}____is`,
                `(data) -> {
			__helios__common__enum_tag_equals(data, ${constrIndex})
		}`
            )
        )
        add(
            new RawFunc(
                `${ns}__from_data`,
                `(data) -> {
			__helios__common__assert_constr_index(data, ${constrIndex})
		}`
            )
        )
        add(
            new RawFunc(
                `${ns}__from_data_safe`,
                `(data) -> {
			__core__chooseData(
				data,
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(${constrIndex}, __core__fstPair(__core__unConstrData__safe(data))),
						() -> {
							__helios__option__SOME_FUNC(data)
						},
						() -> {
							__helios__option__NONE_FUNC
						}
					)()
				},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC}
			)()
		}`
            )
        )
    }

    /**
     * Generates the IR needed to unwrap a Plutus-core constrData
     * @param {string} dataExpr
     * @param {number} iConstr
     * @param {number} iField
     * @param {string} errorExpr
     * @returns {string}
     */
    function unData(
        dataExpr,
        iConstr,
        iField,
        errorExpr = 'error("unexpected constructor index")'
    ) {
        let inner = "__core__sndPair(pair)"
        for (let i = 0; i < iField; i++) {
            inner = `__core__tailList(${inner})`
        }

        // deferred evaluation of ifThenElse branches
        return `(pair) -> {__core__ifThenElse(__core__equalsInteger(__core__fstPair(pair), ${iConstr}), () -> {__core__headList(${inner})}, () -> {${errorExpr}})()}(__core__unConstrData(${dataExpr}))`
    }

    /**
     * Generates IR for constructing a list.
     * By default the result is kept as list, and not converted to data
     * @param {string[]} args
     * @param {boolean} toData
     * @returns
     */
    function makeList(args, toData = false) {
        let n = args.length
        let inner = "__core__mkNilData(())"

        for (let i = n - 1; i >= 0; i--) {
            inner = `__core__mkCons(${args[i]}, ${inner})`
        }

        if (toData) {
            inner = `__core__listData(${inner})`
        }

        return inner
    }

    // Common builtins
    add(
        new RawFunc(
            "__helios__common__assert_constr_index",
            `(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i),
			() -> {data},
			() -> {__helios__error("unexpected constructor index")}
		)()
	}`
        )
    )
    add(new RawFunc("__helios__common__identity", `(self) -> {self}`))
    add(new RawFunc("__helios__common____eq", "__core__equalsData"))
    add(
        new RawFunc(
            "__helios__common____neq",
            `(a, b) -> {
		__helios__bool____not(__core__equalsData(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__serialize",
            `(self) -> {
		() -> {
			__core__serialiseData(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__any",
            `(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {false}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList__safe(self)),
							() -> {true}, 
							() -> {recurse(recurse, __core__tailList__safe(self), fn)}
						)()
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__all",
            `(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self,
					() -> {true},
					() -> {
						__core__ifThenElse(
							fn(__core__headList__safe(self)),
							() -> {recurse(recurse, __core__tailList__safe(self), fn)},
							() -> {false}
						)()
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__map",
            `(self, fn, init) -> {
		(recurse) -> {
			recurse(recurse, self, init)
		}(
			(recurse, rem, lst) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {
						__core__mkCons(
							fn(__core__headList__safe(rem)), 
							recurse(recurse, __core__tailList__safe(rem), lst)
						)
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__filter",
            `(self, fn, nil) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {nil}, 
					() -> {
						(head) -> {
							__core__ifThenElse(
								fn(head),
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList__safe(self), fn))}, 
								() -> {recurse(recurse, __core__tailList__safe(self), fn)}
							)()
						}(__core__headList__safe(self))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__filter_list",
            `(self, fn) -> {
		__helios__common__filter(self, fn, __helios__common__list_0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__filter_map",
            `(self, fn) -> {
		__helios__common__filter(self, fn, __core__mkNilPairData(()))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__find",
            `(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__helios__error("not found")}, 
					() -> {
						(head) -> {
							__core__ifThenElse(
								fn(head), 
								() -> {head}, 
								() -> {recurse(recurse, __core__tailList__safe(self), fn)}
							)()
						}(__core__headList__safe(self))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__find_safe",
            `(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__core__constrData(1, __helios__common__list_0)}, 
					() -> {
						(head) -> {
							__core__ifThenElse(
								fn(head), 
								() -> {__core__constrData(0, __helios__common__list_1(callback(head)))}, 
								() -> {recurse(recurse, __core__tailList__safe(self), fn)}
							)()
						}(__core__headList__safe(self))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__fold",
            `(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, z)
		}(
			(recurse, self, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {recurse(recurse, __core__tailList__safe(self), fn(z, __core__headList__safe(self)))}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__fold_lazy",
            `(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self)
		}(
			(recurse, self) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {fn(__core__headList__safe(self), () -> {recurse(recurse, __core__tailList__safe(self))})}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__insert_in_sorted",
            `(x, lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {__core__mkCons(x, lst)},
					() -> {
						(head) -> {
							__core__ifThenElse(
								comp(x, head),
								() -> {__core__mkCons(x, lst)},
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList__safe(lst)))}
							)()
						}(__core__headList__safe(lst))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__sort",
            `(lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {lst},
					() -> {
						(head, tail) -> {
							__helios__common__insert_in_sorted(head, tail, comp)
						}(__core__headList__safe(lst), recurse(recurse, __core__tailList__safe(lst)))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__map_get",
            `(self, key, fnFound, fnNotFound) -> {
		(recurse) -> {
			recurse(recurse, self, key)
		}(
			(recurse, self, key) -> {
				__core__chooseList(
					self, 
					fnNotFound, 
					() -> {
						(head) -> {
							__core__ifThenElse(
								__core__equalsData(key, __core__fstPair(head)), 
								() -> {fnFound(__core__sndPair(head))}, 
								() -> {recurse(recurse, __core__tailList__safe(self), key)}
							)()
						}(__core__headList__safe(self))
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__is_in_bytearray_list",
            `(lst, key) -> {
		__helios__common__any(lst, (item) -> {__core__equalsData(item, key)})
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__length",
            `(lst) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {0}, 
					() -> {__core__addInteger(recurse(recurse, __core__tailList__safe(lst)), 1)}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__concat",
            `(a, b) -> {
		(recurse) -> {
			recurse(recurse, b, a)
		}(
			(recurse, lst, rem) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {__core__mkCons(__core__headList__safe(rem), recurse(recurse, lst, __core__tailList__safe(rem)))}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__slice_bytearray",
            `(self, selfLengthFn) -> {
		(start, end) -> {
			(normalize) -> {
				(fn) -> {
					fn(normalize(start))
				}(
					(start) -> {
						(fn) -> {
							fn(normalize(end))
						}(
							(end) -> {
								__core__sliceByteString(start, __core__subtractInteger(end, __helios__int__max(start, 0)), self)
							}
						)
					}
				)
			}(
				(pos) -> {
					__core__ifThenElse(
						__core__lessThanInteger(pos, 0),
						() -> {
							__core__addInteger(__core__addInteger(selfLengthFn(self), 1), pos)
						},
						() -> {
							pos
						}
					)()
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__starts_with",
            `(self, selfLengthFn) -> {
		(prefix) -> {
			(n, m) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, m),
					() -> {false},
					() -> {
						__core__equalsByteString(prefix, __core__sliceByteString(0, m, self))
					}
				)()
			}(selfLengthFn(self), __core__lengthOfByteString(prefix))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__ends_with",
            `(self, selfLengthFn) -> {
		(suffix) -> {
			n = selfLengthFn(self);
			m = __core__lengthOfByteString(suffix);
			__core__ifThenElse(
				__core__lessThanInteger(n, m),
				() -> {
					false
				},
				() -> {
					__core__equalsByteString(suffix, __core__sliceByteString(__core__subtractInteger(n, m), m, self))
				}
			)()
		}
	}`
        )
    )
    // TODO: inline __core__sndPair(head)
    add(
        new RawFunc(
            "__helios__common__cip68_field",
            `(self, name) -> {
		name_data = __core__bData(name);
		map = __core__unMapData(__core__headList(__core__sndPair(__core__unConstrData(self))));
		recurse = (recurse, map) -> {
			__core__chooseList(
				map,
				() -> {
					__helios__error(
						__core__appendString(
							"field ",
							__core__appendString(
								__helios__bytearray__show(name)(),
								" not found in struct"
							)
						)
					)
				},
				() -> {
					head = __core__headList__safe(map);
					key = __core__fstPair(head);
					value = __core__sndPair(head);
					__core__ifThenElse(
						__core__equalsData(key, name_data),
						() -> {
							value
						},
						() -> {
							recurse(recurse, __core__tailList__safe(map))
						}
					)()
				}
			)()
		};
		recurse(recurse, map)
	}`
        )
    )
    // map is expected to already have been extracted
    add(
        new RawFunc(
            "__helios__common__cip68_field_safe",
            `(map, name) -> {
		name = __core__bData(name);
		recurse = (recurse, map) -> {
			__core__chooseList(
				map,
				() -> {
					__helios__option__NONE_FUNC
				},
				() -> {
					head = __core__headList__safe(map);
					key = __core__fstPair(head);
					__core__ifThenElse(
						__core__equalsData(key, name),
						() -> {
							__helios__option__SOME_FUNC(__core__sndPair(head))
						},
						() -> {
							recurse(recurse, __core__tailList__safe(map))
						}
					)()
				}
			)()
		};
		recurse(recurse, map)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__test_cip68_field",
            `(self, name, inner_test) -> {
		__core__chooseData(
			self,
			() -> {
				fields = __core__sndPair(__core__unConstrData__safe(self));
				__core__chooseList(
					fields,
					() -> {false},
					() -> {
						head = __core__headList__safe(fields);
						__core__chooseData(
							head,
							() -> {false},
							() -> {
								map = __core__unMapData__safe(head);
								recurse = (recurse, map) -> {
									__core__chooseList(
										map,
										() -> {false},
										() -> {
											head = __core__headList__safe(map);
											key = __core__fstPair(head);
											value = __core__sndPair(head);
											__core__ifThenElse(
												__core__equalsData(key, name),
												() -> {
													inner_test(value)
												},
												() -> {
													recurse(recurse, __core__tailList__safe(map))
												}
											)()
										}
									)()
								};
								recurse(recurse, map)
							},
							() -> {false},
							() -> {false},
							() -> {false}
						)()
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__enum_fields",
            `(self) -> {
		__core__sndPair(__core__unConstrData(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__enum_field_0",
            `(self) -> {
		__core__headList(__helios__common__enum_fields(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__enum_fields_after_0",
            `(self) -> {
		__core__tailList(__helios__common__enum_fields(self))
	}`
        )
    )
    for (let i = 1; i < 20; i++) {
        add(
            new RawFunc(
                `__helios__common__enum_field_${i.toString()}`,
                `(self) -> {
		__core__headList(__helios__common__enum_fields_after_${(i - 1).toString()}(self))
	}`
            )
        )
        add(
            new RawFunc(
                `__helios__common__enum_fields_after_${i.toString()}`,
                `(self) -> {
		__core__tailList(__helios__common__enum_fields_after_${(i - 1).toString()}(self))
	}`
            )
        )
    }
    add(new RawFunc("__helios__common__struct_field_0", "__core__headList"))
    add(
        new RawFunc(
            "__helios__common__struct_fields_after_0",
            "__core__tailList"
        )
    )
    for (let i = 1; i < 20; i++) {
        add(
            new RawFunc(
                `__helios__common__struct_field_${i.toString()}`,
                `(self) -> {
		__core__headList(__helios__common__struct_fields_after_${(i - 1).toString()}(self))
	}`
            )
        )
        add(
            new RawFunc(
                `__helios__common__struct_fields_after_${i.toString()}`,
                `(self) -> {
		__core__tailList(__helios__common__struct_fields_after_${(i - 1).toString()}(self))
	}`
            )
        )
    }
    add(new RawFunc("__helios__common__list_0", "__core__mkNilData(())"))
    add(
        new RawFunc(
            "__helios__common__list_1",
            `(a) -> {
		__core__mkCons(a, __helios__common__list_0)
	}`
        )
    )
    for (let i = 2; i < 20; i++) {
        /**
         * @type {string[]}
         */
        let args = []

        for (let j = 0; j < i; j++) {
            args.push(`arg${j.toString()}`)
        }

        let woFirst = args.slice()
        let first = expectSome(woFirst.shift())

        add(
            new RawFunc(
                `__helios__common__list_${i.toString()}`,
                `(${args.join(", ")}) -> {
		__core__mkCons(${first}, __helios__common__list_${(i - 1).toString()}(${woFirst.join(", ")}))
	}`
            )
        )
    }
    add(
        new RawFunc(
            `__helios__common__hash_datum_data[${FTPP}0]`,
            `(data) -> {
		__core__blake2b_256(${FTPP}0__serialize(data)())
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__common__test_constr_data_2`,
            `(data, index, test_a, test_b) -> {
		__core__chooseData(
			data,
			() -> {
				pair = __core__unConstrData__safe(data);
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), index),
					() -> {
						fields = __core__sndPair(pair);
						__core__chooseList(
							fields,
							() -> {
								false
							},
							() -> {
								__core__ifThenElse(
									test_a(__core__headList__safe(fields)),
									() -> {
										tail = __core__tailList__safe(fields);
										__core__chooseList(
											tail,
											() -> {
												false
											},
											() -> {
												__core__ifThenElse(
													test_b(__core__headList__safe(tail)),
													() -> {
														__core__chooseList(
															__core__tailList__safe(tail), 
															() -> {
																true
															},
															() -> {
																false
															}
														)()
													},
													() -> {
														false
													}
												)()
											}
										)()
									},
									() -> {
										false
									}
								)()
							}
						)()
					},
					() -> {
						false
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__common__enum_tag_equals`,
            `(data, i) -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i)
		}`
        )
    )

    // Global builtin functions
    add(
        new RawFunc(
            "__helios__print",
            `(msg) -> {
		__core__trace(msg, ())
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__error",
            `(msg) -> {
		__core__trace(
			msg, 
			() -> {
				error()
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assert",
            `(cond, msg) -> {
		__core__ifThenElse(
			cond,
			() -> {
				()
			},
			() -> {
				__core__trace(
					msg,
					() -> {
						error()
					}
				)()
			}
		)()
	}`
        )
    )

    // Int builtins
    add(new RawFunc("__helios__int____eq", "__core__equalsInteger"))
    add(new RawFunc("__helios__int__from_data", "__core__unIData"))
    add(
        new RawFunc(
            "__helios__int__from_data_safe",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {
				__helios__option__SOME_FUNC(__core__unIData__safe(data))
			},
			() -> {__helios__option__NONE_FUNC}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__is_valid_data",
            `(data) -> {
		__core__chooseData(data, false, false, false, true, false)
	}`
        )
    )
    add(new RawFunc("__helios__int____to_data", "__core__iData"))
    addNeqFunc("__helios__int")
    addSerializeFunc("__helios__int")
    add(
        new RawFunc(
            "__helios__int____neg",
            `(self) -> {
		__core__multiplyInteger(self, -1)
	}`
        )
    )
    add(new RawFunc("__helios__int____pos", "__helios__common__identity"))
    add(new RawFunc("__helios__int____add", "__core__addInteger"))
    add(new RawFunc("__helios__int____sub", "__core__subtractInteger"))
    add(new RawFunc("__helios__int____mul", "__core__multiplyInteger"))
    add(new RawFunc("__helios__int____div", "__core__quotientInteger"))
    add(new RawFunc("__helios__int____mod", "__core__modInteger"))
    add(
        new RawFunc(
            "__helios__int____add1",
            `(a, b) -> {
		__core__addInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____sub1",
            `(a, b) -> {
		__core__subtractInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____sub2",
            `(a, b) -> {
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		__helios__ratio__new(
			__helios__int____sub(
				__helios__int____mul(a, bb),
				bt
			),
			bb
		)
	}`
        )
    )
    add(new RawFunc("__helios__int____mul1", "__helios__int____mul"))
    add(
        new RawFunc(
            "__helios__int____div1",
            `(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, __helios__real__ONESQ),
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____div2",
            `(a, b) -> {
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);

		__helios__ratio__new(
			__helios__int____mul(a, bb),
			bt
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____geq",
            `(a, b) -> {
		__helios__bool____not(__core__lessThanInteger(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____gt",
            `(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsInteger(a, b))
	}`
        )
    )
    add(new RawFunc("__helios__int____leq", "__core__lessThanEqualsInteger"))
    add(new RawFunc("__helios__int____lt", "__core__lessThanInteger"))
    add(
        new RawFunc(
            "__helios__int____geq1",
            `(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____geq2",
            `(a, b) -> {
				bt = __helios__ratio__top(b);
				bb = __helios__ratio__bottom(b);
		__core__lessThanEqualsInteger(
			bt,
			__helios__int____mul(a, bb)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____gt1",
            `(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____gt2",
            `(a, b) -> {
				bt = __helios__ratio__top(b);
				bb = __helios__ratio__bottom(b);
		__core__lessThanInteger(
			bt,
			__helios__int____mul(a, bb)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____leq1",
            `(a, b) -> {
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____leq2",
            `(a, b) -> {
				bt = __helios__ratio__top(b);
				bb = __helios__ratio__bottom(b);
		__core__lessThanEqualsInteger(
			__helios__int____mul(a, bb),
			bt
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____lt1",
            `(a, b) -> {
		__core__lessThanInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int____lt2",
            `(a, b) -> {
				bt = __helios__ratio__top(b);
				bb = __helios__ratio__bottom(b);
		__core__lessThanInteger(
			__helios__int____mul(a, bb),
			bt
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__min",
            `(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			a,
			b
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__max",
            `(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			b,
			a
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__bound_min",
            `(self) -> {
		(other) -> {
			__helios__int__max(self, other)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__bound_max",
            `(self) -> {
		(other) -> {
			__helios__int__min(self, other)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__bound",
            `(self) -> {
		(min, max) -> {
			__helios__int__max(__helios__int__min(self, max), min)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__abs",
            `(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__multiplyInteger(self, -1)
				},
				() -> {
					self
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__encode_zigzag",
            `(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__subtractInteger(__core__multiplyInteger(self, -2), 1)
				},
				() -> {
					__core__multiplyInteger(self, 2)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__decode_zigzag",
            `(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__helios__error("expected positive int")
				},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(__core__modInteger(self, 2), 0),
						() -> {
							__core__divideInteger(self, 2)
						},
						() -> {
							__core__divideInteger(__core__addInteger(self, 1), -2)
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_bool",
            `(self) -> {
		() -> {
			__core__ifThenElse(__core__equalsInteger(self, 0), false, true)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_ratio",
            `(self) -> {
		() -> {
			__helios__ratio__new(
				self,
				1
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_real",
            `(self) -> {
		() -> {
			__core__multiplyInteger(self, __helios__real__ONE)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_hex",
            `(self) -> {
		() -> {
			recurse = (self, bytes) -> {
				digit = __core__modInteger(self, 16);
				bytes = __core__consByteString(
					__core__ifThenElse(
						__core__lessThanInteger(digit, 10), 
						__core__addInteger(digit, 48), 
						__core__addInteger(digit, 87)
					), 
					bytes
				);
				__core__ifThenElse(
					__core__lessThanInteger(self, 16),
					() -> {bytes},
					() -> {
						recurse(__core__divideInteger(self, 16), bytes)
					}
				)()
			};
			__core__decodeUtf8__safe(
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						__core__consByteString(
							45,
							recurse(__core__multiplyInteger(self, -1), #)
						)
					},
					() -> {
						recurse(self, #)
					}
				)()
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__common__BASE58_ALPHABET",
            "#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a"
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_base58",
            `(self) -> {
		() -> {
			__core__decodeUtf8(
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						__helios__error("expected positive number")
					},
					() -> {
						recurse = (recurse, self, bytes) -> {
							digit = __core__modInteger(self, 58);
							bytes = __core__consByteString(
								__core__indexByteString(__helios__common__BASE58_ALPHABET, digit),
								bytes
							);
							__core__ifThenElse(
								__core__lessThanInteger(self, 58),
								() -> {
									bytes
								},
								() -> {
									recurse(recurse, __core__divideInteger(self, 58), bytes)
								}
							)()
						};
						recurse(recurse, self, #)
					}
				)()
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__BASE58_INVERSE_ALPHABET_1",
            "#ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000102030405060708ffffffffffff"
        )
    )
    add(
        new RawFunc(
            "__helios__int__BASE58_INVERSE_ALPHABET_2",
            "#ff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839ffffffffff"
        )
    )
    add(
        new RawFunc(
            "__helios__int__invert_base58_char",
            `(char) -> {
		digit = __core__ifThenElse(
			__core__lessThanInteger(char, 64),
			() -> {
				__core__indexByteString(__helios__int__BASE58_INVERSE_ALPHABET_1, char)
			},
			() -> {
				__core__ifThenElse(
					__core__lessThanInteger(char, 128),
					() -> {
						__core__indexByteString(
							__helios__int__BASE58_INVERSE_ALPHABET_2,
							__core__subtractInteger(char, 64)
						)
					},
					() -> {
						0xff
					}
				)()
			}
		)();
		__core__ifThenElse(
			__core__equalsInteger(digit, 0xff),
			() -> {
				__helios__error("invalid base58 character")
			},
			() -> {
				digit
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__from_base58",
            `(str) -> {
		bytes = __core__encodeUtf8(str);
		n = __core__lengthOfByteString(bytes);
		recurse = (recurse, acc, pow, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, -1),
				() -> {
					acc
				},
				() -> {
					new_acc = __core__addInteger(
						acc,
						__core__multiplyInteger(
							__helios__int__invert_base58_char(
								__core__indexByteString(bytes, i)
							),
							pow
						)
					);
					recurse(recurse, new_acc, __core__multiplyInteger(pow, 58), __core__subtractInteger(i, 1))
				}
			)()
		};
		recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__show_digit",
            `(x) -> {
		__core__addInteger(__core__modInteger(x, 10), 48)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__show",
            `(self) -> {
		() -> {
			__core__decodeUtf8__safe(
				recurse = (recurse, i, bytes) -> {
					(bytes) -> {
						__core__ifThenElse(
							__core__lessThanInteger(i, 10),
							() -> {
								bytes
							},
							() -> {
								recurse(recurse, __core__divideInteger(i, 10), bytes)
							}
						)()
					}(__core__consByteString(__helios__int__show_digit(i), bytes))
				};
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {__core__consByteString(45, recurse(recurse, __core__multiplyInteger(self, -1), #))},
					() -> {recurse(recurse, self, #)}
				)()
			)
		}
	}`
        )
    )
    // not exposed, assumes positive number
    add(
        new RawFunc(
            "__helios__int__show_padded",
            `(self, n) -> {
		recurse = (recurse, x, pos, bytes) -> {
			__core__ifThenElse(
				__core__equalsInteger(x, 0),
				() -> {
					__core__ifThenElse(
						__core__lessThanEqualsInteger(n, pos),
						() -> {
							bytes
						},
						() -> {
							recurse(
								recurse,
								0,
								__core__addInteger(pos, 1),
								__core__consByteString(48, bytes)
							)
						}
					)()
				},
				() -> {
					recurse(
						recurse,
						__core__divideInteger(x, 10),
						__core__addInteger(pos, 1),
						__core__consByteString(__helios__int__show_digit(x), bytes)
					)
				}
			)()
		};
		recurse(recurse, self, 0, #)
	}`
        )
    )

    add(
        new RawFunc(
            "__helios__int__parse_digit",
            `(digit) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(digit, 57),
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(48, digit),
					() -> {
						__core__subtractInteger(digit, 48)
					},
					() -> {
						__helios__error("not a digit")
					}
				)()
			},
			() -> {
				__helios__error("not a digit")
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__parse_hex_digit",
            `(hex) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(hex, 57),
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(48, hex),
					() -> {
						__core__subtractInteger(hex, 48)
					},
					() -> {
						__helios__error("not a hex digit")
					}
				)()
			},
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(hex, 70),
					() -> {
						__core__ifThenElse(
							__core__lessThanEqualsInteger(65, hex),
							() -> {
								__core__subtractInteger(hex, 55)
							}, 
							() -> {
								__helios__error("not a hex digit")
							}
						)()
					},
					() -> {
						__core__ifThenElse(
							__core__lessThanEqualsInteger(hex, 102),
							() -> {
								__core__ifThenElse(
									__core__lessThanEqualsInteger(97, hex),
									() -> {
										__core__subtractInteger(hex, 87)
									},
									() -> {
										__helios__error("not a hex digit")
									}
								)()
							},
							() -> {
								__helios__error("not a hex digit")
							}
						)()
					}
				)()
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__parse",
            `(string) -> {
		bytes = __core__encodeUtf8(string);
		n = __core__lengthOfByteString(bytes);
		b0 = __core__indexByteString(bytes, 0);
		recurse = (recurse, acc, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, n),
				() -> {
					acc
				},
				() -> {
					new_acc = __core__addInteger(
						__core__multiplyInteger(acc, 10), 
						__helios__int__parse_digit(__core__indexByteString(bytes, i))
					);
					recurse(recurse, new_acc, __core__addInteger(i, 1))
				}
			)()
		};
		__core__ifThenElse(
			__core__equalsInteger(b0, 48),
			() -> {
				__core__ifThenElse(
					__core__equalsInteger(n, 1),
					() -> {
						0
					},
					() -> {
						__helios__error("zero padded integer can't be parsed")
					}
				)()
			},
			() -> {
				__core__ifThenElse(
					__core__equalsInteger(b0, 45),
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(__core__indexByteString(bytes, 1), 48),
							() -> {
								__helios__error("-0 not allowed")
							},
							() -> {
								__core__multiplyInteger(
									recurse(recurse, 0, 1),
									-1
								)
							}
						)()
					},
					() -> {
						recurse(recurse, 0, 0)
					}
				)()
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__from_big_endian",
            `(bytes) -> {
		n = __core__lengthOfByteString(bytes);
		recurse = (recurse, acc, pow, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, -1),
				() -> {
					acc
				},
				() -> {
					new_acc = __core__addInteger(
						acc,
						__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
					);
					recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__subtractInteger(i, 1))
				}
			)()
		};
		recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__from_little_endian",
            `(bytes) -> {
		n = __core__lengthOfByteString(bytes);
		recurse = (recurse, acc, pow, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, n),
				() -> {
					acc
				},
				() -> {
					new_acc = __core__addInteger(
						acc,
						__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
					);
					recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
				}
			)()
		};
		recurse(recurse, 0, 1, 0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_big_endian",
            `(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__helios__error("can't convert negative number to big endian bytearray")
				},
				() -> {
					recurse = (recurse, self, bytes) -> {
						bytes = __core__consByteString(__core__modInteger(self, 256), bytes);
						__core__ifThenElse(
							__core__lessThanInteger(self, 256),
							() -> {
								bytes
							},
							() -> {
								recurse(
									recurse,
									__core__divideInteger(self, 256),
									bytes
								)
							}
						)()
					};
					recurse(recurse, self, #)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__to_little_endian",
            `(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__helios__error("can't convert negative number to little endian bytearray")
				},
				() -> {
					recurse = (recurse, self) -> {
						__core__consByteString(
							__core__modInteger(self, 256),
							__core__ifThenElse(
								__core__lessThanInteger(self, 256),
								() -> {
									#
								},
								() -> {
									recurse(recurse, __core__divideInteger(self, 256))
								}
							)()
						)
					};
					recurse(recurse, self)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__int__sqrt",
            `(x) -> {
		__core__ifThenElse(
			__core__lessThanInteger(x, 2),
			() -> {
				__core__ifThenElse(
					__core__equalsInteger(x, 1),
					() -> {
						1
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(x, 0),
							() -> {
								0
							},
							() -> {
								__helios__error("negative number in sqrt")
							}
						)()
					}
				)()
			},
			() -> {
				recurse = (recurse, x0) -> {
					x1 = __core__divideInteger(
						__core__addInteger(
							x0,
							__core__divideInteger(x, x0)
						),
						2
					);
					__core__ifThenElse(
						__core__lessThanEqualsInteger(x0, x1),
						() -> {
							x0
						},
						() -> {
							recurse(recurse, x1)
						}
					)()
				};
				recurse(recurse, __core__divideInteger(x, 2))
			}
		)()
	}`
        )
    )

    // Ratio builtins
    addDataFuncs("__helios__ratio")
    add(
        new RawFunc(
            "__helios__ratio__new",
            `(top, bottom) -> {
		__core__listData(
			__core__mkCons(
				__core__iData(top),
				__core__mkCons(
					__core__iData(bottom), 
					__core__mkNilData(())
				)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio__top",
            `(self) -> {
		__core__unIData(__core__headList(__core__unListData(self)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio__bottom",
            `(self) -> {
		__core__unIData(__core__headList(__core__tailList(__core__unListData(self))))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____add",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		new_bottom = __helios__int____mul(ab, bb);
		new_top = __helios__int____add(
			__helios__int____mul(at, bb),
			__helios__int____mul(bt, ab)
		);
		__helios__ratio__new(new_top, new_bottom)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____add1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		new_top = __helios__int____add(
			at,
			__helios__int____mul(b, ab)
		);
		__helios__ratio__new(new_top, ab)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____sub",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		new_bottom = __helios__int____mul(ab, bb);
		new_top = __helios__int____sub(
			__helios__int____mul(at, bb),
			__helios__int____mul(bt, ab)
		);
		__helios__ratio__new(new_top, new_bottom)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____sub1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		new_top = __helios__int____sub(
			at,
			__helios__int____mul(b, ab)
		);
		__helios__ratio__new(new_top, ab)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____mul",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		new_bottom = __helios__int____mul(ab, bb);
		new_top = __helios__int____mul(at, bt);
		__helios__ratio__new(new_top, new_bottom)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____mul1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		new_top = __helios__int____mul(at, b);
		__helios__ratio__new(new_top, ab)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____div",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		new_bottom = __helios__int____mul(ab, bt);
		new_top = __helios__int____mul(at, bb);
		__helios__ratio__new(new_top, new_bottom)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____div1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		new_bottom = __helios__int____mul(ab, b);
		__helios__ratio__new(at, new_bottom)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____lt",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		__core__lessThanInteger(
			__core__multiplyInteger(at, bb),
			__core__multiplyInteger(bt, ab)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____lt1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		__core__lessThanInteger(
			at,
			__core__multiplyInteger(b, ab)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____leq",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(at, bb),
			__core__multiplyInteger(bt, ab)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____leq1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		__core__lessThanEqualsInteger(
			at,
			__core__multiplyInteger(b, ab)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____gt",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		__core__lessThanInteger(
			__core__multiplyInteger(bt, ab),
			__core__multiplyInteger(at, bb)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____gt1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		__core__lessThanInteger(
			__core__multiplyInteger(b, ab),
			at
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____geq",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		bt = __helios__ratio__top(b);
		bb = __helios__ratio__bottom(b);
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(bt, ab),
			__core__multiplyInteger(at, bb)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio____geq1",
            `(a, b) -> {
		at = __helios__ratio__top(a);
		ab = __helios__ratio__bottom(a);
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(b, ab),
			at
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__ratio__floor",
            `(self) -> {
			() -> {
				top = __helios__ratio__top(self);
				bottom = __helios__ratio__bottom(self);
				__core__divideInteger(top, bottom)
			}
		}`
        )
    )

    // Real builtins
    addIntLikeFuncs("__helios__real")
    add(
        new RawFunc(
            "__helios__real__is_valid_data",
            "__helios__int__is_valid_data"
        )
    )
    add(new RawFunc("__helios__real__PRECISION", REAL_PRECISION.toString()))
    add(
        new RawFunc(
            "__helios__real__ONE",
            "1" + new Array(REAL_PRECISION).fill("0").join("")
        )
    )
    add(
        new RawFunc(
            "__helios__real__HALF",
            "5" + new Array(REAL_PRECISION - 1).fill("0").join("")
        )
    )
    add(
        new RawFunc(
            "__helios__real__NEARLY_ONE",
            new Array(REAL_PRECISION).fill("9").join("")
        )
    )
    add(
        new RawFunc(
            "__helios__real__ONESQ",
            "1" + new Array(REAL_PRECISION * 2).fill("0").join("")
        )
    )
    add(new RawFunc("__helios__real____neg", "__helios__int____neg"))
    add(new RawFunc("__helios__real____pos", "__helios__int____pos"))
    add(new RawFunc("__helios__real____add", "__helios__int____add"))
    add(
        new RawFunc(
            "__helios__real____add1",
            `(a, b) -> {
		__core__addInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`
        )
    )
    add(new RawFunc("__helios__real____sub", "__helios__int____sub"))
    add(
        new RawFunc(
            "__helios__real____sub1",
            `(a, b) -> {
		__core__subtractInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____mul",
            `(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, b),
			__helios__real__ONE
		)
	}`
        )
    )
    add(new RawFunc("__helios__real____mul1", "__helios__int____mul"))
    add(
        new RawFunc(
            "__helios__real____div",
            `(a, b) -> {
		__core__quotientInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`
        )
    )
    add(new RawFunc("__helios__real____div1", "__helios__int____div"))
    add(new RawFunc("__helios__real____geq", "__helios__int____geq"))
    add(new RawFunc("__helios__real____gt", "__helios__int____gt"))
    add(new RawFunc("__helios__real____leq", "__helios__int____leq"))
    add(new RawFunc("__helios__real____lt", "__helios__int____lt"))
    add(
        new RawFunc(
            "__helios__real____eq1",
            `(a, b) -> {
		__core__equalsInteger(a,
			__core__multiplyInteger(
				b,
				__helios__real__ONE
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____neq1",
            `(a, b) -> {
		__helios__bool____not(
			__core__equalsInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____geq1",
            `(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____gt1",
            `(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				a, 
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____leq1",
            `(a, b) -> {
		__core__lessThanEqualsInteger(
			a, 
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real____lt1",
            `(a, b) -> {
		__core__lessThanInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`
        )
    )
    add(new RawFunc("__helios__real__abs", "__helios__int__abs"))
    add(
        new RawFunc(
            "__helios__real__sqrt",
            `(self) -> {
		__helios__int__sqrt(
			__helios__int____mul(self, __helios__real__ONE)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__floor",
            `(self) -> {
		() -> {
			__core__divideInteger(self, __helios__real__ONE)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__trunc",
            `(self) -> {
		() -> {
			__core__quotientInteger(self, __helios__real__ONE)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__ceil",
            `(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__NEARLY_ONE),
				__helios__real__ONE
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__round",
            `(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__HALF),
				__helios__real__ONE
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__show",
            `(self) -> {
		() -> {
			show_positive = (x) -> {
				__helios__string____add(
					__helios__int__show(
						__helios__real__floor(
							__helios__real__abs(x)()
						)()
					)(),
					__helios__string____add(
						".",
						__core__decodeUtf8(
							__helios__int__show_padded(
								__helios__int____mod(x, __helios__real__ONE),
								__helios__real__PRECISION
							)
						)
					)
				)
			};
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__helios__string____add(
						"-",
						show_positive(__core__multiplyInteger(self, -1))
					)
				},
				() -> {
					show_positive(self)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__real__to_ratio",
            `(self) -> {
		() -> {
			__helios__ratio__new(
				self,
				__helios__real__ONE
			)
		}
	}`
        )
    )

    // Bool builtins
    addSerializeFunc("__helios__bool")
    add(
        new RawFunc(
            "__helios__bool__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				pair = __core__unConstrData__safe(data);
				index = __core__fstPair(pair);
				fields = __core__sndPair(pair);
				__core__chooseList(
					fields,
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(0, index),
							() -> {
								true
							},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(1, index),
									() -> {
										true
									},
									() -> {
										false
									}
								)()
							}
						)()
					},
					() -> {
						false
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool____eq",
            `(a, b) -> {
		__core__ifThenElse(a, b, __helios__bool____not(b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool____neq",
            `(a, b) -> {
		__core__ifThenElse(a, __helios__bool____not(b), b)
	}`
        )
    )
    // TODO: optimize this drastically by simply returning the comparison to 1
    add(
        new RawFunc(
            "__helios__bool__from_data",
            `(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__from_data_safe",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				__helios__option__SOME_FUNC(
					__core__equalsInteger(
						__core__fstPair(
							__core__unConstrData__safe(data)
						),
						1
					)
				)
			},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool____to_data",
            `(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __helios__common__list_0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__and",
            `(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {b()}, 
			() -> {false}
		)()
	}`
        )
    )

    add(
        new RawFunc(
            `__helios__bool__and2`,
            `(a, b) -> {
				__core__ifThenElse(a, b, false)
			}`
        )
    )

    add(
        new RawFunc(
            `__helios__bool__and3`,
            `(a, b, c) -> {
			__core__ifThenElse(a, __core__ifThenElse(b, c, false), false)
		}`
        )
    )

    add(
        new RawFunc(
            `__helios__bool__and4`,
            `(a, b, c, d) -> {
			__core__ifThenElse(a, __core__ifThenElse(b, __core__ifThenElse(c, d, false), false), false)
		}`
        )
    )

    add(
        new RawFunc(
            `__helios__bool__and5`,
            `(a, b, c, d, e) -> {
			__core__ifThenElse(a, __core__ifThenElse(b, __core__ifThenElse(c, __core__ifThenElse(d, e, false), false), false), false)
		}`
        )
    )

    add(
        new RawFunc(
            "__helios__bool__or",
            `(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {true},
			() -> {b()}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool____not",
            `(b) -> {
		__core__ifThenElse(b, false, true)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__to_int",
            `(self) -> {
		() -> {
			__core__ifThenElse(self, 1, 0)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__show",
            `(self) -> {
		() -> {
			__core__ifThenElse(self, "true", "false")
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__trace",
            `(self) -> {
		(prefix) -> {
			__core__trace(
				__helios__string____add(
					prefix,
					__helios__bool__show(self)()
				), 
				self
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__trace_if_false",
            `(self) -> {
		(msg) -> {
			__core__ifThenElse(
				self,
				() -> {
					self
				},
				() -> {
					__core__trace(msg, self)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bool__trace_if_true",
            `(self) -> {
		(msg) -> {
			__core__ifThenElse(
				self,
				() -> {
					__core__trace(msg, self)
				},
				() -> {
					self
				}
			)()
		}
	}`
        )
    )

    // String builtins
    addSerializeFunc("__helios__string")
    addNeqFunc("__helios__string")
    add(new RawFunc("__helios__string____eq", "__core__equalsString"))
    add(
        new RawFunc(
            "__helios__string__from_data",
            `(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__from_data_safe",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {
				bytes = __core__unBData__safe(data);
				__core__ifThenElse(
					__helios__string__is_valid_utf8(bytes),
					() -> {
						__helios__option__SOME_FUNC(__core__decodeUtf8__safe(bytes))
					},
					() -> {
						__helios__option__NONE_FUNC
					}
				)()	
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__show",
            `(self) -> {
		() -> {
			__core__appendString(
				"'",
				__core__appendString(
					self,
					"'"
				)
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__parse_utf8_cont_byte",
            `(byte, callback) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__divideInteger(byte, 64), 2),
			() -> {
				callback(true, __core__modInteger(byte, 64))
			},
			() -> {
				callback(false, 0)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__is_valid_utf8",
            `(bytes) -> {
		n = __core__lengthOfByteString(bytes);
		recurse = (recurse, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, n),
				() -> {
					true
				},
				() -> {
					b0 = __core__indexByteString__safe(bytes, i);
					__core__ifThenElse(
						__core__lessThanEqualsInteger(b0, 127),
						() -> {
							recurse(recurse, __core__addInteger(i, 1))
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(__core__divideInteger(b0, 32), 6),
								() -> {
									inext = __core__addInteger(i, 2);
									__core__ifThenElse(
										__core__lessThanEqualsInteger(inext, n),
										() -> {
											__helios__string__parse_utf8_cont_byte(
												__core__indexByteString__safe(bytes, __core__addInteger(i, 1)), 
												(valid, c1) -> {
													__core__ifThenElse(
														valid,
														() -> {
															c = __core__addInteger(
																__core__multiplyInteger(__core__modInteger(b0, 32), 64),
																c1
															);
															__core__ifThenElse(
																__helios__bool__and(
																	() -> {__core__lessThanEqualsInteger(128, c)},
																	() -> {__core__lessThanEqualsInteger(c, 2047)}
																),
																() -> {
																	recurse(recurse, inext)
																},
																() -> {
																	false
																}
															)()
														},
														() -> {
															false
														}
													)()
												}
											)
										},
										() -> {
											false
										}
									)()
								},
								() -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__divideInteger(b0, 16), 14),
										() -> {
											inext = __core__addInteger(i, 3);
											__core__ifThenElse(
												__core__lessThanEqualsInteger(inext, n),
												() -> {
													__helios__string__parse_utf8_cont_byte(
														__core__indexByteString__safe(bytes, __core__addInteger(i, 1)),
														(valid, c1) -> {
															__core__ifThenElse(
																valid,
																() -> {
																	__helios__string__parse_utf8_cont_byte(
																		__core__indexByteString__safe(bytes, __core__addInteger(i, 2)),
																		(valid, c2) -> {
																			__core__ifThenElse(
																				valid,
																				() -> {
																					c = __core__addInteger(
																						__core__multiplyInteger(__core__modInteger(b0, 16), 4096),
																						__core__addInteger(
																							__core__multiplyInteger(c1, 64),
																							c2
																						)
																					);
																					__core__ifThenElse(
																						__helios__bool__and(
																							() -> {__core__lessThanEqualsInteger(2048, c)},
																							() -> {__core__lessThanEqualsInteger(c, 65535)}
																						),
																						() -> {
																							recurse(recurse, inext)
																						},
																						() -> {
																							false
																						}
																					)()
																				},
																				() -> {
																					false
																				}
																			)()
																		}
																	)
																},
																() -> {
																	false
																}
															)()
														}
													)
												},
												() -> {
													false
												}
											)()
										},
										() -> {
											__core__ifThenElse(
												__core__equalsInteger(__core__divideInteger(b0, 8), 30),
												() -> {
													inext = __core__addInteger(i, 4);
													__core__ifThenElse(
														__core__lessThanEqualsInteger(inext, n),
														() -> {
															__helios__string__parse_utf8_cont_byte(
																__core__indexByteString__safe(bytes, __core__addInteger(i, 1)),
																(valid, c1) -> {
																	__core__ifThenElse(
																		valid,
																		() -> {
																			__helios__string__parse_utf8_cont_byte(
																				__core__indexByteString__safe(bytes, __core__addInteger(i, 2)),
																				(valid, c2) -> {
																					__core__ifThenElse(
																						valid,
																						() -> {
																							__helios__string__parse_utf8_cont_byte(
																								__core__indexByteString__safe(bytes, __core__addInteger(i, 3)),
																								(valid, c3) -> {
																									__core__ifThenElse(
																										valid,
																										() -> {
																											c = __core__addInteger(
																												__core__multiplyInteger(__core__modInteger(b0, 8), 262144),
																												__core__addInteger(
																													__core__multiplyInteger(c1, 4096),
																													__core__addInteger(
																														__core__multiplyInteger(c2, 64),
																														c3
																													)
																												)
																											);
																											__core__ifThenElse(
																												__helios__bool__and(
																													() -> {__core__lessThanEqualsInteger(65536, c)},
																													() -> {__core__lessThanEqualsInteger(c, 2097151)}
																												),
																												() -> {
																													recurse(recurse, inext)
																												},
																												() -> {
																													false
																												}
																											)()
																										},
																										() -> {
																											false
																										}
																									)()
																								}
																							)
																						},
																						() -> {
																							false
																						}
																					)()
																				}
																			)
																		},
																		() -> {
																			false
																		}
																	)()
																}
															)
														},
														() -> {
															false
														}
													)()
												},
												() -> {
													false
												}
											)()
										}
									)()
								}
							)()
						}
					)()
				}
			)()
		};
		recurse(recurse, 0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {false}, 
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {
				__helios__string__is_valid_utf8(__core__unBData__safe(data))
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string____to_data",
            `(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`
        )
    )
    add(new RawFunc("__helios__string____add", "__core__appendString"))
    add(
        new RawFunc(
            "__helios__string__starts_with",
            `(self) -> {
		(prefix) -> {
			__helios__bytearray__starts_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(prefix))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__ends_with",
            `(self) -> {
		(suffix) -> {
			__helios__bytearray__ends_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(suffix))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__string__encode_utf8",
            `(self) -> {
		() -> {
			__core__encodeUtf8(self)
		}
	}`
        )
    )

    // ByteArray builtins
    addSerializeFunc("__helios__bytearray")
    addNeqFunc("__helios__bytearray")
    add(
        new RawFunc(
            "__helios__bytearray__parse",
            `(string) -> {
		hex = __core__encodeUtf8(string);
		i = __core__subtractInteger(__core__lengthOfByteString(hex), 1);
		recurse = (recurse, tail, i) -> {
			__core__ifThenElse(
				__core__equalsInteger(i, -1),
				() -> {
					tail
				},
				() -> {
					byte = __core__addInteger(
						__helios__int__parse_hex_digit(__core__indexByteString(hex, i)),
						__core__multiplyInteger(
							16,
							__helios__int__parse_hex_digit(__core__indexByteString(hex, __core__subtractInteger(i, 1)))
						)
					);
					recurse(
						recurse, 
						__core__consByteString(byte, tail), 
						__core__subtractInteger(i, 2)
					)
				}
			)()
		};
		recurse(recurse, #, i)
	}`
        )
    )
    add(new RawFunc("__helios__bytearray____eq", "__core__equalsByteString"))
    add(new RawFunc("__helios__bytearray__from_data", "__core__unBData"))
    add(
        new RawFunc(
            "__helios__bytearray__from_data_safe",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__SOME_FUNC(__core__unBData__safe(data))}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__is_valid_data",
            `(data) -> {
		__core__chooseData(data, false, false, false, false, true)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__bytearray__is_valid_data_fixed_length`,
            `(data, n) -> {
		__core__chooseData(
			data,
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {
				bytes = __core__unBData__safe(data);
				__core__ifThenElse(
					__core__equalsInteger(__core__lengthOfByteString(bytes), n),
					() -> {
						true
					},
					() -> {
						false
					}
				)()
			}
		)()
	}`
        )
    )
    add(new RawFunc("__helios__bytearray____to_data", "__core__bData"))
    add(new RawFunc("__helios__bytearray____add", "__core__appendByteString"))
    add(
        new RawFunc(
            "__helios__bytearray____geq",
            `(a, b) -> {
		__helios__bool____not(__core__lessThanByteString(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray____gt",
            `(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsByteString(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray____leq",
            "__core__lessThanEqualsByteString"
        )
    )
    add(new RawFunc("__helios__bytearray____lt", "__core__lessThanByteString"))
    add(
        new RawFunc("__helios__bytearray__length", "__core__lengthOfByteString")
    )
    add(
        new RawFunc(
            "__helios__bytearray__slice",
            `(self) -> {
		__helios__common__slice_bytearray(self, __core__lengthOfByteString)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__starts_with",
            `(self) -> {
		__helios__common__starts_with(self, __core__lengthOfByteString)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__ends_with",
            `(self) -> {
		__helios__common__ends_with(self, __core__lengthOfByteString)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__prepend",
            `(self) -> {
		(byte) -> {
			__core__consByteString(byte, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__sha2",
            `(self) -> {
		() -> {
			__core__sha2_256(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__sha3",
            `(self) -> {
		() -> {
			__core__sha3_256(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__blake2b",
            `(self) -> {
		() -> {
			__core__blake2b_256(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__decode_utf8",
            `(self) -> {
		() -> {
			__core__decodeUtf8(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__bytearray__show",
            `(self) -> {
		() -> {
			recurse = (recurse, self) -> {
				n = __core__lengthOfByteString(self);
				__core__ifThenElse(
					__core__lessThanInteger(0, n),
					() -> {
						__core__appendString(
							__core__decodeUtf8__safe(
								hex_bytes = (
									__core__encodeUtf8(
										__helios__int__to_hex(
											__core__indexByteString__safe(self, 0)
										)()
									)
								);
								__core__ifThenElse(
									__core__equalsInteger(__core__lengthOfByteString(hex_bytes), 1),
									__core__consByteString(48, hex_bytes),
									hex_bytes
								)
							), 
							recurse(recurse, __core__sliceByteString(1, n, self))
						)
					},
					() -> {
						""
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )

    // Iterator builtins (lazy lists)
    // many iterator methods must be generated for different number of arguments
    for (let n = 1; n <= 10; n++) {
        const basePath = `__helios__iterator__${n}`
        const head = new Array(n)
            .fill("")
            .map((_, i) => `head${i}`)
            .join(", ")
        const unit = new Array(n)
            .fill("")
            .map((_, i) => "()")
            .join(", ")
        const returnHead =
            n == 1 ? `${head}` : `(callback) -> {callback(${head})}`

        add(
            new RawFunc(
                `${basePath}__drop`,
                `(self) -> {
		(n) -> {
			recurse = (recurse, iterator, i) -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(i, 0),
					() -> {
						iterator
					},
					() -> {
						iterator(
							(is_null, ${head}, next_iterator) -> {
								__core__ifThenElse(
									is_null,
									() -> {
										iterator
									},
									() -> {
										recurse(recurse, next_iterator, __core__subtractInteger(i, 1))
									}
								)()
							}
						)
					}
				)()
			};
			recurse(recurse, self, n)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__is_empty`,
                `(self) -> {
		() -> {
			self(
				(is_null, ${head}, next_iterator) -> {
					is_null
				}
			)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__head`,
                `(self) -> {
		self(
			(is_null, ${head}, next_iterator) -> {
				${returnHead}
			}
		)
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__tail`,
                `(self) -> {
		self(
			(is_null, ${head}, next_iterator) -> {
				next_iterator
			}
		)
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__get`,
                `(self) -> {
		(i) -> {
			__core__ifThenElse(
				__core__lessThanInteger(i, 0),
				() -> {
					__helios__error("negative index in iterator.get()")
				},
				() -> {
					recurse = (recurse, iterator, i) -> {
						iterator(
							(is_null, ${head}, next_iterator) -> {
								__core__ifThenElse(
									is_null,
									() -> {
										__helios__error("index out of range")
									},
									() -> {
										__core__ifThenElse(
											__core__equalsInteger(i, 0),
											() -> {
												${returnHead}
											},
											() -> {
												recurse(recurse, next_iterator, __core__subtractInteger(i, 1))
											}
										)()
									}
								)()
								
							}
						)
					};
					recurse(recurse, self, i)
				}
			)()
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__get_singleton`,
                `(self) -> {
		() -> {
			self(
				(is_null, ${head}, next_iterator) -> {
					__core__ifThenElse(
						is_null,
						() -> {
							__helios__error("empty iterator, not a singleton")
						},
						() -> {
							__core__ifThenElse(
								${basePath}__is_empty(next_iterator)(),
								() -> {
									${returnHead}
								},
								() -> {
									__helios__error("not a singleton iterator")
								}
							)()
						}
					)()
				}
			)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__take`,
                `(self) -> {
		(n) -> {
			recurse = (recurse, iterator, i) -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(i, 0),
					() -> {
						(callback) -> {
							callback(true, ${unit}, ())
						}
					},
					() -> {
						iterator(
							(is_null, ${head}, next_iterator) -> {
								__core__ifThenElse(
									is_null,
									() -> {
										iterator
									},
									() -> {
										(callback) -> {
											callback(false, ${head}, recurse(recurse, next_iterator, __core__subtractInteger(i, 1)))
										}
									}
								)()	
							}
						)
					}
				)()
				
			};
			recurse(recurse, self, n)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__for_each`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						__core__ifThenElse(
							is_null,
							() -> {
								()
							},
							() -> {
								__core__chooseUnit(
									fn(${head}),
									recurse(recurse, next_iterator)
								)
							}
						)()
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__fold[${FTPP}0]`,
                `(self) -> {
		(fn, z0) -> {
			recurse = (recurse, iterator, z) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						__core__ifThenElse(
							is_null,
							() -> {
								z
							},
							() -> {
								recurse(recurse, next_iterator, fn(z, ${head}))
							}
						)()
					}
				)
			};
			recurse(recurse, self, z0)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__find`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						__core__ifThenElse(
							is_null,
							() -> {
								__helios__error("not found")
							},
							() -> {
								__core__ifThenElse(
									fn(${head}),
									() -> {
										${returnHead}
									},
									() -> {
										recurse(recurse, next_iterator)
									}
								)()
							}
						)()
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__any`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						__core__ifThenElse(
							is_null,
							() -> {
								false
							},
							() -> {
								__core__ifThenElse(
									fn(${head}),
									() -> {
										true
									},
									() -> {
										recurse(recurse, next_iterator)
									}
								)()
							}
						)()
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__prepend`,
                `(self) -> {
		(${head}) -> {
			(callback) -> {
				callback(false, ${head}, self)
			}
		}
	}`
            )
        )

        add(
            new RawFunc(
                `${basePath}__filter`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						(callback) -> {
							__core__ifThenElse(
								is_null,
								() -> {
									callback(true, ${unit}, ())
								},
								() -> {
									__core__ifThenElse(
										fn(${head}),
										() -> {
											callback(false, ${head}, recurse(recurse, next_iterator))
										},
										() -> {
											recurse(recurse, next_iterator)(callback)
										}
									)()
								}
							)()
						}
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )
        add(
            new RawFunc(
                `${basePath}__map[${FTPP}0]`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						(callback) -> {
							__core__ifThenElse(
								is_null,
								() -> {
									callback(true, (), ())
								},
								() -> {
									callback(false, fn(${head}), recurse(recurse, next_iterator))
								}
							)()
						}
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )
        add(
            new RawFunc(
                `${basePath}__map2[${FTPP}0@${FTPP}1]`,
                `(self) -> {
		(fn) -> {
			recurse = (recurse, iterator) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						(callback) -> {
							__core__ifThenElse(
								is_null,
								() -> {
									callback(true, (), (), ())
								},
								() -> {
									fn(${head})(
										(new_head0, new_head1) -> {
											callback(false, new_head0, new_head1, recurse(recurse, next_iterator))
										}
									)
								}
							)()
						}
					}
				)
			};
			recurse(recurse, self)
		}
	}`
            )
        )
        add(
            new RawFunc(
                `${basePath}__zip[${FTPP}0]`,
                `(self) -> {
		(lst) -> {
			recurse = (recurse, iterator, lst) -> {
				iterator(
					(is_null, ${head}, next_iterator) -> {
						__core__ifThenElse(
							is_null,
							(callback) -> {
								callback(true, ${unit}, (), ())
							},
							(callback) -> {
								__core__chooseList(
									lst,
									() -> {
										callback(true, ${unit}, (), ())
									},
									() -> {
										callback(
											false,
											${head},
											${FTPP}0__from_data(__core__headList__safe(lst)),
											recurse(recurse, next_iterator, __core__tailList__safe(lst))
										)
									}
								)()
							}
						)
					}
				)	
			};
			recurse(recurse, self, lst)
		}
	}`
            )
        )
    }

    // Struct (list of data, which is used by structs which have more than 1 field, otherwise the internal of that single field is used directly)
    addSerializeFunc("__helios__struct")
    addNeqFunc("__helios__struct")
    addDataLikeEqFunc("__helios__struct")
    add(new RawFunc("__helios__struct__from_data", "__core__unListData"))
    add(new RawFunc("__helios__struct____to_data", "__core__listData"))

    // Tuple builtins
    add(
        new RawFunc(
            "__helios__tuple[]____to_func",
            (ttp) => `__helios__common__identity`
        )
    )
    add(
        new RawFunc("__helios__tuple[]__from_data", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            return `(data) -> {
			fields = __core__unListData(data);
			(callback) -> {
				callback(${ttp
                    .map((tp, i) => {
                        let inner = "fields"

                        for (let j = 0; j < i; j++) {
                            inner = `__core__tailList(${inner})`
                        }

                        return `${tp}__from_data(__core__headList(${inner}))`
                    })
                    .join(", ")})
			}
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]__from_data_safe", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            let inner = `__helios__option__SOME_FUNC(
			(callback) -> {
				callback(${ttp.map((_, i) => `opt${i}`).join(", ")})
			}
		}`

            for (let i = ttp.length - 1; i >= 0; i--) {
                inner = `opt${i}(
				(valid, value${i}) -> {
					__core__ifThenElse(
						valid,
						() -> {
							${inner}
						},
						() -> {
							__helios__option__NONE_FUNC
						}
					)()
				}
			)`
            }

            for (let i = ttp.length - 1; i >= 0; i--) {
                inner = `(fields) -> {
				__core__chooseList(
					fields,
					() -> {
						__helios__option__NONE_FUNC
					},
					() -> {
						(opt${i}) -> {
							${i == ttp.length - 1 ? inner : `${inner}(__core__tailList__safe(fields))`}
						}(${ttp[i]}__from_data_safe(__core__headList__safe(fields)))
					}
				)()
			}`
            }

            return `(data) -> {
			__core__chooseData(
				data,
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {
					${inner}(__core__unListData__safe(data))
				},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC}
			)
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]__show", (ttp) => {
            let inner = `${ttp[ttp.length - 1]}__show(x${ttp.length - 1})()`

            for (let i = ttp.length - 2; i >= 0; i--) {
                inner = `__core__appendString(
				${ttp[i]}__show(x${i})(),
				__core__appendString(
					", ",
					${inner}
				)
			)`
            }

            return `(tuple) -> {
			() -> {
				tuple(
					(${ttp.map((_, i) => `x${i}`).join(", ")}) -> {
						__core__appendString(
							"(",
							__core__appendString(
								${inner},
								")"
							)
						)
					}
				)
			}
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]____to_data", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            let inner = `__core__mkNilData(())`

            for (let i = ttp.length - 1; i >= 0; i--) {
                inner = `__core__mkCons(${ttp[i]}____to_data(x${i}), ${inner})`
            }

            return `(tuple) -> {
			tuple(
				(${ttp.map((tp, i) => `x${i}`).join(", ")}) -> {
					__core__listData(${inner})
				}
			)
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]__is_valid_data", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            let inner = `__core__chooseList(
			list,
			() -> {true},
			() -> {false}
		)()`

            for (let i = ttp.length - 1; i >= 0; i--) {
                const tp = ttp[i]
                inner = `__core__chooseList(
				list,
				() -> {false},
				() -> {
					head = __core__headList__safe(list);
					list = __core__tailList__safe(list);
					__helios__bool__and(
						() -> {${tp}__is_valid_data(head)},
						() -> {
							${inner}
						}
					)
				}
			)()`
            }

            return `(data) -> {
			__core__chooseData(
				data,
				() -> {false},
				() -> {false},
				() -> {
					list = __core__unListData__safe(list);
					${inner}
				},
				() -> {false},
				() -> {false}
			)()
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]__serialize", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            return `(tuple) -> {
			__helios__common__serialize(__helios__tuple[${ttp.join("@")}]____to_data(tuple))
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]____eq", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            return `(a, b) -> {
			__helios__common____eq(
				__helios__tuple[${ttp.join("@")}]____to_data(a),
				__helios__tuple[${ttp.join("@")}]____to_data(b)
			)
		}`
        })
    )
    add(
        new RawFunc("__helios__tuple[]____neq", (ttp) => {
            if (ttp.length < 2) {
                throw new Error("unexpected")
            }

            return `(a, b) -> {
			__helios__common____neq(
				__helios__tuple[${ttp.join("@")}]____to_data(a),
				__helios__tuple[${ttp.join("@")}]____to_data(b)
			)
		}`
        })
    )
    ;["first", "second", "third", "fourth", "fifth"].forEach((getter, i) => {
        add(
            new RawFunc(`__helios__tuple[]__${getter}`, (ttp) => {
                if (ttp.length < 2) {
                    throw new Error("unexpected")
                }

                return `(tuple) -> {
				tuple(
					(${ttp.map((tp, j) => `x${j}`).join(", ")}) -> {
						x${i}
					}
				)
			}`
            })
        )
    })

    // List builtins
    addSerializeFunc(`__helios__list[${TTPP}0]`)
    addNeqFunc(`__helios__list[${TTPP}0]`)
    addDataLikeEqFunc(`__helios__list[${TTPP}0]`)
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__is_valid_data_internal`,
            `(lst) -> {
		recurse = (recurse, lst) -> {
			__core__chooseList(
				lst,
				() -> {
					true
				},
				() -> {
					__core__ifThenElse(
						${TTPP}0__is_valid_data(__core__headList__safe(lst)),
						() -> {
							recurse(recurse, __core__tailList__safe(lst))
						},
						() -> {
							false
						}
					)()
				}
			)()
		};
		recurse(recurse, lst)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__from_data`,
            `(data) -> {
		lst = __core__unListData(data);
		_ = __core__ifThenElse(
			__helios__list[${TTPP}0]__is_valid_data_internal(lst),
			() -> {
				()
			},
			() -> {
				__core__trace("Warning: invalid list data", ())
			}
		)();
		lst
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__from_data_safe`,
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {
				__helios__option__SOME_FUNC(__core__unListData__safe(data))
			},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__is_valid_data`,
            `(data) -> {
		__core__chooseData(
			data,
			() -> {false},
			() -> {false},
			() -> {
				__helios__list[${TTPP}0]__is_valid_data_internal(__core__unListData__safe(data))
			},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(new RawFunc(`__helios__list[${TTPP}0]____to_data`, "__core__listData"))
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__show`,
            `(self) -> {
		() -> {
			recurse = (recurse, self, first) -> {
				__core__chooseList(
					self,
					() -> {
						""
					},
					() -> {
						__core__appendString(
							__core__ifThenElse(
								first,
								() -> {
									""
								},
								() -> {
									", "
								}
							)(),
							head = ${TTPP}0__from_data_safe(__core__headList__safe(self));
							__core__appendString(
								head(
									(valid, value) -> {
										__core__ifThenElse(
											valid,
											() -> {
												${TTPP}0__show(value)()
											},
											() -> {
												"<n/a>"
											}
										)()
									}
								),
								recurse(recurse, __core__tailList__safe(self), false)
							)
						)
					}
				)()
			};
			__core__appendString(
				"[",
				__core__appendString(
					recurse(recurse, self, true),
					"]"
				)
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__new`,
            `(n, fn) -> {
		recurse = (recurse, i) -> {
			__core__ifThenElse(
				__core__lessThanInteger(i, n),
				() -> {__core__mkCons(${TTPP}0____to_data(fn(i)), recurse(recurse, __core__addInteger(i, 1)))},
				() -> {__core__mkNilData(())}
			)()
		};
		recurse(recurse, 0)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__new_const`,
            `(n, item) -> {
		__helios__list[${TTPP}0]__new(n, (i) -> {item})
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]____add`,
            "__helios__common__concat"
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__length`,
            "__helios__common__length"
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__head`,
            `(self) -> {
		${TTPP}0__from_data(__core__headList(self))
	}`
        )
    )
    add(new RawFunc(`__helios__list[${TTPP}0]__tail`, "__core__tailList"))
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__is_empty`,
            `(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[__helios__data]__to_iterator`,
            `(self) -> {
		() -> {
			recurse = (recurse, lst) -> {
				(callback) -> {
					__core__chooseList(
						lst,
						() -> {
							callback(true, (), ())
						},
						() -> {
							callback(
								false, 
								__core__headList__safe(lst),
								recurse(recurse, __core__tailList__safe(lst))
							)
						}
					)()
				}
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__to_iterator`,
            `(self) -> {
		() -> {
			recurse = (recurse, lst) -> {
				(callback) -> {
					__core__chooseList(
						lst,
						() -> {
							callback(true, (), ())
						},
						() -> {
							callback(
								false, 
								${TTPP}0__from_data(__core__headList__safe(lst)),
								recurse(recurse, __core__tailList__safe(lst))
							)
						}
					)()
				}
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__from_iterator`,
            `(iterator) -> {
		recurse = (recurse, iterator) -> {
			iterator(
				(is_null, head, next_iterator) -> {
					__core__ifThenElse(
						is_null,
						() -> {
							__core__mkNilData(())
						},
						() -> {
							__core__mkCons(
								${TTPP}0____to_data(head),
								recurse(recurse, next_iterator)
							)
						}
					)()
				}
			)
		};
		recurse(recurse, iterator)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__zip[${FTPP}0]`,
            `(self) -> {
		(other) -> {
			recurse = (recurse, lst1, lst2) -> {
				__core__chooseList(
					lst1,
					(callback) -> {
						callback(true, (), (), ())
					},
					(callback) -> {
						__core__chooseList(
							lst2,
							() -> {
								callback(true, (), (), ())
							},
							() -> {
								callback(
									false,
									${TTPP}0__from_data(__core__headList__safe(lst1)),
									${FTPP}0__from_data(__core__headList__safe(lst2)),
									recurse(recurse, __core__tailList__safe(lst1), __core__tailList__safe(lst2))
								)
							}
						)()
					}
				)
			};
			recurse(recurse, self, other)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__get`,
            `(self) -> {
		(index) -> {
			${TTPP}0__from_data(__helios__list[__helios__data]__get(self)(index))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__data]__get",
            `(self) -> {
		(index) -> {
			recurse = (recurse, self, i) -> {
				__core__chooseList(
					self, 
					() -> {
						__helios__error("index out of range")
					}, 
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(index, i), 
							() -> {
								__core__headList__safe(self)
							}, 
							() -> {
								recurse(recurse, __core__tailList__safe(self), __core__addInteger(i, 1))
							}
						)()
					}
				)()
			};
			recurse(recurse, self, 0)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__get_singleton`,
            `(self) -> {
		() -> {
			${TTPP}0__from_data(
				__helios__list[__helios__data]__get_singleton(self)()
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__data]__get_singleton",
            `(self) -> {
		() -> {
			__core__chooseUnit(
				__helios__assert(
					__core__nullList(__core__tailList(self)),
					"not a singleton list"
				),
				__core__headList(self)
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__set`,
            `(self) -> {
		(index, item) -> {
			__helios__list[__helios__data]__set(self)(index, ${TTPP}0____to_data(item))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[__helios__data]__set`,
            `(self) -> {
		(index, item) -> {
			recurse = (recurse, lst, i) -> {
				__core__chooseList(
					lst,
					() -> {
						__helios__error("index out of range")
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(i, index),
							() -> {
								__core__mkCons(item, __core__tailList__safe(lst))
							},
							() -> {
								__core__mkCons(
									__core__headList__safe(lst),
									recurse(recurse, __core__tailList__safe(lst), __core__addInteger(i, 1))
								)
							}
						)()
					}
				)()
			};
			recurse(recurse, self, 0)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__split_at`,
            "__helios__list[__helios__data]__split_at"
        )
    )
    add(
        new RawFunc(
            `__helios__list[__helios__data]__split_at`,
            `(self) -> {
		(index) -> {
			recurse = (recurse, lst, i, build_head) -> {
				__core__chooseList(
					lst,
					() -> {
						__helios__error("index out of range")
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(i, index),
							() -> {
								(callback) -> {
									callback(build_head(__core__mkNilData(())), lst)
								}
							},
							() -> {
								recurse(recurse, __core__tailList__safe(lst), __core__addInteger(i, 1), (h) -> {
									build_head(__core__mkCons(__core__headList__safe(lst), h))
								})
							}
						)()
					}
				)()
			};
			recurse(recurse, self, 0, (head) -> {head})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__drop`,
            "__helios__list[__helios__data]__drop"
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__data]__drop",
            `(self) -> {
		(n) -> {
			recurse = (recurse, lst, n) -> {
				__core__ifThenElse(
					__core__equalsInteger(n, 0),
					() -> {
						lst
					},
					() -> {
						recurse(
							recurse,
							__core__tailList(lst),
							__core__subtractInteger(n, 1)
						)
					}
				)()
			};
			__core__ifThenElse(
				__core__lessThanInteger(n, 0),
				() -> {
					__helios__error("negative n in drop")
				},
				() -> {
					recurse(recurse, self, n)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__drop_end`,
            "__helios__list[__helios__data]__drop_end"
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__data]__drop_end",
            `(self) -> {
		(n) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						(callback) -> {callback(0, lst)}
					},
					() -> {
						recurse(recurse, __core__tailList__safe(lst))(
							(count, result) -> {
								__core__ifThenElse(
									__core__equalsInteger(count, n),
									() -> {
										(callback) -> {
											callback(
												count,
												__core__mkCons(
													__core__headList__safe(lst), 
													result
												)
											)
										}
									},
									() -> {
										(callback) -> {
											callback(
												__core__addInteger(count, 1),
												result
											)
										}
									}
								)()
							}
						)
					}
				)()
			};
			__core__ifThenElse(
				__core__lessThanInteger(n, 0),
				() -> {
					__helios__error("negative n in drop_end")
				},
				() -> {
					recurse(recurse, self)(
						(count, result) -> {
							__core__ifThenElse(
								__core__lessThanInteger(count, n),
								() -> {
									__helios__error("list too short")
								},
								() -> {
									result
								}
							)()
						}
					)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__take`,
            "__helios__list[__helios__data]__take"
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__data]__take",
            `(self) -> {
		(n) -> {
			recurse = (recurse, lst, n) -> {
				__core__ifThenElse(
					__core__equalsInteger(n, 0),
					() -> {
						__core__mkNilData(())
					},
					() -> {
						__core__mkCons(
							__core__headList(lst),
							recurse(
								recurse,
								__core__tailList(lst),
								__core__subtractInteger(n, 1)
							)
						)
					}
				)()
			};
			__core__ifThenElse(
				__core__lessThanInteger(n, 0),
				() -> {
					__helios__error("negative n in take")
				},
				() -> {
					recurse(recurse, self, n)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__take_end`,
            "__helios__list[__helios__data]__take_end"
        )
    )
    add(
        new RawFunc(
            `__helios__list[__helios__data]__take_end`,
            `(self) -> {
		(n) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						(callback) -> {callback(0, lst)}
					},
					() -> {
						recurse(recurse, __core__tailList__safe(lst))(
							(count, tail) -> {
								__core__ifThenElse(
									__core__equalsInteger(count, n),
									() -> {
										(callback) -> {callback(count, tail)}
									},
									() -> {
										(callback) -> {
											callback(
												__core__addInteger(count, 1),
												lst
											)
										}
									}
								)()
							}
						)
					}
				)()
			};
			__core__ifThenElse(
				__core__lessThanInteger(n, 0),
				() -> {
					__helios__error("negative n in take_end")
				},
				() -> {
					recurse(recurse, self)(
						(count, result) -> {
							__core__ifThenElse(
								__core__lessThanInteger(count, n),
								() -> {
									__helios__error("list too short")
								},
								() -> {
									result
								}
							)()
						}
					)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__any`,
            `(self) -> {
		(fn) -> {
			__helios__common__any(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__all`,
            `(self) -> {
		(fn) -> {
			__helios__common__all(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[__helios__data]__append`,
            `(self) -> {
		(item) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						__core__mkCons(item, lst)
					},
					() -> {
						__core__mkCons(__core__headList__safe(lst), recurse(recurse, __core__tailList__safe(lst)))
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__append`,
            `(self) -> {
		(item) -> {
			__helios__list[__helios__data]__append(self)(${TTPP}0____to_data(item))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__prepend`,
            `(self) -> {
		(item) -> {
			__core__mkCons(${TTPP}0____to_data(item), self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__find`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {__helios__error("not found")}, 
					() -> {
						item = ${TTPP}0__from_data(__core__headList__safe(lst));
						__core__ifThenElse(
							fn(item), 
							() -> {item}, 
							() -> {recurse(recurse, __core__tailList__safe(lst))}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__find_index`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, lst, i) -> {
				__core__chooseList(
					lst,
					() -> {-1},
					() -> {
						item = ${TTPP}0__from_data(__core__headList__safe(lst));
						__core__ifThenElse(
							fn(item),
							() -> {i},
							() -> {recurse(recurse, __core__tailList__safe(lst), __core__addInteger(i, 1))}
						)()
					}
				)()
			};
			recurse(recurse, self, 0)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__find_safe`,
            `(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(item) -> {
					fn(${TTPP}0__from_data(item))
				},
				__helios__common__identity
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__filter`,
            `(self) -> {
		(fn) -> {
			__helios__common__filter_list(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__for_each`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						()
					},
					() -> {
						__core__chooseUnit(
							fn(${TTPP}0__from_data(__core__headList__safe(lst))),
							recurse(recurse, __core__tailList__safe(lst))
						)
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__fold[${FTPP}0]`,
            `(self) -> {
		(fn, a0) -> {
			__helios__common__fold(
				self, 
				(prev, item) -> {
					fn(prev, ${TTPP}0__from_data(item))
				}, 
				a0
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__fold2[${FTPP}0@${FTPP}1]`,
            `(self) -> {
		(fn, a0, b0) -> {
			__helios__common__fold(
				self,
				(prev, item) -> {
					prev(
						(a, b) -> {
							fn(a, b, ${TTPP}0__from_data(item))
						}
					)
				},
				(callback) -> {
					callback(a0, b0)
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__fold3[${FTPP}0@${FTPP}1@${FTPP}2]`,
            `(self) -> {
		(fn, a0, b0, c0) -> {
			__helios__common__fold(
				self,
				(prev, item) -> {
					prev(
						(a, b, c) -> {
							fn(a, b, c, ${TTPP}0__from_data(item))
						}
					)
				},
				(callback) -> {
					callback(a0, b0, c0)
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__fold_lazy[${FTPP}0]`,
            `(self) -> {
		(fn, a0) -> {
			__helios__common__fold_lazy(
				self, 
				(item, next) -> {
					fn(${TTPP}0__from_data(item), next)
				},
				a0
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__fold2_lazy[${FTPP}0@${FTPP}1]`,
            `(self) -> {
		(fn, a0, b0) -> {
			__helios__common__fold_lazy(
				self, 
				(item, next) -> {
					fn(${TTPP}0__from_data(item), next)
				},
				(callback) -> {
					callback(a0, b0)
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__map[${FTPP}0]`,
            `(self) -> {
		(fn) -> {
			__helios__common__map(
				self, 
				(item) -> {
					${FTPP}0____to_data(fn(${TTPP}0__from_data(item)))
				}, 
				__core__mkNilData(())
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__map_option[${FTPP}0]`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						lst
					},
					() -> {
						head = ${TTPP}0__from_data(__core__headList__safe(lst));
						tail = recurse(recurse, __core__tailList__safe(lst));
						opt = __core__unConstrData(fn(head));
						__core__ifThenElse(
							__core__equalsInteger(__core__fstPair(opt), 0),
							() -> {
								__core__mkCons(
									__core__headList(__core__sndPair(opt)),
									tail
								)
							},	
							() -> {
								tail
							}
						)()
						
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__sort`,
            `(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(${TTPP}0__from_data(a), ${TTPP}0__from_data(b))
				}
			)
		}
	}`
        )
    )

    // List specials
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__sum`,
            `(self) -> {
		() -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						0
					},
					() -> {
						${TTPP}0____add(
							${TTPP}0__from_data(__core__headList__safe(lst)),
							recurse(recurse, __core__tailList__safe(lst))
						)
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__string]__join",
            `(self) -> {
		(__useopt__separator, separator) -> {
			separator = __core__ifThenElse(__useopt__separator, separator, "");
			recurse = (recurse, lst, sep) -> {
				__core__chooseList(
					lst,
					() -> {
						""
					},
					() -> {
						__helios__string____add(
							__helios__string____add(
								sep,
								__helios__string__from_data(__core__headList__safe(lst))
							),
							recurse(recurse, __core__tailList__safe(lst), separator)
						)
					}
				)()
			};
			recurse(recurse, self, "")
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__list[__helios__bytearray]__join",
            `(self) -> {
		(__useopt__separator, separator) -> {
			separator = __core__ifThenElse(__useopt__separator, separator, #);
			recurse = (recurse, lst, sep) -> {
				__core__chooseList(
					lst,
					() -> {
						#
					},
					() -> {
						__helios__bytearray____add(
							__helios__bytearray____add(
								sep,
								__core__unBData(__core__headList__safe(lst))
							),
							recurse(recurse, __core__tailList__safe(lst), separator)
						)
					}
				)()
			};
			recurse(recurse, self, #)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__list[${TTPP}0]__flatten`,
            `(self) -> {
		() -> {
			recurse = (recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {
						__core__mkNilData(())
					},
					() -> {
						__helios__list[${TTPP}0]____add(
							__core__unListData(__core__headList__safe(lst)),
							recurse(recurse, __core__tailList__safe(lst))
						)
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )

    // Map builtins
    addSerializeFunc(`__helios__map[${TTPP}0@${TTPP}1]`)
    addNeqFunc(`__helios__map[${TTPP}0@${TTPP}1]`)
    addDataLikeEqFunc(`__helios__map[${TTPP}0@${TTPP}1]`)
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__is_valid_data_internal`,
            `(map) -> {
		recurse = (recurse, map) -> {
			__core__chooseList(
				map,
				() -> {
					true
				},
				() -> {
					head = __core__headList__safe(map);
					__core__ifThenElse(
						${TTPP}0__is_valid_data(__core__fstPair(head)),
						() -> {
							__core__ifThenElse(
								${TTPP}1__is_valid_data(__core__sndPair(head)),
								() -> {
									recurse(recurse, __core__tailList__safe(map))
								},
								() -> {
									false
								}
							)()
						},
						() -> {
							false
						}
					)()
				}
			)()
		};
		recurse(recurse, map)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__from_data`,
            `(data) -> {
		map = __core__unMapData(data);
		_ = __core__ifThenElse(
			__helios__map[${TTPP}0@${TTPP}1]__is_valid_data_internal(map),
			() -> {
				()
			},
			() -> {
				__core__trace("Warning: invalid map data", ())
			}
		)();
		map
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__from_data_safe`,
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {
				__helios__option__SOME_FUNC(__core__unMapData__safe(data))
			},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__show`,
            `(self) -> {
		() -> {
			recurse = (recurse, self, first) -> {
				__core__chooseList(
					self,
					() -> {
						""
					},
					() -> {
						__core__appendString(
							__core__ifThenElse(
								first,
								() -> {""},
								() -> {", "}
							)(),
							head = __core__headList__safe(self);
							key = ${TTPP}0__from_data_safe(__core__fstPair(head));
							value = ${TTPP}1__from_data_safe(__core__sndPair(head));
							__core__appendString(
								__core__appendString(
									__core__appendString(
										key(
											(valid, key) -> {
												__core__ifThenElse(
													valid,
													() -> {
														${TTPP}0__show(key)()
													},
													() -> {
														"<n/a>"
													}
												)()
											}
										),
										": "
									),
									value(
										(valid, value) -> {
											__core__ifThenElse(
												valid,
												() -> {
													${TTPP}1__show(value)()
												},
												() -> {
													"<n/a>"
												}
											)
										}
									)
								),
								recurse(recurse, __core__tailList__safe(self), false)
							)
						)
					}
				)()
			};
			__core__appendString(
				"{",
				__core__appendString(
					recurse(recurse, self, true),
					"}"
				)
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__is_valid_data`,
            `(data) -> {
		__core__chooseData(
			data,
			() -> {false},
			() -> {
				__helios__map[${TTPP}0@${TTPP}1]__is_valid_data_internal(__core__unMapData__safe(data))
			},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]____to_data`,
            "__core__mapData"
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]____add`,
            "__helios__common__concat"
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__prepend`,
            `(self) -> {
		(key, value) -> {
			__core__mkCons(__core__mkPairData(${TTPP}0____to_data(key), ${TTPP}1____to_data(value)), self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[__helios__data@__helios__data]__append`,
            `(self) -> {
		(key, value) -> {
			__helios__list[__helios__data]__append(self)(__core__mkPairData(key, value))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__append`,
            `(self) -> {
		(key, value) -> {
			__helios__map[__helios__data@__helios__data]__append(self)(${TTPP}0____to_data(key), ${TTPP}1____to_data(value))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__head`,
            `(self) -> {
		head = __core__headList(self);
		(callback) -> {
			callback(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head)))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__head_key`,
            `(self) -> {
		${TTPP}0__from_data(__core__fstPair(__core__headList(self)))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__head_value`,
            `(self) -> {
		${TTPP}1__from_data(__core__sndPair(__core__headList(self)))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__length`,
            `(self) -> {
		__helios__common__length(self)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__tail`,
            "__core__tailList"
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__is_empty`,
            `(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__get`,
            `(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {${TTPP}1__from_data(x)}, 
				() -> {__helios__error("key not found")}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__get_safe`,
            `(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {
					__core__constrData(0, __helios__common__list_1(x))
				}, 
				() -> {
					__core__constrData(1, __helios__common__list_0)
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__all`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
			};
			__helios__common__all(self, fn)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__all_keys`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(
					${TTPP}0__from_data(__core__fstPair(pair))
				)
			};
			__helios__common__all(self, fn)
		}	
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__all_values`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(
					${TTPP}1__from_data(__core__sndPair(pair))
				)
			};
			__helios__common__all(self, fn)
		}	
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__any`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
			};
			__helios__common__any(self, fn)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__any_key`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(${TTPP}0__from_data(__core__fstPair(pair)))
			};
			__helios__common__any(self, fn)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__any_value`,
            `(self) -> {
		(fn) -> {
			fn = (pair) -> {
				fn(${TTPP}1__from_data(__core__sndPair(pair)))
			};
			__helios__common__any(self, fn)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__delete`,
            `(self) -> {
		(key) -> {
			key = ${TTPP}0____to_data(key);
			recurse = (recurse, self) -> {
				__core__chooseList(
					self,
					() -> {self},
					() -> {
						head = __core__headList__safe(self);
						tail = __core__tailList__safe(self);
						__core__ifThenElse(
							__core__equalsData(key, __core__fstPair(head)),
							() -> {recurse(recurse, tail)},
							() -> {__core__mkCons(head, recurse(recurse, tail))}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__filter`,
            `(self) -> {
		(fn) -> {
			__helios__common__filter_map(
				self, 
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, self) -> {
				__core__chooseList(
					self, 
					() -> {__helios__error("not found")}, 
					() -> {
						head = __core__headList__safe(self);
						key = ${TTPP}0__from_data(__core__fstPair(head));
						value = ${TTPP}1__from_data(__core__sndPair(head));
						__core__ifThenElse(
							fn(key, value), 
							() -> {
								(callback) -> {
									callback(key, value)
								}
							}, 
							() -> {
								recurse(recurse, __core__tailList__safe(self))
							}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find_safe`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {
						(callback) -> {
							callback(() -> {__helios__error("not found")}, false)
						}
					}, 
					() -> {
						head = __core__headList__safe(self);
						key = ${TTPP}0__from_data(__core__fstPair(head));
						value = ${TTPP}1__from_data(__core__sndPair(head));
						__core__ifThenElse(
							fn(key, value), 
							() -> {
								(callback) -> {
									callback(
										() -> {
											(callback) -> {
												callback(key, value)
											}
										},
										true
									)
								}
							}, 
							() -> {
								recurse(recurse, __core__tailList__safe(self), fn)
							}
						)()
					}
				)()
			};
			recurse(recurse, self, fn)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find_key`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__error("not found")}, 
					() -> {
						item = ${TTPP}0__from_data(__core__fstPair(__core__headList__safe(map)));
						__core__ifThenElse(
							fn(item), 
							() -> {item}, 
							() -> {recurse(recurse, __core__tailList__safe(map))}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find_key_safe`,
            `(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)))
				},
				__core__fstPair
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find_value`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__error("not found")}, 
					() -> {
						item = ${TTPP}1__from_data(__core__sndPair(__core__headList__safe(map)));
						__core__ifThenElse(
							fn(item), 
							() -> {item}, 
							() -> {recurse(recurse, __core__tailList__safe(map))}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__find_value_safe`,
            `(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}1__from_data(__core__sndPair(pair)))
				},
				__core__sndPair
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__map[${FTPP}0@${FTPP}1]`,
            `(self) -> {
		(fn) -> {
			__helios__common__map(
				self,
				(pair) -> {
					mapped_pair = fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)));
					mapped_pair(
						(key, value) -> {
							__core__mkPairData(${FTPP}0____to_data(key), ${FTPP}1____to_data(value))
						}
					)
				}, 
				__core__mkNilPairData(())
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__fold[${FTPP}0]`,
            `(self) -> {
		(fn, z) -> {
			__helios__common__fold(self,
				(z, pair) -> {
					fn(z, ${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}, 
				z
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__fold_lazy[${FTPP}0]`,
            `(self) -> {
		(fn, z) -> {
			__helios__common__fold_lazy(self, 
				(pair, next) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)), next)
				}, 
				z
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__for_each`,
            `(self) -> {
		(fn) -> {
			recurse = (recurse, map) -> {
				__core__chooseList(
					map,
					() -> {
						()
					},
					() -> {
						head = __core__headList__safe(map);
						__core__chooseUnit(
							fn(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head))),
							recurse(recurse, __core__tailList__safe(map))
						)
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__set`,
            `(self) -> {
		(key, value) -> {
			key = ${TTPP}0____to_data(key);
			value = ${TTPP}1____to_data(value);
			recurse = (recurse, self) -> {
				__core__chooseList(
					self,
					() -> {
						__core__mkCons(__core__mkPairData(key, value), __core__mkNilPairData(()))
					},
					() -> {
						head = __core__headList__safe(self);
						tail = __core__tailList__safe(self);
						__core__ifThenElse(
							__core__equalsData(key, __core__fstPair(head)),
							() -> {
								__core__mkCons(__core__mkPairData(key, value), tail)
							},
							() -> {
								__core__mkCons(head, recurse(recurse, tail))
							}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__to_iterator`,
            `(self) -> {
		() -> {
			recurse = (recurse, map) -> {
				(callback) -> {
					__core__chooseList(
						map,
						() -> {
							callback(true, (), (), ())
						},
						() -> {
							head = __core__headList__safe(map);
							callback(
								false, 
								${TTPP}0__from_data(__core__fstPair(head)),
								${TTPP}1__from_data(__core__sndPair(head)),
								recurse(recurse, __core__tailList__safe(map))
							)
						}
					)()
				}
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__from_iterator`,
            `(iterator) -> {
		recurse = (recurse, iterator) -> {
			iterator(
				(is_null, head0, head1, next_iterator) -> {
					__core__ifThenElse(
						is_null,
						() -> {
							__core__mkNilPairData(())
						},
						() -> {
							__core__mkCons(
								__core__mkPairData(${TTPP}0____to_data(head0), ${TTPP}1____to_data(head1)),
								recurse(recurse, next_iterator)
							)
						}
					)()
				}
			)
		};
		recurse(recurse, iterator)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__update`,
            `(self) -> {
		(key, fn) -> {
			key = ${TTPP}0____to_data(key);
			recurse = (recurse, map) -> {
				__core__chooseList(
					map,
					() -> {
						__helios__error("key not found")
					},
					() -> {
						pair = __core__headList__safe(map);
						__core__ifThenElse(
							__core__equalsData(key, __core__fstPair(pair)),
							() -> {
								__core__mkCons(
									__core__mkPairData(
										key,
										${TTPP}1____to_data(fn(${TTPP}1__from_data(__core__sndPair(pair))))
									),
									__core__tailList(map)
								)
							},
							() -> {
								__core__mkCons(pair, recurse(recurse, __core__tailList__safe(map)))
							}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__update_safe`,
            `(self) -> {
		(key, fn) -> {
			key = ${TTPP}0____to_data(key);
			__helios__common__map(
				self,
				(pair) -> {
					oldKey = __core__fstPair(pair);
					oldValue = __core__sndPair(pair);
					newValue = __core__ifThenElse(
						__core__equalsData(oldKey, key),
						() -> {
							${TTPP}1____to_data(fn(${TTPP}1__from_data(oldValue)))
						},
						() -> {
							oldValue
						}
					)();
					__core__mkPairData(oldKey, newValue)
				}, 
				__core__mkNilPairData(())
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__map[${TTPP}0@${TTPP}1]__sort`,
            `(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(
						${TTPP}0__from_data(__core__fstPair(a)), 
						${TTPP}1__from_data(__core__sndPair(a)), 
						${TTPP}0__from_data(__core__fstPair(b)),
						${TTPP}1__from_data(__core__sndPair(b))
					)
				}
			)
		}
	}`
        )
    )

    // Option[T] builtins
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__is_valid_data`,
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				pair = __core__unConstrData__safe(data);
				index = __core__fstPair(pair);
				fields = __core__sndPair(pair);
				__core__ifThenElse(
					__core__equalsInteger(index, 0),
					() -> {
						__core__chooseList(
							fields,
							() -> {
								false
							},
							() -> {
								__core__chooseList(
									__core__tailList__safe(fields),
									() -> {
										${TTPP}0__is_valid_data(__core__headList__safe(fields))
									},
									() -> {
										false
									}
								)()
							}
						)()
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(index, 1),
							() -> {
								__core__chooseList(
									fields,
									true,
									false
								)
							},
							() -> {
								false
							}
						)()
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    addDataFuncs(`__helios__option[${TTPP}0]`, {
        from_data: `(data) -> {
			_ = __core__ifThenElse(
				__helios__option[${TTPP}0]__is_valid_data(data),
				() -> {
					()
				},
				() -> {
					__core__trace("Warning: invalid option data", ())
				}
			)();
			data
		}`,
        from_data_safe: `(data) -> {
			__core__chooseData(
				data,
				() -> {
					__helios__option__SOME_FUNC(data)
				},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC}
			)()
		}`
    })
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__map[${FTPP}0]`,
            `(self) -> {
		(fn) -> {
			pair = __core__unConstrData(self);
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 0),
				() -> {
					__helios__option[${FTPP}0]__some__new(
						fn(
							${TTPP}0__from_data(
								__core__headList(__core__sndPair(pair))
							)
						)
					)
				},
				() -> {
					__helios__option[${FTPP}0]__none__new()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__unwrap`,
            `(self) -> {
		() -> {
			${TTPP}0__from_data(__helios__common__enum_field_0(self))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__show`,
            `(self) -> {
		__core__chooseData(
			self,
			() -> {
				pair = __core__unConstrData__safe(self);
				index = __core__fstPair(pair);
				__core__ifThenElse(
					__core__equalsInteger(index, 0),
					() -> {
						fields = __core__sndPair(pair);
						__core__chooseList(
							fields,
							() -> {
								"Option::Some{<n/a>}"
							},
							() -> {
								some = ${TTPP}0__from_data_safe(__core__headList__safe(fields));
								some(
									(valid, value) -> {
										__core__ifThenElse(
											valid,
											() -> {
												__core__appendString(
													"Option::Some{",
													__core__appendString(
														${TTPP}0__show(value)(),
														"}"
													)
												)
											},
											() -> {
												"Option::Some{<n/a>}"
											}
										)()
									}
								)
							}
						)()
					},
					() -> {
						"Option::None"
					}
				)()
			},
			() -> {"Option{<n/a>}"},
			() -> {"Option{<n/a>}"},
			() -> {"Option{<n/a>}"},
			() -> {"Option{<n/a>}"}
		)
	}`
        )
    )

    // Option[T]::Some
    addEnumDataFuncs(`__helios__option[${TTPP}0]__some`, 0)
    add(
        new RawFunc(
            "__helios__option__SOME_FUNC",
            `(some) -> {
		(callback) -> {callback(true, some)}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__some____new`,
            `(some) -> {
		__core__constrData(0, __helios__common__list_1(${TTPP}0____to_data(some)))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__some__new`,
            `__helios__option[${TTPP}0]__some____new`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__some__cast`,
            `(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__some__some`,
            `(self) -> {
		${TTPP}0__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option__is_some`,
            `(data) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), 0)
	}`
        )
    )

    // Option[T]::None
    addEnumDataFuncs(`__helios__option[${TTPP}0]__none`, 1)
    add(
        new RawFunc(
            "__helios__option__NONE",
            "__core__constrData(1, __helios__common__list_0)"
        )
    )
    add(
        new RawFunc(
            "__helios__option__NONE_FUNC",
            `(callback) -> {callback(false, ())}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__none____new`,
            `() -> {
		__helios__option__NONE
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__none__new`,
            `__helios__option[${TTPP}0]__none____new`
        )
    )
    add(
        new RawFunc(
            `__helios__option[${TTPP}0]__none__cast`,
            `(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`
        )
    )

    // ScriptHash builtin
    addByteArrayLikeFuncs("__helios__scripthash")
    add(
        new RawFunc(
            "__helios__scripthash__is_valid_data",
            `(data) -> {__helios__bytearray__is_valid_data_fixed_length(data, 28)}`
        )
    )

    for (let hash of [
        "pubkeyhash",
        "validatorhash",
        "mintingpolicyhash",
        "stakingvalidatorhash",
        "datumhash"
    ]) {
        // Hash builtins
        addByteArrayLikeFuncs(`__helios__${hash}`)
        add(
            new RawFunc(
                `__helios__${hash}__is_valid_data`,
                `(data) -> {
			__helios__bytearray__is_valid_data_fixed_length(data, ${hash == "datumhash" ? 32 : 28})
		}`
            )
        )
        add(
            new RawFunc(
                `__helios__${hash}__from_script_hash`,
                "__helios__common__identity"
            )
        )
        add(
            new RawFunc(
                `__helios__${hash}__to_script_hash`,
                `(self) -> {
					() -> {
						__helios__common__identity(self)
					}
				}`
            )
        )
    }

    // PubKey builtin
    addByteArrayLikeFuncs("__helios__pubkey")
    add(
        new RawFunc(
            "__helios__pubkey__is_valid_data",
            `(data) -> {__helios__bytearray__is_valid_data_fixed_length(data, 32)}`
        )
    )
    add(
        new RawFunc(
            "__helios__pubkey__verify",
            `(self) -> {
		(message, signature) -> {
			__core__verifyEd25519Signature(self, message, signature)
		}
	}`
        )
    )

    // ScriptContext builtins
    add(new RawFunc("__helios__scriptcontext__data", "__CONTEXT"))
    add(
        new RawFunc(
            "__helios__scriptcontext__new_spending",
            `(tx, output_id) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(1, __helios__common__list_1(output_id))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__new_minting",
            `(tx, mph) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(
				0, 
				__helios__common__list_1(
					__helios__mintingpolicyhash____to_data(mph)
				)
			)
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__new_rewarding",
            `(tx, cred) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(2, __helios__common__list_1(cred))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__new_certifying",
            `(tx, dcert) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(3, __helios__common__list_1(dcert))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__tx",
            "__helios__common__enum_field_0(__helios__scriptcontext__data)"
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__purpose",
            "__helios__common__enum_field_1(__helios__scriptcontext__data)"
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_current_input",
            `() -> {
		id = __helios__scriptcontext__get_spending_purpose_output_id();
		recurse = (recurse, lst) -> {
			__core__chooseList(
				lst,
				() -> {__helios__error("not found")},
				() -> {
					item = __core__headList__safe(lst);
					__core__ifThenElse(
						__core__equalsData(__helios__txinput__output_id(item), id),
						() -> {item},
						() -> {recurse(recurse, __core__tailList__safe(lst))}
					)()
				}
			)()
		};
		recurse(recurse, __helios__tx__inputs(__helios__scriptcontext__tx))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_cont_outputs",
            `() -> {
		vh = __helios__scriptcontext__get_current_validator_hash();
		outputs = __helios__tx__outputs(__helios__scriptcontext__tx);
		__helios__common__filter_list(
			outputs,
			(output) -> {
				credential = __helios__address__credential(__helios__txoutput__address(output));
				pair = __core__unConstrData(credential);
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {
						false
					},
					() -> {
						__core__equalsByteString(__core__unBData(__core__headList(__core__sndPair(pair))), vh)
					}
				)()
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_spending_purpose_output_id",
            `() -> {
		__helios__common__enum_field_0(__helios__scriptcontext__purpose)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_current_validator_hash",
            `() -> {
		__helios__spendingcredential__validator__hash(
			__helios__spendingcredential__validator__cast(
				__helios__address__credential(
					__helios__txoutput__address(
						__helios__txinput__output(
							__helios__scriptcontext__get_current_input()
						)
					)
				)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_current_minting_policy_hash",
            `() -> {
		__helios__mintingpolicyhash__from_data(__helios__scriptcontext__get_spending_purpose_output_id())
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_current_staking_validator_hash",
            `() -> {
		pair = __core__unConstrData(__helios__scriptcontext__purpose);
		tag = __core__fstPair(pair);
		data = __core__headList(__core__sndPair(pair));

		hash = __core__ifThenElse(
			__core__equalsInteger(tag, 2),
			() -> {
				// rewarding
				__helios__common__enum_field_0(__helios__common__enum_field_0(data))
			},
			() -> {
				// certifying
				__helios__common__enum_field_0(__helios__common__enum_field_0(__helios__common__enum_field_0(data)))
			}
		)();

		__helios__stakingvalidatorhash__from_data(hash)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_current_script_hash",
            `() -> {
				tag = __helios__data__tag(__helios__scriptcontext__purpose);

				__core__ifThenElse(
					__core__equalsInteger(tag, 0),
					__helios__scriptcontext__get_current_minting_policy_hash,
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(tag, 1),
							__helios__scriptcontext__get_current_validator_hash,
							__helios__scriptcontext__get_current_staking_validator_hash
						)()
					}
				)()
			}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_staking_purpose",
            `() -> {
		__helios__scriptcontext__purpose
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptcontext__get_script_purpose",
            `() -> {
		__helios__scriptcontext__purpose
	}`
        )
    )

    // ContractContext builtin
    addDataFuncs("__helios__contractcontext")
    add(
        new RawFunc(
            "__helios__contractcontext__now",
            `(self) -> {
		() -> {
			__core__macro__now(())
		}
	}`
        )
    )
    add(new RawFunc("__helios__contractcontext__agent", `(self) -> {self}`))
    add(new RawFunc("__helios__contractcontext__network", `(self) -> {()}`))
    add(
        new RawFunc(
            "__helios__contractcontext__new_tx_builder",
            `(self) -> {__helios__txbuilder__new_empty}`
        )
    )

    // Network builtin
    add(
        new RawFunc(
            "__helios__network__pick",
            `(self) -> {
		(address, value) -> {
			__core__macro__pick(__helios__address____to_data(address), __helios__value____to_data(value), ())
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__network__get",
            `(self) -> {
		(id) -> {
			__core__macro__get_utxo(__helios__txoutputid____to_data(id), ())
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__network__utxos_at",
            `(self) -> {
		(addr) -> {
			__helios__list[__helios__data]__to_iterator(
				__core__macro__utxos_at(__helios__address____to_data(addr), ())
			)()
		}
	}`
        )
    )

    // Wallet builtin
    addDataFuncs("__helios__wallet")
    add(
        new RawFunc(
            "__helios__wallet__address",
            `(self) -> {__helios__common__enum_field_1(self)}`
        )
    )
    add(
        new RawFunc(
            "__helios__wallet__hash",
            `(self) -> {
		__helios__spendingcredential__pubkey__hash(
			__helios__spendingcredential__pubkey__cast(
				__helios__address__credential(
					__helios__common__enum_field_0(self)
				)
			)
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__wallet__pick",
            `(self) -> {
		(value) -> {
			__core__macro__pick(__helios__common__enum_field_0(self), __helios__value____to_data(value), ())
		}
	}`
        )
    )

    // StakingPurpose builtins
    addDataFuncs("__helios__stakingpurpose")
    add(
        new RawFunc(
            "__helios__stakingpurpose__testdata",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )

    // StakingPurpose::Rewarding builtins
    addEnumDataFuncs("__helios__stakingpurpose__rewarding", 2)
    add(
        new RawFunc(
            "__helios__stakingpurpose__rewarding__credential",
            "__helios__common__enum_field_0"
        )
    )

    // StakingPurpose::Certifying builtins
    addEnumDataFuncs("__helios__stakingpurpose__certifying", 3)
    add(
        new RawFunc(
            "__helios__stakingpurpose__certifying__dcert",
            "__helios__common__enum_field_0"
        )
    )

    // ScriptPurpose builtins
    addDataFuncs("__helios__scriptpurpose")
    // TODO: test fields
    add(
        new RawFunc(
            "__helios__scriptpurpose__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptpurpose__new_minting",
            `(mph) -> {
		__core__constrData(0, __helios__common__list_1(__helios__mintingpolicyhash____to_data(mph)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptpurpose__new_spending",
            `(output_id) -> {
		__core__constrData(1, __helios__common__list_1(output_id))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptpurpose__new_rewarding",
            `(cred) -> {
		__core__constrData(2, __helios__common__list_1(cred))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__scriptpurpose__new_certifying",
            `(action) -> {
		__core__constrData(3, __helios__common__list_1(action))
	}`
        )
    )

    // ScriptPurpose::Minting builtins
    addEnumDataFuncs("__helios__scriptpurpose__minting", 0)
    add(
        new RawFunc(
            "__helios__scriptpurpose__minting__policy_hash",
            `(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )

    // ScriptPurpose::Spending builtins
    addEnumDataFuncs("__helios__scriptpurpose__spending", 1)
    add(
        new RawFunc(
            "__helios__scriptpurpose__spending__output_id",
            "__helios__common__enum_field_0"
        )
    )

    // ScriptPurpose::Rewarding builtins
    addEnumDataFuncs("__helios__scriptpurpose__rewarding", 2)
    add(
        new RawFunc(
            "__helios__scriptpurpose__rewarding__credential",
            "__helios__common__enum_field_0"
        )
    )

    // ScriptPurpose::Certifying builtins
    addEnumDataFuncs("__helios__scriptpurpose__certifying", 3)
    add(
        new RawFunc(
            "__helios__scriptpurpose__certifying__dcert",
            "__helios__common__enum_field_0"
        )
    )

    // DCert builtins
    addDataFuncs("__helios__dcert")
    // TODO: test each enum variant
    add(
        new RawFunc(
            "__helios__dcert__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__new_register",
            `(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__new_deregister",
            `(cred) -> {
		__core__constrData(1, __helios__common__list_1(cred))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__new_delegate",
            `(cred, pool_id) -> {
		__core__constrData(2, __helios__common__list_2(cred, __helios__pubkeyhash____to_data(pool_id)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__new_register_pool",
            `(id, vrf) -> {
		__core__constrData(3, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__pubkeyhash____to_data(vrf)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__new_retire_pool",
            `(id, epoch) -> {
		__core__constrData(4, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__int____to_data(epoch)))
	}`
        )
    )

    // DCert::Register builtins
    addEnumDataFuncs("__helios__dcert__register", 0)
    add(
        new RawFunc(
            "__helios__dcert__register__credential",
            "__helios__common__enum_field_0"
        )
    )

    // DCert::Deregister builtins
    addEnumDataFuncs("__helios__dcert__deregister", 1)
    add(
        new RawFunc(
            "__helios__dcert__deregister__credential",
            "__helios__common__enum_field_0"
        )
    )

    // DCert::Delegate builtins
    addEnumDataFuncs("__helios__dcert__delegate", 2)
    add(
        new RawFunc(
            "__helios__dcert__delegate__delegator",
            "__helios__common__enum_field_0"
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__delegate__pool_id",
            `(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__enum_field_1(self))
	}`
        )
    )

    // DCert::RegisterPool builtins
    addEnumDataFuncs("__helios__dcert__registerpool", 3)
    add(
        new RawFunc(
            "__helios__dcert__registerpool__pool_id",
            `(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__registerpool__pool_vrf",
            `(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__enum_field_1(self))
	}`
        )
    )

    // DCert::RetirePool builtins
    addEnumDataFuncs("__helios__dcert__retirepool", 4)
    add(
        new RawFunc(
            "__helios__dcert__retirepool__pool_id",
            `(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__dcert__retirepool__epoch",
            `(self) -> {
		__helios__int__from_data(__helios__common__enum_field_1(self))
	}`
        )
    )

    // TxBuilder builtins
    addDataFuncs("__helios__txbuilder")
    add(
        new RawFunc(
            `__helios__txbuilder__new`,
            `(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
		__core__constrData(0, __helios__common__list_12(
			__core__listData(inputs),
			__core__listData(ref_inputs),
			__core__listData(outputs),
			__core__mapData(fee),
			__core__mapData(minted),
			__core__listData(dcerts),
			__core__mapData(withdrawals),
			__helios__timerange____to_data(validity),
			__core__listData(signatories),
			__core__mapData(redeemers),
			__core__mapData(datums),
			__helios__txid__new(#00010203040506070809101112131415161718192021222324252627)
		))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__new_empty`,
            `() -> {
		__helios__txbuilder__new(
			__core__mkNilData(()),
			__core__mkNilData(()),
			__core__mkNilData(()),
			__core__mkNilPairData(()),
			__core__mkNilPairData(()),
			__core__mkNilData(()),
			__core__mkNilPairData(()),
			__helios__timerange__ALWAYS,
			__core__mkNilData(()),
			__core__mkNilPairData(()),
			__core__mkNilPairData(())
		)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__unwrap`,
            `(self, callback) -> {
		fields = __core__sndPair(__core__unConstrData(self));
		inputs = __core__unListData(__core__headList(fields));
		fields = __core__tailList(fields);
		ref_inputs = __core__unListData(__core__headList(fields));
		fields = __core__tailList(fields);
		outputs = __core__unListData(__core__headList(fields));
		fields = __core__tailList(fields);
		fee = __core__unMapData(__core__headList(fields));
		fields = __core__tailList(fields);
		minted = __core__unMapData(__core__headList(fields));
		fields = __core__tailList(fields);
		dcerts = __core__unListData(__core__headList(fields));
		fields = __core__tailList(fields);
		withdrawals = __core__unMapData(__core__headList(fields));
		fields = __core__tailList(fields);
		validity = __helios__timerange__from_data(__core__headList(fields));
		fields = __core__tailList(fields);
		signatories = __core__unListData(__core__headList(fields));
		fields = __core__tailList(fields);
		redeemers = __core__unMapData(__core__headList(fields));
		fields = __core__tailList(fields);
		datums = __core__unMapData(__core__headList(fields));
		fields = __core__tailList(fields);
		callback(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__spend`,
            `(self) -> {
		(input) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					__helios__list[__helios__data]__append(inputs)(__helios__txinput____to_data(input)),
					ref_inputs,
					outputs, 
					fee, 
					minted, 
					dcerts, 
					withdrawals, 
					validity, 
					signatories, 
					redeemers, 
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__spend_many`,
            `(self) -> {
		(extra_inputs) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					__helios__common__concat(inputs, extra_inputs),
					ref_inputs,
					outputs, 
					fee, 
					minted, 
					dcerts, 
					withdrawals, 
					validity, 
					signatories, 
					redeemers, 
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__redeem[${FTPP}0]`,
            `(self) -> {
		(input, redeemer) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					__helios__list[__helios__data]__append(inputs)(
						__helios__txinput____to_data(input)
					),
					ref_inputs, 
					outputs, 
					fee, 
					minted, 
					dcerts, 
					withdrawals, 
					validity, 
					signatories,
					__helios__map[__helios__data@__helios__data]__append(redeemers)(
						__helios__scriptpurpose__new_spending(__helios__txinput__output_id(input)),
						${FTPP}0____to_data(redeemer)
					),
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__redeem_many[${FTPP}0]`,
            `(self) -> {
		(inputs, redeemer) -> {
			recurse = (recurse, inputs) -> {
				__core__chooseList(
					inputs,
					() -> {
						self
					},
					() -> {
						__helios__txbuilder__redeem[${FTPP}0](
							recurse(recurse, __core__tailList__safe(inputs))
						)(
							__core__headList__safe(inputs),
							redeemer
						)
					}
				)()
			};
			recurse(recurse, inputs)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__add_output`,
            `(self) -> {
		(output) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					inputs,
					ref_inputs,
					__helios__list[__helios__data]__append(outputs)(
						__helios__txoutput____to_data(output)
					),
					fee,
					minted,
					dcerts,
					withdrawals,
					validity,
					signatories,
					redeemers,
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__add_outputs`,
            `(self) -> {
		(extra_outputs) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					inputs,
					ref_inputs,
					__helios__common__concat(outputs, extra_outputs),
					fee,
					minted,
					dcerts,
					withdrawals,
					validity,
					signatories,
					redeemers,
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__pay[${FTPP}0]`,
            `(self) -> {
		(address, value, datum) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					inputs,
					ref_inputs,
					__helios__list[__helios__data]__append(outputs)(
						__helios__txoutput____to_data(
							__helios__txoutput__new(
								address, 
								value, 
								__helios__txoutputdatum__new_inline[__helios__data](
									${FTPP}0____to_data(datum)
								)
							)
						)
					),
					fee,
					minted,
					dcerts,
					withdrawals,
					validity,
					signatories,
					redeemers,
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__pay_if_true[${FTPP}0]`,
            `(self) -> {
		(cond, address, value, datum) -> {
			__core__ifThenElse(
				cond,
				() -> {
					__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
						__helios__txbuilder__new(
							inputs,
							ref_inputs,
							__helios__list[__helios__data]__append(outputs)(
								__helios__txoutput____to_data(
									__helios__txoutput__new(
										address, 
										value, 
										__helios__txoutputdatum__new_inline[__helios__data](
											${FTPP}0____to_data(datum)
										)
									)
								)
							),
							fee,
							minted,
							dcerts,
							withdrawals,
							validity,
							signatories,
							redeemers,
							datums
						)
					})
				},
				() -> {
					self
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__mint[${FTPP}0]`,
            `(self) -> {
		(value, redeemer) -> {
			__core__chooseUnit(
				__helios__assert(
					__core__equalsInteger(__helios__common__length(value), 1),
					__helios__string____add("expected a single mph in mint value, got ", __helios__int__show(__helios__common__length(value))())
				),
				mph = __helios__mintingpolicyhash__from_data(__core__fstPair(__core__headList(value)));
				__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
					__core__chooseUnit(
						__helios__assert(
							__helios__bool____not(
								__helios__value__contains_policy(minted)(mph)
							),
							"already minted before"
						),
						__helios__txbuilder__new(
							inputs,
							ref_inputs,
							outputs,
							fee,
							__helios__value____add(minted, value),
							dcerts,
							withdrawals,
							validity,
							signatories,
							__helios__map[__helios__data@__helios__data]__append(redeemers)(
								__helios__scriptpurpose__new_minting(mph),
								${FTPP}0____to_data(redeemer)
							),
							datums
						)
					)
				})
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__add_ref_input`,
            `(self) -> {
		(ref_input) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					inputs,
					__helios__list[__helios__data]__append(ref_inputs)(__helios__txinput____to_data(ref_input)),
					outputs,
					fee,
					minted,
					dcerts,
					withdrawals,
					validity,
					signatories,
					redeemers,
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__add_signer`,
            `(self) -> {
		(pk) -> {
			__helios__txbuilder__unwrap(self, (inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
				__helios__txbuilder__new(
					inputs,
					ref_inputs,
					outputs,
					fee,
					minted,
					dcerts,
					withdrawals,
					validity,
					__helios__list[__helios__data]__append(signatories)(__helios__pubkeyhash____to_data(pk)),
					redeemers,
					datums
				)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txbuilder__finalize`,
            `(self) -> {
		() -> {
			__core__macro__finalize(self, ())
		}
	}`
        )
    )

    // Tx builtins
    addDataFuncs("__helios__tx")
    // TODO: test fields
    add(
        new RawFunc(
            "__helios__tx__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__new[${FTPP}0@${FTPP}1]`,
            `(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums, txId) -> {
		__core__constrData(0, __helios__common__list_12(
			__core__listData(inputs),
			__core__listData(ref_inputs),
			__core__listData(outputs),
			__core__mapData(fee),
			__core__mapData(minted),
			__core__listData(dcerts),
			__core__mapData(withdrawals),
			__helios__timerange____to_data(validity),
			__core__listData(signatories),
			__core__mapData(redeemers),
			__core__mapData(datums),
			__helios__txid____to_data(txId)
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__inputs",
            `(self) -> {
		__core__unListData(__helios__common__enum_field_0(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__ref_inputs",
            `(self) -> {
		__core__unListData(__helios__common__enum_field_1(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__outputs",
            `(self) -> {
		__core__unListData(__helios__common__enum_field_2(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__fee",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_3(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__minted",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_4(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__dcerts",
            `(self) -> {
		__core__unListData(__helios__common__enum_field_5(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__withdrawals",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_6(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__time_range",
            "__helios__common__enum_field_7"
        )
    )
    add(
        new RawFunc(
            "__helios__tx__signatories",
            `(self) -> {
		__core__unListData(__helios__common__enum_field_8(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__redeemers",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_9(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__datums",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_10(self))
	}`
        )
    )
    add(new RawFunc("__helios__tx__id", "__helios__common__enum_field_11"))
    add(
        new RawFunc(
            `__helios__tx__find_datum_hash[${FTPP}0]`,
            `(self) -> {
		(datum) -> {
			__helios__datumhash__from_data(
				__core__fstPair(
					__helios__common__find(
						__helios__tx__datums(self),
						(pair) -> {
							__core__equalsData(__core__sndPair(pair), datum)
						}
					)
				)
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__get_datum_data",
            `(self) -> {
		(output) -> {
			output = __core__unConstrData(__helios__txoutput__datum(output));
			idx = __core__fstPair(output);
			__core__ifThenElse(
				__core__equalsInteger(idx, 1),
				() -> {
					__helios__common__map_get(
						__helios__tx__datums(self), 
						__core__headList(__core__sndPair(output)),
						__helios__common__identity,
						() -> {__helios__error("datumhash not found")}
					)
				},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(idx, 2),
						() -> {
							__core__headList(__core__sndPair(output))
						},
						() -> {__helios__error("output doesn't have a datum")}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__filter_outputs",
            `(self, fn) -> {
		__helios__common__filter_list(
			__helios__tx__outputs(self), 
			fn
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__outputs_sent_to",
            `(self) -> {
		(pkh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_sent_to(output)(pkh)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_sent_to_datum[${FTPP}0]`,
            `(self) -> {
		(pkh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_sent_to_inline_datum[${FTPP}0](self, pkh, datum)
				},
				() -> {
					__helios__tx__outputs_sent_to_datum_hash[${FTPP}0](self, pkh, datum)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_sent_to_datum_hash[${FTPP}0]`,
            `(self, pkh, datum) -> {
		datumHash = __helios__common__hash_datum_data[${FTPP}0](datum);
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pkh)
					},
					() -> {
						__helios__txoutput__has_datum_hash(output, datumHash)
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_sent_to_inline_datum[${FTPP}0]`,
            `(self, pkh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pkh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__outputs_locked_by",
            `(self) -> {
		(vh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_locked_by(output)(vh)
			})
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_locked_by_datum[${FTPP}0]`,
            `(self) -> {
		(vh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_locked_by_inline_datum[${FTPP}0](self, vh, datum)
				},
				() -> {
					__helios__tx__outputs_locked_by_datum_hash[${FTPP}0](self, vh, datum)
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_locked_by_datum_hash[${FTPP}0]`,
            `(self, vh, datum) -> {
		datumHash = __helios__common__hash_datum_data[${FTPP}0](datum);
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(vh)
					},
					() -> {
						__helios__txoutput__has_datum_hash(output, datumHash)
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_locked_by_inline_datum[${FTPP}0]`,
            `(self, vh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(vh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__outputs_paid_to[${FTPP}0]`,
            `(self) -> {
		(addr, datum) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__address____eq(__helios__txoutput__address(output), addr)
						},
						() -> {
							__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
						}
					)
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__value_sent_to",
            `(self) -> {
		(pkh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to(self)(pkh))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__value_sent_to_datum[${FTPP}0]`,
            `(self) -> {
		(pkh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to_datum[${FTPP}0](self)(pkh, datum, isInline))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__value_locked_by",
            `(self) -> {
		(vh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by(self)(vh))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__value_locked_by_datum[${FTPP}0]`,
            `(self) -> {
		(vh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by_datum[${FTPP}0](self)(vh, datum, isInline))
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__tx__value_paid_to[${FTPP}0]`,
            `(self) -> {
		(addr, datum) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_paid_to[${FTPP}0](self)(addr, datum))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__tx__is_signed_by",
            `(self) -> {
		(hash) -> {
			hash = __helios__pubkeyhash____to_data(hash);
			__helios__common__any(
				__helios__tx__signatories(self),
				(signatory) -> {
					__core__equalsData(signatory, hash)
				}
			)
		}
	}`
        )
    )

    // TxId builtins
    addDataFuncs("__helios__txid")
    add(
        new RawFunc(
            "__helios__txid__bytes",
            `(self) -> {
		__core__unBData(__core__headList(__core__sndPair(__core__unConstrData(self))))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid____lt",
            `(a, b) -> {
		__helios__bytearray____lt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid____leq",
            `(a, b) -> {
		__helios__bytearray____leq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid____gt",
            `(a, b) -> {
		__helios__bytearray____gt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid____geq",
            `(a, b) -> {
		__helios__bytearray____geq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid__new",
            `(bytes) -> {
		__core__constrData(0, __helios__common__list_1(__core__bData(bytes))) 
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				pair = __core__unConstrData__safe(data);
				index = __core__fstPair(pair);
				fields = __core__sndPair(pair);
				__core__ifThenElse(
					__core__equalsInteger(0, index),
					() -> {
						__core__chooseList(
							fields,
							() -> {
								false
							},
							() -> {
								__core__chooseList(
									__core__tailList__safe(fields),
									() -> {
										__helios__bytearray__is_valid_data_fixed_length(__core__headList__safe(fields), 32)
									},
									() -> {
										false
									}
								)()
							}
						)()
					},
					() -> {
						false
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txid__show",
            `(self) -> {
		__helios__bytearray__show(__helios__txid__bytes(self))
	}`
        )
    )

    // TxInput builtins
    addDataFuncs("__helios__txinput")
    add(
        new RawFunc(
            "__helios__txinput__is_valid_data",
            `(data) -> {
		__helios__common__test_constr_data_2(data, 0, __helios__txoutputid__is_valid_data, __helios__txoutput__is_valid_data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__new",
            `(output_id, output) -> {
		__core__constrData(0, __helios__common__list_2(output_id, output))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__output_id",
            "__helios__common__enum_field_0"
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__output",
            "__helios__common__enum_field_1"
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__address",
            `(self) -> {
		__helios__txoutput__address(__helios__txinput__output(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__value",
            `(self) -> {
		__helios__txoutput__value(__helios__txinput__output(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txinput__datum",
            `(self) -> {
		__helios__txoutput__datum(__helios__txinput__output(self))
	}`
        )
    )

    // TxOutput builtins
    addDataFuncs("__helios__txoutput")
    // TODO: test fields
    add(
        new RawFunc(
            "__helios__txoutput__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__new",
            `(address, value, datum) -> {
		__core__constrData(0, __helios__common__list_4(address, __core__mapData(value), datum, __helios__option__NONE))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__address",
            "__helios__common__enum_field_0"
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__value",
            `(self) -> {
		__core__unMapData(__helios__common__enum_field_1(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__datum",
            "__helios__common__enum_field_2"
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__ref_script_hash",
            "__helios__common__enum_field_3"
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__get_datum_hash",
            `(self) -> {
		() -> {
			pair = __core__unConstrData(__helios__txoutput__datum(self));
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 1),
				() -> {
					__helios__datumhash__from_data(
						__core__headList(__core__sndPair(pair))
					)
				},
				() -> {#}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__has_datum_hash",
            `(self, datumHash) -> {
		__helios__datumhash____eq(__helios__txoutput__get_datum_hash(self)(), datumHash)
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txoutput__has_inline_datum[${FTPP}0]`,
            `(self, datum) -> {
		pair = __core__unConstrData(__helios__txoutput__datum(self));
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(pair), 2),
			() -> {
				__core__equalsData(
					${FTPP}0____to_data(datum),
					__core__headList(__core__sndPair(pair))
				)
			},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__is_locked_by",
            `(self) -> {
		(hash) -> {
			credential = __helios__address__credential(__helios__txoutput__address(self));
			__core__ifThenElse(
				__helios__spendingcredential__is_validator(credential),
				() -> {
					__helios__validatorhash____eq(
						hash, 
						__helios__spendingcredential__validator__hash(
							__helios__spendingcredential__validator__cast(credential)
						)
					)
				},
				() -> {false}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__is_sent_to",
            `(self) -> {
		(pkh) -> {
			credential = __helios__address__credential(__helios__txoutput__address(self));
			__core__ifThenElse(
				__helios__spendingcredential__is_pubkey(credential),
				() -> {
					__helios__pubkeyhash____eq(
						pkh, 
						__helios__spendingcredential__pubkey__hash(
							__helios__spendingcredential__pubkey__cast(credential)
						)
					)
				},
				() -> {false}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutput__sum_values",
            `(outputs) -> {
		__helios__common__fold(
			outputs, 
			(prev, txOutput) -> {
				__helios__value____add(
					prev,
					__helios__txoutput__value(txOutput)
				)
			}, 
			__helios__value__ZERO
		)
	}`
        )
    )

    // OutputDatum
    addDataFuncs("__helios__txoutputdatum")
    // TODO: test each enum variant
    add(
        new RawFunc(
            "__helios__txoutputdatum__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputdatum__new_none",
            `() -> {
		__core__constrData(0, __helios__common__list_0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputdatum__new_hash",
            `(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__datumhash____to_data(hash)))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txoutputdatum__new_inline[__helios__data]`,
            `(data) -> {
		__core__constrData(2, __helios__common__list_1(data))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__txoutputdatum__new_inline[${FTPP}0]`,
            `(data) -> {
		__helios__txoutputdatum__new_inline[__helios__data](${FTPP}0____to_data(data))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputdatum__inline",
            `(self) -> {
		pair = __core__unConstrData(self);
		index = __core__fstPair(pair);
		fields = __core__sndPair(pair);
		__core__ifThenElse(
			__core__equalsInteger(index, 2),
			() -> {
				__core__headList(fields)
			},
			() -> {
				__helios__error("not an inline datum")
			}
		)()
	}`
        )
    )

    // OutputDatum::None
    addEnumDataFuncs("__helios__txoutputdatum__none", 0)

    // OutputDatum::Hash
    addEnumDataFuncs("__helios__txoutputdatum__hash", 1)
    add(
        new RawFunc(
            "__helios__txoutputdatum__hash__hash",
            `(self) -> {
		__helios__datumhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )

    // OutputDatum::Inline
    addEnumDataFuncs("__helios__txoutputdatum__inline", 2)
    add(
        new RawFunc(
            "__helios__txoutputdatum__inline__data",
            "__helios__common__enum_field_0"
        )
    )

    // RawData
    addDataFuncs("__helios__data")
    add(new RawFunc("__helios__data__is_valid_data", `(data) -> {true}`))
    add(
        new RawFunc(
            "__helios__data__tag",
            `(self) -> {
		__core__fstPair(__core__unConstrData(self))
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__data__as[${FTPP}0]`,
            `(data) -> {
				${FTPP}0__from_data(data)
			}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__constrdata____is",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {true},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__constrdata__tag",
            `(data) -> {
		__core__fstPair(__core__unConstrData(data))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__constrdata__fields",
            `(data) -> {
		__core__sndPair(__core__unConstrData(data))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__mapdata____is",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {false},
			() -> {true},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__mapdata__entries",
            `(data) -> {
		__core__unMapData(data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__listdata____is",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {false},
			() -> {false},
			() -> {true},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__listdata__items",
            `(data) -> {
		__core__unListData(data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__intdata____is",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {true},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__intdata__value",
            `(data) -> {
		__core__unIData(data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__bytearraydata____is",
            `(data) -> {
		__core__chooseData(
			data, 
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {true}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__data__bytearraydata__value",
            `(data) -> {
		__core__unBData(data)
	}`
        )
    )

    // TxOutputId
    addDataFuncs("__helios__txoutputid")
    add(
        new RawFunc(
            "__helios__txoutputid__is_valid_data",
            `(data) -> {
		__helios__common__test_constr_data_2(data, 0, __helios__txid__is_valid_data, __helios__int__is_valid_data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid__tx_id",
            "__helios__common__enum_field_0"
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid__index",
            `(self) -> {
		__helios__int__from_data(__helios__common__enum_field_1(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid__comp",
            `(a, b, comp_txid, comp_index) -> {
		a_txid = __helios__txoutputid__tx_id(a);
		a_index = __helios__txoutputid__index(a);
		b_txid = __helios__txoutputid__tx_id(b);
		b_index = __helios__txoutputid__index(b);
		__core__ifThenElse(
			__core__equalsData(a_txid, b_txid),
			() -> {
				comp_index(a_index, b_index)
			},
			() -> {
				comp_txid(a_txid, b_txid)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid____lt",
            `(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____lt, __helios__int____lt)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid____leq",
            `(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____leq, __helios__int____leq)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid____gt",
            `(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____gt, __helios__int____gt)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid____geq",
            `(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____geq, __helios__int____geq)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid__new",
            `(tx_id, idx) -> {
		__core__constrData(0, __helios__common__list_2(tx_id, __helios__int____to_data(idx)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__txoutputid__show",
            `(self) -> {
		() -> {
			__helios__string____add(
				__helios__txid__show(__helios__txoutputid__tx_id(self))(),
				__helios__string____add(
					"#",
					__helios__int__show(__helios__txoutputid__index(self))()
				)
			)
		}
	}`
        )
    )

    // Address
    addDataFuncs("__helios__address")
    add(
        new RawFunc(
            "__helios__address__to_hex",
            `(self) -> {
		__helios__bytearray__show(__helios__address__to_bytes(self)())
	}`
        )
    )
    add(new RawFunc("__helios__address__show", "__helios__address__to_hex"))
    add(
        new RawFunc(
            "__helios__address__header",
            `(self) -> {
		() -> {
			credential = __helios__address__credential(self);
			staking_credential = __helios__address__staking_credential(self);
			__core__ifThenElse(
				__helios__spendingcredential__is_pubkey(credential),
				() -> {
					staking_option_pair = __core__unConstrData(staking_credential);
					__core__ifThenElse(
						__core__equalsInteger(__core__fstPair(staking_option_pair), 0),
						() -> {
							staking_credential = __core__headList(__core__sndPair(__core__unConstrData(__helios__stakingcredential__hash__cast(__core__headList(__core__sndPair(staking_option_pair))))));
							__core__ifThenElse(
								__helios__spendingcredential__is_pubkey(staking_credential),
								() -> {
									${isTestnet ? "0x00" : "0x01"}
								},
								() -> {
									${isTestnet ? "0x20" : "0x21"}
								}
							)()
						},
						() -> {
							${isTestnet ? "0x60" : "0x61"}
						}
					)()
				},
				() -> {
					staking_option_pair = __core__unConstrData(staking_credential);
					__core__ifThenElse(
						__core__equalsInteger(__core__fstPair(staking_option_pair), 0)
						() -> {
							staking_credential = __core__headList(__core__sndPair(__core__unConstrData(__helios__stakingcredential__hash__cast(__core__headList(__core__sndPair(staking_option_pair))))));
							__core__ifThenElse(
								__helios__spendingcredential__is_pubkey(staking_credential),
								() -> {
									${isTestnet ? "0x10" : "0x11"}
								},
								() -> {
									${isTestnet ? "0x30" : "0x31"}
								}
							)()
						},
						() -> {
							${isTestnet ? "0x70" : "0x71"}
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__to_bytes",
            `(self) -> {
		() -> {
			credential = __helios__address__credential(self);
			staking_credential = __helios__address__staking_credential(self);
			__core__ifThenElse(
				__helios__spendingcredential__is_pubkey(credential),
				() -> {
					staking_option_pair = __core__unConstrData(staking_credential);
					__core__ifThenElse(
						__core__equalsInteger(__core__fstPair(staking_option_pair), 0),
						() -> {
							staking_credential = __core__headList(__core__sndPair(__core__unConstrData(__helios__stakingcredential__hash__cast(__core__headList(__core__sndPair(staking_option_pair))))));
							__core__ifThenElse(
								__helios__spendingcredential__is_pubkey(staking_credential),
								() -> {
									__core__consByteString(
										${isTestnet ? "0x00" : "0x01"},
										__core__appendByteString(
											__helios__spendingcredential__pubkey__hash(credential),
											__helios__spendingcredential__pubkey__hash(staking_credential)
										)
									)
								},
								() -> {
									__core__consByteString(
										${isTestnet ? "0x20" : "0x21"},
										__core__appendByteString(
											__helios__spendingcredential__pubkey__hash(credential),
											__helios__spendingcredential__validator__hash(staking_credential)
										)
									)
								}
							)()
						},
						() -> {
							__core__consByteString(
								${isTestnet ? "0x60" : "0x61"},
								__helios__spendingcredential__pubkey__hash(credential)
							)
						}
					)()
				},
				() -> {
					staking_option_pair = __core__unConstrData(staking_credential);
					__core__ifThenElse(
						__core__equalsInteger(__core__fstPair(staking_option_pair), 0),
						() -> {
							staking_credential = __core__headList(__core__sndPair(__core__unConstrData(__helios__stakingcredential__hash__cast(__core__headList(__core__sndPair(staking_option_pair))))));
							__core__ifThenElse(
								__helios__spendingcredential__is_pubkey(staking_credential),
								() -> {
									__core__consByteString(
										${isTestnet ? "0x10" : "0x11"},
										__core__appendByteString(
											__helios__spendingcredential__validator__hash(credential),
											__helios__spendingcredential__pubkey__hash(staking_credential)
										)
									)
								},
								() -> {
									__core__consByteString(
										${isTestnet ? "0x30" : "0x31"},
										__core__appendByteString(
											__helios__spendingcredential__validator__hash(credential),
											__helios__spendingcredential__validator__hash(staking_credential)
										)
									)
								}
							)()
						},
						() -> {
							__core__consByteString(
								${isTestnet ? "0x70" : "0x71"},
								__helios__spendingcredential__validator__hash(credential)
							)
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__from_bytes",
            `(bytes) -> {
		header = __core__indexByteString(bytes, 0);
		__core__ifThenElse(
			__core__equalsInteger(__core__modInteger(header, 2), ${isTestnet ? "0" : "1"}),
			() -> {
				is_pubkey_spending = __core__equalsInteger(__core__modInteger(__core__divideInteger(header, 16), 2), 0);
				staking_type = __core__divideInteger(header, 32);
				__core__ifThenElse(
					is_pubkey_spending,
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(staking_type, 0),
							() -> {
								__helios__address__new(
									__helios__spendingcredential__new_pubkey(__core__sliceByteString(1, 28, bytes)),
									__core__constrData(0, __helios__common__list_1(
										__helios__stakingcredential__new_hash(
											__helios__spendingcredential__new_pubkey(__core__sliceByteString(29, 28, bytes))
										)
									))
								)
							},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(staking_type, 1),
									() -> {
										__helios__address__new(
											__helios__spendingcredential__new_pubkey(__core__sliceByteString(1, 28, bytes)),
											__core__constrData(0, __helios__common__list_1(
												__helios__stakingcredential__new_hash(
													__helios__spendingcredential__new_validator(__core__sliceByteString(29, 28, bytes))
												)
											))
										)
									},
									() -> {
										__core__ifThenElse(
											__core__equalsInteger(staking_type, 3),
											() -> {
												__helios__address__new(
													__helios__spendingcredential__new_pubkey(__core__sliceByteString(1, 28, bytes)),
													__helios__option__NONE
												)
											},
											() -> {
												__helios__error("unhandled staking type")
											}
										)()
									}
								)()
							}
						)()
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(staking_type, 0),
							() -> {
								__helios__address__new(
									__helios__spendingcredential__new_validator(__core__sliceByteString(1, 28, bytes)),
									__core__constrData(0, __helios__common__list_1(
										__helios__stakingcredential__new_hash(
											__helios__spendingcredential__new_pubkey(__core__sliceByteString(29, 28, bytes))
										)
									))
								)
							},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(staking_type, 1),
									() -> {
										__helios__address__new(
											__helios__spendingcredential__new_validator(__core__sliceByteString(1, 28, bytes)),
											__core__constrData(0, __helios__common__list_1(
												__helios__stakingcredential__new_hash(
													__helios__spendingcredential__new_validator(__core__sliceByteString(29, 28, bytes))
												)
											))
										)
									},
									() -> {
										__core__ifThenElse(
											__core__equalsInteger(staking_type, 3),
											() -> {
												__helios__address__new(
													__helios__spendingcredential__new_validator(__core__sliceByteString(1, 28, bytes)),
													__helios__option__NONE
												)
											},
											() -> {
												__helios__error("unhandled staking type")
											}
										)()
									}
								)()
							}
						)()
					}
				)()
			},
			() -> {
				__helios__error(
					__core__appendString(
						"not a ${isTestnet ? "testnet" : "mainnet"} address (header: ",
						__core__appendString(
							__helios__int__show(header)(),
							")"
						)
					)
				)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__from_hex",
            `(hex) -> {
		__helios__address__from_bytes(__helios__bytearray__parse(hex))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__is_valid_data",
            `(data) -> {
		__helios__common__test_constr_data_2(data, 0, __helios__spendingcredential__is_valid_data, __helios__option[__helios__stakingcredential]__is_valid_data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__new",
            `(cred, staking_cred) -> {
		__core__constrData(0, __helios__common__list_2(cred, staking_cred))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__new_empty",
            `() -> {
		__core__constrData(0, __helios__common__list_2(__helios__spendingcredential__new_pubkey(#), __helios__option__NONE))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__credential",
            "__helios__common__enum_field_0"
        )
    )
    add(
        new RawFunc(
            "__helios__address__staking_credential",
            "__helios__common__enum_field_1"
        )
    )
    add(
        new RawFunc(
            "__helios__address__is_staked",
            `(self) -> {
		() -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(__helios__common__enum_field_1(self))), 0)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__address__from_validator",
            `(vh) -> {
			__helios__address__new(
				__helios__spendingcredential__new_validator(vh),
				__helios__option__NONE
			)
		}`
        )
    )

    // SpendingCredential builtins
    addDataFuncs("__helios__spendingcredential")
    add(
        new RawFunc(
            "__helios__spendingcredential__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				pair = __core__unConstrData__safe(data);
				index = __core__fstPair(pair);
				fields = __core__sndPair(pair);
				__core__ifThenElse(
					__core__equalsInteger(index, 0),
					() -> {
						__core__chooseList(
							fields,
							() -> {
								false
							},
							() -> {
								__core__chooseList(
									__core__tailList__safe(fields),
									() -> {
										__helios__validatorhash__is_valid_data(__core__headList__safe(fields))
									}, 
									() -> {
										false
									}
								)()
							}
						)()
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(index, 1),
							() -> {
								__core__chooseList(
									fields,
									() -> {
										false
									},
									() -> {
										__core__chooseList(
											__core__tailList__safe(fields),
											() -> {
												__helios__pubkeyhash__is_valid_data(__core__headList__safe(fields))
											}, 
											() -> {
												false
											}
										)()
									}
								)()
							},
							() -> {
								false
							}
						)()
					}
				)()
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__new_pubkey",
            `(hash) -> {
		__core__constrData(0, __helios__common__list_1(__helios__pubkeyhash____to_data(hash)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__new_validator",
            `(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__validatorhash____to_data(hash)))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__is_pubkey",
            `(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__is_validator",
            `(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
	}`
        )
    )

    // Credential::PubKey builtins
    addEnumDataFuncs("__helios__spendingcredential__pubkey", 0)
    add(
        new RawFunc(
            "__helios__spendingcredential__pubkey__cast",
            `(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__pubkey__hash",
            `(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )

    // Credential::Validator builtins
    addEnumDataFuncs("__helios__spendingcredential__validator", 1)
    add(
        new RawFunc(
            "__helios__spendingcredential__validator____new",
            "__helios__spendingcredential__new_validator"
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__validator__cast",
            `(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__spendingcredential__validator__hash",
            `(self) -> {
		__helios__validatorhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )

    // StakingHash builtins
    addDataFuncs("__helios__stakinghash")
    add(
        new RawFunc(
            "__helios__stakinghash__is_valid_data",
            "__helios__spendingcredential__is_valid_data"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__new_stakekey",
            "__helios__spendingcredential__new_pubkey"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__new_validator",
            "__helios__spendingcredential__new_validator"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__is_stakekey",
            "__helios__spendingcredential__is_stakekey"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__is_validator",
            "__helios__spendingcredential__is_validator"
        )
    )

    // StakingHash::StakeKey builtins
    addEnumDataFuncs("__helios__stakinghash__stakekey", 0)
    add(
        new RawFunc(
            "__helios__stakinghash__stakekey__is_valid_data",
            "__helios__spendingcredential__pubkey__is_valid_data"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__stakekey__cast",
            "__helios__spendingcredential__pubkey__cast"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__stakekey__hash",
            "__helios__spendingcredential__pubkey__hash"
        )
    )

    // StakingHash::Validator builtins
    addEnumDataFuncs("__helios__stakinghash__validator", 1)
    add(
        new RawFunc(
            "__helios__stakinghash__validator__is_valid_data",
            "__helios__spendingcredential__validator__is_valid_data"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__validator__cast",
            "__helios__spendingcredential__validator__cast"
        )
    )
    add(
        new RawFunc(
            "__helios__stakinghash__validator__hash",
            "__helios__spendingcredential__validator__hash"
        )
    )

    // StakingCredential builtins
    addDataFuncs("__helios__stakingcredential")
    // TODO: test fields
    add(
        new RawFunc(
            "__helios__stakingcredential__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__stakingcredential__new_hash",
            `(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__stakingcredential__hash__cast",
            `(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__stakingcredential__new_ptr",
            `(i, j, k) -> {
		__core__constrData(1, __helios__common__list_3(
			__helios__int____to_data(i), 
			__helios__int____to_data(j), 
			__helios__int____to_data(k)
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__stakingcredential__ptr__cast",
            `(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`
        )
    )

    // StakingCredential::Hash builtins
    addEnumDataFuncs("__helios__stakingcredential__hash", 0)
    add(
        new RawFunc(
            "__helios__stakingcredential__hash__hash",
            "__helios__common__enum_field_0"
        )
    )

    // StakingCredential::Ptr builtins
    addEnumDataFuncs("__helios__stakingcredential__ptr", 1)

    // Time builtins
    addIntLikeFuncs("__helios__time")
    add(
        new RawFunc(
            "__helios__time__is_valid_data",
            `__helios__int__is_valid_data`
        )
    )
    add(new RawFunc("__helios__time__new", `__helios__common__identity`))
    add(new RawFunc("__helios__time____add", `__helios__int____add`))
    add(new RawFunc("__helios__time____sub", `__helios__int____sub`))
    add(new RawFunc("__helios__time____sub1", `__helios__int____sub`))
    add(new RawFunc("__helios__time____geq", `__helios__int____geq`))
    add(new RawFunc("__helios__time____gt", `__helios__int____gt`))
    add(new RawFunc("__helios__time____leq", `__helios__int____leq`))
    add(new RawFunc("__helios__time____lt", `__helios__int____lt`))
    add(new RawFunc("__helios__time__show", `__helios__int__show`))

    // Duratin builtins
    addIntLikeFuncs("__helios__duration")
    add(
        new RawFunc(
            "__helios__duration__is_valid_data",
            `__helios__int__is_valid_data`
        )
    )
    add(new RawFunc("__helios__duration__new", `__helios__common__identity`))
    add(new RawFunc("__helios__duration__show", `__helios__int__show`))
    add(new RawFunc("__helios__duration____add", `__helios__int____add`))
    add(new RawFunc("__helios__duration____sub", `__helios__int____sub`))
    add(new RawFunc("__helios__duration____mul", `__helios__int____mul`))
    add(new RawFunc("__helios__duration____div", `__helios__int____div`))
    add(new RawFunc("__helios__duration____div1", `__helios__int____div`))
    add(new RawFunc("__helios__duration____mod", `__helios__int____mod`))
    add(new RawFunc("__helios__duration____geq", `__helios__int____geq`))
    add(new RawFunc("__helios__duration____gt", `__helios__int____gt`))
    add(new RawFunc("__helios__duration____leq", `__helios__int____leq`))
    add(new RawFunc("__helios__duration____lt", `__helios__int____lt`))
    add(new RawFunc("__helios__duration__SECOND", "1000"))
    add(new RawFunc("__helios__duration__MINUTE", "60000"))
    add(new RawFunc("__helios__duration__HOUR", "3600000"))
    add(new RawFunc("__helios__duration__DAY", "86400000"))
    add(new RawFunc("__helios__duration__WEEK", "604800000"))

    // TimeRange builtins
    addDataFuncs("__helios__timerange")
    // TODO: test fields
    add(
        new RawFunc(
            "__helios__timerange__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {
				true
			},
			() -> {false},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__new",
            `
	(a, b) -> {
		a = __helios__time____to_data(a);
		b = __helios__time____to_data(b);
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__bool____to_data(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__bool____to_data(true)
			))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__ALWAYS",
            `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__NEVER",
            `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__from",
            `
	(a) -> {
		a = __helios__time____to_data(a);
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__bool____to_data(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(2, __helios__common__list_0),
				__helios__bool____to_data(true)
			))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__to",
            `
	(b) -> {
		b = __helios__time____to_data(b);
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_0),
				__helios__bool____to_data(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__bool____to_data(true)
			))
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__is_before",
            `(self) -> {
		(t) -> {
			upper = __helios__common__enum_field_1(self);
			extended = __helios__common__enum_field_0(upper);
			closed = __helios__bool__from_data(__helios__common__enum_field_1(upper));
			extType = __core__fstPair(__core__unConstrData(extended));
			__core__ifThenElse(
				__core__equalsInteger(extType, 2),
				() -> {false},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(extType, 0),
						() -> {true},
						() -> {
							__core__ifThenElse(
								closed,
								() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
								() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
							)()
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__is_after",
            `(self) -> {
		(t) -> {
			lower = __helios__common__enum_field_0(self);
			extended = __helios__common__enum_field_0(lower);
			closed = __helios__bool__from_data(__helios__common__enum_field_1(lower));
			extType = __core__fstPair(__core__unConstrData(extended));
			__core__ifThenElse(
				__core__equalsInteger(extType, 0),
				() -> {false},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(extType, 2),
						() -> {true},
						() -> {
							__core__ifThenElse(
								closed,
								() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
								() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
							)()
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__contains",
            `(self) -> {
		(t) -> {
			lower = __helios__common__enum_field_0(self);
			extended = __helios__common__enum_field_0(lower);
			closed = __helios__bool__from_data(__helios__common__enum_field_1(lower));
			lowerExtType = __core__fstPair(__core__unConstrData(extended));
			checkUpper = () -> {
				upper = __helios__common__enum_field_1(self);
				extended = __helios__common__enum_field_0(upper);
				closed = __helios__bool__from_data(__helios__common__enum_field_1(upper));
				upperExtType = __core__fstPair(__core__unConstrData(extended));
				__core__ifThenElse(
					__core__equalsInteger(upperExtType, 0),
					() -> {false},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(upperExtType, 2),
							() -> {true},
							() -> {
								__core__ifThenElse(
									__core__ifThenElse(
										closed,
										() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
										() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
									)(),
									true,
									false
								)
							}
						)()
					}
				)()
			};
			__core__ifThenElse(
				__core__equalsInteger(lowerExtType, 2),
				() -> {false},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(lowerExtType, 0),
						() -> {checkUpper()},
						() -> {
							__core__ifThenElse(
								__core__ifThenElse(
									closed,
									() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
									() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
								)(),
								() -> {checkUpper()},
								() -> {false}
							)()
						}
					)()
				}
			)()
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__start",
            `(self) -> {
		__helios__time__from_data(__helios__common__enum_field_0(__helios__common__enum_field_0(__helios__common__enum_field_0(self))))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__end",
            `(self) -> {
		__helios__time__from_data(__helios__common__enum_field_0(__helios__common__enum_field_0(__helios__common__enum_field_1(self))))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__timerange__show",
            `(self) -> {
		() -> {
			show_extended = (extended) -> {
				extType = __core__fstPair(__core__unConstrData(extended));
				__core__ifThenElse(
					__core__equalsInteger(extType, 0),
					() -> {"-inf"},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 2),
							() -> {"+inf"},
							() -> {
								fields = __core__sndPair(__core__unConstrData(extended));
								__helios__int__show(
									__helios__int__from_data(__core__headList(fields))
								)()
							}
						)()
					}
				)()
			};
			__helios__string____add(
				lower = __helios__common__enum_field_0(self);
				extended = __helios__common__enum_field_0(lower);
				closed = __helios__bool__from_data(__helios__common__enum_field_1(lower));
				__helios__string____add(
					__core__ifThenElse(closed, "[", "("),
					show_extended(extended)
				),
				__helios__string____add(
					",",
					upper = __helios__common__enum_field_1(self);
					extended = __helios__common__enum_field_0(upper);
					closed = __helios__bool__from_data(__helios__common__enum_field_1(upper));
					__helios__string____add(
						show_extended(extended),
						__core__ifThenElse(closed, "]", ")")
					)
				)
			)
		}
	}`
        )
    )

    // AssetClass builtins
    addDataFuncs("__helios__assetclass")
    add(
        new RawFunc(
            "__helios__assetclass__is_valid_data",
            `(data) -> {
		__helios__common__test_constr_data_2(data, 0, __helios__mintingpolicyhash__is_valid_data, __helios__bytearray__is_valid_data)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass__ADA",
            `__helios__assetclass__new(#, #)`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass__new",
            `(mph, token_name) -> {
		__core__constrData(0, __helios__common__list_2(
			__helios__mintingpolicyhash____to_data(mph), 
			__helios__bytearray____to_data(token_name)
		))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass__mph",
            `(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__enum_field_0(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass__token_name",
            `(self) -> {
		__helios__bytearray__from_data(__helios__common__enum_field_1(self))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass__show",
            `(self) -> {
		__core__chooseData(
			self,
			() -> {
				fields = __core__sndPair(__core__unConstrData__safe(self));
				__core__chooseList(
					fields,
					() -> {
						"N/A"
					},
					() -> {
						mph = __core__headList__safe(fields);
						__core__appendString(
							__core__chooseData(
								mph,
								() -> {"N/A"},
								() -> {"N/A"},
								() -> {"N/A"},
								() -> {"N/A"},
								() -> {
									__helios__bytearray__show(__core__unBData__safe(mph))()
								}
							)(),
							__core__appendString(
								".",
								fields = __core__tailList__safe(fields);
								__core__chooseList(
									fields,
									() -> {
										"N/A"
									},
									() -> {
										token_name = __core__headList__safe(fields);
										__core__chooseData(
											token_name,
											() -> {"N/A"},
											() -> {"N/A"},
											() -> {"N/A"},
											() -> {"N/A"},
											() -> {
												__helios__bytearray__show(__core__unBData__safe(token_name))()
											}
										)()
									}
								)()
							)
						)
					}
				)()
			},
			() -> {"N/A"},
			() -> {"N/A"},
			() -> {"N/A"},
			() -> {"N/A"}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass____lt",
            `(a, b) -> {
		mpha = __helios__assetclass__mph(a);
		mphb = __helios__assetclass__mph(b);
		__core__ifThenElse(
			__helios__bytearray____eq(mpha, mphb),
			() -> {
				__helios__bytearray____lt(
					__helios__assetclass__token_name(a),
					__helios__assetclass__token_name(b)
				)
			},
			() -> {
				__helios__bytearray____lt(mpha, mphb)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass____leq",
            `(a, b) -> {
		mpha = __helios__assetclass__mph(a);
		mphb = __helios__assetclass__mph(b);
		__core__ifThenElse(
			__helios__bytearray____eq(mpha, mphb),
			() -> {
				__helios__bytearray____leq(
					__helios__assetclass__token_name(a),
					__helios__assetclass__token_name(b)
				)
			},
			() -> {
				__helios__bytearray____lt(mpha, mphb)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass____gt",
            `(a, b) -> {
		mpha = __helios__assetclass__mph(a);
		mphb = __helios__assetclass__mph(b);
		__core__ifThenElse(
			__helios__bytearray____eq(mpha, mphb),
			() -> {
				__helios__bytearray____gt(
					__helios__assetclass__token_name(a),
					__helios__assetclass__token_name(b)
				)
			},
			() -> {
				__helios__bytearray____gt(mpha, mphb)
			}
		)()
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__assetclass____geq",
            `(a, b) -> {
		mpha = __helios__assetclass__mph(a);
		mphb = __helios__assetclass__mph(b);
		__core__ifThenElse(
			__helios__bytearray____eq(mpha, mphb),
			() -> {
				__helios__bytearray____geq(
					__helios__assetclass__token_name(a),
					__helios__assetclass__token_name(b)
				)
			},
			() -> {
				__helios__bytearray____gt(mpha, mphb)
			}
		)()
	}`
        )
    )

    // Value builtins
    addSerializeFunc("__helios__value")
    // TODO: test each entry in the map
    add(
        new RawFunc(
            "__helios__value__is_valid_data",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {false},
			() -> {
				map = __core__unMapData__safe(data);
				recurse = (recurse, map) -> {
					__core__chooseList(
						map,
						() -> {
							true
						},
						() -> {
							head = __core__headList__safe(map);
							key = __core__fstPair(head);
							value = __core__sndPair(head);
							__core__ifThenElse(
								__helios__mintingpolicyhash__is_valid_data(key),
								() -> {
									__core__chooseData(
										value,
										() -> {false},
										() -> {
											inner = __core__unMapData__safe(value);
											__core__chooseList(
												inner,
												() -> {
													false
												},
												() -> {
													recurse_inner = (recurse_inner, inner) -> {
														__core__chooseList(
															inner,
															() -> {
																true
															},
															() -> {
																head = __core__headList__safe(inner);
																key = __core__fstPair(head);
																value = __core__sndPair(head);
																__core__ifThenElse(
																	__helios__bytearray__is_valid_data(key),
																	() -> {
																		__core__ifThenElse(
																			__helios__int__is_valid_data(value),
																			() -> {
																				true
																			},
																			() -> {
																				false
																			}
																		)()
																	},
																	() -> {
																		false
																	}
																)()
															}
														)()
													};
													recurse_inner(recurse_inner, inner)
												}
											)()
										},
										() -> {false},
										() -> {false},
										() -> {false}
									)()
								},
								() -> {
									false
								}
							)()
						}
					)()
				};
				recurse(recurse, map)
			},
			() -> {false},
			() -> {false},
			() -> {false}
		)()
	}`
        )
    )
    add(new RawFunc("__helios__value__from_data", "__core__unMapData"))
    add(
        new RawFunc(
            "__helios__value__from_data_safe",
            `(data) -> {
		__core__chooseData(
			data,
			() -> {__helios__option__NONE_FUNC},
			() -> {
				__helios__option__SOME_FUNC(__core__unMapData__safe(data))
			},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC},
			() -> {__helios__option__NONE_FUNC}
		)()
	}`
        )
    )
    add(new RawFunc("__helios__value____to_data", "__core__mapData"))
    add(new RawFunc("__helios__value__value", "__helios__common__identity"))
    add(new RawFunc("__helios__value__ZERO", "__core__mkNilPairData(())"))
    add(
        new RawFunc(
            "__helios__value__lovelace",
            `(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__new",
            `(assetClass, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(0, i),
			() -> {
				__helios__value__ZERO
			},
			() -> {
				mph = __helios__common__enum_field_0(assetClass);
				tokenName = __helios__common__enum_field_1(assetClass);
				__core__mkCons(
					__core__mkPairData(
						mph, 
						__core__mapData(
							__core__mkCons(
								__core__mkPairData(tokenName, __helios__int____to_data(i)), 
								__core__mkNilPairData(())
							)
						)
					), 
					__core__mkNilPairData(())
				)
			}
		)()
	}`
        )
    )
    add(new RawFunc("__helios__value__from_map", "__helios__common__identity"))
    add(
        new RawFunc(
            "__helios__value__to_map",
            `(self) -> {
		() -> {
			self
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_map_keys",
            `(map) -> {
		recurse = (recurse, map) -> {
			__core__chooseList(
				map, 
				() -> {__helios__common__list_0}, 
				() -> {__core__mkCons(__core__fstPair(__core__headList__safe(map)), recurse(recurse, __core__tailList__safe(map)))}
			)()
		};
		recurse(recurse, map)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__merge_map_keys",
            `(a, b) -> {
		aKeys = __helios__value__get_map_keys(a);
		recurse = (recurse, keys, map) -> {
			__core__chooseList(
				map, 
				() -> {__helios__common__list_0}, 
				() -> {
					key = __core__fstPair(__core__headList__safe(map));
					__core__ifThenElse(
						__helios__common__is_in_bytearray_list(aKeys, key), 
						() -> {recurse(recurse, keys, __core__tailList__safe(map))},
						() -> {__core__mkCons(key, recurse(recurse, keys, __core__tailList__safe(map)))}
					)()
				}
			)()
		};
		uniqueBKeys = recurse(recurse, aKeys, b);
		__helios__common__concat(aKeys, uniqueBKeys)	
	}`
        )
    )

    add(
        new RawFunc(
            "__helios__value__get_inner_map",
            `(map, mph) -> {
		recurse = (recurse, map) -> {
			__core__chooseList(
				map, 
				() -> {__core__mkNilPairData(())},
				() -> {
					__core__ifThenElse(
						__core__equalsData(__core__fstPair(__core__headList__safe(map)), mph), 
						() -> {__core__unMapData(__core__sndPair(__core__headList__safe(map)))},
						() -> {recurse(recurse, __core__tailList__safe(map))}
					)()
				}
			)()
		};
		recurse(recurse, map)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_inner_map_int",
            `(map, key) -> {
		recurse = (recurse, map, key) -> {
			__core__chooseList(
				map, 
				() -> {0}, 
				() -> {
					__core__ifThenElse(
						__core__equalsData(__core__fstPair(__core__headList__safe(map)), key), 
						() -> {__core__unIData(__core__sndPair(__core__headList__safe(map)))}, 
						() -> {recurse(recurse, __core__tailList__safe(map), key)}
					)()
				}
			)()
		};
		recurse(recurse, map, key)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__add_or_subtract_inner",
            `(op) -> {
		(a, b) -> {
			recurse = (recurse, keys, result) -> {
				__core__chooseList(
					keys, 
					() -> {result}, 
					() -> {
						key = __core__headList__safe(keys);
						tail = recurse(recurse, __core__tailList__safe(keys), result);
						sum = op(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key));
						__core__ifThenElse(
							__core__equalsInteger(sum, 0), 
							() -> {tail}, 
							() -> {__core__mkCons(__core__mkPairData(key, __core__iData(sum)), tail)}
						)()
					}
				)()
			};
			recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__add_or_subtract",
            `(a, b, op) -> {
		recurse = (recurse, keys, result) -> {
			__core__chooseList(
				keys, 
				() -> {result}, 
				() -> {
					key = __core__headList__safe(keys);
					tail = recurse(recurse, __core__tailList__safe(keys), result);
					item = __helios__value__add_or_subtract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key));
					__core__chooseList(
						item, 
						() -> {tail}, 
						() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
					)()
				}
			)()
		};
		recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__map_quantities",
            `(self, op) -> {
		recurseInner = (recurseInner, inner) -> {
			__core__chooseList(
				inner,
				() -> {__core__mkNilPairData(())},
				() -> {
					head = __core__headList__safe(inner);
					__core__mkCons(
						__core__mkPairData(
							__core__fstPair(head),
							__core__iData(op(__core__unIData(__core__sndPair(head))))
						),
						recurseInner(recurseInner, __core__tailList__safe(inner))
					)
				}
			)()
		};
		recurseOuter = (recurseOuter, outer) -> {
			__core__chooseList(
				outer,
				() -> {__core__mkNilPairData(())},
				() -> {
					head = __core__headList__safe(outer);
					__core__mkCons(
						__core__mkPairData(
							__core__fstPair(head), 
							__core__mapData(recurseInner(recurseInner, __core__unMapData(__core__sndPair(head))))
						),  
						recurseOuter(recurseOuter, __core__tailList__safe(outer))
					)
				}
			)()
		};
		recurseOuter(recurseOuter, self)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__compare_inner",
            `(comp, a, b) -> {
		recurse = (recurse, keys) -> {
			__core__chooseList(
				keys, 
				() -> {true}, 
				() -> {
					key = __core__headList__safe(keys);
					__core__ifThenElse(
						__helios__bool____not(
							comp(
								__helios__value__get_inner_map_int(a, key), 
								__helios__value__get_inner_map_int(b, key)
							)
						), 
						() -> {false}, 
						() -> {recurse(recurse, __core__tailList__safe(keys))}
					)()
				}
			)()
		};
		recurse(recurse, __helios__value__merge_map_keys(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__compare",
            `(a, b, comp) -> {
		recurse = (recurse, keys) -> {
			__core__chooseList(
				keys, 
				() -> {true}, 
				() -> {
					key = __core__headList__safe(keys);
					__core__ifThenElse(
						__helios__bool____not(
							__helios__value__compare_inner(
								comp, 
								__helios__value__get_inner_map(a, key), 
								__helios__value__get_inner_map(b, key)
							)
						), 
						() -> {false}, 
						() -> {recurse(recurse, __core__tailList__safe(keys))}
					)()
				}
			)()
		};
		recurse(recurse, __helios__value__merge_map_keys(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____eq",
            `(a, b) -> {
		__helios__value__compare(a, b, __core__equalsInteger)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____neq",
            `(a, b) -> {
		__helios__bool____not(__helios__value____eq(a, b))
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____add",
            `(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__addInteger)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____sub",
            `(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__subtractInteger)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____mul",
            `(a, scale) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__multiplyInteger(qty, scale)})
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____div",
            `(a, den) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__divideInteger(qty, den)})
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____geq",
            `(a, b) -> {
		__helios__value__compare(
			a, 
			b, 
			(a_qty, b_qty) -> {
				__helios__bool____not(
					__core__lessThanInteger(a_qty, b_qty)
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__contains",
            `
	(self) -> {
		(value) -> {
			__helios__value____geq(self, value)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____gt",
            `(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					a, 
					b,
					(a_qty, b_qty) -> {
						__helios__bool____not(__core__lessThanEqualsInteger(a_qty, b_qty))
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____leq",
            `(a, b) -> {
		__helios__value__compare(a, b, __core__lessThanEqualsInteger)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value____lt",
            `(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare( 
					a, 
					b,
					(a_qty, b_qty) -> {
						__core__lessThanInteger(a_qty, b_qty)
					}
				)
			}
		)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__is_zero_inner",
            `(tokens) -> {
		recurse = (recurse, tokens) -> {
			__core__chooseList(
				tokens,
				() -> {
					true
				},
				() -> {
					__helios__bool__and(
						() -> {
							__core__equalsInteger(__core__unIData(__core__sndPair(__core__headList__safe(tokens))), 0)
						},
						() -> {
							recurse(recurse, __core__tailList__safe(tokens))
						}
					)
				}
			)()
		};
		recurse(recurse, tokens)
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__is_zero",
            `(self) -> {
		() -> {
			recurse = (recurse, map) -> {
				__core__chooseList(
					map,
					() -> {
						true
					},
					() -> {
						__helios__bool__and(
							() -> {
								__helios__value__is_zero_inner(__core__unMapData(__core__sndPair(__core__headList__safe(map))))
							},
							() -> {
								recurse(recurse, __core__tailList__safe(map))
							}
						)
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    // TODO: core__unBData__safe(mph)
    add(
        new RawFunc(
            "__helios__value__get",
            `(self) -> {
		(assetClass) -> {
			mph = __helios__common__enum_field_0(assetClass);
			tokenName = __helios__common__enum_field_1(assetClass);
			outer = (outer, inner, map) -> {
				__core__chooseList(
					map, 
					() -> {
						__helios__error(
							__helios__string____add(
								__helios__string____add(
									"policy ", 
									__helios__mintingpolicyhash__show(__core__unBData(mph))()
								),
								" not found"
							)
						)
					},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), mph), 
							() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList__safe(map))))}, 
							() -> {outer(outer, inner, __core__tailList__safe(map))}
						)()
					}
				)()
			};
			inner = (inner, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__error("tokenName not found")}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), tokenName),
							() -> {
								__core__unIData(__core__sndPair(__core__headList__safe(map)))
							},
							() -> {
								inner(inner, __core__tailList__safe(map))
							}
						)()
					}
				)()
			};
			outer(outer, inner, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_safe",
            `(self) -> {
		(assetClass) -> {
			mintingPolicyHash = __helios__common__enum_field_0(assetClass);
			tokenName = __helios__common__enum_field_1(assetClass);
			outer = (outer, inner, map) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), mintingPolicyHash), 
							() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList__safe(map))))}, 
							() -> {outer(outer, inner, __core__tailList__safe(map))}
						)()
					}
				)()
			};
			inner = (inner, map) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), tokenName),
							() -> {
								__core__unIData(__core__sndPair(__core__headList__safe(map)))
							},
							() -> {
								inner(inner, __core__tailList__safe(map))
							}
						)()
					}
				)()
			};
			outer(outer, inner, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_lovelace",
            `(self) -> {
		() -> {
			__helios__value__get_safe(self)(__helios__assetclass__ADA)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_assets",
            `(self) -> {
		() -> {
			__helios__common__filter_map(
				self,
				(pair) -> {
					__helios__bool____not(__core__equalsByteString(__core__unBData(__core__fstPair(pair)), #))
				}
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_singleton_asset_class",
            `(self) -> {
			() -> {
				recurse = (map, found, asset_class) -> {
					__core__chooseList(
						map,
						() -> {
							__core__ifThenElse(
								found,
								() -> {
									asset_class
								},
								() -> {
									__helios__error("doesn't contain a singleton asset class")
								}
							)()
						},
						() -> {
							head = __core__headList(map);
							tail = __core__tailList(map);
							mph = __core__unBData(__core__fstPair(head));

							__core__ifThenElse(
								// ignore ada
								__core__equalsByteString(mph, #),
								() -> {
									recurse(tail, found, asset_class)
								},
								() -> {
									__core__ifThenElse(
										found,
										() -> {
											__helios__error("not singleton, contains multiple assetclasses")
										},
										() -> {
											// parse asset class entry
											tokens = __core__unMapData(__core__sndPair(head));
			
											// assert no other tokens
											__core__chooseList(
												__core__tailList(tokens),
												() -> {
													first = __core__headList(tokens);
													qty = __core__unIData(__core__sndPair(first));

													// assert qty is 1
													__core__ifThenElse(
														__core__equalsInteger(qty, 1),
														() -> {
															name = __core__unBData(__core__fstPair(first));
															recurse(tail, true, __helios__assetclass__new(mph, name))
														},
														() -> {
															__helios__error("not singleton, qty is not 1")
														}
													)()
												},
												() -> {
													__helios__error("not singleton, has other token names")
												}
											)()
										}
									)()
								}
							)()
						}
					)()
				};
				recurse(self, false, ())
			}
		}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__get_policy",
            `(self) -> {
		(mph) -> {
			mph = __helios__mintingpolicyhash____to_data(mph);
			recurse = (recurse, map) -> {
				__core__chooseList(
					map,
					() -> {__helios__error("policy not found")},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), mph),
							() -> {
								__core__unMapData(__core__sndPair(__core__headList__safe(map)))
							},
							() -> {
								recurse(recurse, __core__tailList__safe(map))
							}
						)()
					}
				)()
			};
			recurse(recurse, self)
		} 
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__contains_policy",
            `(self) -> {
		(mph) -> {
			mph = __helios__mintingpolicyhash____to_data(mph);
			recurse = (recurse, map) -> {
				__core__chooseList(
					map,
					() -> {false},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList__safe(map)), mph),
							() -> {true},
							() -> {recurse(recurse, __core__tailList__safe(map))}
						)()
					}
				)()
			};
			recurse(recurse, self)
		}
	}`
        )
    )
    add(
        new RawFunc(
            "__helios__value__show",
            `(self) -> {
		() -> {
			__helios__common__fold(
				self,
				(prev, pair) -> {
					mph = __core__unBData__safe(__core__fstPair(pair));
					tokens = __core__unMapData__safe(__core__sndPair(pair));
					__helios__common__fold(
						tokens,
						(prev, pair) -> {
							token_name = __core__unBData__safe(__core__fstPair(pair));
							qty = __core__unIData__safe(__core__sndPair(pair));
							__helios__string____add(
								prev,
								__core__ifThenElse(
									__helios__mintingpolicyhash____eq(mph, #),
									() -> {
										__helios__string____add(
											"lovelace: ",
											__helios__string____add(
												__helios__int__show(qty)(),
												"\\n"
											)
										)
									},
									() -> {
										__helios__string____add(
											__helios__mintingpolicyhash__show(mph)(),
											__helios__string____add(
												".",
												__helios__string____add(
													__helios__bytearray__show(token_name)(),
													__helios__string____add(
														": ",
														__helios__string____add(
															__helios__int__show(qty)(),
															"\\n"
														)
													)
												)
											)
										)
									}
								)()
							)
						},
						prev
					)
				},
				""
			)
		}
	}`
        )
    )
    add(
        new RawFunc(
            `__helios__value__sum[${FTPP}0]`,
            `(self) -> {
		recurse = (recurse, lst) -> {
			__core__chooseList(
				lst,
				() -> {
					__helios__value__ZERO
				},
				() -> {
					__helios__value____add(
						${FTPP}0__value(${FTPP}0__from_data(__core__headList__safe(lst))),
						recurse(recurse, __core__tailList__safe(lst))
					)
				}
			)()
		};
		recurse(recurse, self)
	}`
        )
    )

    // Cip67 namespace
    add(new RawFunc(`__helios__cip67__fungible_token_label`, "#0014df10"))
    add(new RawFunc(`__helios__cip67__reference_token_label`, "#000643b0"))
    add(new RawFunc(`__helios__cip67__user_token_label`, "#000de140"))

    // MixedArgs
    add(
        new RawFunc(
            `__helios__mixedargs__other__redeemer`,
            `__helios__common__enum_field_0`
        )
    )
    add(
        new RawFunc(
            `__helios__mixedargs__other____is`,
            `(data) -> {
			__helios__common__enum_tag_equals(data, 0)
		}`
        )
    )
    add(
        new RawFunc(
            `__helios__mixedargs__spending__datum`,
            `__helios__common__enum_field_0`
        )
    )
    add(
        new RawFunc(
            `__helios__mixedargs__spending__redeemer`,
            `__helios__common__enum_field_1`
        )
    )
    add(
        new RawFunc(
            `__helios__mixedargs__spending____is`,
            `(data) -> {
				__helios__common__enum_tag_equals(data, 1)
			}`
        )
    )

    return db
}
