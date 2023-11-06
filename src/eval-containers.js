//@ts-check
// Eval container types

import {
	assertDefined
} from "./utils.js";

import {
	Word,
	Site,
	FTPP,
	TTPP
} from "./tokens.js";

import { 
	ListData 
} from "./uplc-data.js";

import {
	HeliosData,
	HMap,
	HList,
	Option
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	ArgType,
    FuncType,
    GenericEnumMemberType,
    GenericType,
    VoidType,
	applyTypes
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EnumMemberType} EnumMemberType
 */

/**
 * @typedef {import("./eval-common.js").Named} Named
 */

/**
 * @typedef {import("./eval-common.js").Parametric} Parametric
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").InstanceMembers} InstanceMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeMembers} TypeMembers
 */

/**
 * @template {HeliosData} T
 * @typedef {import("./eval-common.js").GenericTypeProps<T>} GenericTypeProps
 */

/**
 * @typedef {import("./eval-common.js").InferenceMap} InferenceMap
 */

import {
	BoolType,
	ByteArrayType,
	IntType,
	RealType,
	StringType,
	genCommonInstanceMembers,
	genCommonTypeMembers
} from "./eval-primitives.js";

import {
	AnyTypeClass,
	GenericParametricType,
	GenericParametricEnumMemberType,
	Parameter,
    ParametricFunc,
	ParametricType,
	DefaultTypeClass,
	SummableTypeClass
} from "./eval-parametric.js";


/**
 * @internal
 * @param {Type[]} itemTypes
 * @returns {Type}
 */
export function IteratorType$(itemTypes) {
	const props = {
		name: `Iterator[${itemTypes.map(it => it.toString()).join(", ")}]`,
		path: `__helios__iterator__${itemTypes.length}`,
		genInstanceMembers: (self) => {
			// Note: to_list and to_map can't be part of Iterator because type information is lost (eg. we can map to an iterator over functions)

			const itemType = itemTypes.length == 1 ? itemTypes[0] : TupleType$(itemTypes);

			const members = {
				any: new FuncType([new FuncType(itemTypes, BoolType)], BoolType),
				drop: new FuncType([IntType], self),
				filter: new FuncType([new FuncType(itemTypes, BoolType)], self),
				find: new FuncType([new FuncType(itemTypes, BoolType)], itemType),
				for_each: new FuncType([new FuncType(itemTypes, new VoidType())], new VoidType()),
				fold: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([a.ref].concat(itemTypes), a.ref), a.ref], a.ref));
				})(),
				head: itemType,
				get: new FuncType([IntType], itemType),
				get_singleton: new FuncType([], itemType),
				is_empty: new FuncType([], BoolType),
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType(itemTypes, a.ref)], IteratorType$([a.ref])));
				})(),
				map2: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType(itemTypes, TupleType$([a.ref, b.ref]))], IteratorType$([a.ref, b.ref])));
				})(),
				prepend: new FuncType(itemTypes, self),
				tail: self,
				take: new FuncType([IntType], self)
			}

			if (itemTypes.length < 10) {
				members.zip = (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					return new ParametricFunc([a], new FuncType([ListType$(a.ref)], IteratorType$(itemTypes.concat([a.ref]))));
				})();
			}

			return members;
		},
		genTypeMembers: (self) => ({})
	};

	// if any of the item type is parametric, this return type must also be parametric so that the item type inference methods are called correctly
	//  (i.e. the inference method of this Iterator type calls the inference methods of the itemtypes)
	return itemTypes.some(it => it.isParametric()) ? new GenericParametricType(props) : new GenericType(props);
};

/**
 * @internal
 * @template {HeliosData} T
 * @implements {DataType}
 */
export class TupleType extends GenericType {
	#itemTypes;

	/**
	 * @param {GenericTypeProps<T>} props
	 * @param {Type[]} itemTypes
	 */
	constructor(props, itemTypes) {
		super(props);

		this.#itemTypes = itemTypes;
	}
	
	get itemTypes() {
		return this.#itemTypes;
	}

	/**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
		if (other instanceof TupleType) {
			return other.#itemTypes.length == this.#itemTypes.length && this.#itemTypes.every((it, i) => it.isBaseOf(other.#itemTypes[i]));
		} else {
			return false;
		}
    }

	/**
	 * @internal
	 * @param {Site} site
	 * @param {InferenceMap} map 
	 * @param {null | Type} type 
	 * @returns {Type}
	 */
	infer(site, map, type) {
		if (!this.#itemTypes.some(it => it.isParametric())) {
			return this;
		}

		if (!type) {
			const itemTypes = this.#itemTypes.map(it => it.infer(site, map, null));

			return TupleType$(itemTypes);
		} else if (type instanceof TupleType && this.#itemTypes.length == type.#itemTypes.length) {
			const itemTypes = this.#itemTypes.map((it, i) => it.infer(site, map, type.#itemTypes[i]));

			return TupleType$(itemTypes);
		}

		throw site.typeError(`unable to infer type of ${this.toString()} (${type instanceof TupleType} ${type instanceof GenericType})`);
	}
}

