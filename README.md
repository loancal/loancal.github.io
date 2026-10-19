# LoanCal | Free Secure Loan & EMI Calculator

[![Deployment](https://github.com/loancal/loancal.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/loancal/loancal.github.io/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Support on Ko-fi](https://img.shields.io/badge/Support-Ko--fi-ff5e5b.svg)](https://ko-fi.com/kishara)

A 100% client-side, zero-server financial loan and EMI calculator built with **Astro (SSG)**, **React (Islands Architecture)**, and **Tailwind CSS**. Engineered for instantaneous mathematical feedback, deep privacy, and maximum technical SEO.

🌐 **Live URL**: [https://loancal.github.io](https://loancal.github.io)  
☕ **Developer Support**: [https://ko-fi.com/kishara](https://ko-fi.com/kishara)

---

## 🌟 Key Highlights

- **🔒 100% Client-Side Privacy**: All mathematical calculations execute locally within the browser. Zero financial data, cookies, or telemetry ever leave your device or touch a server.
- **⚡ Zero-Latency Real-Time Math**: Standard EMI (Equated Monthly Installment) equations compute on every keystroke or slider shift with sub-millisecond precision.
- **📊 Interactive Amortization Engine**:
  - Dynamically computes and renders both **Annual** and **Monthly** payoff schedules.
  - Interactive SVG visualizer displaying Principal vs. Interest breakdown ratios.
  - One-click **CSV Export** for Microsoft Excel, Apple Numbers, and Google Sheets.
  - One-click **Printer-Friendly Amortization Sheet** format.
- **🌍 Full Multilingual & i18n Subpath Routing**:
  - Native static dynamic routing for **6 locales**:
    - English (`/`)
    - Español (`/es/`)
    - Português (`/pt/`)
    - Deutsch (`/de/`)
    - Français (`/fr/`)
    - 日本語 (`/ja/`)
- **🔍 Technical SEO Architecture**:
  - OpenGraph integration with mandatory `<meta property="og:site_name" content="LoanCal" />`.
  - Dynamic native JSON-LD structured data injection (`WebSite`, `WebApplication`, `SoftwareApplication` / `FinancialApplication`, and `FAQPage`).
  - Hreflang alternate tags for all 6 locales with `x-default`.
- **🎨 Strict Financial Trust Color Palette**:
  - `#B7C4CF` (Soft Slate / Powder Blue Accent)
  - `#EEE3CB` (Warm Cream Canvas Light Background)
  - `#D7C0AE` (Warm Sand Card Surface)
  - `#967E76` (Muted Mocha Text & Dark Canvas)
  - Instant light/dark theme switcher with zero flash of unstyled content (FOUC).

---

## 🧮 Mathematical Formula

The standard Equated Monthly Installment (EMI) formula applied:

$$E = \frac{P \times r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
- **$P$**: Principal loan amount
- **$r$**: Periodic monthly interest rate ($\text{Annual Rate} \div 12 \div 100$)
- **$n$**: Total loan duration in months ($\text{Years} \times 12$)

---

## 🛠️ Tech Stack

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation)
- **UI Islands**: [React 19](https://react.dev/) (`client:load` Islands)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [GitHub Pages](https://pages.github.com/) via GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation

```bash
# Clone the repository
git clone https://github.com/loancal/loancal.github.io.git
cd loancal.github.io

# Install dependencies
npm install
```

### Local Development

```bash
npm run dev
```

Visit `http://localhost:4321` in your browser.

### Production Build

```bash
npm run build
```

The static site will be compiled into the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🤝 Support the Developer

If LoanCal helped you plan your mortgage, car loan, or personal financing, consider buying a coffee to keep this utility free, independent, and ad-free:

👉 **[ko-fi.com/kishara](https://ko-fi.com/kishara)**

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
