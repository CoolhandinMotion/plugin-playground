import { resolve, relative, normalize, sep, isAbsolute } from "node:path";
import { readJson } from "./fs.mjs";
import { diagnostic } from "./diagnostic.mjs";
import { SEMVER } from "./constants.mjs";

const CLAUDE_MARKETPLACE_FILE = ".claude-plugin/marketplace.json";
const CODEX_MARKETPLACE_FILE = ".agents/plugins/marketplace.json";
const CLAUDE_PLUGIN_FILE = "plugins/plugin-playground/.claude-plugin/plugin.json";
const CODEX_PLUGIN_FILE = "plugins/plugin-playground/.codex-plugin/plugin.json";
const EXPECTED_SOURCE = "plugins/plugin-playground";

/**
 * Resolve a marketplace "source" path and report drift from the expected plugin dir.
 */
function checkSourcePath(root, sourcePath, relFile, diagnostics) {
  const resolved = normalize(resolve(root, sourcePath));
  const relToRoot = relative(normalize(root), resolved);
  const isOutsideRoot =
    relToRoot === ".." || relToRoot.startsWith(".." + sep) || isAbsolute(relToRoot);
  const rel = relToRoot.split(sep).join("/");
  if (isOutsideRoot || rel !== EXPECTED_SOURCE) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_SOURCE",
        `Plugin "source" resolves to "${rel}" but expected "${EXPECTED_SOURCE}".`,
        `Set the plugin source path to "./${EXPECTED_SOURCE}" in ${relFile}.`,
      ),
    );
  }
}

/**
 * Cross-check a dialect marketplace catalog against the Copilot baseline.
 *
 * @param {string} root
 * @param {string} relFile - repository-relative catalog path
 * @param {{ marketplaceName: string|null, pluginName: string|null, version: string|null }} baseline
 * @param {{ hasVersion: boolean, objectSource: boolean }} dialect
 * @param {import('./diagnostic.mjs').Diagnostic[]} diagnostics
 */
async function checkMarketplace(root, relFile, baseline, dialect, diagnostics) {
  const { data, error } = await readJson(resolve(root, relFile), relFile);
  if (error) {
    diagnostics.push(
      diagnostic(relFile, "JSON_PARSE", error, `Ensure ${relFile} is valid JSON.`),
    );
    return;
  }

  const name = data != null && typeof data.name === "string" ? data.name : null;
  const plugins =
    data != null && typeof data === "object" && Array.isArray(data.plugins)
      ? data.plugins
      : null;

  if (name === null || plugins === null || plugins.length !== 1) {
    diagnostics.push(
      diagnostic(
        relFile,
        "MARKETPLACE_SHAPE",
        `${relFile} must have a string "name" and a "plugins" array with exactly one entry.`,
        `Restore the marketplace shape in ${relFile}.`,
      ),
    );
    return;
  }

  if (baseline.marketplaceName !== null && name !== baseline.marketplaceName) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_IDENTITY",
        `Marketplace "name" "${name}" does not match "${baseline.marketplaceName}" in .github/plugin/marketplace.json.`,
        `Use the same marketplace name across all catalogs.`,
      ),
    );
  }

  const entry = plugins[0];
  const entryName =
    entry != null && typeof entry.name === "string" ? entry.name : null;
  if (baseline.pluginName !== null && entryName !== baseline.pluginName) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_IDENTITY",
        `Plugin entry "name" "${entryName}" does not match "${baseline.pluginName}" in .github/plugin/marketplace.json.`,
        `Use the same plugin name across all catalogs.`,
      ),
    );
  }

  // Source: Codex uses an object { source, path }; Claude a string path.
  const sourcePath = dialect.objectSource
    ? entry != null &&
      entry.source != null &&
      typeof entry.source === "object" &&
      typeof entry.source.path === "string"
      ? entry.source.path
      : null
    : entry != null && typeof entry.source === "string"
      ? entry.source
      : null;
  if (sourcePath === null) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_SOURCE",
        `Plugin entry in ${relFile} is missing its source path.`,
        `Point the plugin entry at "./${EXPECTED_SOURCE}".`,
      ),
    );
  } else {
    checkSourcePath(root, sourcePath, relFile, diagnostics);
  }

  // Version: the Codex catalog dialect carries no version.
  if (dialect.hasVersion) {
    const entryVersion =
      entry != null && typeof entry.version === "string" ? entry.version : null;
    checkVersion(entryVersion, relFile, baseline, diagnostics);
  }
}

