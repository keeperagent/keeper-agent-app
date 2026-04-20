# Keeper Agent

A desktop application for managing cryptocurrency wallets, executing automated workflows, and coordinating on-chain operations across multiple blockchains — powered by an AI agent system.

## Features

### AI Agent

- Multi-LLM support (Claude, OpenAI, Google Gemini)
- Extensible skills system with custom instruction files
- MCP (Model Context Protocol) tool integration
- Persistent agent memory across sessions
- Real-time streaming responses

### Wallet Management

- Multi-chain support: **Solana**, **EVM**, **Aptos**, **Sui**
- Bulk wallet generation and encrypted storage
- Wallet grouping, color tagging, and portfolio tracking

### On-Chain Operations

- **Token swaps** via Jupiter, Kyberswap, Uniswap
- **Token launches** via Pumpfun, Bonkfun
- Real-time balance queries and price feeds
- Native token and SPL/ERC20 transfers

### Visual Workflow Editor

- Drag-and-drop flow builder for workflow automation
- Browser automation with wallet extension support (Phantom, Rabby, Martian)
- Conditional logic, HTTP requests, and multi-threaded execution
- Parameterized runs via resource variables

### Campaigns & Scheduling

- Link workflows to profile groups for batch execution
- Cron-like scheduling with job chaining
- Timeout detection and Telegram notifications
- Execution history and debug logs

## Tech Stack

| Layer         | Technologies                                                |
| ------------- | ----------------------------------------------------------- |
| Desktop       | Electron 39, electron-vite                                  |
| Frontend      | React 19, TypeScript, Ant Design 6, Redux                   |
| Visual Editor | XYFlow                                                      |
| Database      | SQLite3, Sequelize                                          |
| AI/Agent      | DeepAgents, LangChain, LangGraph                            |
| Blockchain    | ethers.js, @solana/web3.js, @aptos-labs/ts-sdk, @mysten/sui |
| Automation    | Puppeteer with stealth plugin                               |

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Development

```bash
npm install
npm run dev
```

This starts Electron in dev mode with Vite hot reload on `localhost:4000`.

### Rebuild Native Dependencies

```bash
npm run rebuild-native
```

Required after switching Node versions or platforms (rebuilds sqlite3).

## Build

```bash
# macOS
npm run package-mac          # Universal
npm run package-mac-arm      # ARM64 only
npm run package-mac-intel    # x86_64 only

# Windows
npm run package-win          # x64
```

> **Note:** For Mac ARM builds, set `"arch": ["arm64"]` in the build config. For Intel, use `"arch": ["x64"]`.

## Project Structure

```
src/
├── electron/                # Main process
│   ├── agentCore/           # AI agent (skills, tools, subagents)
│   ├── controller/          # IPC handlers & session management
│   ├── database/            # Sequelize models & migrations
│   ├── simulator/           # Browser automation & on-chain execution
│   ├── schedule/            # Job scheduling & execution
│   └── service/             # Business logic
├── page/                    # React pages
│   ├── Agent/               # AI chat interface
│   ├── Wallet/              # Wallet management
│   ├── Campaign/            # Campaign builder
│   ├── Schedule/            # Scheduling UI
│   ├── Workflow/            # Visual workflow editor
│   └── ...
├── component/               # Shared React components
├── redux/                   # State management
└── hook/                    # Custom React hooks
```

## Architecture Highlights

- **Skills vs SubAgents** — Skills are knowledge (SKILL.md files read on demand), subagents are workers with tools. This separation keeps the system lightweight and scalable.
- **ToolContext** — Model-agnostic context injection ensures wallet and endpoint info flows to tools regardless of which LLM provider is active.
- **Agent Memory** — Persistent AGENT.md with auto-compaction and backup rotation. Durable facts are preserved across conversation resets.
- **Schedule System** — Generic job container that supports workflows, campaigns, and future job types (e.g., autonomous LP management).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [Business Source License 1.1](LICENSE).

- You **can**: view, fork, modify, and contribute to the code
- You **can**: use it for personal and educational purposes
- You **cannot**: use it for commercial purposes without a separate license
- On **2029-02-28**, the code converts to [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
