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

export default async function test() {
    config.set({
        CHECK_CASTS: true
    })

    const src = `
testing tagged_struct

struct TaggedStruct {
	a: Int "@"
	b: Int "hello-world"
}

func main(s: TaggedStruct) -> TaggedStruct {
	print(s.b.show());
	c: TaggedStruct = s.copy(b: 5);
	c
}
`

    const program = Program.new(src)

    const arg = new UplcDataValue(
        Site.dummy(),
        new ConstrData(0, [
            new MapData([
                [new ByteArrayData(textToBytes("@")), new IntData(0n)],
                [
                    new ByteArrayData(textToBytes("hello-world")),
                    new IntData(10n)
                ]
            ]),
            new IntData(1n)
        ])
    )

    const res = await program.compile().run([arg])

    const json = res.data.toSchemaJson()

    console.log(json)

    assert(JSON.parse(json).fields[0].map[1].v.int == 5)
}
