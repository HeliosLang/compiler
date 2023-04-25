//@ts-check
// IR definitions

import {
	config
} from "./config.js";

import {
    assert,
	assertDefined,
	replaceTabs
} from "./utils.js";

import {
	IR
} from "./tokens.js";

/**
 * For collecting test coverage statistics
 * @type {?((name: string, count: number) => void)}
 */
var onNotifyRawUsage = null;

/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback 
 */
function setRawUsageNotifier(callback) {
	onNotifyRawUsage = callback;
}

/**
 * Wrapper for a builtin function (written in IR)
 */
class RawFunc {
	#name;
	#definition;

	/** @type {Set<string>} */
	#dependencies;

	/**
	 * Construct a RawFunc, and immediately scan the definition for dependencies
	 * @param {string} name 
	 * @param {string} definition 
	 */
	constructor(name, definition) {
		this.#name = name;
		assert(definition != undefined);
		this.#definition = definition;
		this.#dependencies = new Set();

		let re = new RegExp("__helios__[a-zA-Z_0-9]*", "g");

		let matches = this.#definition.match(re);

		if (matches !== null) {
			for (let match of matches) {
				this.#dependencies.add(match);
			}
		}
	}

	get name() {
		return this.#name;
	}

	/**
	 * Loads 'this.#dependecies' (if not already loaded), then load 'this'
	 * @param {Map<string, RawFunc>} db 
	 * @param {Map<string, IR>} dst 
	 * @returns {void}
	 */
	load(db, dst) {
		if (onNotifyRawUsage !== null) {
			onNotifyRawUsage(this.#name, 1);
		}

		if (dst.has(this.#name)) {
			return;
		} else {
			for (let dep of this.#dependencies) {
				if (!db.has(dep)) {
					throw new Error(`InternalError: dependency ${dep} is not a builtin`);
				} else {
					assertDefined(db.get(dep)).load(db, dst);
				}
			}

			dst.set(this.#name, new IR(replaceTabs(this.#definition)));
		}
	}
}

/**
 * Initializes the db containing all the builtin functions
 * @returns {Map<string, RawFunc>}
 */
// only need to wrap these source in IR right at the very end
function makeRawFunctions() {
	/** @type {Map<string, RawFunc>} */
	let db = new Map();

	// local utility functions

	/**
	 * @param {RawFunc} fn 
	 */
	function add(fn) {
		if (db.has(fn.name)) {
			throw new Error(`builtin ${fn.name} duplicate`);
		}
		db.set(fn.name, fn);
	}

	/**
	 * Adds basic auto members to a fully named type
	 * @param {string} ns 
	 */
	function addDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__common__identity"));
	}

	/**
	 * Adds basic auto members to a fully named enum type
	 * @param {string} ns 
	 */
	function addEnumDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
	}

	/**
	 * Generates the IR needed to unwrap a Plutus-core constrData
	 * @param {string} dataExpr
	 * @param {number} iConstr 
	 * @param {number} iField 
	 * @param {string} errorExpr 
	 * @returns {string}
	 */
	function unData(dataExpr, iConstr, iField, errorExpr = "error(\"unexpected constructor index\")") {
		let inner = "__core__sndPair(pair)";
		for (let i = 0; i < iField; i++) {
			inner = `__core__tailList(${inner})`;
		}

		// deferred evaluation of ifThenElse branches
		return `(pair) -> {__core__ifThenElse(__core__equalsInteger(__core__fstPair(pair), ${iConstr}), () -> {__core__headList(${inner})}, () -> {${errorExpr}})()}(__core__unConstrData(${dataExpr}))`;
	}

	/**
	 * Generates verbose IR for unwrapping a Plutus-core constrData.
	 * If config.DEBUG === false then returns IR without print statement
	 * @param {string} dataExpr
	 * @param {string} constrName
	 * @param {number} iConstr
	 * @param {number} iField
	 * @returns {string}
	 */
	function unDataVerbose(dataExpr, constrName, iConstr, iField) {
		if (!config.DEBUG) {
			return unData(dataExpr, iConstr, iField);
		} else {
			return unData(dataExpr, iConstr, iField, `__helios__common__verbose_error(__core__appendString("bad constr for ${constrName}, want ${iConstr.toString()} but got ", __helios__int__show(__core__fstPair(pair))()))`)
		}
	}

	/**
	 * Generates IR for constructing a list.
	 * By default the result is kept as list, and not converted to data
	 * @param {string[]} args 
	 * @param {boolean} toData 
	 * @returns 
	 */
	function makeList(args, toData = false) {
		let n = args.length;
		let inner = "__core__mkNilData(())";

		for (let i = n - 1; i >= 0; i--) {
			inner = `__core__mkCons(${args[i]}, ${inner})`;
		}

		if (toData) {
			inner = `__core__listData(${inner})`
		}

		return inner;
	}


	// Common builtins
	add(new RawFunc("__helios__common__verbose_error",
	`(msg) -> {
		__core__trace(msg, () -> {error("")})()
	}`));
	add(new RawFunc("__helios__common__assert_constr_index",
	`(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i),
			() -> {data},
			() -> {error("unexpected constructor index")}
		)()
	}`));
	add(new RawFunc("__helios__common__identity",
	`(self) -> {self}`));
	add(new RawFunc("__helios__common__not",
	`(b) -> {
		__core__ifThenElse(b, false, true)
	}`));
	add(new RawFunc("__helios__common____eq", "__core__equalsData"));
	add(new RawFunc("__helios__common____neq",
	`(a, b) -> {
		__helios__common__not(__core__equalsData(a, b))
	}`));
	add(new RawFunc("__helios__common__serialize",
	`(self) -> {
		() -> {
			__core__bData(__core__serialiseData(self))
		}
	}`));
	add(new RawFunc("__helios__common__any",
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
							fn(__core__headList(self)),
							() -> {true}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__all", 
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
							fn(__core__headList(self)),
							() -> {recurse(recurse, __core__tailList(self), fn)},
							() -> {false}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map",
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
							fn(__core__headList(rem)), 
							recurse(recurse, __core__tailList(rem), lst)
						)
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter", 
	`(self, fn, nil) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {nil}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {__core__mkCons(__core__headList(self), recurse(recurse, __core__tailList(self), fn))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter_list", 
	`(self, fn) -> {
		__helios__common__filter(self, fn, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__filter_map",
	`(self, fn) -> {
		__helios__common__filter(self, fn, __core__mkNilPairData(()))
	}`));
	add(new RawFunc("__helios__common__find",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {error("not found")}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {callback(__core__headList(self))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__find_safe",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__core__constrData(1, __helios__common__list_0)}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__constrData(0, __helios__common__list_1(callback(__core__headList(self))))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {recurse(recurse, __core__tailList(self), fn, fn(z, __core__headList(self)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold_lazy",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {fn(__core__headList(self), () -> {recurse(recurse, __core__tailList(self), fn, z)})}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__insert_in_sorted",
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
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList(lst)))}
							)()
						}(__core__headList(lst))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__sort", 
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
						}(__core__headList(lst), recurse(recurse, __core__tailList(lst)))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map_get",
	`(self, key, fnFound, fnNotFound) -> {
		(self) -> {
			(recurse) -> {
				recurse(recurse, self, key)
			}(
				(recurse, self, key) -> {
					__core__chooseList(
						self, 
						fnNotFound, 
						() -> {
							__core__ifThenElse(
								__core__equalsData(key, __core__fstPair(__core__headList(self))), 
								() -> {fnFound(__core__sndPair(__core__headList(self)))}, 
								() -> {recurse(recurse, __core__tailList(self), key)}
							)()
						}
					)()
				}
			)
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__common__is_in_bytearray_list",
	`(lst, key) -> {
		__helios__common__any(lst, (item) -> {__core__equalsData(item, key)})
	}`));
	add(new RawFunc("__helios__common__unBoolData",
	`(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`));
	add(new RawFunc("__helios__common__boolData",
	`(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__unStringData",
	`(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`));
	add(new RawFunc("__helios__common__stringData",
	`(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`));
	add(new RawFunc("__helios__common__length", 
	`(lst) -> {
		(recurse) -> {
			__core__iData(recurse(recurse, lst))
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {0}, 
					() -> {__core__addInteger(recurse(recurse, __core__tailList(lst)), 1)}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__common__min", 
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(a, b),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__common__concat", 
	`(a, b) -> {
		(recurse) -> {
			recurse(recurse, b, a)
		}(
			(recurse, lst, rem) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {__core__mkCons(__core__headList(rem), recurse(recurse, lst, __core__tailList(rem)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__slice_bytearray",
	`(self, selfLengthFn) -> {
		(start, end) -> {
			(self) -> {
				(start, end) -> {
					(normalize) -> {
						__core__bData(
							(fn) -> {
								fn(normalize(start))
							}(
								(start) -> {
									(fn) -> {
										fn(normalize(end))
									}(
										(end) -> {
											__core__sliceByteString(start, __core__subtractInteger(end, __helios__common__max(start, 0)), self)
										}
									)
								}
							)
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
				}(__core__unIData(start), __core__unIData(end))
			}(__core__unBData(self))
		}
	}`));
	add(new RawFunc("__helios__common__starts_with", 
	`(self, selfLengthFn) -> {
		(self) -> {
			(prefix) -> {
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
				}(__core__unBData(prefix))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__common__ends_with",
	`(self, selfLengthFn) -> {
		(self) -> {
			(suffix) -> {
				(suffix) -> {
					(n, m) -> {
						__core__ifThenElse(
							__core__lessThanInteger(n, m),
							() -> {false},
							() -> {
								__core__equalsByteString(suffix, __core__sliceByteString(__core__subtractInteger(n, m), m, self))
							}
						)()
					}(selfLengthFn(self), __core__lengthOfByteString(suffix))
				}(__core__unBData(suffix))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__common__fields", 
	`(self) -> {
		__core__sndPair(__core__unConstrData(self))
	}`));
	add(new RawFunc("__helios__common__field_0", 
	`(self) -> {
		__core__headList(__helios__common__fields(self))
	}`));
	add(new RawFunc("__helios__common__fields_after_0",
	`(self) -> {
		__core__tailList(__helios__common__fields(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__tuple_field_0",
	`(self) -> {
		__core__headList(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__common__tuple_fields_after_0", 
	`(self) -> {
		__core__tailList(__core__unListData(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__tuple_field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__tuple_fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__list_0", "__core__mkNilData(())"));
	add(new RawFunc("__helios__common__list_1", 
	`(a) -> {
		__core__mkCons(a, __helios__common__list_0)
	}`));
	for (let i = 2; i < 20; i++) {
		/**
		 * @type {string[]}
		 */
		let args = [];

		for (let j = 0; j < i; j++) {
			args.push(`arg${j.toString()}`);
		}

		let woFirst = args.slice()
		let first = assertDefined(woFirst.shift());

		add(new RawFunc(`__helios__common__list_${i.toString()}`,
	`(${args.join(", ")}) -> {
		__core__mkCons(${first}, __helios__common__list_${(i-1).toString()}(${woFirst.join(", ")}))
	}`));
	}
	add(new RawFunc("__helios__common__hash_datum_data", 
	`(data) -> {
		__core__bData(__core__blake2b_256(__core__serialiseData(data)))
	}`));


	// Global builtin functions
	add(new RawFunc("__helios__print", 
	`(msg) -> {
		__core__trace(__helios__common__unStringData(msg), ())
	}`));
	add(new RawFunc("__helios__error",
	`(msg) -> {
		__core__trace(
			__helios__common__unStringData(msg), 
			() -> {
				error("error thrown by user-code")
			}
		)()
	}`));
	add(new RawFunc("__helios__assert",
	`(cond, msg) -> {
		__core__ifThenElse(
			cond,
			() -> {
				()
			},
			() -> {
				__core__trace(
					__helios__common__unStringData(msg),
					() -> {
						error("assert failed")
					}
				)()
			}
		)()
	}`));


	// Int builtins
	addDataFuncs("__helios__int");
	add(new RawFunc("__helios__int____neg",
	`(self) -> {
		__core__iData(__core__multiplyInteger(__core__unIData(self), -1))	
	}`));
	add(new RawFunc("__helios__int____pos", "__helios__common__identity"));
	add(new RawFunc("__helios__int____add",
	`(a, b) -> {
		__core__iData(__core__addInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____sub",
	`(a, b) -> {
		__core__iData(__core__subtractInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____mul",
	`(a, b) -> {
		__core__iData(__core__multiplyInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____div",
	`(a, b) -> {
		__core__iData(__core__divideInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____mod",
	`(a, b) -> {
		__core__iData(__core__modInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____geq",
	`(a, b) -> {
		__helios__common__not(__core__lessThanInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____gt",
	`(a, b) -> {
		__helios__common__not(__core__lessThanEqualsInteger(__core__unIData(a), __core__unIData(b)))
	}`));
	add(new RawFunc("__helios__int____leq",
	`(a, b) -> {
		__core__lessThanEqualsInteger(__core__unIData(a), __core__unIData(b))
	}`));
	add(new RawFunc("__helios__int____lt",
	`(a, b) -> {
		__core__lessThanInteger(__core__unIData(a), __core__unIData(b))
	}`));
	add(new RawFunc("__helios__int__min",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(__core__unIData(a), __core__unIData(b)),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__int__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(__core__unIData(a), __core__unIData(b)),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__int__bound_min",
	`(self) -> {
		(other) -> {
			__helios__int__max(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound_max",
	`(self) -> {
		(other) -> {
			__helios__int__min(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound",
	`(self) -> {
		(min, max) -> {
			__helios__int__max(__helios__int__min(self, max), min)
		}
	}`));
	add(new RawFunc("__helios__int__abs",
	`(self) -> {
		() -> {
			(i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, 0),
					() -> {
						__core__iData(__core__multiplyInteger(i, -1))
					},
					() -> {
						self
					}
				)()
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__encode_zigzag",
	`(self) -> {
		() -> {
			(i) -> {
				__core__iData(
					__core__ifThenElse(
						__core__lessThanInteger(i, 0),
						() -> {
							__core__subtractInteger(__core__multiplyInteger(i, -2), 1)
						},
						() -> {
							__core__multiplyInteger(i, 2)
						}
					)()
				)
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__decode_zigzag",
	`(self) -> {
		() -> {
			(i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, 0),
					() -> {
						error("expected positive int")
					},
					() -> {
						__core__iData(
							__core__ifThenElse(
								__core__equalsInteger(__core__modInteger(i, 2), 0),
								() -> {
									__core__divideInteger(i, 2)
								},
								() -> {
									__core__divideInteger(__core__addInteger(i, 1), -2)
								}
							)()
						)
					}
				)()
			}(__core__unIData(self))
		}
	}`));
	add(new RawFunc("__helios__int__to_bool",
	`(self) -> {
		() -> {
			__core__ifThenElse(__core__equalsInteger(__core__unIData(self), 0), false, true)
		}
	}`));
	add(new RawFunc("__helios__int__to_hex",
	`(self) -> {
		(self) -> {
			() -> {
				(recurse) -> {
					__core__bData(
						__core__ifThenElse(
							__core__lessThanInteger(self, 0),
							() -> {
								__core__consByteString(
									45,
									recurse(recurse, __core__multiplyInteger(self, -1), #)
								)
							},
							() -> {
								recurse(recurse, self, #)
							}
						)()
					)
				}(
					(recurse, self, bytes) -> {
						(digit) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(self, 16),
									() -> {bytes},
									() -> {
										recurse(recurse, __core__divideInteger(self, 16), bytes)
									}
								)()
							}(
								__core__consByteString(
									__core__ifThenElse(
										__core__lessThanInteger(digit, 10), 
										__core__addInteger(digit, 48), 
										__core__addInteger(digit, 87)
									), 
									bytes
								)
							)
						}(__core__modInteger(self, 16))
					}
				)
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__common__BASE58_ALPHABET", "#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a"))
	add(new RawFunc("__helios__int__to_base58",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {
							error("expected positive number")
						},
						() -> {
							(recurse) -> {
								recurse(recurse, self, #)
							}(
								(recurse, self, bytes) -> {
									(digit) -> {
										(bytes) -> {
											__core__ifThenElse(
												__core__lessThanInteger(self, 58),
												() -> {
													bytes
												},
												() -> {
													recurse(recurse, __core__divideInteger(self, 58), bytes)
												}
											)()
										}(
											__core__consByteString(
												__core__indexByteString(__helios__common__BASE58_ALPHABET, digit),
												bytes
											)
										)
									}(__core__modInteger(self, 58))
								}
							)
						}
					)()
				)
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_1", "#ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000102030405060708ffffffffffff"));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_2", "#ff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839ffffffffff"));
	add(new RawFunc("__helios__int__invert_base58_char", 
	`(char) -> {
		(digit) -> {
			__core__ifThenElse(
				__core__equalsInteger(digit, 0xff),
				() -> {
					error("invalid base58 character")
				},
				() -> {
					digit
				}
			)()
		}(
			__core__ifThenElse(
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
			)()
		)
	}`));
	add(new RawFunc("__helios__int__from_base58",
	`(str) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, -1),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 58), __core__subtractInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(
												__helios__int__invert_base58_char(
													__core__indexByteString(bytes, i)
												),
												pow
											)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(str))
	}`));
	add(new RawFunc("__helios__int__show",
	`(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__decodeUtf8(
					(recurse) -> {
						__core__ifThenElse(
							__core__lessThanInteger(self, 0),
							() -> {__core__consByteString(45, recurse(recurse, __core__multiplyInteger(self, -1)))},
							() -> {recurse(recurse, self)}
						)()
					}(
						(recurse, i) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(i, 10),
									() -> {bytes},
									() -> {__core__appendByteString(recurse(recurse, __core__divideInteger(i, 10)), bytes)}
								)()
							}(__core__consByteString(__core__addInteger(__core__modInteger(i, 10), 48), #))
						}
					)
				))
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__parse_digit",
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
						error("not a digit")
					}
				)()
			},
			() -> {
				error("not a digit")
			}
		)()
	}`));
	add(new RawFunc("__helios__int__parse",
	`(string) -> {
		(bytes) -> {
			__core__iData(
				(n, b0) -> {
					(recurse) -> {
						__core__ifThenElse(
							__core__equalsInteger(b0, 48),
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(n, 1),
									() -> {
										0
									},
									() -> {
										error("zero padded integer can't be parsed")
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
												error("-0 not allowed")
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
					}(
						(recurse, acc, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, n),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__addInteger(i, 1))
									}(
										__core__addInteger(
											__core__multiplyInteger(acc, 10), 
											__helios__int__parse_digit(__core__indexByteString(bytes, i))
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes), __core__indexByteString(bytes, 0))
			)
		}(__core__unBData(string))
	}`));
	add(new RawFunc("__helios__int__from_big_endian",
	`(bytes) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, -1),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__subtractInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(bytes))
	}`));
	add(new RawFunc("__helios__int__from_little_endian", 
	`(bytes) -> {
		(bytes) -> {
			__core__iData(
				(n) -> {
					(recurse) -> {
						recurse(recurse, 0, 1, 0)
					}(
						(recurse, acc, pow, i) -> {
							__core__ifThenElse(
								__core__equalsInteger(i, n),
								() -> {
									acc
								},
								() -> {
									(new_acc) -> {
										recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
									}(
										__core__addInteger(
											acc,
											__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
										)
									)
								}
							)()
						}
					)
				}(__core__lengthOfByteString(bytes))
			)
		}(__core__unBData(bytes))
	}`));
	add(new RawFunc("__helios__int__to_big_endian",
	`(self) -> {
		(self) -> {
			() -> {
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("can't convert negative number to big endian bytearray")
					},
					() -> {
						(recurse) -> {
							__core__bData(recurse(recurse, self, #))
						}(
							(recurse, self, bytes) -> {
								(bytes) -> {
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
								}(__core__consByteString(self, bytes))
							}
						)
					}
				)()
			}
		}(__core__unIData(self))
	}`));
	add(new RawFunc("__helios__int__to_little_endian",
	`(self) -> {
		(self) -> {
			() -> {
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("can't convert negative number to big endian bytearray")
					},
					() -> {
						(recurse) -> {
							__core__bData(recurse(recurse, self))
						}(
							(recurse, self) -> {
								__core__consByteString(self,
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
							}
						)
					}
				)()
			}
		}(__core__unIData(self))
	}`))


	// Bool builtins
	add(new RawFunc(`__helios__bool____eq`, 
	`(a, b) -> {
		__core__ifThenElse(a, b, __helios__common__not(b))
	}`));
	add(new RawFunc(`__helios__bool____neq`,
	`(a, b) -> {
		__core__ifThenElse(a, __helios__common__not(b), b)
	}`));
	add(new RawFunc(`__helios__bool__serialize`, 
	`(self) -> {
		__helios__common__serialize(__helios__common__boolData(self))
	}`));
	add(new RawFunc(`__helios__bool__from_data`,
	`(data) -> {
		__helios__common__unBoolData(data)
	}`));
	add(new RawFunc("__helios__bool__and",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {b()}, 
			() -> {false}
		)()
	}`));
	add(new RawFunc("__helios__bool__or",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {true},
			() -> {b()}
		)()
	}`));
	add(new RawFunc("__helios__bool____not", "__helios__common__not"));
	add(new RawFunc("__helios__bool__to_int",
	`(self) -> {
		() -> {
			__core__iData(__core__ifThenElse(self, 1, 0))
		}
	}`));
	add(new RawFunc("__helios__bool__show",
	`(self) -> {
		() -> {
			__helios__common__stringData(__core__ifThenElse(self, "true", "false"))
		}
	}`));
	add(new RawFunc("__helios__bool__trace",
	`(self) -> {
		(prefix) -> {
			__core__trace(
				__helios__common__unStringData(
					__helios__string____add(
						prefix,
						__helios__bool__show(self)()
					)
				), 
				self
			)
		}
	}`));


	// String builtins
	addDataFuncs("__helios__string");
	add(new RawFunc("__helios__string____add",
	`(a, b) -> {
		__helios__common__stringData(__core__appendString(__helios__common__unStringData(a), __helios__common__unStringData(b)))	
	}`));
	add(new RawFunc("__helios__string__starts_with", "__helios__bytearray__starts_with"));
	add(new RawFunc("__helios__string__ends_with", "__helios__bytearray__ends_with"));
	add(new RawFunc("__helios__string__encode_utf8",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__encodeUtf8(self))
			}
		}(__helios__common__unStringData(self))
	}`));


	// ByteArray builtins
	addDataFuncs("__helios__bytearray");
	add(new RawFunc("__helios__bytearray____add",
	`(a, b) -> {
		__core__bData(__core__appendByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____geq",
	`(a, b) -> {
		__helios__common__not(__core__lessThanByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____gt",
	`(a, b) -> {
		__helios__common__not(__core__lessThanEqualsByteString(__core__unBData(a), __core__unBData(b)))
	}`));
	add(new RawFunc("__helios__bytearray____leq",
	`(a, b) -> {
		__core__lessThanEqualsByteString(__core__unBData(a), __core__unBData(b))
	}`));
	add(new RawFunc("__helios__bytearray____lt",
	`(a, b) -> {
		__core__lessThanByteString(__core__unBData(a), __core__unBData(b))
	}`));
	add(new RawFunc("__helios__bytearray__length",
	`(self) -> {
		__core__iData(__core__lengthOfByteString(__core__unBData(self)))
	}`));
	add(new RawFunc("__helios__bytearray__slice",
	`(self) -> {
		__helios__common__slice_bytearray(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__ends_with",
	`(self) -> {
		__helios__common__ends_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__prepend", 
	`(self) -> {
		(byte) -> {
			__core__bData(
				__core__consByteString(
					__core__unIData(byte),
					__core__unBData(self)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha2",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha2_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__sha3",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__sha3_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__blake2b",
	`(self) -> {
		(self) -> {
			() -> {
				__core__bData(__core__blake2b_256(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__decode_utf8",
	`(self) -> {
		(self) -> {
			() -> {
				__helios__common__stringData(__core__decodeUtf8(self))
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray__show",
	`(self) -> {
		(self) -> {
			() -> {
				(recurse) -> {
					__helios__common__stringData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						(n) -> {
							__core__ifThenElse(
								__core__lessThanInteger(0, n),
								() -> {
									__core__appendString(
										__core__decodeUtf8((hexBytes) -> {
											__core__ifThenElse(
												__core__equalsInteger(__core__lengthOfByteString(hexBytes), 1),
												__core__consByteString(48, hexBytes),
												hexBytes
											)
										}(__core__unBData(__helios__int__to_hex(__core__iData(__core__indexByteString(self, 0)))()))), 
										recurse(recurse, __core__sliceByteString(1, n, self))
									)
								},
								() -> {
									""
								}
							)()
						}(__core__lengthOfByteString(self))
					}
				)
			}
		}(__core__unBData(self))
	}`));
	add(new RawFunc("__helios__bytearray32____eq", "__helios__bytearray____eq"));
	add(new RawFunc("__helios__bytearray32____neq", "__helios__bytearray____neq"));
	add(new RawFunc("__helios__bytearray32__serialize", "__helios__bytearray__serialize"));
	add(new RawFunc("__helios__bytearray32____add", "__helios__bytearray____add"));
	add(new RawFunc("__helios__bytearray32__length", "(_) -> {__core__iData(32)}"));
	add(new RawFunc("__helios__bytearray32__slice", 
	`(self) -> {
		__helios__common__slice_bytearray(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__ends_with", 
	`(self) -> {
		__helios__common__ends_with(self, (self) -> {32})
	}`));
	add(new RawFunc("__helios__bytearray32__sha2", "__helios__bytearray__sha2"));
	add(new RawFunc("__helios__bytearray32__sha3", "__helios__bytearray__sha3"));
	add(new RawFunc("__helios__bytearray32__blake2b", "__helios__bytearray__blake2b"));
	add(new RawFunc("__helios__bytearray32__decode_utf8", "__helios__bytearray__decode_utf8"));
	add(new RawFunc("__helios__bytearray32__show", "__helios__bytearray__show"));


	// List builtins
	addDataFuncs("__helios__list");
	add(new RawFunc("__helios__list__new",
	`(n, fn) -> {
		(n) -> {
			(recurse) -> {
				__core__listData(recurse(recurse, 0))
			}(
				(recurse, i) -> {
					__core__ifThenElse(
						__core__lessThanInteger(i, n),
						() -> {__core__mkCons(fn(__core__iData(i)), recurse(recurse, __core__addInteger(i, 1)))},
						() -> {__core__mkNilData(())}
					)()
				}
			)
		}(__core__unIData(n))
	}`));
	add(new RawFunc("__helios__list__new_const",
	`(n, item) -> {
		__helios__list__new(n, (i) -> {item})
	}`));
	add(new RawFunc("__helios__list____add",
	`(a, b) -> {
		__core__listData(__helios__common__concat(__core__unListData(a), __core__unListData(b)))
	}`));
	add(new RawFunc("__helios__list__length",
	`(self) -> {
		__helios__common__length(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__head",
	`(self) -> {
		__core__headList(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__tail",
	`(self) -> {
		__core__listData(__core__tailList(__core__unListData(self)))
	}`));
	add(new RawFunc("__helios__list__is_empty",
	`(self) -> {
		(self) -> {
			() -> {
				__core__nullList(self)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__get",
	`(self) -> {
		(self) -> {
			(index) -> {
				(recurse) -> {
					recurse(recurse, self, __core__unIData(index))
				}(
					(recurse, self, index) -> {
						__core__chooseList(
							self, 
							() -> {error("index out of range")}, 
							() -> {__core__ifThenElse(
								__core__lessThanInteger(index, 0), 
								() -> {error("index out of range")}, 
								() -> {
									__core__ifThenElse(
										__core__equalsInteger(index, 0), 
										() -> {__core__headList(self)}, 
										() -> {recurse(recurse, __core__tailList(self), __core__subtractInteger(index, 1))}
									)()
								}
							)()}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__get_singleton",
	`(self) -> {
		(self) -> {
			() -> {
				__core__chooseUnit(
					__helios__assert(
						__core__nullList(__core__tailList(self)),
						__helios__common__stringData("not a singleton list")
					),
					__core__headList(self)
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__any",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__any(self, fn)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__all",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__all(self, fn)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__prepend",
	`(self) -> {
		(self) -> {
			(item) -> {
				__core__listData(__core__mkCons(item, self))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__find",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__find(self, fn, __helios__common__identity)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__find_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__helios__common__find_safe(self, fn, __helios__common__identity)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__filter",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__core__listData(__helios__common__filter_list(self, fn))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__for_each",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, lst) -> {
						__core__chooseList(
							lst,
							() -> {
								()
							},
							() -> {
								__core__chooseUnit(
									fn(__core__headList(lst)),
									recurse(recurse, __core__tailList(lst))
								)
							}
						)()
					}
				)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__fold",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				__helios__common__fold(self, fn, z)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__fold_lazy",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				__helios__common__fold_lazy(self, fn, z)
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				__core__listData(__helios__common__map(self, fn, __core__mkNilData(())))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__list__map_to_bool",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					__helios__common__boolData(fn(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__list__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				__core__listData(__helios__common__sort(self, comp))
			}
		}(__core__unListData(self))
	}`));
	add(new RawFunc("__helios__boollist__new", 
	`(n, fn) -> {
		__helios__list__new(
			n, 
			(i) -> {
				__helios__common__boolData(fn(i))
			}
		)
	}`));
	add(new RawFunc("__helios__boollist__new_const", 
	`(n, item) -> {
		__helios__list__new_const(n, __helios__common__boolData(item))
	}`));
	add(new RawFunc("__helios__boollist____eq", "__helios__list____eq"));
	add(new RawFunc("__helios__boollist____neq", "__helios__list____neq"));
	add(new RawFunc("__helios__boollist__serialize", "__helios__list__serialize"));
	add(new RawFunc("__helios__boollist__from_data", "__helios__list__from_data"));
	add(new RawFunc("__helios__boollist____add", "__helios__list____add"));
	add(new RawFunc("__helios__boollist__length", "__helios__list__length"));
	add(new RawFunc("__helios__boollist__head", 
	`(self) -> {
		__helios__common__unBoolData(__helios__list__head(self))
	}`));
	add(new RawFunc("__helios__boollist__tail", "__helios__list__tail"));
	add(new RawFunc("__helios__boollist__is_empty", "__helios__list__is_empty"));
	add(new RawFunc("__helios__boollist__get", 
	`(self) -> {
		(index) -> {
			__helios__common__unBoolData(__helios__list__get(self)(index))
		}
	}`));
	add(new RawFunc("__helios__boollist__get_singleton",
	`(self) -> {
		() -> {
			__helios__common__unBoolData(__helios__list__get_singleton(self)())
		}
	}`));
	add(new RawFunc("__helios__boollist__any", 
	`(self) -> {
		(fn) -> {
			__helios__list__any(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__all",
	`(self) -> {
		(fn) -> {
			__helios__list__all(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__prepend",
	`(self) -> {
		(item) -> {
			__helios__list__prepend(self)(__helios__common__boolData(item))
		}
	}`));
	add(new RawFunc("__helios__boollist__find",
	`(self) -> {
		(fn) -> {
			__helios__common__unBoolData(
				__helios__list__find(self)(
					(item) -> {
						fn(__helios__common__unBoolData(item))
					}
				)
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__find_safe",
	`(self) -> {
		(fn) -> {
			__helios__list__find_safe(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__filter",
	`(self) -> {
		(fn) -> {
			__helios__list__filter(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__for_each",
	`(self) -> {
		(fn) -> {
			__helios__list__for_each(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__fold",
	`(self) -> {
		(fn, z) -> {
			__helios__list__fold(self)(
				(prev, item) -> {
					fn(prev, __helios__common__unBoolData(item))
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__fold_lazy",
	`(self) -> {
		(fn, z) -> {
			__helios__list__fold_lazy(self)(
				(item, next) -> {
					fn(__helios__common__unBoolData(item), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__map",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					fn(__helios__common__unBoolData(item))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__map_to_bool",
	`(self) -> {
		(fn) -> {
			__helios__list__map(self)(
				(item) -> {
					__helios__common__boolData(fn(__helios__common__unBoolData(item)))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boollist__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				(comp) -> {
					__core__listData(__helios__common__sort(self, comp))
				}(
					(a, b) -> {
						comp(__helios__common__unBoolData(a), __helios__common__unBoolData(b))
					}
				)
			}
		}(__core__unListData(self))
	}`));


	// Map builtins
	addDataFuncs("__helios__map");
	add(new RawFunc("__helios__map____add",
	`(a, b) -> {
		__core__mapData(__helios__common__concat(__core__unMapData(a), __core__unMapData(b)))
	}`));
	add(new RawFunc("__helios__map__prepend",
	`(self) -> {
		(self) -> {
			(key, value) -> {
				__core__mapData(__core__mkCons(__core__mkPairData(key, value), self))
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__head",
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(__core__fstPair(head), __core__sndPair(head))
				}
			}
		}(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__head_key",
	`(self) -> {
		__core__fstPair(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__head_value",
	`(self) -> {
		__core__sndPair(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__length",
	`(self) -> {
		__helios__common__length(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__tail",
	`(self) -> {
		__core__mapData(__core__tailList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__map__is_empty",
	`(self) -> {
		(self) -> {
			() -> {
				__core__nullList(self)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__get",
	`(self) -> {
		(key) -> {
			__helios__common__map_get(self, key, (x) -> {x}, () -> {error("key not found")})
		}
	}`));
	add(new RawFunc("__helios__map__get_safe",
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				key, 
				(x) -> {
					__core__constrData(0, __helios__common__list_1(x))
				}, 
				() -> {
					__core__constrData(1, __helios__common__list_0)
				}
			)
		}
	}`));
	add(new RawFunc("__helios__map__all",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__all(self, fn)
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__any",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__any(self, fn)
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__delete",
	`(self) -> {
		(self) -> {
			(key) -> {
				(recurse) -> {
					__core__mapData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {self},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {recurse(recurse, tail)},
										() -> {__core__mkCons(head, recurse(recurse, tail))}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__filter",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__filter_map(self, fn))
				}(
					(pair) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self, fn)
				}(
					(recurse, self, fn) -> {
						__core__chooseList(
							self, 
							() -> {error("not found")}, 
							() -> {
								(head) -> {
									__core__ifThenElse(
										fn(__core__fstPair(head), __core__sndPair(head)), 
										() -> {
											(callback) -> {
												callback(__core__fstPair(head), __core__sndPair(head))
											}
										}, 
										() -> {recurse(recurse, __core__tailList(self), fn)}
									)()
								}(__core__headList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self, fn)
				}(
					(recurse, self, fn) -> {
						__core__chooseList(
							self, 
							() -> {
								(callback) -> {
									callback(() -> {error("not found")}, false)
								}
							}, 
							() -> {
								(head) -> {
									__core__ifThenElse(
										fn(__core__fstPair(head), __core__sndPair(head)), 
										() -> {
											(callback) -> {
												callback(
													() -> {
														(callback) -> {
															callback(__core__fstPair(head), __core__sndPair(head))
														}
													},
													true
												)
											}
										}, 
										() -> {recurse(recurse, __core__tailList(self), fn)}
									)()
								}(__core__headList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_key",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						__core__fstPair
					)
				}(
					(pair) -> {
						fn(__core__fstPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_key_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self,
						fn,
						__core__fstPair
					)
				}(
					(pair) -> {
						fn(__core__fstPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_value",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						__core__sndPair
					)
				}(
					(pair) -> {
						fn(__core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__find_value_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self,
						fn,
						__core__sndPair
					)
				}(
					(pair) -> {
						fn(__core__sndPair(pair))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, value)
								}
							)
						}(fn(__core__fstPair(pair), __core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__map_to_bool",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, __helios__common__boolData(value))
								}
							)
						}(fn(__core__fstPair(pair), __core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__fold",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				(fn) -> {
					__helios__common__fold(self, fn, z)
				}(
					(z, pair) -> {
						fn(z, __core__fstPair(pair), __core__sndPair(pair))
					}
				)
				
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__fold_lazy",
	`(self) -> {
		(self) -> {
			(fn, z) -> {
				(fn) -> {
					__helios__common__fold_lazy(self, fn, z)
				}(
					(pair, next) -> {
						fn(__core__fstPair(pair), __core__sndPair(pair), next)
					}
				)
				
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__for_each",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {
								()
							},
							() -> {
								(head) -> {
									__core__chooseUnit(
										fn(__core__fstPair(head), __core__sndPair(head)),
										recurse(recurse, __core__tailList(map))
									)
								}(__core__headList(map))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__set", 
	`(self) -> {
		(self) -> {
			(key, value) -> {
				(recurse) -> {
					__core__mapData(recurse(recurse, self))
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {
								__core__mkCons(__core__mkPairData(key, value), __core__mkNilPairData(()))
							},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {
											__core__mkCons(__core__mkPairData(key, value), tail)
										},
										() -> {
											__core__mkCons(head, recurse(recurse, tail))
										}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__map__sort",
	`(self) -> {
		(self) -> {
			(comp) -> {
				(comp) -> {
					__core__mapData(__helios__common__sort(self, comp))
				}(
					(a, b) -> {
						comp(__core__fstPair(a), __core__sndPair(a), __core__fstPair(b), __core__sndPair(b))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap____eq", "__helios__map____eq"));
	add(new RawFunc("__helios__boolmap____neq", "__helios__map____neq"));
	add(new RawFunc("__helios__boolmap__serialize", "__helios__map__serialize"));
	add(new RawFunc("__helios__boolmap__from_data", "__helios__map__from_data"));
	add(new RawFunc("__helios__boolmap____add", "__helios__map____add"));
	add(new RawFunc("__helios__boolmap__prepend",
	`(self) -> {
		(self) -> {
			(key, value) -> {
				__core__mapData(
					__core__mkCons(
						__core__mkPairData(key, __helios__common__boolData(value)),
						self
					)
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__head",
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(__core__fstPair(head), __helios__common__unBoolData(__core__sndPair(head)))
				}
			}
		}(__core__headList(__core__unMapData(self)))
	}`));
	add(new RawFunc("__helios__boolmap__head_key", "__helios__map__head_key"));
	add(new RawFunc("__helios__boolmap__head_value",
	`(self) -> {
		__helios__common__unBoolData(__helios__map__head_value(self))
	}`));
	add(new RawFunc("__helios__boolmap__length", "__helios__map__length"));
	add(new RawFunc("__helios__boolmap__tail", "__helios__map__tail"));
	add(new RawFunc("__helios__boolmap__is_empty", "__helios__map__is_empty"));
	add(new RawFunc("__helios__boolmap__get", 
	`(self) -> {
		(key) -> {
			__helios__common__unBoolData(__helios__map__get(self)(key))
		}
	}`));
	add(new RawFunc("__helios__boolmap__all",
	`(self) -> {
		(fn) -> {
			__helios__map__all(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__any",
	`(self) -> {
		(fn) -> {
			__helios__map__any(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__delete", "__helios__map__delete"));
	add(new RawFunc("__helios__boolmap__filter",
	`(self) -> {
		(fn) -> {
			__helios__map__filter(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				(result) -> {
					(callback) -> {
						result((key, value) -> {
							callback(key, __helios__common__unBoolData(value))
						})
					}
				}(__helios__map__find(self)(fn))
			}(
				(fst, snd) -> {
					fn(fst, __helios__common__unBoolData(snd))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find_safe",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				(resultok) -> {
					(callback) -> {
						resultok((result, ok) -> {
							callback(
								() -> {
									(inner_callback) -> {
										result()(
											(key, value) -> {
												inner_callback(key, __helios__common__unBoolData(value))
											}
										)
									}
								}, 
								ok
							)
						})
					}
				}(__helios__map__find_safe(self)(fn))
			}(
				(fst, snd) -> {
					fn(fst, __helios__common__unBoolData(snd))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__find_key", "__helios__map__find_key"));
	add(new RawFunc("__helios__boolmap__find_key_safe", "__helios__map__find_key_safe"));
	add(new RawFunc("__helios__boolmap__find_value",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find(
						self, 
						fn,
						(result) -> {
							__helios__common__unBoolData(__core__sndPair(result))
						}	
					)
				}(
					(pair) -> {
						fn(__helios__common__unBoolData(__core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__find_value_safe",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__helios__common__find_safe(
						self, 
						fn,
						(result) -> {
							__core__sndPair(result)
						}	
					)
				}(
					(pair) -> {
						fn(__helios__common__unBoolData(__core__sndPair(pair)))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__map",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, value)
								}
							)
						}(fn(__core__fstPair(pair), __helios__common__unBoolData(__core__sndPair(pair))))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__map_to_bool",
	`(self) -> {
		(self) -> {
			(fn) -> {
				(fn) -> {
					__core__mapData(__helios__common__map(self, fn, __core__mkNilPairData(())))
				}(
					(pair) -> {
						(mapped_pair) -> {
							mapped_pair(
								(key, value) -> {
									__core__mkPairData(key, __helios__common__boolData(value))
								}
							)
						}(fn(__core__fstPair(pair), __helios__common__unBoolData(__core__sndPair(pair))))
					}
				)
			}
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__boolmap__fold",
	`(self) -> {
		(fn, z) -> {
			__helios__map__fold(self)(
				(prev, key, value) -> {
					fn(prev, key, __helios__common__unBoolData(value))
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__fold_lazy",
	`(self) -> {
		(fn, z) -> {
			__helios__map__fold_lazy(self)(
				(key, value, next) -> {
					fn(key, __helios__common__unBoolData(value), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__for_each",
	`(self) -> {
		(fn) -> {
			__helios__map__for_each(self)(
				(key, value) -> {
					fn(key, __helios__common__unBoolData(value))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__boolmap__set", 
	`(self) -> {
		(key, value) -> {
			__helios__map__set(self)(key, __helios__common__boolData(value))
		}
	}`));
	add(new RawFunc("__helios__boolmap__sort",
	`(self) -> {
		(comp) -> {
			(comp) -> {
				__helios__map__sort(self)(comp)
			}(
				(ak, av, bk, bv) -> {
					comp(ak, __helios__common__unBoolData(av), bk, __helios__common__unBoolData(bv))
				}
			)
		}
	}`));


	// Option[T] builtins
	addDataFuncs("__helios__option");
	add(new RawFunc("__helios__option__map", 
	`(self) -> {
		(fn) -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {
						__helios__option__some__new(fn(__core__headList(__core__sndPair(pair))))
					},
					() -> {
						__helios__option__none__new()
					}
				)()
			}(__core__unConstrData(self))
		}
	}`));
	add(new RawFunc("__helios__option__map_to_bool",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					__helios__common__boolData(fn(data))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__option__unwrap", 
	`(self) -> {
		() -> {
			__helios__common__field_0(self)
		}
	}`));


	// Option[T]::Some
	addEnumDataFuncs("__helios__option__some");
	add(new RawFunc("__helios__option__some__new",
	`(data) -> {
		__core__constrData(0, __helios__common__list_1(data))
	}`));
	add(new RawFunc("__helios__option__some__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__option__some__some", "__helios__common__field_0"));
	

	// Option[T]::None
	addEnumDataFuncs("__helios__option__none");
	add(new RawFunc("__helios__option__none__new",
	`() -> {
		__core__constrData(1, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__option__none__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));


	// Option[Bool]
	add(new RawFunc("__helios__booloption____eq", "__helios__option____eq"));
	add(new RawFunc("__helios__booloption____neq", "__helios__option____neq"));
	add(new RawFunc("__helios__booloption__serialize", "__helios__option__serialize"));
	add(new RawFunc("__helios__booloption__from_data", "__helios__option__from_data"));
	add(new RawFunc("__helios__booloption__unwrap", `
	(self) -> {
		() -> {
			__helios__common__unBoolData(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__booloption__map",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					fn(__helios__common__unBoolData(data))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__booloption__map_to_bool",
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__option__map(self)(fn)
			}(
				(data) -> {
					__helios__common__boolData(fn(__helios__common__unBoolData(data)))
				}
			)
		}
	}`));

	
	// Option[Bool]::Some
	add(new RawFunc("__helios__booloption__some____eq", "__helios__option__some____eq"));
	add(new RawFunc("__helios__booloption__some____neq", "__helios__option__some____neq"));
	add(new RawFunc("__helios__booloption__some__serialize", "__helios__option__some__serialize"));
	add(new RawFunc("__helios__booloption__some__new", 
	`(b) -> {
		__helios__option__some__new(__helios__common__boolData(b))
	}`));
	add(new RawFunc("__helios__booloption__some__cast", "__helios__option__some__cast"));
	add(new RawFunc("__helios__booloption__some__some", 
	`(self) -> {
		__helios__common__unBoolData(__helios__option__some__some(self))
	}`));

	
	// Option[Bool]::None
	add(new RawFunc("__helios__booloption__none____eq",      "__helios__option__none____eq"));
	add(new RawFunc("__helios__booloption__none____neq",     "__helios__option__none____neq"));
	add(new RawFunc("__helios__booloption__none__serialize", "__helios__option__none__serialize"));
	add(new RawFunc("__helios__booloption__none__new",       "__helios__option__none__new"));
	add(new RawFunc("__helios__booloption__none__cast",      "__helios__option__none__cast"));

	
	// Hash builtins
	addDataFuncs("__helios__hash");
	add(new RawFunc("__helios__hash____lt", "__helios__bytearray____lt"));
	add(new RawFunc("__helios__hash____leq", "__helios__bytearray____leq"));
	add(new RawFunc("__helios__hash____gt", "__helios__bytearray____gt"));
	add(new RawFunc("__helios__hash____geq", "__helios__bytearray____geq"));
	add(new RawFunc("__helios__hash__new", `__helios__common__identity`));
	add(new RawFunc("__helios__hash__show", "__helios__bytearray__show"));
	add(new RawFunc("__helios__hash__CURRENT", "__core__bData(#0000000000000000000000000000000000000000000000000000000000000000)"));
	add(new RawFunc("__helios__hash__from_script_hash", "__helios__common__identity"));

	
	// ScriptHash builtin
	addDataFuncs("__helios__scripthash");


	// PubKey builtin
	addDataFuncs("__helios__pubkey");
	add(new RawFunc("__helios__pubkey__new", "__helios__common__identity"));
	add(new RawFunc("__helios__pubkey__show", "__helios__bytearray__show"));
	add(new RawFunc("__helios__pubkey__verify", 
	`(self) -> {
		(message, signature) -> {
			__core__verifyEd25519Signature(__core__unBData(self), __core__unBData(message), __core__unBData(signature))
		}
	}`));


	// ScriptContext builtins
	addDataFuncs("__helios__scriptcontext");
	add(new RawFunc("__helios__scriptcontext__new_spending",
	`(tx, output_id) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(1, __helios__common__list_1(output_id))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_minting",
	`(tx, mph) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(0, __helios__common__list_1(mph))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_rewarding",
	`(tx, cred) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(2, __helios__common__list_1(cred))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_certifying",
	`(tx, dcert) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(3, __helios__common__list_1(dcert))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__tx", "__helios__common__field_0"));
	add(new RawFunc("__helios__scriptcontext__purpose", "__helios__common__field_1"));
	add(new RawFunc("__helios__scriptcontext__get_current_input",
	`(self) -> {
		() -> {
			(id) -> {
				__helios__list__find(__helios__tx__inputs(__helios__scriptcontext__tx(self)))(
					(input) -> {
						__core__equalsData(__helios__txinput__output_id(input), id)
					}
				)
			}(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_cont_outputs",
	`(self) -> {
		() -> {
			(vh) -> {
				(outputs) -> {
					__helios__list__filter(outputs)(
						(output) -> {
							(credential) -> {
								(pair) -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__fstPair(pair), 0),
										() -> {
											false
										},
										() -> {
											__core__equalsData(__core__headList(__core__sndPair(pair)), vh)
										}
									)()
								}(__core__unConstrData(credential))
							}(__helios__address__credential(__helios__txoutput__address(output)))
						}
					)
				}(__helios__tx__outputs(__helios__scriptcontext__tx(self)))
			}(__helios__scriptcontext__get_current_validator_hash(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_spending_purpose_output_id",
	`(self) -> {
		() -> {
			__helios__common__field_0(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_validator_hash",
	`(self) -> {
		() -> {
			__helios__credential__validator__hash(
				__helios__credential__validator__cast(
					__helios__address__credential(
						__helios__txoutput__address(
							__helios__txinput__output(
								__helios__scriptcontext__get_current_input(self)()
							)
						)
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_minting_policy_hash", "__helios__scriptcontext__get_spending_purpose_output_id"));
	add(new RawFunc("__helios__scriptcontext__get_staking_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_script_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));


	// StakingPurpose builtins
	addDataFuncs("__helios__stakingpurpose");


	// StakingPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__stakingpurpose__rewarding");
	add(new RawFunc("__helios__stakingpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// StakingPurpose::Certifying builtins
	addEnumDataFuncs("__helios__stakingpurpose__certifying");
	add(new RawFunc("__helios__stakingpurpose__certifying__dcert", "__helios__common__field_0"));


	// ScriptPurpose builtins
	addDataFuncs("__helios__scriptpurpose");
	add(new RawFunc("__helios__scriptpurpose__new_minting",
	`(mintingPolicyHash) -> {
		__core__constrData(0, __helios__common__list_1(mintingPolicyHash))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_spending",
	`(output_id) -> {
		__core__constrData(1, __helios__common__list_1(output_id))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_rewarding",
	`(cred) -> {
		__core__constrData(2, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_certifying",
	`(dcert) -> {
		__core__constrData(3, __helios__common__list_1(dcert))
	}`));


	// ScriptPurpose::Minting builtins
	addEnumDataFuncs("__helios__scriptpurpose__minting");
	add(new RawFunc("__helios__scriptpurpose__minting__policy_hash", "__helios__common__field_0"));

	
	// ScriptPurpose::Spending builtins
	addEnumDataFuncs("__helios__scriptpurpose__spending");
	add(new RawFunc("__helios__scriptpurpose__spending__output_id", "__helios__common__field_0"));

	
	// ScriptPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__scriptpurpose__rewarding");
	add(new RawFunc("__helios__scriptpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// ScriptPurpose::Certifying builtins
	addEnumDataFuncs("__helios__scriptpurpose__certifying");
	add(new RawFunc("__helios__scriptpurpose__certifying__dcert", "__helios__common__field_0"));


	// DCert builtins
	addDataFuncs("__helios__dcert");
	add(new RawFunc("__helios__dcert__new_register",
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_deregister",
	`(cred) -> {
		__core__constrData(1, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__dcert__new_delegate",
	`(cred, pool_id) -> {
		__core__constrData(2, __helios__common__list_2(cred, pool_id))
	}`));
	add(new RawFunc("__helios__dcert__new_register_pool",
	`(id, vrf) -> {
		__core__constrData(3, __helios__common__list_2(id, vrf))
	}`));
	add(new RawFunc("__helios__dcert__new_retire_pool",
	`(id, epoch) -> {
		__core__constrData(4, __helios__common__list_2(id, epoch))
	}`));


	// DCert::Register builtins
	addEnumDataFuncs("__helios__dcert__register");
	add(new RawFunc("__helios__dcert__register__credential", "__helios__common__field_0"));


	// DCert::Deregister builtins
	addEnumDataFuncs("__helios__dcert__deregister");
	add(new RawFunc("__helios__dcert__deregister__credential", "__helios__common__field_0"));


	// DCert::Delegate builtins
	addEnumDataFuncs("__helios__dcert__delegate");
	add(new RawFunc("__helios__dcert__delegate__delegator", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__delegate__pool_id", "__helios__common__field_1"));


	// DCert::RegisterPool builtins
	addEnumDataFuncs("__helios__dcert__registerpool");
	add(new RawFunc("__helios__dcert__registerpool__pool_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__registerpool__pool_vrf", "__helios__common__field_1"));


	// DCert::RetirePool builtins
	addEnumDataFuncs("__helios__dcert__retirepool");
	add(new RawFunc("__helios__dcert__retirepool__pool_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__dcert__retirepool__epoch", "__helios__common__field_1"));


	// Tx builtins
	addDataFuncs("__helios__tx");
	add(new RawFunc("__helios__tx__new",
	`(inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, validity, signatories, redeemers, datums) -> {
		__core__constrData(0, __helios__common__list_12(
			inputs,
			ref_inputs,
			outputs,
			fee,
			minted,
			dcerts,
			withdrawals,
			validity,
			signatories,
			redeemers,
			datums,
			__helios__txid__CURRENT
		))
	}`));
	add(new RawFunc("__helios__tx__inputs", "__helios__common__field_0"));
	add(new RawFunc("__helios__tx__ref_inputs", "__helios__common__field_1"))
	add(new RawFunc("__helios__tx__outputs", "__helios__common__field_2"));
	add(new RawFunc("__helios__tx__fee", "__helios__common__field_3"));
	add(new RawFunc("__helios__tx__minted", "__helios__common__field_4"));
	add(new RawFunc("__helios__tx__dcerts", "__helios__common__field_5"));
	add(new RawFunc("__helios__tx__withdrawals", "__helios__common__field_6"));
	add(new RawFunc("__helios__tx__time_range", "__helios__common__field_7"));
	add(new RawFunc("__helios__tx__signatories", "__helios__common__field_8"));
	add(new RawFunc("__helios__tx__redeemers", "__helios__common__field_9"));
	add(new RawFunc("__helios__tx__datums", "__helios__common__field_10"));
	add(new RawFunc("__helios__tx__id", "__helios__common__field_11"));
	add(new RawFunc("__helios__tx__find_datum_hash",
	`(self) -> {
		(datum) -> {
			__core__fstPair(__helios__common__find(
				__core__unMapData(__helios__tx__datums(self)),
				(pair) -> {
					__core__equalsData(__core__sndPair(pair), datum)
				},
				__helios__common__identity
			))
		}
	}`));
	add(new RawFunc("__helios__tx__get_datum_data",
	`(self) -> {
		(output) -> {
			(pair) -> {
				(idx) -> {
					__core__ifThenElse(
						__core__equalsInteger(idx, 1),
						() -> {
							__helios__map__get(__helios__tx__datums(self))(__core__headList(__core__sndPair(pair)))
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(idx, 2),
								() -> {
									__core__headList(__core__sndPair(pair))
								},
								() -> {error("output doesn't have a datum")}
							)()
						}
					)()
				}(__core__fstPair(pair))
			}(__core__unConstrData(__helios__txoutput__datum(output)))
		}
	}`));
	add(new RawFunc("__helios__tx__filter_outputs",
	`(self, fn) -> {
		__core__listData(
			__helios__common__filter_list(
				__core__unListData(__helios__tx__outputs(self)), 
				fn
			)
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to",
	`(self) -> {
		(pubKeyHash) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_sent_to(output)(pubKeyHash)
			})
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_datum",
	`(self) -> {
		(pubKeyHash, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_sent_to_inline_datum(self, pubKeyHash, datum)
				},
				() -> {
					__helios__tx__outputs_sent_to_datum_hash(self, pubKeyHash, datum)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_datum_hash",
	`(self, pubKeyHash, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_sent_to(output)(pubKeyHash)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data(datum))
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to_inline_datum",
	`(self, pubKeyHash, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pubKeyHash)
					},
					() -> {
						__helios__txoutput__has_inline_datum(output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by",
	`(self) -> {
		(validatorHash) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_locked_by(output)(validatorHash)
			})
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_datum",
	`(self) -> {
		(validatorHash, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_locked_by_inline_datum(self, validatorHash, datum)
				},
				() -> {
					__helios__tx__outputs_locked_by_datum_hash(self, validatorHash, datum)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_datum_hash",
	`(self, validatorHash, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_locked_by(output)(validatorHash)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data(datum))
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by_inline_datum",
	`(self, validatorHash, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(validatorHash)
					},
					() -> {
						__helios__txoutput__has_inline_datum(output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__value_sent_to",
	`(self) -> {
		(pubKeyHash) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to(self)(pubKeyHash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_sent_to_datum",
	`(self) -> {
		(pubKeyHash, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to_datum(self)(pubKeyHash, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by",
	`(self) -> {
		(validatorHash) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by(self)(validatorHash))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by_datum",
	`(self) -> {
		(validatorHash, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by_datum(self)(validatorHash, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__is_signed_by",
	`(self) -> {
		(hash) -> {
			__helios__common__any(
				__core__unListData(__helios__tx__signatories(self)),
				(signatory) -> {
					__core__equalsData(signatory, hash)
				}
			)
		}
	}`));


	// TxId builtins
	addDataFuncs("__helios__txid");
	add(new RawFunc("__helios__txid__bytes",
	`(self) -> {
		__core__headList(__core__sndPair(__core__unConstrData(self)))
	}`));
	add(new RawFunc("__helios__txid____lt", 
	`(a, b) -> {
		__helios__bytearray____lt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____leq", 
	`(a, b) -> {
		__helios__bytearray____leq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____gt", 
	`(a, b) -> {
		__helios__bytearray____gt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____geq", 
	`(a, b) -> {
		__helios__bytearray____geq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid__new",
	`(bytes) -> {
		__core__constrData(0, __helios__common__list_1(bytes)) 
	}`));
	add(new RawFunc("__helios__txid__CURRENT", "__helios__txid__new(__core__bData(#0000000000000000000000000000000000000000000000000000000000000000))"));
	add(new RawFunc("__helios__txid__show",
	`(self) -> {
		__helios__bytearray__show(__helios__txid__bytes(self))
	}`));


	// TxInput builtins
	addDataFuncs("__helios__txinput");
	add(new RawFunc("__helios__txinput__new",
	`(output_id, output) -> {
		__core__constrData(0, __helios__common__list_2(output_id, output))
	}`));
	add(new RawFunc("__helios__txinput__output_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txinput__output", "__helios__common__field_1"));
	

	// TxOutput builtins
	addDataFuncs("__helios__txoutput");
	add(new RawFunc("__helios__txoutput__new", 
	`(address, value, datum) -> {
		__core__constrData(0, __helios__common__list_4(address, value, datum, __helios__option__none__new()))
	}`));
	add(new RawFunc("__helios__txoutput__address", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutput__value", "__helios__common__field_1"));
	add(new RawFunc("__helios__txoutput__datum", "__helios__common__field_2"));
	add(new RawFunc("__helios__txoutput__ref_script_hash", "__helios__common__field_3"));
	add(new RawFunc("__helios__txoutput__get_datum_hash",
	`(self) -> {
		() -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 1),
					() -> {__core__headList(__core__sndPair(pair))},
					() -> {__core__bData(#)}
				)()
			}(__core__unConstrData(__helios__txoutput__datum(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__has_datum_hash",
	`(self, datumHash) -> {
		__core__equalsData(__helios__txoutput__get_datum_hash(self)(), datumHash)
	}`));
	add(new RawFunc("__helios__txoutput__has_inline_datum",
	`(self, datum) -> {
		(pair) -> {
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 2),
				() -> {__core__equalsData(datum, __core__headList(__core__sndPair(pair)))},
				() -> {false}
			)()
		}(__core__unConstrData(__helios__txoutput__datum(self)))
	}`));
	add(new RawFunc("__helios__txoutput__is_locked_by",
	`(self) -> {
		(hash) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_validator(credential),
					() -> {
						__core__equalsData(
							hash, 
							__helios__credential__validator__hash(
								__helios__credential__validator__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__is_sent_to",
	`(self) -> {
		(pkh) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_pubkey(credential),
					() -> {
						__core__equalsData(
							pkh, 
							__helios__credential__pubkey__hash(
								__helios__credential__pubkey__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__sum_values",
	`(outputs) -> {
		__helios__list__fold(outputs)(
			(prev, txOutput) -> {
				__helios__value____add(
					prev,
					__helios__txoutput__value(txOutput)
				)
			}, 
			__helios__value__ZERO
		)	
	}`));


	// OutputDatum
	addDataFuncs("__helios__outputdatum");
	add(new RawFunc("__helios__outputdatum__new_none",
	`() -> {
		__core__constrData(0, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__outputdatum__new_hash",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__outputdatum__new_inline",
	`(data) -> {
		__core__constrData(2, __helios__common__list_1(data))
	}`));
	add(new RawFunc("__helios__outputdatum__new_inline_from_bool",
	`(b) -> {
		__helios__outputdatum__new_inline(_helios__common__boolData(b))
	}`));
	add(new RawFunc("__helios__outputdatum__get_inline_data",
	`(self) -> {
		() -> {
			(pair) -> {
				(index, fields) -> {
					__core__ifThenElse(
						__core__equalsInteger(index, 2),
						() -> {
							__core__headList(fields)
						},
						() -> {
							error("not an inline datum")
						}
					)()
				}(__core__fstPair(pair), __core__sndPair(pair))
			}(__core__unConstrData(self))
		}
	}`));


	// OutputDatum::None
	addEnumDataFuncs("__helios__outputdatum__none");
	

	// OutputDatum::Hash
	addEnumDataFuncs("__helios__outputdatum__hash");
	add(new RawFunc("__helios__outputdatum__hash__hash", "__helios__common__field_0"));


	// OutputDatum::Inline
	addEnumDataFuncs("__helios__outputdatum__inline");
	add(new RawFunc("__helios__outputdatum__inline__data", "__helios__common__field_0"));


	// RawData
	addDataFuncs("__helios__data");
	add(new RawFunc("__helios__data__tag", 
	`(self) -> {
		__core__iData(__core__fstPair(__core__unConstrData(self)))
	}`));


	// TxOutputId
	addDataFuncs("__helios__txoutputid");
	add(new RawFunc("__helios__txoutputid__tx_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutputid__index", "__helios__common__field_1"));
	add(new RawFunc("__helios__txoutputid__comp", 
	`(a, b, comp_txid, comp_index) -> {
		(a_txid, a_index) -> {
			(b_txid, b_index) -> {
				__core__ifThenElse(
					__core__equalsData(a_txid, b_txid),
					() -> {
						comp_index(a_index, b_index)
					},
					() -> {
						comp_txid(a_txid, b_txid)
					}
				)()
			}(__helios__txoutputid__tx_id(b), __helios__txoutputid__index(b))
		}(__helios__txoutputid__tx_id(a), __helios__txoutputid__index(a))
	}`));
	add(new RawFunc("__helios__txoutputid____lt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____lt, __helios__int____lt)
	}`));
	add(new RawFunc("__helios__txoutputid____leq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____leq, __helios__int____leq)
	}`));
	add(new RawFunc("__helios__txoutputid____gt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____gt, __helios__int____gt)
	}`));
	add(new RawFunc("__helios__txoutputid____geq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____geq, __helios__int____geq)
	}`));
	add(new RawFunc("__helios__txoutputid__new",
	`(tx_id, idx) -> {
		__core__constrData(0, __helios__common__list_2(tx_id, idx))
	}`));


	// Address
	addDataFuncs("__helios__address");
	add(new RawFunc("__helios__address__new", 
	`(cred, staking_cred) -> {
		__core__constrData(0, __helios__common__list_2(cred, staking_cred))
	}`));
	add(new RawFunc("__helios__address__new_empty",
	`() -> {
		__core__constrData(0, __helios__common__list_2(__helios__credential__new_pubkey(__core__bData(#)), __helios__option__none__new()))
	}`))
	add(new RawFunc("__helios__address__credential", "__helios__common__field_0"));
	add(new RawFunc("__helios__address__staking_credential", "__helios__common__field_1"));
	add(new RawFunc("__helios__address__is_staked",
	`(self) -> {
		() -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(__helios__common__field_1(self))), 0)
		}
	}`));


	// Credential builtins
	addDataFuncs("__helios__credential");
	add(new RawFunc("__helios__credential__new_pubkey",
	`(hash) -> {
		__core__constrData(0, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__credential__new_validator",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(hash))
	}`));
	add(new RawFunc("__helios__credential__is_pubkey",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
	}`));
	add(new RawFunc("__helios__credential__is_validator",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
	}`));


	// Credential::PubKey builtins
	addEnumDataFuncs("__helios__credential__pubkey");
	add(new RawFunc("__helios__credential__pubkey__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__credential__pubkey__hash", "__helios__common__field_0"));


	// Credential::Validator builtins
	addEnumDataFuncs("__helios__credential__validator");
	add(new RawFunc("__helios__credential__validator__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));
	add(new RawFunc("__helios__credential__validator__hash", "__helios__common__field_0"));


	// StakingHash builtins
	addDataFuncs("__helios__stakinghash");
	add(new RawFunc("__helios__stakinghash__new_stakekey", "__helios__credential__new_pubkey"));
	add(new RawFunc("__helios__stakinghash__new_validator", "__helios__credential__new_validator"));
	add(new RawFunc("__helios__stakinghash__is_stakekey", "__helios__credential__is_stakekey"));
	add(new RawFunc("__helios__stakinghash__is_validator", "__helios__credential__is_validator"));


	// StakingHash::StakeKey builtins
	addEnumDataFuncs("__helios__stakinghash__stakekey");
	add(new RawFunc("__helios__stakinghash__stakekey__cast", "__helios__credential__pubkey__cast"));
	add(new RawFunc("__helios__stakinghash__stakekey__hash", "__helios__credential__pubkey__hash"));


	// StakingHash::Validator builtins
	addEnumDataFuncs("__helios__stakinghash__validator");
	add(new RawFunc("__helios__stakinghash__validator__cast", "__helios__credential__validator__cast"));
	add(new RawFunc("__helios__stakinghash__validator__hash", "__helios__credential__validator__hash"));


	// StakingCredential builtins
	addDataFuncs("__helios__stakingcredential");
	add(new RawFunc("__helios__stakingcredential__new_hash", 
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__stakingcredential__new_ptr", 
	`(i, j, k) -> {
		__core__constrData(1, __helios__common__list_3(i, j, k))
	}`));

	
	// StakingCredential::Hash builtins
	addEnumDataFuncs("__helios__stakingcredential__hash");
	add(new RawFunc("__helios__stakingcredential__hash__hash", "__helios__common__field_0"));


	// StakingCredential::Ptr builtins
	addEnumDataFuncs("__helios__stakingcredential__ptr");


	// Time builtins
	addDataFuncs("__helios__time");
	add(new RawFunc("__helios__time__new", `__helios__common__identity`));
	add(new RawFunc("__helios__time____add", `__helios__int____add`));
	add(new RawFunc("__helios__time____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__time____sub_alt", `__helios__int____sub`));
	add(new RawFunc("__helios__time____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__time____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__time____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__time____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__time__show", `__helios__int__show`));


	// Duratin builtins
	addDataFuncs("__helios__duration");
	add(new RawFunc("__helios__duration__new", `__helios__common__identity`));
	add(new RawFunc("__helios__duration____add", `__helios__int____add`));
	add(new RawFunc("__helios__duration____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__duration____mul", `__helios__int____mul`));
	add(new RawFunc("__helios__duration____div", `__helios__int____div`));
	add(new RawFunc("__helios__duration____div_alt", `__helios__int____div`));
	add(new RawFunc("__helios__duration____mod", `__helios__int____mod`));
	add(new RawFunc("__helios__duration____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__duration____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__duration____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__duration____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__duration__SECOND", "__core__iData(1000)"));
	add(new RawFunc("__helios__duration__MINUTE", "__core__iData(60000)"));
	add(new RawFunc("__helios__duration__HOUR", "__core__iData(3600000)"));
	add(new RawFunc("__helios__duration__DAY", "__core__iData(86400000)"));
	add(new RawFunc("__helios__duration__WEEK", "__core__iData(604800000)"));


	// TimeRange builtins
	addDataFuncs("__helios__timerange");
	add(new RawFunc("__helios__timerange__new", `
	(a, b) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__ALWAYS", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__common__boolData(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__common__boolData(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__NEVER", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__common__boolData(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__common__boolData(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__from", `
	(a) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(a)),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(2, __helios__common__list_0),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__to", `
	(b) -> {
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_0),
				__helios__common__boolData(true)
			)),
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(1, __helios__common__list_1(b)),
				__helios__common__boolData(true)
			))
		))
	}`));
	add(new RawFunc("__helios__timerange__is_before", 
	`(self) -> {
		(t) -> {
			(upper) -> {
				(extended, closed) -> {
					(extType) -> {
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
											() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))},
											() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
			}(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__is_after",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(extType) -> {
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
											() -> {__core__lessThanInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
											() -> {__core__lessThanEqualsInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__contains",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(lowerExtType, checkUpper) -> {
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
												() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))},
												() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), __core__unIData(t))}
											)(),
											() -> {checkUpper()},
											() -> {false}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)), () -> {
						(upper) -> {
							(extended, closed) -> {
								(upperExtType) -> {
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
															() -> {__core__lessThanEqualsInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
															() -> {__core__lessThanInteger(__core__unIData(t), __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
														)(),
														true,
														false
													)
												}
											)()
										}
									)()
								}(__core__fstPair(__core__unConstrData(extended)))
							}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					})
				}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__start",
	`(self) -> {
		__helios__common__field_0(__helios__common__field_0(__helios__common__field_0(self)))
	}`));
	add(new RawFunc("__helios__timerange__end",
	`(self) -> {
		__helios__common__field_0(__helios__common__field_0(__helios__common__field_1(self)))
	}`));
	add(new RawFunc("__helios__timerange__show",
	`(self) -> {
		() -> {
			(show_extended) -> {
				__helios__string____add(
					(lower) -> {
						(extended, closed) -> {
							__helios__string____add(
								__core__ifThenElse(
									closed,
									() -> {__helios__common__stringData("[")},
									() -> {__helios__common__stringData("(")}
								)(),
								show_extended(extended)
							)
						}(__helios__common__field_0(lower), __helios__common__unBoolData(__helios__common__field_1(lower)))
					}(__helios__common__field_0(self)),
					__helios__string____add(
						__helios__common__stringData(","),
						(upper) -> {
							(extended, closed) -> {
								__helios__string____add(
									show_extended(extended),
									__core__ifThenElse(
										closed,
										() -> {__helios__common__stringData("]")},
										() -> {__helios__common__stringData(")")}
									)()
								)
							}(__helios__common__field_0(upper), __helios__common__unBoolData(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					)
				)
			}(
				(extended) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {__helios__common__stringData("-inf")},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {__helios__common__stringData("+inf")},
									() -> {
										(fields) -> {
											__helios__int__show(__core__headList(fields))()
										}(__core__sndPair(__core__unConstrData(extended)))
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}
			)
		}
	}`))


	// AssetClass builtins
	addDataFuncs("__helios__assetclass");
	add(new RawFunc("__helios__assetclass__ADA", `__helios__assetclass__new(__core__bData(#), __core__bData(#))`));
	add(new RawFunc("__helios__assetclass__new",
	`(mph, token_name) -> {
		__core__constrData(0, __helios__common__list_2(mph, token_name))
	}`));
	add(new RawFunc("__helios__assetclass__mph", "__helios__common__field_0"));
	add(new RawFunc("__helios__assetclass__token_name", "__helios__common__field_1"));


	// Value builtins
	add(new RawFunc("__helios__value__serialize", "__helios__common__serialize"));
	add(new RawFunc("__helios__value__from_data", "__helios__common__identity"));
	add(new RawFunc("__helios__value__ZERO", `__core__mapData(__core__mkNilPairData(()))`));
	add(new RawFunc("__helios__value__lovelace",
	`(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`));
	add(new RawFunc("__helios__value__new",
	`(assetClass, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(0, __core__unIData(i)),
			() -> {
				__helios__value__ZERO
			},
			() -> {
				(mintingPolicyHash, tokenName) -> {
					__core__mapData(
						__core__mkCons(
							__core__mkPairData(
								mintingPolicyHash, 
								__core__mapData(
									__core__mkCons(
										__core__mkPairData(tokenName, i), 
										__core__mkNilPairData(())
									)
								)
							), 
							__core__mkNilPairData(())
						)
					)
				}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
			}
		)()
	}`));
	add(new RawFunc("__helios__value__from_map", "__helios__common__identity"));
	add(new RawFunc("__helios__value__to_map", 
	`(self) -> {
		() -> {
			self
		}
	}`));
	add(new RawFunc("__helios__value__get_map_keys",
	`(map) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__common__list_0}, 
					() -> {__core__mkCons(__core__fstPair(__core__headList(map)), recurse(recurse, __core__tailList(map)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__merge_map_keys",
	`(a, b) -> {
		(aKeys) -> {
			(recurse) -> {
				(uniqueBKeys) -> {
					__helios__common__concat(aKeys, uniqueBKeys)
				}(recurse(recurse, aKeys, b))
			}(
				(recurse, keys, map) -> {
					__core__chooseList(
						map, 
						() -> {__helios__common__list_0}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__is_in_bytearray_list(aKeys, key), 
									() -> {recurse(recurse, keys, __core__tailList(map))},
									() -> {__core__mkCons(key, recurse(recurse, keys, __core__tailList(map)))}
								)()
							}(__core__fstPair(__core__headList(map)))
						}
					)()
				}
			)
		}(__helios__value__get_map_keys(a))
	}`));

	add(new RawFunc("__helios__value__get_inner_map",
	`(map, mph) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__core__mkNilPairData(())},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), mph), 
							() -> {__core__unMapData(__core__sndPair(__core__headList(map)))},
							() -> {recurse(recurse, __core__tailList(map))}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__get_inner_map_int",
	`(map, key) -> {
		(recurse) -> {
			recurse(recurse, map, key)
		}(
			(recurse, map, key) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), key), 
							() -> {__core__unIData(__core__sndPair(__core__headList(map)))}, 
							() -> {recurse(recurse, __core__tailList(map), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__add_or_subtract_inner",
	`(op) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(sum) -> {
									__core__ifThenElse(
										__core__equalsInteger(sum, 0), 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__iData(sum)), tail)}
									)()
								}(op(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__add_or_subtract",
	`(op, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				__core__mapData(recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(())))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(item) -> {
									__core__chooseList(
										item, 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
									)()
								}(__helios__value__add_or_subtract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}(__core__unMapData(a), __core__unMapData(b))
	}`));
	add(new RawFunc("__helios__value__map_quantities",
	`(self, op) -> {
		(self) -> {
			(recurseInner) -> {
				(recurseOuter) -> {
					__core__mapData(recurseOuter(recurseOuter, self))
				}(
					(recurseOuter, outer) -> {
						__core__chooseList(
							outer,
							() -> {__core__mkNilPairData(())},
							() -> {
								(head) -> {
									__core__mkCons(
										__core__mkPairData(
											__core__fstPair(head), 
											__core__mapData(recurseInner(recurseInner, __core__unMapData(__core__sndPair(head))))
										),  
										recurseOuter(recurseOuter, __core__tailList(outer))
									)
								}(__core__headList(outer))
							}
						)()
					}
				)
			}(
				(recurseInner, inner) -> {
					__core__chooseList(
						inner,
						() -> {__core__mkNilPairData(())},
						() -> {
							(head) -> {
								__core__mkCons(
									__core__mkPairData(
										__core__fstPair(head),
										__core__iData(op(__core__unIData(__core__sndPair(head))))
									),
									recurseInner(recurseInner, __core__tailList(inner))
								)
							}(__core__headList(inner))
						}
					)()
				}
			)
		}(__core__unMapData(self))
	}`));
	add(new RawFunc("__helios__value__compare_inner",
	`(comp, a, b) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__common__not(comp(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key))), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare",
	`(comp, a, b) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b))
			}(
				(recurse, keys) -> {
					__core__chooseList(
						keys, 
						() -> {true}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__not(
										__helios__value__compare_inner(
											comp, 
											__helios__value__get_inner_map(a, key), 
											__helios__value__get_inner_map(b, key)
										)
									), 
									() -> {false}, 
									() -> {recurse(recurse, __core__tailList(keys))}
								)()
							}(__core__headList(keys))
						}
					)()
				}
			)
		}(__core__unMapData(a), __core__unMapData(b))
	}`));
	add(new RawFunc("__helios__value____eq",
	`(a, b) -> {
		__helios__value__compare(__core__equalsInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____neq",
	`(a, b) -> {
		__helios__common__not(__helios__value____eq(a, b))
	}`));
	add(new RawFunc("__helios__value____add",
	`(a, b) -> {
		__helios__value__add_or_subtract(__core__addInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____sub",
	`(a, b) -> {
		__helios__value__add_or_subtract(__core__subtractInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____mul",
	`(a, b) -> {
		(scale) -> {
			__helios__value__map_quantities(a, (qty) -> {__core__multiplyInteger(qty, scale)})
		}(__core__unIData(b))
	}`));
	add(new RawFunc("__helios__value____div",
	`(a, b) -> {
		(den) -> {
			__helios__value__map_quantities(a, (qty) -> {__core__divideInteger(qty, den)})
		}(__core__unIData(b))
	}`));
	add(new RawFunc("__helios__value____geq",
	`(a, b) -> {
		__helios__value__compare((a_qty, b_qty) -> {__helios__common__not(__core__lessThanInteger(a_qty, b_qty))}, a, b)
	}`));
	add(new RawFunc("__helios__value__contains", `
	(self) -> {
		(value) -> {
			__helios__value____geq(self, value)
		}
	}`));
	add(new RawFunc("__helios__value____gt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__common__not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					(a_qty, b_qty) -> {
						__helios__common__not(__core__lessThanEqualsInteger(a_qty, b_qty))
					}, 
					a, 
					b
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value____leq",
	`(a, b) -> {
		__helios__value__compare(__core__lessThanEqualsInteger, a, b)
	}`));
	add(new RawFunc("__helios__value____lt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__common__not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					(a_qty, b_qty) -> {
						__core__lessThanInteger(a_qty, b_qty)
					}, 
					a, 
					b
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__is_zero",
	`(self) -> {
		() -> {
			__core__nullList(__core__unMapData(self))
		}
	}`));
	add(new RawFunc("__helios__value__get",
	`(self) -> {
		(assetClass) -> {
			(map, mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, map)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("policy not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("tokenName not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {__core__sndPair(__core__headList(map))},
									() -> {inner(inner, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self), __helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_safe",
	`(self) -> {
		(assetClass) -> {
			(map, mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, map)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {__core__iData(0)}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {__core__iData(0)}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {__core__sndPair(__core__headList(map))},
									() -> {inner(inner, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self), __helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_lovelace",
	`(self) -> {
		() -> {
			__helios__value__get_safe(self)(__helios__assetclass__ADA)
		}
	}`));
	add(new RawFunc("__helios__value__get_assets",
	`(self) -> {
		() -> {
			__helios__map__filter(self)(
				(key, _) -> {
					__helios__common__not(__core__equalsByteString(__core__unBData(key), #))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__get_policy", 
	`(self) -> {
		(mph) -> {
			(map) -> {
				(recurse) -> {
					recurse(recurse, map)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {error("policy not found")},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {__core__sndPair(__core__headList(map))},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self))
		} 
	}`));
	add(new RawFunc("__helios__value__contains_policy",
	`(self) -> {
		(mph) -> {
			(map) -> {
				(recurse) -> {
					recurse(recurse, map)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {true},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__core__unMapData(self))
		}
	}`));
	add(new RawFunc("__helios__value__show",
	`(self) -> {
		() -> {
			__helios__map__fold(self)(
				(prev, mph, tokens) -> {
					__helios__map__fold(tokens)(
						(prev, token_name, qty) -> {
							__helios__string____add(
								prev,
								__core__ifThenElse(
									__helios__bytearray____eq(mph, __core__bData(#)),
									() -> {
										__helios__string____add(
											__helios__common__stringData("lovelace: "),
											__helios__string____add(
												__helios__int__show(qty)(),
												__helios__common__stringData("\\n")
											)
										)
									},
									() -> {
										__helios__string____add(
											__helios__bytearray__show(mph)(),
											__helios__string____add(
												__helios__common__stringData("."),
												__helios__string____add(
													__helios__bytearray__show(token_name)(),
													__helios__string____add(
														__helios__common__stringData(": "),
														__helios__string____add(
															__helios__int__show(qty)(),
															__helios__common__stringData("\\n")
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
				__helios__common__stringData("")
			)
		}
	}`))

	return db;
}

/**
 * @param {IR} ir 
 * @returns {IR}
 * @package
 */
export function wrapWithRawFunctions(ir) {
	let db = makeRawFunctions();

	// notify statistics of existence of builtin in correct order
	if (onNotifyRawUsage !== null) {
		for (let [name, _] of db) {
			onNotifyRawUsage(name, 0);
		}
	}

	let re = new RegExp("__helios[a-zA-Z0-9_]*", "g");

	let [src, _] = ir.generateSource();

	//console.log(src);

	let matches = src.match(re);

	let map = new Map();

	if (matches !== null) {
		for (let match of matches) {
			if (!map.has(match)) {
				if (!db.has(match)) {
					throw new Error(`builtin ${match} not found`);
				}

				let builtin = assertDefined(db.get(match));

				builtin.load(db, map);
			}
		}
	}

	return IR.wrapWithDefinitions(ir, map);
}
