# Future With ML

A professional ML/AI engineering blog built with [Zola](https://www.getzola.org/) static site generator and the [tabi theme](https://github.com/welpo/tabi).

## Prerequisites

Before running this blog locally, you need:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **macOS/Linux/Windows** | - | Operating system |
| **Git** | 2.x+ | Version control & submodule management |
| **Zola** | 0.19.2+ | Static site generator |

### Optional Dependencies

| Tool | Purpose |
|------|---------|
| **Node.js** | If you need to modify/test JavaScript locally |

## Quick Start

### 1. Install Zola

**macOS (Homebrew):**
```bash
brew install zola
```

**Linux (Snap):**
```bash
snap install zola --edge
```

**Linux (Debian/Ubuntu):**
```bash
# Download latest release from https://github.com/getzola/zola/releases
wget https://github.com/getzola/zola/releases/download/v0.19.2/zola-v0.19.2-x86_64-unknown-linux-gnu.tar.gz
tar -xzf zola-v0.19.2-x86_64-unknown-linux-gnu.tar.gz
sudo mv zola /usr/local/bin/
```

**Windows (Chocolatey):**
```powershell
choco install zola
```

**Windows (Scoop):**
```powershell
scoop install zola
```

Verify installation:
```bash
zola --version
# Expected output: zola 0.19.2 or higher
```

### 2. Clone the Repository

```bash
git clone --recurse-submodules https://github.com/Cpicon/myblog.git
cd myblog
```

If you already cloned without `--recurse-submodules`:
```bash
git submodule update --init --recursive
```

### 3. Run Locally

```bash
zola serve
```

The site will be available at: **http://127.0.0.1:1111**

> **Note:** Use `127.0.0.1:1111`, not `localhost:1111`. Zola generates asset URLs based on the bound address, so accessing via `localhost` will cause styles to fail loading. To use localhost instead:
> ```bash
> zola serve --base-url http://localhost:1111
> ```

The development server:
- Hot-reloads on file changes
- Shows build errors in the terminal
- Serves drafts by default

### 4. Build for Production

```bash
zola build
```

Output will be in the `public/` directory.

## Project Structure

```
myblog/
├── config.toml           # Site configuration
├── content/              # Markdown content
│   ├── _index.md         # Homepage content
│   └── posts/            # Blog posts
├── sass/                 # Custom SCSS
│   └── skins/
│       └── cyber.scss    # ML/AI color theme
├── static/               # Static assets
│   ├── css/
│   │   └── custom.css    # Custom styles
│   ├── js/
│   │   ├── neural-bg.js  # Three.js animation
│   │   └── typing.js     # Typing effect
│   └── icons/            # Favicons
├── templates/            # Custom templates
│   └── index.html        # Homepage override
└── themes/
    └── tabi/             # Theme (git submodule)
```

## Features

- **Dark/Light Mode** - Automatic OS detection with manual toggle
- **ML/AI Aesthetic** - Custom "cyber" skin with electric cyan accents
- **Neural Network Background** - Interactive Three.js particle animation
- **Terminal-Style Code Blocks** - Professional code presentation
- **Typing Animation** - Dynamic hero text cycling through titles
- **KaTeX Math Rendering** - For mathematical notation
- **Mermaid Diagrams** - For flowcharts and architecture diagrams
- **Responsive Design** - Mobile-first approach
- **Perfect Lighthouse Scores** - Optimized for performance

## Writing Content

### Creating a New Post

1. Create a new directory in `content/posts/`:
   ```bash
   mkdir content/posts/my-new-post
   ```

2. Create `index.md` with front matter:
   ```markdown
   +++
   title = "My New Post"
   date = 2025-01-04
   description = "A brief description"

   [taxonomies]
   categories = ["MLOps"]
   tags = ["machine-learning", "python"]
   +++

   Your content here...
   ```

3. Add images to the same directory and reference them:
   ```markdown
   ![Alt text](my-image.png)
   ```

### Front Matter Options

```toml
+++
title = "Post Title"
date = 2025-01-04
updated = 2025-01-05
description = "SEO description"
draft = false

[taxonomies]
categories = ["Category"]
tags = ["tag1", "tag2"]

[extra]
toc = true                    # Show table of contents
math = true                   # Enable KaTeX
mermaid = true               # Enable Mermaid diagrams
+++
```

## Deployment

The site is configured for **Netlify** deployment:

1. Push changes to the `main` branch
2. Netlify automatically builds and deploys
3. Live at: https://futurewithml.netlify.app

### Manual Deployment

```bash
zola build
# Upload contents of public/ to your hosting provider
```

## Troubleshooting

### Theme Not Loading

Ensure the tabi submodule is initialized:
```bash
git submodule update --init --recursive
```

### Build Errors

Check Zola version compatibility:
```bash
zola --version
# Should be 0.19.2 or higher
```

### CSS Not Updating

Clear browser cache or use incognito mode during development.

## License

Content: All rights reserved
Code: MIT License

---

**Author:** Christian Picon Calderon
**Contact:** [LinkedIn](https://linkedin.com/in/christianpiconmlengineer) | [GitHub](https://github.com/Cpicon)
