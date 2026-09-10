import { resolve } from "node:path";
import { pathExists } from "./fs.mjs";
import { diagnostic } from "./diagnostic.mjs";
import { REQUIRED_FILES } from "./constants.mjs";

/**
 * Validate required files exist. Prose (Markdown) files are deliberately
 * not validated: only SKILL.md files are, via the skills validator.
 *
 * @param {string} root - absolute repository root
 * @returns {Promise<{ diagnostics: import('./diagnostic.mjs').Diagnostic[], checkedFiles: number }>}
 */
export async function validateDocumentation(root) {
  const diagnostics = [];
  let checkedFiles = 0;

  for (const rel of REQUIRED_FILES) {
    checkedFiles++;
    const abs = resolve(root, rel);
    const exists = await pathExists(abs);
    if (!exists) {
      diagnostics.push(
        diagnostic(
          rel,
          "REQUIRED_FILE",
          `Required file "${rel}" is missing.`,
          `Create ${rel} in the repository root.`,
        ),
      );
    }
  }

  return { diagnostics, checkedFiles };
}
