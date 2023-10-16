import { config, FuzzyTest } from "helios";
import { asBool, isError, asIntList } from "../../assert.js";

export default async function test() {
    config.set({DEBUG: true, CHECK_CASTS: true})

    const ft = new FuzzyTest(/*Math.random()*/42, 100, true, true);

    await ft.test([ft.list(ft.int(), 0, 20)], `
    testing list_wrong_data
    func main(a: []Bool) -> Bool {
        a.any((item: Bool) -> {item})
    }`, ([a], res) => {
        if (asIntList(a).length == 0) {
            return !asBool(res);
        } else {
            return isError(res, "")
        }
    });

    config.set({DEBUG: false, CHECK_CASTS: false})
}