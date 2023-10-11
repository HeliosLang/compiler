import { config, FuzzyTest } from "helios";
import { asBool } from "../assert.js";

config.set({DEBUG: true})

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([ft.int(0)], `
        testing int_to_from_little_endian
        func main(a: Int) -> Bool {
            Int::from_little_endian(a.to_little_endian()) == a
        }`, ([_], res) => asBool(res));
}