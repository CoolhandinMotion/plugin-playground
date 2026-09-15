$ErrorActionPreference = "Stop"

try {
    $inputJson = [Console]::In.ReadToEnd()
    $hookInput = $inputJson | ConvertFrom-Json
    $command = [string]$hookInput.tool_input.command
}
catch {
    [Console]::Error.WriteLine("Commit guard could not parse the hook input.")
    exit 2
}

# Covers git commit, git.exe commit, git -C <path> commit,
# git -c <setting> commit, and git commit-tree.
$commitPattern = '(?i)(?:^|[;&|]\s*)git(?:\.exe)?(?:\s+(?:(?:-C|-c)\s+(?:"[^"]*"|''[^'']*''|\S+)|--(?:git-dir|work-tree)(?:=(?:"[^"]*"|''[^'']*''|\S+)|\s+(?:"[^"]*"|''[^'']*''|\S+))|--(?:no-pager|bare)))*\s+(?:commit|commit-tree)(?=\s|$)'

if ($command -match $commitPattern) {
    $response = @{
        hookSpecificOutput = @{
            hookEventName           = "PreToolUse"
            permissionDecision      = "deny"
            permissionDecisionReason = "Git commits are disabled by the demo policy plugin."
        }
    }

    [Console]::Out.WriteLine(
        ($response | ConvertTo-Json -Depth 4 -Compress)
    )
}

exit 0