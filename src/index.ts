// @ts-expect-error - Webpack specific.
import { _start } from "../bin/brocess.wasm";
console.log("Test Build!", _start);