/**
 * Cross-check a dialect plugin manifest against the Copilot baseline.
 */
async function checkPlugin(root, relFile, baseline, diagnostics) {
  const { data, error } = await readJson(resolve(root, relFile), relFile);
  if (error) {
    diagnostics.push(
      diagnostic(relFile, "JSON_PARSE", error, `Ensure ${relFile} is valid JSON.`),
    );
    return;
  }

  const name = data != null && typeof data.name === "string" ? data.name : null;
  const version =
    data != null && typeof data.version === "string" ? data.version : null;

  if (name === null || version === null) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_SHAPE",
        `${relFile} must have string "name" and "version" fields.`,
        `Restore the required fields in ${relFile}.`,
      ),
    );
  }

  if (baseline.pluginName !== null && name !== null && name !== baseline.pluginName) {
    diagnostics.push(
      diagnostic(
        relFile,
        "PLUGIN_IDENTITY",
        `"name" "${name}" does not match "${baseline.pluginName}" in plugins/plugin-playground/plugin.json.`,
        `Use the same plugin name across all plugin manifests.`,
      ),
    );
  }

  checkVersion(version, relFile, baseline, diagnostics);
}

function checkVersion(version, relFile, baseline, diagnostics) {
  if (version === null) return;
  if (!SEMVER.test(version)) {
    diagnostics.push(
      diagnostic(
        relFile,
        "VERSION_FORMAT",
        `"version" "${version}" is not a valid semver string.`,
        `Use a semver version (e.g. "0.1.0") in ${relFile}.`,
      ),
    );
  } else if (baseline.version !== null && version !== baseline.version) {
    diagnostics.push(
      diagnostic(
        relFile,
        "VERSION_MATCH",
        `Version mismatch: ${relFile} has "${version}" but the Copilot manifests have "${baseline.version}".`,
        `Bump every manifest to the same version.`,
      ),
    );
  }
}

/**
 * Drift detection for the Claude and Codex manifest pairs: JSON-parse all four
 * files and cross-check name/version/source against the Copilot catalog pair.
 * Deliberately not a per-dialect schema validation.
 *
 * @param {string} root - absolute repository root
 * @param {unknown} marketplace - parsed Copilot marketplace.json (or null)
 * @param {unknown} plugin - parsed Copilot plugin.json (or null)
 * @returns {Promise<{ diagnostics: import('./diagnostic.mjs').Diagnostic[], checkedFiles: number }>}
 */
export async function validateDialectManifests(root, marketplace, plugin) {
  const diagnostics = [];

  const marketplaceName =
    marketplace != null && typeof marketplace.name === "string"
      ? marketplace.name
      : null;
  const pluginName =
    plugin != null && typeof plugin.name === "string" ? plugin.name : null;
  const version =
    plugin != null && typeof plugin.version === "string" && SEMVER.test(plugin.version)
      ? plugin.version
      : null;
  const baseline = { marketplaceName, pluginName, version };

  await checkMarketplace(
    root,
    CLAUDE_MARKETPLACE_FILE,
    baseline,
    { hasVersion: true, objectSource: false },
    diagnostics,
  );
  await checkMarketplace(
    root,
    CODEX_MARKETPLACE_FILE,
    baseline,
    { hasVersion: false, objectSource: true },
    diagnostics,
  );
  await checkPlugin(root, CLAUDE_PLUGIN_FILE, baseline, diagnostics);
  await checkPlugin(root, CODEX_PLUGIN_FILE, baseline, diagnostics);

  return { diagnostics, checkedFiles: 4 };
}
