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
 * @param {Type[]} itemTypes
 * @returns {Type}
 */
export function IteratorType$(itemTypes) {
	const props = {
		name: `Iterator[${itemTypes.map(it => it.toString()).join(", ")}]`,
		path: `__helios__iterator__${itemTypes.length}`,
		genInstanceMembers: (self) => {
			const members = {
				any: new FuncType([new FuncType(itemTypes, BoolType)], BoolType),
				drop: new FuncType([IntType], self),
				head: new FuncType([], itemTypes),
				filter: new FuncType([new FuncType(itemTypes, BoolType)], self),
				find: new FuncType([new FuncType(itemTypes, BoolType)], itemTypes),
				for_each: new FuncType([new FuncType(itemTypes, new VoidType())], new VoidType()),
				fold: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([a.ref].concat(itemTypes), a.ref), a.ref], a.ref));
				})(),
				get: new FuncType([IntType], itemTypes),
				get_singleton: new FuncType([], itemTypes),
				is_empty: new FuncType([], BoolType),
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType(itemTypes, a.ref)], IteratorType$([a.ref])));
				})(),
				map2: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType(itemTypes, [a.ref, b.ref])], IteratorType$([a.ref, b.ref])));
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

	// to_list and to_map can't be part of Iterator because type information is lost (eg. we can map to an iterator over functions)
	return itemTypes.some(it => it.isParametric()) ? new GenericParametricType(props) : new GenericType(props);
};

/**
 * Builtin list type
 * @package
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
			jsToUplc: (obj) => {
				if (Array.isArray(obj)) {
					return new ListData(obj.map(item => itemType.jsToUplc(item)));
				} else {
					throw new Error("expected array");	
				}
			},
			uplcToJs: (data) => {
				return data.list.map(item => itemType.uplcToJs(item));
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
					find_safe: new FuncType([new FuncType([itemType], BoolType)], OptionType$(itemType)),
					fold: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([a.ref, itemType], a.ref), a.ref], a.ref));
					})(),
					fold2: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b], new FuncType([new FuncType([a.ref, b.ref, itemType], [a.ref, b.ref]), a.ref, b.ref], [a.ref, b.ref]));
					})(),
					fold3: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						const c = new Parameter("c", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b, c], new FuncType([new FuncType([a.ref, b.ref, c.ref, itemType], [a.ref, b.ref, c.ref]), a.ref, b.ref, c.ref], [a.ref, b.ref, c.ref]));
					})(),
					fold_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
					})(),
					fold2_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						const b = new Parameter("b", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a, b], new FuncType([new FuncType([itemType, new FuncType([], [a.ref, b.ref])], [a.ref, b.ref]), a.ref, b.ref], [a.ref, b.ref]));
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
					split_at: new FuncType([IntType], [self, self]),
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
 * @param {Type} itemType 
 * @returns {DataType}
 */
export function ListType$(itemType) {
	return applyTypes(ListType, itemType);
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @package
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
				find: new FuncType([new FuncType([keyType, valueType], BoolType)], [keyType, valueType]),
				find_key: new FuncType([new FuncType([keyType], BoolType)], keyType),
				find_key_safe: new FuncType([new FuncType([keyType], BoolType)], OptionType$(keyType)),
				find_safe: new FuncType([new FuncType([keyType, valueType], BoolType)], [new FuncType([], [keyType, valueType]), BoolType]),
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
				head: new FuncType([], [keyType, valueType]),
				head_key: keyType,
				head_value: valueType,
				is_empty: new FuncType([], BoolType),
				length: IntType,
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType([keyType, valueType], [a.ref, b.ref])], MapType$(a.ref, b.ref)));
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
 * @param {Type} keyType 
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType, valueType) {
	return applyTypes(MapType, keyType, valueType);
}

/**
 * Builtin option type
 * @package
 * @type {Parametric}
 */
export const OptionType = new ParametricType({
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
 * @param {Type} someType 
 * @returns {DataType}
 */
export function OptionType$(someType) {
	return applyTypes(OptionType, someType);
}