# DataDup Guard — Duplicate-Safe Incremental Merge Diagnostics & Repair Platform
**Capstone Project DEAI-10 | B.Tech Artificial Intelligence & Data Science**

DataDup Guard is a data-engineering diagnostics platform designed to detect duplicate records in datasets, analyze root cause drivers in data ingestion pipelines (such as repeated batch processing or un-deduplicated MERGE INTO keys), and recommend safe, non-destructive actions (`KEEP`, `MERGE`, `QUARANTINE`) without blindly deleting records.

---

## 🏛️ System Architecture

```text
                         DATA DUP GUARD
                               |
         +---------------------+---------------------+
         |                                           |
   React Frontend                             FastAPI Backend
(src/App.jsx & pages/)                      (backend/app.py)
         |                                           |
         |                   +-----------------------+-----------------------+
         |                   |                                               |
         |         Data Processing Engine                               AI Assistant
         |       (PySpark / Pandas Engine)                          (POST /api/v1/ai/chat &
         |                   |                                     src/components/AIAssistant.jsx)
         |     +-------------+-------------+                                 |
         |     |             |             |                                 |
         | Profiling     Duplicate     Root-Cause                            |
         | (/profile)    Detection      Analysis                             |
         |              (/duplicates) (/root-causes)                         |
         |     |             |             |                                 |
         +-----+-------------+-------------+---------------------------------+
                             |
                      Results / Reports
                        (/reports)
```

---

## 🚀 Quick Start Guide

### 1. Frontend Setup (React + Vite + Tailwind CSS)

```bash
# 1. Install dependencies
npm install

# 2. Start the frontend dev server
npm run dev
```
The React frontend will be available at: **`http://localhost:5173/`**

### 2. Backend Setup (Python FastAPI & PySpark Service)

```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt
# (fastapi, uvicorn, pandas, python-multipart, mysql-connector-python, openpyxl)

# 2. Start the Python backend server
python backend/app.py
```
The FastAPI backend REST API will be available at: **`http://127.0.0.1:8000/`**

> **Note:** If the Python backend is offline, the React frontend automatically operates in **Demo / Mock Mode** with pre-packaged synthetic datasets, ensuring 100% reliable offline review.

---

## 📂 Folder Structure

```text
d:/KLU/4-1/Capstone/DataDup/
├── backend/                  # Python PySpark & FastAPI Backend Service
│   ├── app.py                # Main FastAPI REST API server & AI endpoints (supports up to 200MB streaming uploads)
│   ├── analysis_engine.py    # Evidence-based Root Cause Classification Engine
│   ├── database.py           # MySQL database manager with resilient local SQLite fallback
│   ├── requirements.txt      # Python dependencies including openpyxl and mysql-connector-python
│   ├── test_analysis_engine.py # Automated test suite (12 tests)
│   └── uploads/              # Ingested dataset file storage directory
├── src/
│   ├── components/           # Reusable UI Components
│   │   ├── AIAssistant.jsx   # Interactive AI Assistant Drawer Widget
│   │   ├── EmptyState.jsx    # Empty state guidance component
│   │   ├── FileUploader.jsx  # Drag-and-drop CSV/Excel uploader supporting up to 200MB
│   │   ├── Header.jsx        # Top navigation header & backend status badge
│   │   ├── Sidebar.jsx       # Section navigation menu
│   │   ├── StatCard.jsx      # Summary metrics card component
│   │   ├── StatusBadge.jsx   # Color-coded KEEP / MERGE / QUARANTINE badges
│   │   └── Table.jsx         # Searchable table with key column highlighting
│   ├── context/
│   │   └── DatasetContext.jsx# Centralized React state & workflow context
│   ├── pages/
│   │   ├── UploadPage.jsx    # Dataset file upload & sample dataset loader
│   │   ├── OverviewPage.jsx  # Summary metrics & analysis overview
│   │   ├── ProfilePage.jsx   # Schema profile, null distribution & data preview
│   │   ├── DuplicateAnalysisPage.jsx # Group detection & record inspector
│   │   ├── RootCausePage.jsx # 5 root cause diagnostic cause categories & evidence
│   │   └── ReportsPage.jsx   # Audit report, before/after metrics & JSON download
│   ├── services/
│   │   ├── api.js           # Low-level HTTP client with VITE_API_BASE_URL
│   │   ├── datasetService.js# Service layer API abstraction functions
│   │   └── mockData.js      # Synthetic incremental e-commerce dataset
│   ├── utils/
│   │   ├── fileParser.js    # Browser-side CSV & Excel parsing fallback (supports up to 200MB)
│   │   ├── formatters.js    # Number, percentage, byte size formatters
│   │   └── rootCauseEngine.js # Client-side mirror of root cause diagnostics
│   ├── App.jsx               # Application layout shell & view switcher
│   ├── index.css             # Tailwind directives & dark theme base styles
│   └── main.jsx              # React application entry point
├── vite.config.js            # Vite configuration with tailwindcss & allowedHosts
├── package.json              # Frontend npm dependencies
└── README.md                 # Project documentation & execution guide
```

---

## ✨ Features Implemented

1. **High-Capacity Dataset Ingestion (Up to 200MB):** Drag-and-drop CSV & Excel (`.csv`, `.xlsx`, `.xls`) upload supporting files up to 200MB with memory-efficient 1MB chunked streaming, browser validation, and automatic 413 size-limit enforcement.
2. **Excel Engine Support:** Integrated `openpyxl` engine on the backend and SheetJS fallback on the frontend to parse Excel spreadsheets up to 200MB seamlessly.
3. **Dataset Profiling:** Schema data types, null percentage bars, completeness score, uniqueness score, and searchable preview table.
4. **Duplicate Detection & Record Inspector:** Categorization into Exact, Key-Based, and Potential duplicates with amber-highlighted key matching columns.
5. **Root-Cause Diagnostic Engine:** 5 pipeline cause categories (*Repeated Batch Ingestion*, *Incorrect Merge Keys*, *Join Fanout*, *Late-Arriving Records*, *Source Duplicates*) with empirical evidence & confidence scores.
6. **Non-Destructive Recommendations:** Clear `KEEP`, `MERGE`, `QUARANTINE` strategy for every duplicate group without deleting records.
7. **DataDup AI Assistant:** Interactive AI assistant drawer providing instant diagnostic guidance and Delta Lake MERGE key help.
8. **Audit & Reconciliation Reports:** Before-and-after simulation metrics and Download Report (JSON) export.
