📖 Focused Storybook
Focused Storybook is a VSCode extension that helps developers run Storybook with only the currently focused story file, significantly speeding up Storybook startup times — especially in large monorepos.

🚀 Features

Automatically detects the nearest .storybook/main.ts (or main.js).
Temporarily overrides the stories array to include only the currently active story file.
Runs npm run storybook dev -p 6006 directly from the correct project directory.
Automatically restores the original main.ts/main.js when Storybook shuts down.
Supports multiple concurrent Storybook sessions — each with its own isolated config and backup.

🎯 Why Use Focused Storybook?

Working with large Storybook projects can be slow, especially when all stories across a monorepo or large project need to be loaded.
Focused Storybook lets you:

Test a single story in isolation.
Avoid loading hundreds of unnecessary stories.
Quickly debug a specific component's story.
Run multiple Storybook instances for different components simultaneously.

📂 How It Works

Open any \*.stories.tsx (or .js, .jsx, .mdx) file.

Run the command:
Open Focused Storybook from the command palette (Ctrl+Shift+P or Cmd+Shift+P).

The extension:
Locates the nearest .storybook/main.ts (or .storybook/main.js).
Creates a backup of the original config.
Replaces the stories array to load only the current file.
Starts Storybook.
Restores the original main.ts/main.js when Storybook exits.

⚙️ Requirements

Node.js 18+ (recommended)
Storybook installed locally in the project (no global dependency required)
Works with both JavaScript and TypeScript Storybook configurations

🛠️ Configuration

This extension assumes:

Storybook can be started with:

```
npm run storybook dev -p 6006
```

.storybook directory is present at the project root or in the nearest ancestor folder.
If you use a different command (yarn, pnpm), you can customize the command in future versions.

🔒 Safety

Each Storybook session gets its own backup file, so multiple sessions can run in parallel safely.
If the editor crashes, you can manually restore the backup using the command:
Restore Storybook Config

📸 Example
Example project structure:

```
apps/
    design-system/
        .storybook/
            main.ts
        src/
            components/
                Button/
                    Button.stories.tsx
```

When you open Button.stories.tsx and run Open Focused Storybook, only that file loads.

🏗️ Supported Storybook Versions

Storybook 6+
Supports both Next.js and standard React setups
Works in monorepos (Rush, Turborepo, Nx)

💬 Feedback & Issues

Found a bug? Have a feature request?
Please open an issue on the repository.

⚠️ Disclaimer

This extension temporarily modifies your .storybook/main.ts (or main.js). The changes are automatically reverted when Storybook shuts down.
However, if you force close VSCode, you may need to manually restore the original file using the provided restore command.

📦 Installation

You can install this extension directly from the VSCode Marketplace (link will be available after publishing).
