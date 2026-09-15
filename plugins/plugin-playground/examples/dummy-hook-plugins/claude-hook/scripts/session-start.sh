#!/usr/bin/env bash
# Example helper script for a hook.
#
# hooks/hooks.json currently uses a plain `echo` so it works everywhere
# with zero setup. Once you are comfortable, point a hook at this script
# instead, ALWAYS via the ${CLAUDE_PLUGIN_ROOT} variable:
#
#   "command": "bash \"${CLAUDE_PLUGIN_ROOT}/scripts/session-start.sh\""
#
# Never use a relative path like ./scripts/... — plugins are installed
# into different locations, so only ${CLAUDE_PLUGIN_ROOT} is reliable.
echo "plugin-playground-claude: session started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
