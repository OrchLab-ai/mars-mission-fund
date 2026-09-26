# Agent container: Claude Code + Playwright MCP + the app's toolchain, in Docker.
# The workshop's claude-container is built from this image.
# Base includes browser deps + Node.js (Ubuntu Noble)
FROM mcr.microsoft.com/playwright:v1.58.2-noble

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    lsof \
    sudo \
  && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# DBMate — database migration tool
RUN curl -fsSL https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64 \
      -o /usr/local/bin/dbmate \
  && chmod +x /usr/local/bin/dbmate

# Claude Code CLI + Playwright MCP server (global)
# Base image ships Node 20 + npm 10; npm workspaces are fully supported — npm ci works in monorepos.
RUN npm install -g @anthropic-ai/claude-code @playwright/mcp

# Non-root user — Claude Code refuses --dangerously-skip-permissions as root
RUN useradd -m -s /bin/bash agent \
  && echo "agent ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Pre-create ~/.claude so Docker volume mounts don't create it as root.
# Without this, mounting .mcp.json to /home/agent/.claude/.mcp.json causes
# Docker to create the .claude/ directory owned by root, which blocks
# Claude Code's Bash tool (session-env) and MCP config reads.
RUN mkdir -p /home/agent/.claude \
  && chown -R agent:agent /home/agent

WORKDIR /workspace
RUN chown agent:agent /workspace

USER agent

# Install Chromium using the MCP server's bundled Playwright, not the system one.
# @playwright/mcp bundles its own playwright-core which may expect a different
# browser revision than the system Playwright. Using its bundled copy ensures
# the installed browser matches what the MCP server will look for at runtime.
# Placed before COPY steps so script/prompt edits don't bust this cache layer.
RUN node /usr/lib/node_modules/@playwright/mcp/node_modules/playwright-core/cli.js install chromium

# No entrypoint of its own. The workshop stack runs its own start script in this
# image (see docker-compose.workshop.yml in the workshop repository); on its own the
# container simply stays up so a shell can be opened in it.
CMD ["sleep", "infinity"]
