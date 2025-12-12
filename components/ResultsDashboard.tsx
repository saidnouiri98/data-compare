import React from "react";
import { ComparisonResult } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { Download, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { downloadCSV } from "../services/csvService";

interface ResultsDashboardProps {
  results: ComparisonResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
}) => {
  const { stats } = results;

  // Dynamic names for the chart legend
  const matchData = [
    { name: "Matched", value: stats.matched },
    { name: `Missing in ${results.sourceBName}`, value: stats.missingInB },
    { name: `Missing in ${results.sourceAName}`, value: stats.missingInA },
  ];

  // Calculate percentage of matched keys against the total union of keys found
  const totalUnion = stats.matched + stats.missingInB + stats.missingInA;
  const matchPercentage =
    totalUnion > 0 ? ((stats.matched / totalUnion) * 100).toFixed(1) : "0.0";

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"]; // Green, Amber, Blue

  const handleDownload = (
    type: "missingInB" | "missingInA" | "duplicatesA" | "duplicatesB"
  ) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Clean extension from filenames for the report name
    const nameA = results.sourceAName.replace(/\.[^/.]+$/, "");
    const nameB = results.sourceBName.replace(/\.[^/.]+$/, "");

    if (type === "missingInB") {
      // Rows present in A but missing in B
      const filename = `${nameA}_missing_in_${nameB}_${timestamp}.csv`;
      downloadCSV(results.rowsMissingInB, filename);
    } else if (type === "missingInA") {
      // Rows present in B but missing in A
      const filename = `${nameB}_missing_in_${nameA}_${timestamp}.csv`;
      downloadCSV(results.rowsMissingInA, filename);
    } else if (type === "duplicatesA") {
      // Duplicated rows in Source A
      const filename = `${nameA}_duplicates_${timestamp}.csv`;
      const dataWithCount = results.duplicatedRowsA.map((entry) => ({
        ...entry.row,
        Count: entry.count,
      }));
      downloadCSV(dataWithCount, filename);
    } else if (type === "duplicatesB") {
      // Duplicated rows in Source B
      const filename = `${nameB}_duplicates_${timestamp}.csv`;
      const dataWithCount = results.duplicatedRowsB.map((entry) => ({
        ...entry.row,
        Count: entry.count,
      }));
      downloadCSV(dataWithCount, filename);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label={`Total Processed (${results.sourceAName})`}
          value={stats.totalA}
          subValue={`${stats.duplicatesA} duplicates removed`}
        />
        <StatCard
          label={`Total Processed (${results.sourceBName})`}
          value={stats.totalB}
          subValue={`${stats.duplicatesB} duplicates removed`}
        />

        {/* Dynamic labels for missing counts */}
        <StatCard
          label={`Missing in ${results.sourceBName}`}
          value={stats.missingInB}
          color="text-amber-600"
        />
        <StatCard
          label={`Missing in ${results.sourceAName}`}
          value={stats.missingInA}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discrepancy Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Reconciliation Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={matchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {matchData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  <Label
                    value={`${matchPercentage}%`}
                    position="center"
                    dy={-5}
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      fill: "#334155",
                    }}
                  />
                  <Label
                    value="Matched"
                    position="center"
                    dy={15}
                    style={{ fontSize: "12px", fill: "#64748b" }}
                  />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions & Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Export Reports
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Download detailed CSV reports of the discrepancies found during
              the reconciliation process.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDownload("missingInB")}
                className="w-full flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-amber-900"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <span className="font-medium block">
                      Missing in {results.sourceBName}
                    </span>
                    <span className="text-xs opacity-75">
                      Rows in {results.sourceAName} but not{" "}
                      {results.sourceBName}
                    </span>
                  </div>
                </div>
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleDownload("missingInA")}
                className="w-full flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-900"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <span className="font-medium block">
                      Missing in {results.sourceAName}
                    </span>
                    <span className="text-xs opacity-75">
                      Rows in {results.sourceBName} but not{" "}
                      {results.sourceAName}
                    </span>
                  </div>
                </div>
                <Download className="w-5 h-5" />
              </button>

              {results.duplicatedRowsA.length > 0 && (
                <button
                  onClick={() => handleDownload("duplicatesA")}
                  className="w-full flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-900"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <span className="font-medium block">
                        Duplicates in {results.sourceAName}
                      </span>
                      <span className="text-xs opacity-75">
                        {results.duplicatedRowsA.length} unique duplicated rows
                      </span>
                    </div>
                  </div>
                  <Download className="w-5 h-5" />
                </button>
              )}

              {results.duplicatedRowsB.length > 0 && (
                <button
                  onClick={() => handleDownload("duplicatesB")}
                  className="w-full flex items-center justify-between p-4 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-indigo-900"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5 text-indigo-600" />
                    <div className="text-left">
                      <span className="font-medium block">
                        Duplicates in {results.sourceBName}
                      </span>
                      <span className="text-xs opacity-75">
                        {results.duplicatedRowsB.length} unique duplicated rows
                      </span>
                    </div>
                  </div>
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {stats.matched > 0 && (
            <div className="mt-6 flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {stats.matched.toLocaleString()} records perfectly matched.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  subValue,
  color = "text-slate-900",
}: {
  label: string;
  value: number;
  subValue?: string;
  color?: string;
}) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
    <p
      className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate"
      title={label}
    >
      {label}
    </p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>
      {value.toLocaleString()}
    </p>
    {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
  </div>
);
