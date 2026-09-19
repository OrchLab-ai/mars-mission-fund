# Markdown Standard

> **Spec ID**: L3-007
> **Version**: 1.0
> **Status**: Approved
> **Rate of Change**: Sprint level / technology decisions
> **Depends On**: L2-002 (standards/engineering.md)
> **Depended On By**: All specs in this repository

---

## Purpose

This document defines how Markdown files are authored, formatted, and validated across the Mars Mission Fund codebase.
Consistent Markdown matters because specifications, documentation, and READMEs are engineering artefacts — they receive the same quality standards as code (L2-002, Section 4).

> **Local demo scope:** Fully enforced.
> The markdownlint configuration and one-sentence-per-line rule apply to the local demo — all specs and docs in this repo are validated against this standard.

---

## 1. Line Structure

### 1.1 One Sentence Per Line

Every sentence starts on its own line.
Every line contains at most one sentence.

This is the single most important formatting rule in this spec.

**Why**:

- Git diffs become sentence-level, not paragraph-level.
  Reviewers see exactly which sentence changed.
- Reordering, deleting, or editing a sentence never produces a noisy diff that obscures the actual change.
- Merge conflicts are isolated to the sentence that was edited, not the entire paragraph.

**Correct**:

```markdown
Mars Mission Fund uses escrow-based funding.
Funds are released only when milestones are verified.
This protects both donors and proposal teams.
```

**Incorrect**:

```markdown
Mars Mission Fund uses escrow-based funding. Funds are released only when milestones are verified. This protects both donors and proposal teams.
```

### 1.2 Line Length

Line length is not enforced by a hard character limit (markdownlint MD013 is disabled).
The one-sentence-per-line rule naturally keeps lines at a reasonable length.

If a single sentence exceeds ~120 characters, consider whether the sentence itself is too long and should be split for readability — not for formatting.

### 1.3 Blank Lines

Use a single blank line to separate block-level elements (headings, paragraphs, lists, code blocks, tables).
Never use multiple consecutive blank lines (MD012).

---

## 2. Headings

### 2.1 Style

Use ATX-style headings (`#`, `##`, `###`).
Do not use setext-style (underline) headings (MD003).

### 2.2 Hierarchy

Heading levels increment by one.
Do not skip levels — e.g., jumping from `##` to `####` (MD001).

Every document must start with a single top-level heading (`#`) as the first line (MD041).
Only one `#` heading per document (MD025).

### 2.3 Blank Lines Around Headings

Every heading must have a blank line before and after it (MD022).

### 2.4 Trailing Punctuation

Headings must not end with punctuation (MD026).
Exception: question marks are permitted in FAQ-style headings.

---

## 3. Lists

### 3.1 Unordered Lists

Use `-` as the list marker.
Do not use `*` or `+` (MD004, configured for `dash`).

### 3.2 Ordered Lists

Use `1.` for all items in ordered lists (MD029, configured for `one`).
Markdown renderers will number them correctly.
This avoids noisy diffs when items are reordered.

### 3.3 Indentation

Indent nested list items by 2 spaces (MD007).

### 3.4 Blank Lines Around Lists

Lists must be surrounded by blank lines (MD032).

---

## 4. Code

### 4.1 Code Blocks

Use fenced code blocks with backticks (` ``` `), not indented code blocks (MD046).
Do not use tildes (`~~~`) for fences (MD048).

Every fenced code block must specify a language identifier (MD040).

### 4.2 Code Spans

Inline code uses single backticks.
No spaces inside code span backticks (MD038).

---

## 5. Links and Images

### 5.1 No Bare URLs

URLs must be wrapped in angle brackets or used as part of a Markdown link (MD034).

### 5.2 Image Alt Text

Every image must have meaningful alt text (MD045).

### 5.3 Link Text

Link text must be descriptive.
Do not use "click here" or "link" as link text (MD059).
This aligns with the brand voice requirement in L2-001 (Section 4.3, Forbidden Language Patterns).

---

## 6. Emphasis

Use `*` for italic and `**` for bold.
Do not use `_` or `__` (MD049, MD050).
No spaces inside emphasis markers (MD037).

---

## 7. Tables

Tables must be surrounded by blank lines (MD058).
Pipe characters must have consistent spacing (MD055).
Every table must have the correct number of columns in every row (MD056).
Separator rows must use padded style with spaces around dashes, matching the header row spacing (MD060).

**Correct**:

```markdown
| Name | Value |
| ---- | ----- |
| Foo  | Bar   |
```

**Incorrect**:

```markdown
| Name | Value |
| ---- | ----- |
| Foo  | Bar   |
```

---

## 8. Horizontal Rules

Use `---` for horizontal rules.
Maintain a consistent style throughout the document (MD035).

---

## 9. Inline HTML

Inline HTML is not permitted in specification documents (MD033).
Markdown must be sufficient for all spec content.

---

## 10. Whitespace

No trailing spaces at end of lines (MD009).
No hard tabs — use spaces only (MD010).
Files must end with a single newline character (MD047).

---

## 11. Linter

This project uses [markdownlint](https://github.com/DavidAnson/markdownlint) to enforce these rules automatically.

### 11.1 VS Code Extension

Install the VS Code extension for real-time linting:

```bash
code --install-extension DavidAnson.vscode-markdownlint
```

Or search for "markdownlint" in the VS Code Extensions panel (`Cmd+Shift+X`).

The extension highlights violations inline as you type and provides quick-fix actions.

### 11.2 CLI

For CI and pre-commit validation, use [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2):

```bash
npm install --save-dev markdownlint-cli2
```

Run against the project:

```bash
npx markdownlint-cli2 "**/*.md"
```

### 11.3 Configuration

The project-level configuration lives in `.markdownlint.jsonc` at the repository root.
This file must be kept in sync with the rules defined in this spec.

The configuration matching this spec:

```jsonc
{
  // Line length — disabled; one-sentence-per-line governs structure
  "MD013": false,

  // Unordered list marker: dash only
  "MD004": { "style": "dash" },

  // Ordered list prefix: always 1.
  "MD029": { "style": "one" },

  // List indentation: 2 spaces
  "MD007": { "indent": 2 },

  // Heading style: ATX only
  "MD003": { "style": "atx" },

  // Code block style: fenced only
  "MD046": { "style": "fenced" },

  // Code fence style: backtick only
  "MD048": { "style": "backtick" },

  // Emphasis style: asterisk only
  "MD049": { "style": "asterisk" },

  // Strong style: asterisk only
  "MD050": { "style": "asterisk" },

  // Horizontal rule style: dashes
  "MD035": { "style": "---" },

  // No inline HTML
  "MD033": true,

  // Heading trailing punctuation — allow question marks
  "MD026": { "punctuation": ".,;:!" },

  // Table separator style: padded (spaces around dashes)
  "MD060": { "style": "padded" },
}
```

---

## Change Log

| Date       | Version | Author | Summary                                                                                    |
| ---------- | ------- | ------ | ------------------------------------------------------------------------------------------ |
| March 2026 | 1.0     | —      | Initial draft. One-sentence-per-line rule, markdownlint integration, linter configuration. |
| March 2026 | 1.0     | —      | Promoted to Review status. Content complete.                                               |

---

*This standard governs all Markdown authorship in the Mars Mission Fund project.
For the engineering quality principles that motivate these rules, see L2-002 (standards/engineering.md).*