/**
 * TODO: rename DataType to something else
 * @internal
 * @param {Type} type 
 * @return {boolean}
 */
export function isDataType(type) {
	const dt = type.asDataType;

	if (!dt) {
		return false;
	}

	// no need to check for primitives
	if (dt == IntType || dt == StringType || dt == ByteArrayType || dt == BoolType || dt == RealType) {
		return true;
	}

	const dataTypeClass = new DefaultTypeClass();

	return dataTypeClass.isImplementedBy(dt)
}

/**
 * @internal
 * @param {Type[]} itemTypes
 * @param {boolean | null} isAllDataTypes - if the all the itemTypes are known datatypes, then don't check that here (could lead to infinite recursion)
 * @returns {Type}
 */
export function TupleType$(itemTypes, isAllDataTypes = null) {
	const isData = isAllDataTypes !== null ? isAllDataTypes : itemTypes.every(it => {
		return isDataType(it);
	});

	const props = {
		name: `(${itemTypes.map(it => it.toString()).join(", ")})`,
		path: `__helios__tuple[${itemTypes.map(it => it.asDataType ? it.asDataType.path : "__helios__func").join("@")}]`,
		genInstanceMembers: (self) => {
			const members = isData ? genCommonInstanceMembers(self) : {};

			const getters = [
				"first",
				"second",
				"third",
				"fourth",
				"fifth"
			];

			for (let i = 0; i< 5 && i < itemTypes.length; i++) {
				const key = getters[i];
				members[key] = itemTypes[i]
			}

			const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
			members.__to_func = new ParametricFunc([a], new FuncType([new FuncType(itemTypes, a.ref)], a.ref));
			
			return members;
		},
		genTypeMembers: (self) => {
			return isData ? genCommonTypeMembers(self) : {};
		}
	};

	return new TupleType(props, itemTypes);
}

/**
 * Returns null if `type` isn't a tuple
 * @internal
 * @param {Type} type 
 * @returns {null | Type[]}
 */
export function getTupleItemTypes(type) {
	if (type instanceof TupleType) {
		return type.itemTypes;
	} else {
		return null;
	}
}

/**
 * Builtin list type
 * @internal
 * @type {Parametric}
 */
