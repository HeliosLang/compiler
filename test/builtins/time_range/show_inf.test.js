import { config, FuzzyTest } from "helios";
import { asBool } from "../../assert.js";

export default async function test() {
    config.set({DEBUG: true});

    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([], `
    testing timerange_show_inf
    func main() -> Bool {
        TimeRange::NEVER.show() == "[+inf,-inf]" &&
        TimeRange::ALWAYS.show() == "[-inf,+inf]"
    }`, ([_], res) => asBool(res), 1);

    config.set({DEBUG: false});
}