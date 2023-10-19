import { Program } from "helios"

export default async function main() {
	const src = `spending output_index_check

	func main(_, _, ctx: ScriptContext) -> Bool {
		ctx.get_current_input().output_id.index == 0
	}
	`

	const program = Program.new(src)


	console.log(program.dumpIR(false))

	console.log(program.dumpIR(true))
}