import React, { useState, useRef, useEffect } from "react";
import { Activity, Play, RefreshCw, Box, Loader } from "lucide-react";
import { FileUploader } from "./components/FileUploader";
import { ConfigPanel } from "./components/ConfigPanel";
import { LogPanel } from "./components/LogPanel";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { CsvFile, ComparisonConfig, LogEntry, ComparisonResult } from "./types";
import { runComparison } from "./services/csvService";

const App: React.FC = () => {
  const [fileA, setFileA] = useState<CsvFile | null>(null);
  const [fileB, setFileB] = useState<CsvFile | null>(null);

  const [config, setConfig] = useState<ComparisonConfig>({
    keyMappings: [],
    rules: {
      trimWhitespace: true,

      // Source A Defaults
      removeLeadingZerosA: true,
      removeLeadingZerosFieldsA: ["DOC_NUMBER"],
      normalizeDatesA: true,
      dateFieldsA: [],

      // Source B Defaults
      removeLeadingZerosB: true,
      removeLeadingZerosFieldsB: [],
      normalizeDatesB: true,
      dateFieldsB: [],
    },
  });

  // Ref to track the latest config state to avoid stale closures in setTimeout
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const addLog = (level: LogEntry["level"], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36),
        timestamp: new Date().toISOString(),
        level,
        message,
      },
    ]);
  };

  const handleRun = async () => {
    if (!fileA || !fileB) {
      addLog("error", "Both source files must be loaded.");
      return;
    }
    if (config.keyMappings.length === 0) {
      addLog("error", "At least one key mapping is required.");
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);
    const startTime = performance.now();
    setLogs([]); // Reset logs for the new run
    setResult(null); // Reset previous results
    addLog("info", "Initializing comparison engine...");

    // Small timeout to allow UI to render the "processing" state before the heavy sync operation
    setTimeout(() => {
      try {
        // CRITICAL FIX: Use configRef.current to get the FRESH configuration
        const currentConfig = configRef.current;
        const res = runComparison(fileA, fileB, currentConfig, addLog);
        setResult(res);
      } catch (e: any) {
        addLog("error", `Critical Failure: ${e.message}`);
      } finally {
        setIsProcessing(false);
        const endTime = performance.now();
        const elapsed = endTime - startTime;
        if (elapsed < 1000) {
          setTimeout(() => setIsLoading(false), 1000 - elapsed);
        } else {
          setIsLoading(false);
        }
      }
    }, 100);
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setResult(null);
    setLogs([]);
    setConfig((prev) => ({
      ...prev,
      keyMappings: [],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Data Compare
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Top Grid: Inputs & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-8 space-y-6">
            {/* File Input Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-slate-500" /> Source Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploader
                  label="Primary Source (Source A)"
                  file={fileA}
                  onFileLoaded={(f) => {
                    setFileA(f);
                    addLog("info", `Loaded Source A: ${f.name}`);
                  }}
                  color="blue"
                />
                <FileUploader
                  label="Secondary Source (Source B)"
                  file={fileB}
                  onFileLoaded={(f) => {
                    setFileB(f);
                    addLog("info", `Loaded Source B: ${f.name}`);
                  }}
                  color="indigo"
                />
              </div>
            </div>

            {/* Config Panel (Only visible if files loaded) */}
            {fileA && fileB && (
              <ConfigPanel
                fileA={fileA}
                fileB={fileB}
                config={config}
                setConfig={setConfig}
              />
            )}

            {/* Action Bar */}
            <div className="flex justify-end">
              <button
                onClick={handleRun}
                disabled={!fileA || !fileB || isProcessing}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-200 flex items-center gap-3 transition-all
                  ${
                    !fileA || !fileB
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                  }
                `}
              >
                <Play className="w-5 h-5 fill-current" /> Run Comparison
              </button>
            </div>
          </div>

          {/* Right Column: Status Log */}
          <div className="lg:col-span-4 h-[500px] lg:h-auto">
            <LogPanel logs={logs} />
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Execution Results
            </h2>
            <ResultsDashboard results={result} />
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-semibold text-slate-800">
                Processing...
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
