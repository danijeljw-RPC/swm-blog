import { validateContent } from "./lib/content-validation.mjs";

const result = await validateContent(process.cwd());

if (result.errors.length > 0) {
  console.error(`Content validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed (${result.filesChecked} files checked).`);
}
