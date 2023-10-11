import { config, FuzzyTest} from "helios";
import { isError, asIntList, equalsList, asInt} from "../assert.js";

config.set({DEBUG: true});

export default async function test() {
    const ft = new FuzzyTest(/*Math.random()*/42, 100, true);

    await ft.test([ft.list(ft.int(), 0, 10), ft.int(-10, 15)], `
        testing list_take_end
        func main(a: []Int, n: Int) -> []Int {
            a.take_end(n)
        }`, ([lst_, n_], res) => {
            const lst = asIntList(lst_);
            const n = Number(asInt(n_));
            

            if (n > lst.length) {
                return isError(res, "list too short");
            } else if (n < 0) {
                return isError(res, "negative n in take_end");
            } else {
                const resLst = asIntList(res);
                
                return (n == resLst.length) && equalsList(resLst, lst.slice(lst.length - n));
            }
        });
}