{
  "project_name": "bottok",
  "project_description": "Bot Tok is a TikTok Up Bot (likes, shares, favorites and views) based in Node.js, Puppeteer, and third-party providers (zefoy.com & freer.es). It automates interactions on Zefoy website, such as increasing views, hearts, followers, and shares on a specified video. This project aims to recreate and enhance its functionalities.",
  "tech_stack": [
    "Node.js",
    "Puppeteer",
    "JavaScript",
    "Possibly a web framework for a user interface (e.g., Express.js, React for frontend if UI is desired)",
    "Possibly a database for managing user sessions/tasks (e.g., SQLite, MongoDB)"
  ],
  "core_functionalities": [
    "Automate TikTok views, shares, and favorites.",
    "Automate TikTok likes/hearts (note: availability may be poor).",
    "Handle CAPTCHA solving (potentially integrate with OCR or free/premium auto-solve services).",
    "Manage sessions (Cloudflare & Zefoy Cookies, User-Agent, Proxy).",
    "Support random User-Agent and proxy from a list.",
    "Maintain activity logs.",
    "Implement custom accumulation limits.",
    "Run on Windows, Linux, and Android (Termux).",
    "Support multi-tasking (premium feature in original).",
    "Run as a detached process (premium feature in original)."
  ],
  "project_structure": {
    "src": {
      "controllers": "Handles logic for different bot actions (views, likes, etc.).",
      "services": "Contains core logic for interacting with TikTok/Zefoy, Puppeteer automation.",
      "utils": "Helper functions (e.g., proxy rotation, User-Agent generation, logging).",
      "config": "Configuration files (e.g., API keys, default settings, third-party provider URLs).",
      "models": "Data models if a database is used (e.g., for sessions, task history).",
      "routes": "If a web UI/API is implemented.",
      "views": "If a web UI is implemented."
    },
    "data": "Stores temporary data, logs, session cookies.",
    "tests": "Unit and integration tests for core functionalities.",
    "scripts": "Setup, installation, and utility scripts.",
    ".github": {
      "workflows": "GitHub Actions for CI/CD, testing, and deployment."
    },
    ".cursor": {
      "rules": "Cursor IDE specific rules for code generation and AI assistance."
    },
    "README.md": "Project documentation.",
    "package.json": "Node.js project configuration and dependencies."
  },
  "cursor_ide_rules": {
    "file_path": ".cursor/rules/bottok_rules.mdc",
    "content": "--- \ndescription: Guidelines for developing the Bot Tok application, focusing on Node.js, Puppeteer, and web automation best practices. \nglobs: [\"**/*.js\", \"**/*.ts\"]\nalwaysApply: true\n---\n\n# Bot Tok Development Guidelines\n\n## General Principles\n- **Modularity**: Break down functionalities into small, testable modules (e.g., separate services for each TikTok action).\n- **Error Handling**: Implement robust error handling for all web automation steps, including retries and fallbacks.\n- **Concurrency**: Be mindful of concurrency and rate limits when interacting with external services. Use Puppeteer's capabilities efficiently.\n- **Security**: Be aware of the security implications of using third-party services and handling user data (even if limited to session data). Avoid hardcoding sensitive information.\n- **Maintainability**: Write clean, readable, and well-commented code. Prioritize clear variable names and function signatures.\n- **Ethical Use**: Remind developers that using a TikTok viewbot is against TikTok's Terms of Service. [6] The tool is provided for educational/research purposes and use is at the user's own risk. [6]\n\n## Node.js & Puppeteer Best Practices\n- **Puppeteer Initialization**: Ensure Puppeteer instances are properly launched and closed to prevent resource leaks.\n- **Selectors**: Use resilient CSS selectors to interact with web elements. Consider using multiple selectors as fallbacks if UI changes frequently.\n- **Headless Mode**: Default to headless mode for performance, but allow options for non-headless mode during development/debugging.\n- **Page Navigation**: Handle page navigation and waits for network idle or specific elements to load before proceeding.\n- **Captcha Handling**: Integrate with a robust captcha solving mechanism. If an external service is used, ensure its API integration is reliable.\n- **Session Management**: Securely store and load session cookies. Implement mechanisms for session expiration and renewal.\n- **User-Agents & Proxies**: Implement logic to rotate User-Agents and proxies to avoid detection and bans.\n- **Logging**: Use a structured logging library (e.g., Winston, Pino) for detailed activity logs, errors, and debugging information.\n\n## Code Style & Structure\n- **JavaScript/TypeScript**: Adhere to a consistent coding style (e.g., ESLint with a popular style guide like Airbnb).\n- **Asynchronous Operations**: Primarily use `async/await` for asynchronous operations for better readability.\n- **Configuration**: Centralize all configurable parameters in the `src/config` directory.\n- **Dependency Management**: Clearly define all project dependencies in `package.json`.\n\n## Cursor IDE Specifics\n- **Context**: When asking for code generation, provide relevant file context using `@file` or `@folder` (e.g., `@src/services/tiktokService.js` for Puppeteer automation tasks). [12]\n- **Planning**: Utilize Cursor's planning capabilities (`/plan` command or Agent mode) to outline complex features or refactoring tasks. [5, 12]\n- **Testing**: When generating tests, ensure they cover edge cases and error scenarios, especially for web automation.\n- **Documentation**: Encourage the AI to generate JSDoc comments for functions and modules.\n- **Refactoring**: When refactoring existing code, prioritize small, incremental changes and provide clear instructions to the AI.\n- **Project Structure Awareness**: If necessary, explicitly instruct Cursor to run `ls` or `tree` to understand the project structure before making changes, especially in larger projects. [5]\n- **Yolo Mode**: Consider enabling Yolo mode for automated test execution during iterative development cycles (use with caution). [11]\n"
  }
}
