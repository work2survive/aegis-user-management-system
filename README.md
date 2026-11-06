# Aegis Identity — User & Hierarchy Management System (CZ / SK)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://work2survive.github.io/aegis-user-management-system/)
[![Vanilla Web](https://img.shields.io/badge/Tech-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-orange.svg)](#technical-architecture)

> **Live Interactive Preview**: [https://work2survive.github.io/aegis-user-management-system/](https://work2survive.github.io/aegis-user-management-system/)

An elegant, minimalistic, and fully customizable User & Role Management simulator engineered specifically for educational and enterprise hierarchies across the **Czech Republic** (🇨🇿) and **Slovakia** (🇸🇰).

---

## 🌟 Core Feature Overview

### 1. Mandatory Unified Phone Numbers (Rule 0.0)
- Enforces standardized international format including national area code:
  - **Czech Republic**: `+420 XXX XXX XXX`
  - **Slovak Republic**: `+421 XXX XXX XXX`
- Real-time input masking automatically standardizes spacing and rejects invalid formats.
- Enforced on manual creation, user updates, and CSV/XLS roster imports.

### 2. Granular Role & Group Management (Rules 1.0 – 1.1)
- **Granular Capabilities**: Group creation, renaming, editing, disabling, and deletion.
- **Duplicate Privilege Detection**: Prevents creating or modifying groups with identical privilege configurations to prevent security policy redundancy.
- **Smart Auto-Naming & Codename Generator**: Generates human-readable names and military-grade codenames (e.g., `NEXUS-OMNI`, `FACULTY-LEAD-742`, `VANGUARD-ALERT-519`) based on granted capabilities.
- **Scope-Constrained Group Browsing**: Users only see groups operating within their authorized geographical or institutional purview.

### 3. User Management with Scope Enforcement (Rules 2.0 – 2.1)
- Supports granular capabilities: Create, Edit, Disable, and Delete users.
- **Multi-Level Scope Boundaries**: Restricts user visibility and administrative authority based on:
  - **Country** (`CZ` / `SK` / `ALL`)
  - **Region** (16 Czech & Slovak territorial regions)
  - **Organization** (Universities, Gymnasiums, Academies, Regional Authorities)
  - **Sub-Organization** (Faculties, Departments, Sections)
- **Rule 3.1 Bulk Operations**: Select multiple users to batch-update status (Active, Inactive, Suspended), reassign groups, or move across institutions.
- **Rule 3.2 CSV / XLS Ingestion**: Drag-and-drop batch upload with row-by-row phone validation, format error detection, and pre-formatted CSV template download.

### 4. Institutional & Geographic Hierarchy (Rules 4.0 – 4.2)
- Tree and card browser mapping national administrative structures:
  - **Countries**: Czech Republic 🇨🇿, Slovakia 🇸🇰
  - **16 Regions**: Hlavní město Praha, Jihomoravský, Bratislavský, Košický, etc.
  - **15 Organizations**: Charles University (CUNI), Czech Technical University (CVUT), Comenius University (UNIBA), Slovak Technical University (STUBA), etc.
  - **22 Sub-Organizations**: MFF, FEL, FIT, FMFI, FIIT, etc.
- Granular capability checks for Add, Edit, Disable, and Remove operations at each tier.

### 5. Privacy Protection & Password Lifecycle (Rules 6.0 – 6.7)
- **Privacy Shields**: Sensitive personal records (phone number, national ID / rodné číslo, home address, emergency contacts) are masked as `••••••••••••• [Restricted]` unless the user has `view_others_personal` privileges.
- **Rule 6.5 – 6.6 Password Modes**:
  - **Custom Password**: Evaluated with a real-time entropy and complexity strength meter.
  - **Cryptographic Generator**: One-click 16-character alphanumeric password generation with clipboard copy.
- **Rule 6.7 Forgotten Password Recovery**: Simulated OTP verification dispatched via RCS/SMS to the user's mandatory phone number.

### 6. RCS Business Messaging Studio (Rules 7.0 – 8.0)
- **10 Standardized RCS Categories**:
  1. Emergency Alert (Critical)
  2. Security & OTP Verification (Security)
  3. System Notification (System)
  4. Attendance Reminder (Operations)
  5. Grade & Report Update (Academic)
  6. Schedule & Calendar Notice (Academic)
  7. Administrative Memo (Administrative)
  8. Billing & Fee Notice (Finance)
  9. Event Invitation (Events)
  10. General Broadcast (General)
- **Trigger Privileges**: Enforces that only authorized groups can dispatch messages, restricted to their permitted subset of categories (minimum 1 required).
- **Receive Privileges**: Only groups with verified receive permissions can be targeted.
- **Smartphone Device Simulator**: Live phone preview rendering rich cards, carrier verified sender checkmarks, and deep-link action buttons.

### 7. Floating Testing Simulator ("FOR TESTING PURPOSES ONLY")
- **Distinct Visual Code**: Amber/warning theme with grab-handle bar.
- **Fully Draggable**: Smooth mouse & touch dragging across the entire screen.
- **Minimizable & Dockable**: Collapses into a floating pill dock (`🧪 Testing Simulator`).
- **God Mode Button (👁️⃤)**: Eye of Providence icon to instantly restore the unrestricted Super Administrator session.
- **Persona Switcher**: Filter 300 Czech and Slovak users by Country, Group, or Organization, or click **"Pick Random User"** to test scoped UI restrictions from any role's perspective.

### 8. Dynamic Rebranding & Theme Customizer
- **Curated Color Palettes**: Nordic Slate, Obsidian Minimal, Alpine Emerald, Oceanic Azure, Warm Terracotta, Royal Amethyst.
- **Custom Color Picker**: Real-time HSL color tokens applied dynamically.
- **Typography Switching**: Google Fonts integration (`Inter`, `Plus Jakarta Sans`, `Outfit`, `Space Grotesk`, `System Default`).
- **Corner Radii Geometry**: Sharp (0px), Subtle (6px), Smooth (10px), Pill (20px).
- **Dark & Light Mode**: Complete theme contrast switching.

---

## 🏗️ Technical Architecture

This project is built purely with standards-compliant modern web technologies:
- **Markup**: Semantic HTML5 with accessibility attributes and modular dialog overlays.
- **Styling**: Pure CSS3 utilizing CSS Custom Properties (`--primary`, `--bg-app`, `--border-color`, `--radius-md`). Zero heavy runtime frameworks.
- **Logic**: Vanilla ES6+ JavaScript organized in modular state controllers, data normalizers, and DOM render pipelines.
- **Persistence**: Real-time synchronization to browser `localStorage` ensuring testing mutations persist across browser sessions.

```
├── index.html           # Main semantic user interface, modals, and preview phone
├── styles.css           # Design tokens, themes, animations, and draggable panel styles
├── data.js              # Initial database (300 CZ/SK users, 20 groups, 53 hierarchy nodes)
├── app.js               # Application engine, privilege rules, scope logic, and event handlers
├── generate_data.py     # Python script to reproduce/extend the authentic dataset
└── .github/workflows/   # Automated GitHub Pages CI/CD deployment
```

---

## 🚀 Running Locally

Clone the repository and launch any local web server:

```bash
# Clone repository
git clone https://github.com/work2survive/aegis-user-management-system.git
cd aegis-user-management-system

# Option 1: Python 3
python3 -m http.server 8080

# Option 2: Node.js (npx)
npx serve -l 8080 .
```

Open `http://localhost:8080` in your web browser.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