export const ListType = new ParametricType({
	name: "[]",
	offChainType: HList,
	parameters: [new Parameter("ItemType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([itemType_]) => {
		const itemType = assertDefined(itemType_.asDataType);
		const offChainItemType = itemType.offChainType ?? null;
		const offChainType = offChainItemType ? HList(offChainItemType) : null;

		const props = {
			offChainType: offChainType,
			name: `[]${itemType.toString()}`,
			path: `__helios__list[${itemType.path}]`,
			genTypeDetails: (self) => ({
				inputType: `(${assertDefined(itemType.typeDetails?.inputType)})[]`,
				outputType: `(${assertDefined(itemType.typeDetails?.outputType)})[]`,
				internalType: {
					type: "List",
					itemType: assertDefined(itemType.typeDetails?.internalType)
				}
			}),
			jsToUplc: async (obj, helpers) => {
				if (Array.isArray(obj)) {
					return new ListData(await Promise.all(obj.map(item => itemType.jsToUplc(item, helpers))));
				} else {
					throw new Error("expected array");	
				}
			},
			uplcToJs: async (data, helpers) => {
				return await Promise.all(data.list.map(item => itemType.uplcToJs(item, helpers)));
			},
			genInstanceMembers: (self) => {
				/**
				 * @type {InstanceMembers}
				 */
				const specialMembers = {};

				if ((new SummableTypeClass()).isImplementedBy(itemType)) {
					specialMembers.sum = new FuncType([], itemType);
				} else if (StringType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), StringType, true)
					], StringType);
				} else if (ByteArrayType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), ByteArrayType, true)
					], ByteArrayType);
				} else if (itemType.asNamed?.name.startsWith("[]")) {
					specialMembers.flatten = new FuncType([], itemType);
				}

				return {
					...genCommonInstanceMembers(self),
					...specialMembers,
					all: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					any: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					append: new FuncType([itemType], self),
					drop: new FuncType([IntType], self),
					drop_end: new FuncType([IntType], self),
					filter: new FuncType([new FuncType([itemType], BoolType)], self),
					find: new FuncType([new FuncType([itemType], BoolType)], itemType),
					find_index: new FuncType([new FuncType([itemType], BoolType)], IntType),
					find_safe: new FuncType([new FuncType([itemType], BoolType)], OptionType$(itemType)),
					fold: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([a.ref, itemType], a.ref), a.ref], a.ref));
					})(),
					fold2: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b], new FuncType([new FuncType([a.ref, b.ref, itemType], TupleType$([a.ref, b.ref])), a.ref, b.ref], TupleType$([a.ref, b.ref])));
					})(),
					fold3: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						const c = new Parameter("c", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b, c], new FuncType([new FuncType([a.ref, b.ref, c.ref, itemType], TupleType$([a.ref, b.ref, c.ref])), a.ref, b.ref, c.ref], TupleType$([a.ref, b.ref, c.ref])));
					})(),
					fold_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
					})(),
					fold2_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b], new FuncType([new FuncType([itemType, new FuncType([], TupleType$([a.ref, b.ref]))], TupleType$([a.ref, b.ref])), a.ref, b.ref], TupleType$([a.ref, b.ref])));
					})(),
					for_each: new FuncType([new FuncType([itemType], new VoidType())], new VoidType()),
					get: new FuncType([IntType], itemType),
					get_singleton: new FuncType([], itemType),
					head: itemType,
					is_empty: new FuncType([], BoolType),
					length: IntType,
					map: (() => {
						const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType], a.ref)], ListType$(a.ref)));
					})(),
					map_option: (() => {
						const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType], OptionType$(a.ref))], ListType$(a.ref)));
					})(),
					prepend: new FuncType([itemType], self),
					set: new FuncType([IntType, itemType], self),
					sort: new FuncType([new FuncType([itemType, itemType], BoolType)], self),
					split_at: new FuncType([IntType], TupleType$([self, self], true)),
					tail: self,
					take: new FuncType([IntType], self),
					take_end: new FuncType([IntType], self),
					to_iterator: new FuncType([], IteratorType$([itemType])),
					zip: (() => {
						const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
						return new ParametricFunc([a], new FuncType([ListType$(a.ref)], IteratorType$([itemType, a.ref])));
					})()
				}
			},
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self),
				new: new FuncType([IntType, new FuncType([IntType], itemType)], self),
				new_const: new FuncType([IntType, itemType], self),
				from_iterator: new FuncType([IteratorType$([itemType])], self)
			})
		};

		return itemType_.isParametric() ? new GenericParametricType(props) : new GenericType(props);
	}
});

/**
 * @internal
 * @param {Type} itemType 
 * @returns {DataType}
 */
export function ListType$(itemType) {
	return applyTypes(ListType, itemType);
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @internal
 * @type {Parametric}
 */
export const MapType = new ParametricType({
	name: "Map",
	offChainType: HMap,
	parameters: [
		new Parameter("KeyType", `${TTPP}0`, new DefaultTypeClass()), 
		new Parameter("ValueType", `${TTPP}1`, new DefaultTypeClass())
	],
	apply: ([keyType_, valueType_]) => {
		const keyType = assertDefined(keyType_.asDataType);
		const valueType = assertDefined(valueType_.asDataType);
		const offChainKeyType = keyType.offChainType ?? null;
		const offChainValueType = valueType.offChainType ?? null;
		const offChainType = offChainKeyType && offChainValueType ? HMap(offChainKeyType, offChainValueType) : null;

		const props = {
			offChainType: offChainType,
			name: `Map[${keyType.toString()}]${valueType.toString()}`,
			path: `__helios__map[${keyType.path}@${valueType.path}]`,
			genTypeDetails: (self) => ({
				inputType: `[${assertDefined(keyType.typeDetails?.inputType)}, ${assertDefined(valueType.typeDetails?.inputType)}][]`,
				outputType: `[${assertDefined(keyType.typeDetails?.outputType)}, ${assertDefined(valueType.typeDetails?.outputType)}][]`,
				internalType: {
					type: "Map",
					keyType: assertDefined(keyType.typeDetails?.internalType),
					valueType: assertDefined(valueType.typeDetails?.internalType)
				}
			}),
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				all: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				any: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				append: new FuncType([keyType, valueType], self),
				delete: new FuncType([keyType], self),
				filter: new FuncType([new FuncType([keyType, valueType], BoolType)], self),
				find: new FuncType([new FuncType([keyType, valueType], BoolType)], TupleType$([keyType, valueType], true)),
				find_key: new FuncType([new FuncType([keyType], BoolType)], keyType),
				find_key_safe: new FuncType([new FuncType([keyType], BoolType)], OptionType$(keyType)),
				// TODO: convert return value of find_safe to an OptionType of a TupleType (requires changing the way options work internally)
				find_safe: new FuncType([new FuncType([keyType, valueType], BoolType)], TupleType$([new FuncType([], TupleType$([keyType, valueType])), BoolType], false)),
				find_value: new FuncType([new FuncType([valueType], BoolType)], valueType),
				find_value_safe: new FuncType([new FuncType([valueType], BoolType)], OptionType$(valueType)),
				fold: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([a.ref, keyType, valueType], a.ref), a.ref], a.ref));
				})(),
				fold_lazy: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([keyType, valueType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
				})(),
				for_each: new FuncType([new FuncType([keyType, valueType], new VoidType())], new VoidType()),
				get: new FuncType([keyType], valueType),
				get_safe: new FuncType([keyType], OptionType$(valueType)),
				head: TupleType$([keyType, valueType], true),
				head_key: keyType,
				head_value: valueType,
				is_empty: new FuncType([], BoolType),
				length: IntType,
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType([keyType, valueType], TupleType$([a.ref, b.ref], true))], MapType$(a.ref, b.ref)));
				})(),
				prepend: new FuncType([keyType, valueType], self),
				set: new FuncType([keyType, valueType], self),
				sort: new FuncType([new FuncType([keyType, valueType, keyType, valueType], BoolType)], self),
				tail: self,
				to_iterator: new FuncType([], IteratorType$([keyType, valueType])),
				update: new FuncType([keyType, new FuncType([valueType], valueType)], self),
				update_safe: new FuncType([keyType, new FuncType([valueType], valueType)], self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self),
				from_iterator: new FuncType([IteratorType$([keyType, valueType])], self)
			})
		}

		return (keyType.isParametric() || valueType.isParametric()) ? new GenericParametricType(props) : new GenericType(props);
	}
});

