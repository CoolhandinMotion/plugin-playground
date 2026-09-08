import { resolve, relative, normalize, sep, isAbsolute } from "node:path";
import { readJson } from "./fs.mjs";
import { diagnostic } from "./diagnostic.mjs";
import { KEBAB_CASE, SEMVER } from "./constants.mjs";

const MARKETPLACE_FILE = ".github/plugin/marketplace.json";

/**
 * Validate marketplace and plugin manifest files.
 *
 * @param {string} root - absolute repository root
 * @returns {Promise<{ marketplace: unknown, plugin: unknown, diagnostics: import('./diagnostic.mjs').Diagnostic[], checkedFiles: number }>}
 */
export async function validateManifests(root) {
  const diagnostics = [];
  let checkedFiles = 0;
  let marketplace = null;
  let plugin = null;

  // --- marketplace.json ---
  const marketplacePath = resolve(root, MARKETPLACE_FILE);
  const { data: marketplaceData, error: marketplaceError } = await readJson(
    marketplacePath,
    MARKETPLACE_FILE,
  );
  checkedFiles++;

  // A broken marketplace must not mask plugin.json/skills/MCP validation, so
  // on upstream failure we fall through with entry = null and validate
  // plugin.json at the conventional location.
  let entry = null;
  let marketplaceValid = false;

  if (marketplaceError) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "JSON_PARSE",
        marketplaceError,
        `Ensure ${MARKETPLACE_FILE} is valid JSON.`,
      ),
    );
  } else {
    marketplace = marketplaceData;
    marketplaceValid = true;
  }

  // Shape: name, owner.name, plugins array
  const marketplaceName =
    marketplace != null &&
    typeof marketplace === "object" &&
    typeof marketplace.name === "string"
      ? marketplace.name
      : null;
  const ownerName =
    marketplace != null &&
    typeof marketplace === "object" &&
    marketplace.owner != null &&
    typeof marketplace.owner.name === "string"
      ? marketplace.owner.name
      : null;
  const plugins =
    marketplace != null &&
    typeof marketplace === "object" &&
    Array.isArray(marketplace.plugins)
      ? marketplace.plugins
      : null;

  if (marketplaceValid && (marketplaceName === null || ownerName === null || plugins === null)) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "MARKETPLACE_SHAPE",
        `${MARKETPLACE_FILE} must have string "name", object "owner" with string "name", and array "plugins".`,
        `Add the required top-level fields to ${MARKETPLACE_FILE}.`,
      ),
    );
  }

  // Identifier format: marketplace name
  if (marketplaceName !== null && !KEBAB_CASE.test(marketplaceName)) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "IDENTIFIER_FORMAT",
        `"name" value "${marketplaceName}" must match kebab-case pattern.`,
        `Use a kebab-case name (e.g. "plugin-playground") in ${MARKETPLACE_FILE}.`,
      ),
    );
  }

  // Exactly one plugin
  if (plugins !== null && plugins.length !== 1) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "MARKETPLACE_SHAPE",
        `"plugins" must contain exactly one entry; found ${plugins.length}.`,
        `Ensure exactly one plugin entry is listed in ${MARKETPLACE_FILE}.`,
      ),
    );
  } else if (plugins !== null) {
    entry = plugins[0];
  }

  // Plugin entry must have strict === true
  if (
    plugins !== null &&
    (entry == null ||
      typeof entry !== "object" ||
      entry.strict !== true)
  ) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "MARKETPLACE_SHAPE",
        `Plugin entry must have "strict": true.`,
        `Add "strict": true to the plugin entry in ${MARKETPLACE_FILE}.`,
      ),
    );
  }

  // Plugin entry version format
  const entryVersion =
    entry != null && typeof entry.version === "string" ? entry.version : null;
  if (entryVersion !== null && !SEMVER.test(entryVersion)) {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "VERSION_FORMAT",
        `Plugin entry "version" value "${entryVersion}" is not a valid semver string.`,
        `Use a semver version (e.g. "0.1.0") in ${MARKETPLACE_FILE}.`,
      ),
    );
  }

  // Plugin entry source: must resolve inside root
  const entrySource =
    entry != null && typeof entry.source === "string" ? entry.source : null;
  let resolvedPluginDir = null;
  if (entrySource !== null) {
    const resolved = normalize(resolve(root, entrySource));
    const rootNorm = normalize(root);
    const relToRoot = relative(rootNorm, resolved);
    const isOutsideRoot =
      relToRoot === ".." || relToRoot.startsWith(".." + sep) || isAbsolute(relToRoot);
    if (isOutsideRoot) {
      diagnostics.push(
        diagnostic(
          MARKETPLACE_FILE,
          "PLUGIN_SOURCE",
          `Plugin "source" "${entrySource}" resolves outside the repository root.`,
          `Set "source" to a path inside the repository root, e.g. "./plugins/plugin-playground".`,
        ),
      );
    } else {
      // Validate the normalized relative value (POSIX form, platform-independent)
      const rel = relToRoot.split(sep).join("/");
      const expectedRel = "plugins/plugin-playground";
      if (rel !== expectedRel) {
        diagnostics.push(
          diagnostic(
            MARKETPLACE_FILE,
            "PLUGIN_SOURCE",
            `Plugin "source" resolves to "${rel}" but expected "${expectedRel}".`,
            `Set "source" to "./plugins/plugin-playground" in ${MARKETPLACE_FILE}.`,
          ),
        );
      } else {
        resolvedPluginDir = resolved;
      }
    }
  } else if (entry != null && typeof entry === "object") {
    diagnostics.push(
      diagnostic(
        MARKETPLACE_FILE,
        "MARKETPLACE_SHAPE",
        `Plugin entry is missing required field "source".`,
        `Add a "source" field pointing to the plugin directory in ${MARKETPLACE_FILE}.`,
      ),
    );
  }

  // --- plugin.json ---
  // Even when the marketplace side failed, validate plugin.json at the
  // conventional location so one upstream error cannot hide downstream ones.
  if (resolvedPluginDir === null) {
    resolvedPluginDir = resolve(root, "plugins/plugin-playground");
  }
  {
    const pluginRelFile = relative(root, resolve(resolvedPluginDir, "plugin.json"));
    const pluginAbsFile = resolve(resolvedPluginDir, "plugin.json");
    const { data: pluginData, error: pluginError } = await readJson(pluginAbsFile, pluginRelFile);
    checkedFiles++;

    if (pluginError) {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "JSON_PARSE",
          pluginError,
          `Ensure ${pluginRelFile} is valid JSON.`,
        ),
      );
      return { marketplace, plugin, diagnostics, checkedFiles };
    }

    plugin = pluginData;

    // Shape: name, description, version, author.name, license, skills
    const pName =
      plugin != null && typeof plugin.name === "string" ? plugin.name : null;
    const pDescription =
      plugin != null && typeof plugin.description === "string" ? plugin.description : null;
    const pVersion =
      plugin != null && typeof plugin.version === "string" ? plugin.version : null;
    const pAuthorName =
      plugin != null &&
      plugin.author != null &&
      typeof plugin.author.name === "string"
        ? plugin.author.name
        : null;
    const pLicense =
      plugin != null && typeof plugin.license === "string" ? plugin.license : null;
    const pSkills = plugin != null ? plugin.skills : undefined;
    const pMcpServers = plugin != null ? plugin.mcpServers : undefined;

    const missingFields = [];
    if (pName === null) missingFields.push("name");
    if (pDescription === null) missingFields.push("description");
    if (pVersion === null) missingFields.push("version");
    if (pAuthorName === null) missingFields.push("author.name");
    if (pLicense === null) missingFields.push("license");

    // skills must be "skills/" or ["skills/"]
    const skillsValid =
      pSkills === "skills/" ||
      (Array.isArray(pSkills) && pSkills.length === 1 && pSkills[0] === "skills/");
    if (!skillsValid) missingFields.push("skills");

    if (missingFields.length > 0) {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "PLUGIN_SHAPE",
          `${pluginRelFile} is missing or has invalid fields: ${missingFields.join(", ")}.`,
          `Ensure all required fields are present and correct in ${pluginRelFile}.`,
        ),
      );
    }

    // mcpServers: absent, or exactly the sanctioned promotion pointer ".mcp.json"
    // (the workshop's section-10 ritual). Inline server objects and any other
    // path stay forbidden — server definitions belong in the reviewed .mcp.json.
    if (pMcpServers !== undefined && pMcpServers !== ".mcp.json") {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "PLUGIN_SHAPE",
          `${pluginRelFile} "mcpServers" must be absent or the string ".mcp.json".`,
          `Use "mcpServers": ".mcp.json" for the reviewed promotion, or remove the field.`,
        ),
      );
    }

    // Identity: plugin.name must match marketplace entry name
    const entryName =
      entry != null && typeof entry.name === "string" ? entry.name : null;
    if (pName !== null && entryName !== null && pName !== entryName) {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "PLUGIN_IDENTITY",
          `plugin.json "name" "${pName}" does not match marketplace entry "name" "${entryName}".`,
          `Ensure the "name" field in plugin.json matches the marketplace entry.`,
        ),
      );
    }

    // Version format for plugin.json
    if (pVersion !== null && !SEMVER.test(pVersion)) {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "VERSION_FORMAT",
          `plugin.json "version" "${pVersion}" is not a valid semver string.`,
          `Use a semver version (e.g. "0.1.0") in ${pluginRelFile}.`,
        ),
      );
    }

    // Version match between marketplace entry and plugin.json
    if (
      entryVersion !== null &&
      pVersion !== null &&
      SEMVER.test(entryVersion) &&
      SEMVER.test(pVersion) &&
      entryVersion !== pVersion
    ) {
      diagnostics.push(
        diagnostic(
          pluginRelFile,
          "VERSION_MATCH",
          `Version mismatch: marketplace entry "${entryVersion}" vs plugin.json "${pVersion}".`,
          `Ensure both files use the same version string.`,
        ),
      );
    }
  }

  return { marketplace, plugin, diagnostics, checkedFiles };
}
