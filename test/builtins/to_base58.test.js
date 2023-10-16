import { config, FuzzyTest } from "helios";
import { asString } from "../assert.js";

config.set({DEBUG: true});

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([], `
    testing int_to_base58
    func main() -> String {
        a = 0x287fb4cd;
        a.to_base58()
    }`, ([_], res) => asString(res) == "233QC4", 1);
}