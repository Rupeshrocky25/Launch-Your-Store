# Launch-Your-Store — No-Code Multi-Tenant E-Commerce Website Builder

> **Hackathon Submission**: A production-grade, full-stack, multi-tenant e-commerce website builder tailored for small businesses, artisan makers, and indie retailers. Complete with phone-number OTP authentication, 4 distinctive commercial themes, unique storefront URLs, server-validated inventory integrity, and real-data AI store analytics powered by Google Gemini.

---

## 🏛️ Architecture Overview

```
                                +---------------------------+
                                |    Browser / Client SPA   |
                                | React 19 + Tailwind CSS   |
                                +-------------+-------------+
                                              |
                          REST API & Sessions | (x-user-id header)
                                              v
+-----------------------------------------------------------------------------------+
|                            Full-Stack Express Server (server.ts)                  |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | Phone OTP Service  |   | Multi-Tenant Engine |   |  Atomic Inventory Guard  |  |
|  | - Single Phone/Role|   | - Storefront Routing|   |  - Server-calculated Tax |  |
|  | - Rate-limited     |   | - Tenant Isolation  |   |  - Safe Restock on Cancel|  |
|  +--------------------+   +---------------------+   +--------------------------+  |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | CSV Import Service |   | 4-Theme Renderer    |   | Gemini AI Store Analyst  |  |
|  | - Header Detection |   | - Modern Minimal    |   | - Typed Read-only Queries|  |
|  | - Row Error Log    |   | - Bold Commerce     |   | - Zero Hallucination     |  |
|  | - Safe Execution   |   | - Elegant Boutique  |   | - Telemetry & Fallback   |  |
|  +--------------------+   | - Fresh Market      |   +--------------------------+  |
|                           +---------------------+                                 |
+-------------------------------------+---------------------------------------------+
                                      |
                     Persistent Data  | Disk / PostgreSQL
                                      v
+-----------------------------------------------------------------------------------+
|                         Persistent Storage & Database                             |
|  - .data/store_db.json (Runtime Embedded Engine with Atomic Write-locks)          |
|  - supabase/migrations/20261009_initial_schema.sql (Production Supabase Schema)   |
|  - Multi-tenant Row Level Security (RLS) & Foreign Key Constraints               |
+-----------------------------------------------------------------------------------+
```

---

## 🎯 15 Hackathon Mandatory Checkpoints

| # | Checkpoint Requirement | Implementation Location | Status |
|---|------------------------|-------------------------|:------:|
| 1 | **Validated store-onboarding wizard** | `src/components/onboarding/OnboardingWizard.tsx` (5 Steps: Business details, categories, products, theme, publish) | **PASS** |
| 2 | **Predefined and custom categories** | `src/server/db.ts`, `src/components/onboarding/OnboardingWizard.tsx` (Global + store custom categories) | **PASS** |
| 3 | **Realistic sample-product import** | `src/server/sample-catalog.ts`, `POST /api/products/sample-import` | **PASS** |
| 4 | **CSV/XLSX upload with templates & row errors** | `src/server/csv-import.ts`, `GET /api/import/template`, `POST /api/import/preview` | **PASS** |
| 5 | **Four distinct themes with live previews** | Modern Minimal, Bold Commerce, Elegant Boutique, Fresh Market in `StorefrontRenderer.tsx` | **PASS** |
| 6 | **Unique, working storefront URLs** | `/store/:slug` and hash routes `#store-artisan-roastery`, `#store-khadi-craft`, etc. | **PASS** |
| 7 | **Complete storefront with search, filters, cart, checkout** | `StorefrontRenderer.tsx`, `CartDrawer.tsx`, `CheckoutModal.tsx` | **PASS** |
| 8 | **Seller dashboard with revenue, orders, low stock, activity** | `ShopkeeperDashboard.tsx`, `GET /api/analytics/:storeId` | **PASS** |
| 9 | **Full content customization** | Custom logo, banner, announcement bar, typography, and palette switcher in `ShopkeeperDashboard.tsx` | **PASS** |
| 10 | **Product, inventory, variant, discount & bulk management** | Product CRUD, SKU uniqueness, low stock indicators, variants support | **PASS** |
| 11 | **Order management & customer-visible status updates** | PENDING -> PROCESSING -> SHIPPED -> DELIVERED -> CANCELLED with inventory restore | **PASS** |
| 12 | **Multi-tenant isolation & role-based permissions** | Strict tenant authorization in `server.ts`, RLS in `supabase/migrations/` | **PASS** |
| 13 | **Real-data AI analytics assistant** | `@google/genai` with `gemini-3.8-flash` in `src/server/ai-analytics.ts` | **PASS** |
| 14 | **Read-only AI safety, evidence-backed answers, honest missing data** | Strict read-only verified metric inputs, metric definitions, and deterministic fallback | **PASS** |
| 15 | **Responsive UI for onboarding, storefronts, dashboards** | Mobile (360px), tablet (768px), desktop (1440px) fluid layouts via Tailwind CSS | **PASS** |

---

## 🎬 3-Minute Hackathon Demo Script

### Minute 1: Dual Role Landing Page & Store Discovery
1. **Landing Page**: Observe the clean brand identity for **Launch-Your-Store**. Note the two prominent cards: **"Continue as Customer"** and **"Continue as Shopkeeper"**.
2. **Customer Journey**: Click **"Continue as Customer"**. Browse the curated Marketplace, search products ("Coffee", "Saree", "Honey"), filter by category.
3. **Cart & Atomic Stock Checkout**: Open a product, click **"Add to Cart"**, inspect the free shipping progress bar, proceed to checkout with demo payment, and observe the instant order placement with generated order number (`ORD-XXXX`).

### Minute 2: 5-Step Shopkeeper Onboarding & 4 Commercial Themes
1. Click **"Start Free Store"** or **"Continue as Shopkeeper"**.
2. Complete the 5-step wizard:
   - **Step 1**: Enter store name (`Terra Bloom Botanicals`), slug (`terra-bloom`), entity type, and contact info.
   - **Step 2**: Select categories (Wellness & Beauty, Organic Grocery) and add a custom category.
   - **Step 3**: Click **"1-Click Realistic Samples"** to populate realistic goods with images and variants.
   - **Step 4**: Preview the 4 themes (**Modern Minimal**, **Bold Commerce**, **Elegant Boutique**, **Fresh Market**).
   - **Step 5**: Click **"Publish Store Now"** to generate the unique storefront URL `/store/terra-bloom`.

### Minute 3: Seller Dashboard, Order Fulfillment & Gemini AI Analyst
1. Enter the **Shopkeeper Dashboard**.
2. **Overview**: Observe real calculated revenue (₹2,110+), order counts, and low-stock alerts.
3. **Orders**: Open a pending order, update status to `PROCESSING` or `SHIPPED` with a dispatch note, and inspect the customer-visible timeline.
4. **AI Assistant**: Click the **AI Business Analyst** tab. Ask: *"What are my top selling products this month?"* or *"Which products are low on stock?"*. Observe the synthesized, evidence-backed answer citing verified numbers directly from the database!

---

## 🚀 Deployment Guide (Vercel & Supabase)

### Vercel Deployment
1. Import this repository into Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. The included `vercel.json` automatically routes API endpoints and SPA routes.
5. Set environment variable: `GEMINI_API_KEY` in Vercel Project Settings.

### Supabase Setup
1. Create a project in [Supabase](https://supabase.com).
2. Run `supabase/migrations/20261009_initial_schema.sql` in the SQL Editor to provision tables, indexes, and Row Level Security policies.
