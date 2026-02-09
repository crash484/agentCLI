# 🤖 AgentCLI - AI Agent from Scratch

A general-purpose AI agent built from first principles in TypeScript. This project demonstrates how to build an autonomous agent that can orchestrate tools, manage conversations, handle context windows, and execute commands on your machine.

## 📋 Overview

AgentCLI is a command-line AI agent that can:
- Execute multi-turn conversations with context awareness
- Call and orchestrate multiple tools (file operations, web search, shell commands)
- Manage context windows with automatic summarization
- Request human approval for sensitive operations (HITL - Human-in-the-Loop)
- Track token usage and optimize for model limits
- Stream responses in real-time with a beautiful CLI interface

This project was built as part of the "Build an AI Agent from Scratch" course, focusing on understanding agent fundamentals without relying on frameworks or abstractions.

## ✨ Features

- **🔧 Tool Calling**: Agent can use multiple tools to accomplish tasks:
  - **File System Tools**: Read, write, list, and delete files
  - **Web Search**: Search Google for real-time information
  - **Shell Commands**: Execute system commands (with approval)
  - **Date/Time**: Get current date and time information

- **💬 Conversational Interface**: Interactive terminal UI with:
  - Real-time streaming responses
  - Visual tool execution feedback
  - Token usage tracking
  - Beautiful formatting with Ink

- **🧠 Context Management**: 
  - Automatic conversation compaction when approaching token limits
  - Token usage monitoring and warnings
  - Smart message filtering for model compatibility

- **🔒 Safety Features**:
  - Human-in-the-loop approval for sensitive operations
  - Tool execution visibility
  - Error handling and recovery

