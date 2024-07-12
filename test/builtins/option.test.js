import { FuzzyTest, UplcData } from "helios"

import { asBytes } from "../assert.js"

function decodeCbor(bs) {
    return UplcData.fromCbor(bs)
}

const serializeProp = ([a], res) => {
    return decodeCbor(asBytes(res)).isSame(a.data)
}

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/ 42, 100, true)

    await ft.test(
        [ft.option(ft.int())],
        `
    testing option_sub_serialize
    func main(a: Option[Int]) -> ByteArray {
        a.switch{
            s: Some => s.serialize(),
            n: None => n.serialize()
        }
    }`,
        serializeProp
    )
}
