import {
	assert,
	MintingPolicyHash,
	Value
} from "helios"


export default async function test() {
	const lovelace = 100
	const mph = "00010203040506070809101112131415161718192021222324252627"
	const tokens = 99

	const schema = Value.fromCbor(
		new Value({
			lovelace: 100,
			assets: [
				[
					new MintingPolicyHash("00010203040506070809101112131415161718192021222324252627"),
					[
						[
							"", 99
						]
					]
				]
			]
		}).toCbor()
	)._toUplcData().toSchemaJson()

	assert(schema.includes(lovelace.toString()) && schema.includes(mph) && schema.includes(tokens.toString()))
}
