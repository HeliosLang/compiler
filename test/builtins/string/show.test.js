import { FuzzyTest } from "helios";
import { asString } from "../../assert.js";

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([ft.string()], `
    testing string_show
    func main(s: String) -> String {
        s.show()
    }`, ([s], res) => {
        return asString(res) === `'${asString(s)}'`
    });
}