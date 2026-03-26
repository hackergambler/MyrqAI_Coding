# Project: AI Coding Academy (library.myrqai.com)

## 🎯 Primary Objective
Transform the existing `index.html` from a UI skeleton into a professional, data-driven AI learning platform with 100,000+ tutorials and 500+ projects.

## 🛠 Tech Stack & Style Guide
- **Frontend:** Vanilla HTML5, CSS3 (using Instrument Sans & JetBrains Mono), and Modular JavaScript.
- **Architecture:** Data-driven. Content must be loaded dynamically via `ContentEngine.js` from JSON databases to ensure scalability.
- **Design:** Maintain the "Dark/Cyber" aesthetic defined in the current `index.html`.

## 📂 4-Tier Curriculum Roadmap
All tutorials and navigation must follow this hierarchy:
1. **Level 1: Foundations** (Python for AI, Math, Data Preprocessing)
2. **Level 2: Machine Learning** (Scikit-Learn, Regression, Neural Network Basics)
3. **Level 3: Deep Learning** (PyTorch, TensorFlow, Computer Vision, NLP)
4. **Level 4: Modern AI** (Transformers, RAG, AI Agents, LangChain, LLM Fine-tuning)

## 🔧 Critical Tasks & Fixes
- **Link Audit:** Replace all `href="#"` or broken links (e.g., `courses/openai.html`, `debugging/index.html`) with functional paths.
- **Content Injection:** If a linked page does not exist, create the full content for it. No placeholders or "coming soon" text.
- **Debugging Lab:** Implement a split-pane IDE view (Red/Green highlighting) with a terminal output for the `debugging/index.html` route.
- **Scaling:** Implement the `MasterLibrary` JSON schema to handle the target of 100,000 tutorials.

## 🤖 Autonomous Behavior Rules
- **No Questions:** Do not ask for permission; identify the next logical error or missing piece and fix it.
- **Persistence:** If a rate limit (429 error) is reached, wait for the automated loop to restart.
- **QA Requirement:** Every code change must be followed by an internal link-integrity check.
- **Completion:** Once all tiers are functional and 100% of links in `index.html` work, create a file named `finished.txt`.