- **📊 Evaluation Framework**:
  - Single-turn evaluation tests
  - Multi-turn agent evaluation
  - Tool-specific evaluation suites

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- An API key for one of the supported LLM providers:
  - Google AI (Gemini)
  - OpenAI (GPT)

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/crash484/agentCLI.git
   cd agentCLI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the project root by copying the example:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your configuration:
   ```bash
   # Pick the provider: openai | google
   LLM_PROVIDER=google

   # Pick the model name for that provider
   # Google examples: gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash
   # OpenAI examples: gpt-4-turbo, gpt-4, gpt-3.5-turbo
   LLM_MODEL=gemini-2.5-flash

   # --- Credentials ---
   # OpenAI (used when LLM_PROVIDER=openai)
   OPENAI_API_KEY=your_openai_api_key_here

   # Gemini via Google Generative AI (used when LLM_PROVIDER=google)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

   # Optional: For evaluation features
   LMNR_API_KEY=your_laminar_api_key_here
   ```

   **Getting API Keys**:
   - **Google AI (Gemini)**: Get your key at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **OpenAI**: Get your key at [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Laminar** (optional, for evals): Get your key at [Laminar](https://www.lmnr.ai/)

4. **Build the project** (optional, for CLI usage):
   ```bash
   npm run build
   ```

## 🎮 Usage

### Development Mode

Run the agent in development mode with hot reloading:

```bash
npm run dev
```

### Production Mode

Run the agent directly:

```bash
npm start
```

### As a CLI Tool

After building the project, you can run it as a CLI tool:

```bash
npm run build
./dist/cli.js
```

Or install it globally:

```bash
npm install -g .
agi
```

### Interacting with the Agent

Once the agent starts, you'll see an interactive prompt:

```
🤖 AI Agent (type "exit" to quit)

You: _
```

**Example interactions**:

1. **File operations**:
   ```
   You: Create a new file called hello.txt with the content "Hello, World!"
   ```

2. **Web search**:
   ```
   You: What's the latest news about AI agents?
   ```

3. **Shell commands** (requires approval):
   ```
   You: List all files in the current directory
   ```

4. **Combined tasks**:
   ```
   You: Search for TypeScript best practices and save a summary to notes.txt
   ```

**Commands**:
- Type `exit` or `quit` to close the agent

### Tool Approval

For sensitive operations (like shell commands), the agent will ask for your approval:

```
🔐 Tool Approval Required
Tool: runCommand
Arguments: { command: "ls -la" }

Approve? (y/n):
```

Type `y` to approve or `n` to deny.

## 🧪 Running Evaluations

The project includes evaluation suites to test agent behavior:

```bash
# Run all evaluations
npm run eval

# Run specific evaluation suites
npm run eval:file-tools      # Test file operations
npm run eval:shell-tools     # Test shell commands
npm run eval:agent          # Test multi-turn agent behavior
```

## 📁 Project Structure

```
agentCLI/
├── src/
│   ├── agent/              # Core agent logic
│   │   ├── run.ts         # Main agent loop
│   │   ├── executeTool.ts # Tool execution handler
│   │   ├── context/       # Context management & token handling
│   │   ├── system/        # System prompts & message filtering
│   │   └── tools/         # Tool implementations
│   │       ├── file.ts           # File system operations
│   │       ├── googleSearch.ts   # Web search
│   │       ├── shell.ts          # Shell command execution
│   │       ├── dateTime.ts       # Date/time utilities
│   │       └── index.ts          # Tool registry
│   ├── ui/                # Terminal UI components (Ink)
│   │   ├── App.tsx        # Main application component
│   │   └── components/    # UI components
│   ├── cli.ts             # CLI entry point
│   ├── index.ts           # Development entry point
│   └── types.ts           # TypeScript type definitions
├── evals/                 # Evaluation test suites
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ How It Works

### The Agent Loop

The agent operates in a continuous loop:

1. **User Input**: Receives a message from the user
2. **Context Management**: Checks token usage and compacts history if needed
3. **Model Call**: Sends messages to the LLM with available tools
4. **Response Streaming**: Streams text responses in real-time
5. **Tool Calls**: If the model requests tool usage:
   - Requests approval for sensitive tools
   - Executes the tool
   - Adds results to conversation history
6. **Iteration**: Repeats steps 3-5 until the model provides a final response
7. **Complete**: Returns response to user and updates conversation history

### Key Components

- **Agent Core** (`src/agent/run.ts`): Orchestrates the agent loop, manages conversation history, and handles tool execution
- **Tools** (`src/agent/tools/`): Individual tool implementations that the agent can call
- **Context Manager** (`src/agent/context/`): Monitors token usage and compacts conversations when needed
- **UI Layer** (`src/ui/`): Terminal interface built with React Ink for beautiful CLI interactions
- **Callbacks**: Event-driven architecture for tool execution, token tracking, and approval workflows

## 🔧 Development

### Available Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm start` - Run in production mode
- `npm run build` - Build the project for distribution
- `npm run eval` - Run all evaluation suites
- `npm run eval:file-tools` - Run file tools evaluation
- `npm run eval:shell-tools` - Run shell tools evaluation
- `npm run eval:agent` - Run multi-turn agent evaluation

### Adding New Tools

To add a new tool to the agent:

1. Create a new file in `src/agent/tools/`:
   ```typescript
   // src/agent/tools/myTool.ts
   import { tool } from "ai";
   import { z } from "zod";

   export const myTool = tool({
     description: "Description of what your tool does",
     parameters: z.object({
       // Define your parameters
       input: z.string().describe("Input description"),
     }),
     execute: async ({ input }) => {
       // Implement your tool logic
       return "result";
     },
   });
   ```

2. Register the tool in `src/agent/tools/index.ts`:
   ```typescript
   import { myTool } from "./myTool";
   
   export const tools = {
     // ... existing tools
     myTool,
   };
   ```

3. (Optional) Add approval logic in `src/agent/executeTool.ts` if the tool needs human approval

### Code Quality

The project uses Biome for linting and formatting:

```bash
# Check code quality
npx biome check .

# Fix issues automatically
npx biome check --apply .
```

## 📚 Learning Resources

This project demonstrates key concepts in building AI agents:

- **Tool Calling**: How LLMs can use external tools to extend their capabilities
- **Context Management**: Handling token limits with summarization and compaction
- **Streaming**: Real-time response generation for better UX
- **Human-in-the-Loop**: Safety patterns for sensitive operations
- **Evaluation**: Testing agent behavior with both single-turn and multi-turn tests
- **Conversational State**: Managing multi-turn conversations with proper history

For a deeper dive into these concepts, check out the course materials in the `notes/` directory.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs by opening an issue
- Suggest new features or improvements
- Submit pull requests with enhancements

## 📄 License

This project is part of an educational course on building AI agents from scratch.

## 🙏 Acknowledgments

This project was built as part of the "Build an AI Agent from Scratch" workshop, focusing on understanding agent primitives without framework abstractions.

---

**Happy Agent Building! 🚀**
