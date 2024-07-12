import { MintingPolicyHash, Value } from "helios"

export default async function test() {
    let v = new Value(100n)

    const mph1 = new MintingPolicyHash(
        "c1f33e6a7a18310ffd2b764f16afb8a999203e865ef1e900f911a2d3"
    )

    const mph2 = new MintingPolicyHash(
        "6ccc5b3376a0a7ee6b521102b582fc188547e0dbde99ad11e151cb44"
    )

    const mph3 = new MintingPolicyHash(
        "ac22ab48467d7f070b697fa50d68f9075e41170cf3151d5af4cfb9e9"
    )

    v = v.add(new Value(0n, [[mph1, [["746573742d31332e38", 1n]]]]))

    v = v.add(new Value(0n, [[mph2, [["746573742d31332e38", 1n]]]]))

    v = v.add(new Value(0n, [[mph3, [["746573742d31332e38", 1n]]]]))

    console.log("BEFORE SORT: ", v.dump())

    v.assets.sort()

    console.log("AFTER SORT: ", v.dump())
}
