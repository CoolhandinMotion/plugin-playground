# UserPromptSubmit hook: shows the user proof that the hook ran.
#
# Claude Code pipes a JSON payload to this script on stdin. For the
# UserPromptSubmit event it includes a "prompt" field with the exact
# text the user typed. Whatever we print as {"systemMessage": ...}
# is displayed to the user in the terminal.
#
# Because a hook must finish before the prompt continues to the LLM,
# the Start-Sleep below visibly holds the prompt for 3 seconds.
#
# Kill switch (checked on every prompt, so it works mid-session):
#   - flag file  ~/.claude/banner-off        -> toggle any time (/banner-off, /banner-on)
#   - env var    SKIP_PROMPT_BANNER = 1      -> per-launch override

$flagFile = Join-Path $env:USERPROFILE ".claude\banner-off"
if ($env:SKIP_PROMPT_BANNER -eq '1' -or (Test-Path $flagFile)) {
    exit 0
}

$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$prompt  = $payload.prompt

$words = ($prompt -split '\s+' | Where-Object { $_ }).Count
$chars = $prompt.Length
$now   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Start-Sleep -Seconds 3

$msg = "**This Is the Hook result**`n" +
       "Date/Time: $now`n" +
       "Words: $words | Characters: $chars`n" +
       "your prompt was held for 3 seconds before reaching the LLM"

@{ systemMessage = $msg } | ConvertTo-Json
