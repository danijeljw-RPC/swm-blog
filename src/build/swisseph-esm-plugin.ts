import type { Plugin } from "vite";

const swissephModulePath = "/node_modules/@swisseph/browser/dist/swisseph.js";
const legacyFooter = /;if\(typeof exports==="object"&&typeof module==="object"\)\{module\.exports=([^;]+);module\.exports\.default=\1\}else if\(typeof define==="function"&&define\["amd"\]\)define\(\[\],\(\)=>\1\);/;

export function transformSwissephEsm(code: string, id: string): { code: string; map: null } | null {
  if (!id.includes(swissephModulePath)) return null;
  if (!legacyFooter.test(code)) {
    throw new Error("The @swisseph/browser bundle format changed; update the ESM compatibility transform.");
  }
  return { code: code.replace(legacyFooter, ";"), map: null };
}

export function swissephEsmPlugin(): Plugin {
  return {
    name: "swisseph-esm-only",
    enforce: "pre",
    transform: transformSwissephEsm,
  };
}
