# Aiva - VS Code Theme Extension

<p align="center">
  <img src="assets/logo.png" alt="Aiva Logo" width="128">
</p>

<p align="center">
  A beautiful dark theme with an animated mascot that reacts to your code diagnostics.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=sam-thisha.aiva">
    <img src="https://img.shields.io/visual-studio-marketplace/v/sam-thisha.aiva" alt="Version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=sam-thisha.aiva">
    <img src="https://img.shields.io/visual-studio-marketplace/i/sam-thisha.aiva" alt="Installs">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/thisha-me/aiva" alt="License">
  </a>
</p>

![Screenshot](assets/screen-shot.jpg)

## Features

- 🎨 **Dark Theme** - Carefully crafted color palette with vibrant syntax highlighting
- 🤖 **Animated Mascot** - Interactive face that follows your cursor
- 📊 **Diagnostic Reactions** - Mascot expression changes based on code errors/warnings
- ⚡ **Lightweight** - Minimal performance impact

## Architecture

### Extension Overview

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                     │
├─────────────────────────────────────────────────────────┤
│  extension.ts                                            │
│  ├── AivaViewProvider (WebviewViewProvider)             │
│  │   ├── Registers webview in explorer panel            │
│  │   ├── Monitors vscode.languages.getDiagnostics()     │
│  │   └── Posts pose messages to webview                 │
│  └── Diagnostic Listener                                 │
│      └── onDidChangeDiagnostics → updatePose()          │
├─────────────────────────────────────────────────────────┤
│  aiva-face/ (Webview)                                    │
│  ├── aiva.ts - HeyAiva custom element                   │
│  ├── aiva.css - Animations & styling                    │
│  └── Listens for postMessage({ type: 'pose', pose })    │
└─────────────────────────────────────────────────────────┘
```

### Theme Implementation

The theme is defined in `themes/aiva.json` with 800+ color definitions:

```json
{
  "name": "Aiva",
  "type": "dark",
  "colors": {
    "editor.background": "#181b28",
    "editor.foreground": "#d3d3d3",
    "activityBar.foreground": "#00b4fb",
    ...
  },
  "tokenColors": [...]
}
```

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00b4fb` | Primary accent |
| Purple | `#c276ff` | Keywords |
| Red | `#ff5f70` | Errors, strings |
| Yellow | `#ffd164` | Warnings, types |
| Green | `#65c06b` | Success, strings |

### Webview Communication

Extension → Webview:
```typescript
// extension.ts
this._view.webview.postMessage({ type: "pose", pose: "happy" });

// aiva.ts (webview)
window.addEventListener("message", (event) => {
  if (event.data.type === "pose") {
    aiva.setAttribute("pose", event.data.pose);
  }
});
```

### Diagnostic State Handling

```typescript
function updateDiagnostics(provider: AivaViewProvider): void {
  const diagnostics = vscode.languages.getDiagnostics();
  let errorCount = 0;
  
  for (const [, collection] of diagnostics) {
    errorCount += collection.filter(d => 
      d.severity === vscode.DiagnosticSeverity.Error
    ).length;
  }
  
  // Map error count to pose
  const pose = errorCount === 0 ? "happy" 
    : errorCount === 1 ? "sad"
    : errorCount <= 3 ? "disappointed"
    : errorCount <= 6 ? "shocked" 
    : "cry";
    
  provider.setPose(pose);
}
```

### Animated Mascot (Web Component)

The mascot is implemented as a custom HTML element:

```typescript
class HeyAiva extends HTMLElement {
  static get observedAttributes() {
    return ["pose"];
  }
  
  attributeChangedCallback(name: string, _old: string, newValue: string) {
    if (name === "pose") {
      this.updateShapes(poses[newValue]);
    }
  }
  
  onPointerMove(event: PointerEvent) {
    // Eyes follow cursor
    const x = (event.clientX - this._rect.x) / this._rect.width;
    this.style.setProperty("--x", x.toString());
  }
}

customElements.define("hey-aiva", HeyAiva);
```

## Project Structure

```
aiva/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── aiva-face/
│   │   ├── aiva.ts           # HeyAiva web component
│   │   ├── aiva.css          # Mascot styles & animations
│   │   ├── reset.css         # CSS reset
│   │   └── vscode.css        # VS Code theme variables
│   └── test/
│       ├── runTest.ts        # Test runner
│       └── suite/
│           ├── index.ts      # Mocha setup
│           └── extension.test.ts
├── themes/
│   └── aiva.json             # Theme color definitions
├── assets/
│   ├── logo.png              # Extension icon
│   └── screen-shot.jpg       # Marketplace screenshot
├── out/                      # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Extension & webview logic |
| VS Code Extension API | Extension framework |
| Web Components | Custom `<hey-aiva>` element |
| CSS Animations | Mascot animations & effects |
| Mocha | Test framework |
| GitHub Actions | CI/CD pipeline |

## Build & Development

### Prerequisites

- Node.js 20+
- npm 9+
- VS Code 1.90+

### Setup

```bash
# Clone repository
git clone https://github.com/thisha-me/aiva.git
cd aiva

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Copy static assets
npm run copy-assets
```

### Development

```bash
# Watch mode
npm run watch

# Run extension in development
# Press F5 in VS Code
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile TypeScript |
| `npm run copy-assets` | Copy CSS/HTML to out/ |
| `npm run watch` | Watch mode compilation |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run vscode:prepublish` | Pre-publish build |

## Testing

```bash
# Run all tests
npm test

# Tests download VS Code and run integration tests
# Output:
#   Extension Test Suite
#     ✔ Sample test
#   1 passing
```

Tests use `@vscode/test-electron` to run in an actual VS Code instance.

## Publishing

### Prerequisites

1. Create [Azure DevOps](https://dev.azure.com/) account
2. Generate Personal Access Token (PAT) with Marketplace scope
3. Create publisher on [VS Code Marketplace](https://marketplace.visualstudio.com/manage)

### Publish

```bash
# Login
npx @vscode/vsce login sam-thisha

# Package
npx @vscode/vsce package

# Publish
npx @vscode/vsce publish
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add tests for new features
- Run `npm run lint` before committing

## License

[MIT](LICENSE) © thisha-me

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/thisha-me">thisha-me</a>
</p>
