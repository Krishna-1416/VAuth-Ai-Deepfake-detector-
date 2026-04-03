# Frontend Design Plan: AI Deepfake Detection System (PS0201)

This document outlines the visual identity, UI/UX flow, and technical implementation details for the frontend of the Deepfake Detection System. The goal is to create a **premium, state-of-the-art interface** that feels "alive" and builds trust through transparency.

---

## 🎨 Visual Identity & Design System

### 🌑 Theme: "Stark Midnight"
A deep, cinematic dark mode utilizing **Glassmorphism** and **Vibrant Accents**.

| Category | Specification |
| :--- | :--- |
| **Primary Background** | Radial Gradient: `at 0% 0%, #0f172a 0, transparent 50%`, `at 50% 0%, #1e1b4b 0, transparent 50%` |
| **Glass Panel** | `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(20px)` and a `1px` border of `rgba(255, 255, 255, 0.1)` |
| **Accent Colors** | **Electric Cyan** (`#22d3ee`), **Aurora Purple** (`#a855f7`), **Neon Teal** (`#2dd4bf`) |
| **Status Colors** | **Authentic:** Emerald (`#10b981`), **Manipulated:** Rose/Crimson (`#f43f5e`), **Analyzing:** Amber (`#f59e0b`) |
| **Typography** | **Headings:** [Outfit](https://fonts.google.com/specimen/Outfit) (Bold, 700+). **Body:** [Inter](https://fonts.google.com/specimen/Inter) (Regular/Medium). |

---

## 🧱 Component Architecture

### 1. The "Pulse" Navbar
*   **Design:** A floating glass capsule at the top.
*   **Interaction:** Subtle glow when the user scrolls. Contains logo and "How it Works" link.
*   **Animation:** Logo uses a gentle "breathing" opacity animation.

### 2. The "Nexus" Upload Zone
*   **Design:** A large, interactive area with a dashed glowing border.
*   **Interactive States:**
    *   **Idle:** Dotted border with a "Drag & Drop Media" icon.
    *   **Hover:** Border transitions to a solid cyan glow; background opacity increases.
    *   **Selected:** Displays the thumbnail of the image/video or a waveform for audio.

### 3. The "Scanning" Matrix (Processing State)
*   **Animation:** A horizontal "laser line" scans up and down the media preview.
*   **Micro-logs:** Small, fast-scrolling text snippets like `[SYSTEM] Analyzing FFT patterns...`, `[SYSTEM] Checking face mesh symmetry...` to give a "pro" feel.

### 4. The "Verdict" Dashboard (Results)
*   **Primary Gauge:** A high-end SVG circular progress bar showing the confidence score.
*   **Reasoning Cards:** Three small glass cards explaining *why* (e.g., "Frequency Anomalies Found", "Temporal Inconsistency").
*   **CTA:** "Download Report" or "Scan Another File".

---

## 🌊 UI/UX Flow (The "Detection Journey")

1.  **Landing:** User is greeted by a high-impact hero section with a "Start Verification" button that scrolls to the upload zone.
2.  **Upload:** Instant preview of the file. Drag-and-drop support.
3.  **Analysis:** The "Scanner" animation keeps the user engaged during the 2-5s processing window.
4.  **Reveal:** A staggered animation reveals the result:
    *   Sound effect (subtle UI click).
    *   Verdict text fades in.
    *   Confidence bar animates from 0% to the target value.
    *   Explanation points slide in one by one.

---

## 🛠️ Technical Strategy (Vanilla JS + Modern CSS)

*   **CSS Custom Properties:** All design tokens (colors, spacing, blur levels) will be stored in `:root`.
*   **Flexbox/Grid:** For a perfectly responsive layout that works on desktop, tablet, and mobile.
*   **SVG Filters:** Used for subtle grain/noise effects to enhance the "premium" feel of the dark background.
*   **Animation Library:** Simple CSS Keyframes for lightweight, high-quality motions.

---

## 🚀 SEO & Performance
*   **Fast LCP:** Critical CSS inlined.
*   **Semantic HTML:** Using `<section>`, `<article>`, `<header>` properly.
*   **ARIA Labels:** Ensuring the confidence scores and status updates are readable by screen readers.
*   **Meta Tags:** OpenGraph and Twitter cards for social sharing.

> [!IMPORTANT]
> This plan focuses on **perceived value**. By adding "fake" micro-logs and high-end animations, we elevate a functional tool into a premium-feeling security product.
