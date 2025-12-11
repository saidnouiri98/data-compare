# Data Compare

A React-based CSV comparison tool that allows users to upload two CSV files, configure comparison parameters, and analyze differences between datasets. The application identifies matching records, missing entries, and provides visual dashboards for results.

## Programming Languages and Frameworks

- **Primary Language**: TypeScript
- **UI Framework**: React 19.2.1
- **Build Tool**: Vite 6.2.0
- **CSV Parsing**: PapaParse 5.5.3
- **Charting Library**: Recharts 3.5.1
- **Date Handling**: date-fns 4.1.0
- **Icons**: Lucide React 0.559.0
- **Styling**: Tailwind CSS (via inline classes)

## Project Architecture Overview

The application follows a modular React architecture:

- **Components** (`/components`):

  - `FileUploader`: Handles CSV file uploads with drag-and-drop functionality
  - `ConfigPanel`: Configuration interface for key mappings and comparison rules
  - `LogPanel`: Real-time logging of comparison operations
  - `ResultsDashboard`: Visual display of comparison results with charts and statistics

- **Services** (`/services`):

  - `csvService`: Core business logic for CSV parsing, data normalization, and comparison operations

- **Types** (`types.ts`): TypeScript interfaces for data structures (CsvFile, ComparisonConfig, etc.)

- **Main Application** (`App.tsx`): Orchestrates the UI components and manages application state

The architecture separates UI concerns from business logic, with services handling data processing and components managing user interactions.

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Installation and Setup

1. Clone or download the project repository
2. Navigate to the project directory
3. Install dependencies:

   ```bash
   npm install
   ```

## How to Run the Project

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Serve the production build locally for testing:

```bash
npm run preview
```

## Usage Instructions

1. **Upload Source Files**:

   - Click or drag CSV files into the "Primary Source (Source A)" and "Secondary Source (Source B)" areas
   - The application supports standard CSV format with headers

2. **Configure Comparison**:

   - **Key Mappings**: Define how records from both sources should be matched (e.g., map "ID" from Source A to "CustomerID" from Source B)
   - **Comparison Rules**:
     - Trim whitespace from values
     - Remove leading zeros from specific fields
     - Normalize date formats for specified fields

3. **Run Comparison**:

   - Click the "Run Comparison" button
   - Monitor progress in the log panel
   - View results in the dashboard below

4. **Analyze Results**:

   - **Statistics**: Overview of total records, matches, and differences
   - **Charts**: Visual representation of comparison results
   - **Download Options**: Export missing records as CSV files

5. **Reset**: Use the "Reset" button to clear all data and start over

## Environment Variables

No environment variables are required for this application. All configuration is handled through the UI.
