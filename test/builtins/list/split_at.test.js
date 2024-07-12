import { config, FuzzyTest } from "helios"
import { asIntList, asInt, isError, equalsList } from "../../assert.js"

export default async function test() {
    config.set({ DEBUG: true })

    const ft = new FuzzyTest(/*Math.random()*/ 42, 100, true)

    await ft.test(
        [ft.list(ft.int(), 0, 10), ft.int(-5, 15)],
        `
        testing list_split_at
        func main(a: []Int, b: Int) -> []Int {
            (c: []Int, d: []Int) = a.split_at(b);

            c + d
        }`,
        ([a, b], res) => {
            const lst = asIntList(a)
            const idx = Number(asInt(b))

            if (idx < 0 || idx >= lst.length) {
                return isError(res, "index out of range")
            } else {
                const resLst = asIntList(res)

                return equalsList(lst, resLst)
            }
        }
    )

    config.set({ DEBUG: false })
}
