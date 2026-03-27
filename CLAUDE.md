# Project: AI Coding Academy (coding.myrqai.com)

---

## 🎯 Global Mission

Build a world-class, production-ready AI training platform.

The system must:

1. Fully function as a complete product
2. Provide structured learning (lessons, debugging, projects)
3. Maintain high-quality, real-world usable content

⚠️ PRIORITY ORDER:

1. Fix system (debugging, projects, UI, links)
2. Audit and stabilize platform
3. THEN expand lessons/content

---

## 🛑 Critical Safety Rules (VERY IMPORTANT)

* ❌ NEVER delete existing working code
* ❌ NEVER overwrite entire files unless absolutely necessary
* ❌ NEVER remove features that already work
* ❌ NEVER remove existing lessons
* ✅ ONLY add, extend, or improve safely
* ✅ Preserve all existing functionality

If modifying a file:

* Make minimal, safe edits
* Do NOT rewrite unrelated sections

---

## 🔒 Data Safety Rules

* DO NOT rewrite entire `MasterLibrary.json`
* Treat it as **append-only**
* Preserve all existing entries exactly
* Maintain valid structure

---

## 🛑 Lesson Protection Rules (CRITICAL)

* DO NOT modify existing lessons
* DO NOT rewrite existing topics
* DO NOT duplicate lessons
* DO NOT replace or restructure existing content

Before adding a lesson:

1. Check if topic already exists
2. If exists → SKIP
3. Only add if missing

Rules:

* Existing lessons are FINAL and LOCKED
* Only append new lessons
* Only update minimal prev/next links if required

---

## 🚨 EXECUTION PRIORITY SYSTEM (MANDATORY)

Claude MUST follow this order:

---

### 🥇 Phase 1 — System Completion (FIRST)

Focus ONLY on:

* Debugging section
* Projects section
* Missing pages
* Navigation issues
* UI alignment
* Broken links

Rules:

* ❌ DO NOT add lessons
* ❌ DO NOT modify `MasterLibrary.json`
* ✅ Only fix system

---

### 🥈 Phase 2 — Full System Audit

After system works:

* Verify all pages exist
* Fix broken links
* Fix console errors
* Ensure UI works across all pages
* Ensure no blank/missing pages

Rules:

* ❌ DO NOT add lessons
* ❌ DO NOT modify lessons
* ✅ Only audit and fix

---

### 🥉 Phase 3 — Content Expansion (LAST)

ONLY after Phase 1 and 2 are complete:

* Add missing lessons
* Expand roadmap
* Improve content quality

Rules:

* ❌ DO NOT rewrite existing lessons
* ❌ DO NOT duplicate topics
* ✅ ONLY append missing lessons

---

## 📂 4-Tier Learning Roadmap (MANDATORY)

### Level 1: Foundations

* Python for AI
* Math for ML
* Data Preparation

### Level 2: Machine Learning

* Supervised Learning
* Unsupervised Learning
* Evaluation Techniques

### Level 3: Deep Learning

* CNNs, RNNs, GANs
* PyTorch, TensorFlow
* Optimization

### Level 4: Modern AI

* Transformers
* LLM Engineering
* Agentic AI
* MLOps

---

## 🧠 Lesson Quality Standard (MANDATORY)

Each lesson MUST include:

1. Title & Objective
2. Concept Explanation
3. Code Example
4. Step-by-step breakdown
5. Hands-on Exercise
6. Real-world use case
7. Difficulty level

⚠️ No lesson without code + exercise

---

## 🧪 Debugging System (MANDATORY)

Debugging is structured learning (NOT a tool).

Each entry MUST include:

1. Error message
2. Why it occurs
3. Root cause
4. Step-by-step fix
5. Code before
6. Code after

Rules:

* ❌ Do NOT create code editors
* ❌ Do NOT create placeholder pages
* ✅ Must be real-world debugging cases

---

## 📁 Projects System (MANDATORY)

Projects must be real, practical builds.

Each project MUST include:

1. Title
2. Description
3. Difficulty
4. Step-by-step guide
5. Code
6. Final output

Rules:

* ❌ No empty or placeholder projects
* ✅ Must be usable
* ✅ Link with lessons where possible

---

## 🔗 Navigation & Page Integrity (CRITICAL)

* Every link MUST work
* Missing page → CREATE it
* No broken navigation

Required sections:

* tutorials/
* courses/
* debugging/
* projects/

---

## 🧪 System QA Rules

Before committing:

* All pages open correctly
* No blank pages
* No broken links
* UI is aligned and responsive
* No critical console errors

---

## 🎯 Task Execution Rules

* Do EXACTLY ONE task per run
* Follow execution priority strictly
* Keep changes minimal and focused
* Maintain lesson chain integrity

CONTENT RULES:

* DO NOT modify existing lessons
* DO NOT rewrite topics
* ONLY add missing lessons
* Skip anything already implemented

---

## ⚡ Efficiency Rules

* Do NOT scan entire project
* Only read required files
* Prefer single-file edits
* Avoid large context

---

## 🏗 Technical Requirements

* Use `ContentEngine.js` + `MasterLibrary.json`
* Dynamic lesson loading
* Structured sidebar navigation
* Maintain scalable architecture

---

## 🎨 UI / UX Requirements

* Clean layout
* Proper code formatting
* Smooth navigation
* No UI breakage

---

## 💰 AdSense Integration (MANDATORY)

All HTML pages must include Google AdSense.

---

### 🔹 REQUIRED SCRIPT (ADD EXACTLY IN `<head>`)

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8668540803235423"
     crossorigin="anonymous"></script>

Rules:

* Add this script ONLY ONCE per page
* Must be inside `<head>`
* Do NOT duplicate or modify it

---

### 🔹 Ad Placement Blocks

Insert ads in safe locations:

* Below navbar
* Between sections
* End of content

Example:

<div class="adsense-container">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-8668540803235423"
       data-ad-slot="auto"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>

<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>

---

### 🔹 Ad Safety Rules

* ❌ Do NOT break layout
* ❌ Do NOT insert ads inside code blocks
* ❌ Do NOT spam ads
* ✅ Maintain clean UX

---

## 🚀 Product-Level Expectations

Platform must:

* Teach with code
* Provide debugging knowledge
* Provide real-world projects
* Be monetized properly
* Work as a complete product

---

## 🚫 Content Integrity Rules

* Do NOT fake numbers
* Ensure all content exists
* Prefer accuracy

---

## 🤖 Workflow Rules

* Run autonomously
* Handle rate limits with retry
* Continue until meaningful progress

Create `finished.txt` ONLY when:

* System fully functional
* No broken links
* All sections complete
* Roadmap complete

---

## 🔒 Final Rule

Always prioritize:

👉 System stability > Content
👉 Working product > More lessons
👉 Quality > Quantity
