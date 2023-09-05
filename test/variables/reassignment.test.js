import {
	assert,
	config,
	textToBytes,
	Site,
	Program,
	MapData,
	ConstrData,
	UplcDataValue,
	ByteArrayData,
	IntData,
	ToIRContext
} from "helios"

function test1() {
    const src = `
testing reassignment

func main(a: Int) -> Int {
    print(a.show());
    a = 0;
    a
}
`

	Program.new(src)
}

function test2() {
    const src = `
testing reassignment_nested_scope

func main(a: Int) -> Int {
    print(a.show());
    []Int{1,2}.for_each((b: Int) -> {
		a: Int = 0;
        print(a.show() + b.show())
    });
    a
}
`

	Program.new(src)
}

export default async function test() {
    test1()

    test2()
}
