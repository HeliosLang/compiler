import {
    IREvaluation,
    IRScope,
    Program,
    ToIRContext,
    annotateIR,
    buildIRExpr,
    tokenizeIR
} from "helios";

function compileHeliosAndAnnotate(src) {
    const program = Program.new(src)

    const [rawIR, _] = program.toIR(new ToIRContext(false, "")).generateSource()

    return compileAndAnnotate(rawIR)
}

function compileAndAnnotate(src) {
    const ir = tokenizeIR(src);

    const expr = buildIRExpr(ir);

    const scope = new IRScope(null, null);

    expr.resolveNames(scope);

    const evaluation = new IREvaluation();

    evaluation.eval(expr);

    return annotateIR(evaluation, expr);
}

export default async function test() {
    /*console.log(compileAndAnnotate(
        `(a, b) -> {
            a
        }`
    ));

    console.log(compileAndAnnotate(
        `(a, b) -> {
            __core__divideInteger(a, b)
        }`
    ));

    console.log(compileHeliosAndAnnotate(
        `testing int_div_0
    
        func main(a: Int) -> Int {
            a / 0
        }`
    ));

    console.log(compileHeliosAndAnnotate(
        `testing int_decode_zigzag
    
        func main(a: Int) -> Int {
            a.decode_zigzag()
        }`
    ));

    console.log(compileHeliosAndAnnotate(`
    testing int_to_from_little_endian
    func main(a: Int) -> Bool {
        Int::from_little_endian(a.to_little_endian()) == a
    }`));*/

    console.log(compileHeliosAndAnnotate(`
    testing int_parse
    func main(a: Int) -> Bool {
        Int::parse(a.show()) == a
    }`));

    /*console.log(compileAndAnnotate(
        `(a, b) -> {
            __core__multiplyInteger(__core__divideInteger(a, b), 0)
        }`
    ));

    console.log(compileAndAnnotate(
        `(a) -> {
            (recurse) -> {
                recurse(recurse, a)
            }(
                (recurse, lst) -> {
                    __core__chooseList(
                        lst,
                        () -> {
                            __core__trace("end", ())
                        },
                        () -> {
                            __core__trace("not end", recurse(recurse, __core__tailList(lst)))
                        }
                    )()
                }
            )
        }`
    ));

    console.log(compileAndAnnotate(
        `(a) -> {
            (recurse) -> {
                recurse(recurse, a)
            }(
                (recurse, lst) -> {
                    __core__chooseList(
                        lst,
                        () -> {
                            __core__trace("end", ())
                        },
                        () -> {
                            __core__trace("not end", recurse(recurse, __core__tailList__safe(lst)))
                        }
                    )()
                }
            )
        }`
    ));*/
}