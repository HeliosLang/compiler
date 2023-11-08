import { FuzzyTest } from "helios";
import { asBool, isValidString } from "../../assert.js";

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([ft.bytes()], `
    testing string_is_valid_utf8
    func main(bs: ByteArray) -> Bool {
        String::is_valid_utf8(bs)
    }`, ([bs], res) => {
        return asBool(res) === isValidString(bs)
    });

    await ft.test([ft.utf8Bytes()], `
    testing string_is_always_valid_utf8
    func main(bs: ByteArray) -> Bool {
        String::is_valid_utf8(bs)
    }
    `, ([_], res) => asBool(res))
}