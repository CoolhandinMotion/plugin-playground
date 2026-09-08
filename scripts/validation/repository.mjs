import { resolve } from "node:path";
import { access } from "node:fs/promises";
import { validateManifests } from "./manifests.mjs";
import { validateDialectManifests } from "./dialects.mjs";
import { validateSkills } from "./skills.mjs";
import { validateMcpConfigurations } from "./mcp.mjs";
import { validateDocumentation } from "./documentation.mjs";
import { sortDiagnostics } from "./diagnostic.mjs";

export async function validateRepository(root) {
  await access(root).catch(() => {
    throw new Error(`Repository root does not exist: ${root}`);
  });
  const manifests = await validateManifests(root);

  const diagnostics = [...manifests.diagnostics];
  let checkedFiles = manifests.checkedFiles;
  let skillCount = 0;
  let mcpEnvironmentVariables = [];

  const dialects = await validateDialectManifests(root, manifests.marketplace, manifests.plugin);
  diagnostics.push(...dialects.diagnostics);
  checkedFiles += dialects.checkedFiles;

  const pluginDir = resolve(root, "plugins/plugin-playground");

  // Skills need the parsed plugin.json; skip only when that file itself failed.
  if (manifests.plugin != null) {
    const skills = await validateSkills(root, pluginDir, manifests.plugin);
    diagnostics.push(...skills.diagnostics);
    checkedFiles += skills.checkedFiles;
    skillCount = skills.skillCount;
  }

  // MCP validation is independent of the manifests; never let an upstream
  // manifest error mask MCP diagnostics.
  const mcp = await validateMcpConfigurations(root, pluginDir);
  diagnostics.push(...mcp.diagnostics);
  checkedFiles += mcp.checkedFiles;
  mcpEnvironmentVariables = mcp.environmentVariables;

  const docs = await validateDocumentation(root, mcpEnvironmentVariables);
  diagnostics.push(...docs.diagnostics);
  checkedFiles += docs.checkedFiles;

  return {
    diagnostics: sortDiagnostics(diagnostics),
    checkedFiles,
    skillCount,
    mcpEnvironmentVariables,
  };
}
