# Student Performance Prediction System - Frontend

Modern, high-performance web application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Axios**, and **Recharts**.

---

## 🎨 Technology Stack & Features

- **Framework**: React 19 & TypeScript 5
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Glassmorphism Design Token System
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Donuts, Bar Charts, Scatter Plots, Heatmaps)
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM 6

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── assets/         # Static visual assets
│   ├── components/     # Reusable UI elements (Navbar, Sidebar, MetricCard, FileUploadModal)
│   ├── pages/          # Application views (Dashboard, Dataset, Model Training, Predictor, History, Reports)
│   ├── charts/         # Recharts wrappers (Bar, Pie, Line, Scatter, Confusion Matrix, Feature Importance)
│   ├── services/       # Axios API client & endpoints wrappers (dataset, ML, prediction, dashboard)
│   ├── types/          # TypeScript interfaces (StudentFeatures, ModelDetail, etc.)
│   ├── utils/          # Formatting helpers (percentages, file sizes, category colors)
│   ├── App.tsx         # Main React router & layout component
│   ├── main.tsx        # React 19 client entry mount
│   └── index.css       # Global Tailwind CSS & glassmorphism styles
├── package.json        # Dependencies & npm scripts
├── vite.config.ts      # Vite configuration & backend proxy setup
├── tailwind.config.js  # Tailwind CSS theme configuration
└── tsconfig.json       # TypeScript compiler settings
```

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open browser at: `http://localhost:5173`

---

## 📊 Pages & Capabilities

1. **Dashboard (`/`)**: Real-time metric cards, student academic averages, category distributions, and algorithm comparison charts.
2. **Dataset Overview (`/dataset`)**: CSV upload drag-and-drop zone, sample data table previews, missing value statistics, and auto-cleaning controls.
3. **Model Training (`/models`)**: Checkbox selection for 6 ML algorithms, hyperparameter controls, multi-model evaluation table, 2D confusion matrix grid, and feature importances.
4. **Performance Predictor (`/predict`)**: Real-time form for 12 student features, single-click ML inference, and category confidence probability bars.
5. **Prediction History (`/history`)**: Filterable audit trail table listing past student inferences.
6. **Project Reports (`/reports`)**: Complete academic documentation sections (Abstract, Architecture, Results Table, Future Scope).
