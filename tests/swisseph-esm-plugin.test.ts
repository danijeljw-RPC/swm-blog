import assert from "node:assert/strict";
import test from "node:test";

import { transformSwissephEsm } from "../src/build/swisseph-esm-plugin";

test("removes the CommonJS and AMD footer from the swisseph ESM bundle", () => {
  const source = 'const factory = 1;if(typeof exports==="object"&&typeof module==="object"){module.exports=factory;module.exports.default=factory}else if(typeof define==="function"&&define["amd"])define([],()=>factory);\nexport default factory;';
  const result = transformSwissephEsm(source, "/project/node_modules/@swisseph/browser/dist/swisseph.js");

  assert.deepEqual(result, { code: "const factory = 1;\nexport default factory;", map: null });
});

test("does not alter unrelated modules", () => {
  const result = transformSwissephEsm("export default 1;", "/project/src/example.ts");

  assert.equal(result, null);
});