/**
 * @internal
 * @param {Type} keyType 
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType, valueType) {
	return applyTypes(MapType, keyType, valueType);
}

/**
 * Builtin option type
 * @internal
 * @type {Parametric}
 */
const OptionType = new ParametricType({
	name: "Option",
	offChainType: Option,
	parameters: [new Parameter("SomeType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([someType_]) => {
		const someType = assertDefined(someType_.asDataType);
		const someOffChainType = someType.offChainType ?? null;
		const offChainType = someOffChainType ? Option(someOffChainType) : null;
		const someTypePath = someType.path;

		/**
		 * @type {null | EnumMemberType}
		 */
		let NoneType = null;

		/**
		 * @type {null | EnumMemberType}
		 */
		let SomeType = null;

		const appliedOptionTypeProps = {
			offChainType: offChainType,
			name: `Option[${someType.toString()}]`,
			path: `__helios__option[${someTypePath}]`,
			genTypeDetails: (self) => ({
				inputType: `null | ${assertDefined(someType.typeDetails?.inputType)}`,
				outputType: `null | ${assertDefined(someType.typeDetails?.outputType)}`,
				internalType: {
					type: "Option",
					someType: assertDefined(someType.typeDetails?.internalType)
				}
			}),
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([someType], a.ref)], OptionType$(a.ref)));
				})(),
				unwrap: new FuncType([], someType)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
           		None: assertDefined(NoneType),
            	Some: assertDefined(SomeType)
			})
		};

		const someTypeProps = {
			name: "Some",
			constrIndex: 0,
			fieldNames: ["some"],
			path: `__helios__option[${someTypePath}]__some`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				some: someType
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		};

		const noneTypeProps = {
			name: "None",
			constrIndex: 1,
			path: `__helios__option[${someTypePath}]__none`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		};

		if (someType.isParametric()) {
			const AppliedOptionType = new GenericParametricType(appliedOptionTypeProps);

			SomeType = new GenericParametricEnumMemberType({
				...someTypeProps,
				parentType: AppliedOptionType
			});

			NoneType = new GenericParametricEnumMemberType({
				...noneTypeProps,
				parentType: AppliedOptionType
			});

			return AppliedOptionType;
		} else {
			const AppliedOptionType = new GenericType(appliedOptionTypeProps);

			SomeType = new GenericEnumMemberType({
				...someTypeProps,
				parentType: AppliedOptionType
			});

			NoneType = new GenericEnumMemberType({
				...noneTypeProps,
				parentType: AppliedOptionType
			});

			return AppliedOptionType;
		}
	}
});

/**
 * @internal
 * @param {Type} someType 
 * @returns {DataType}
 */
export function OptionType$(someType) {
	return applyTypes(OptionType, someType);
}