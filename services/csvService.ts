import Papa from "papaparse";
import { parse, format, isValid } from "date-fns";
import {
  ComparisonConfig,
  ComparisonResult,
  CsvFile,
  LogEntry,
} from "../types";

export const parseCSV = (file: File): Promise<CsvFile> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && !results.data.length) {
          reject(
            new Error("Failed to parse CSV: " + results.errors[0].message)
          );
          return;
        }
        resolve({
          name: file.name,
          data: results.data,
          headers: results.meta.fields || [],
          size: file.size,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const normalizeValue = (
  value: any,
  fieldName: string,
  config: ComparisonConfig,
  isSourceA: boolean
): string => {
  let valStr = String(value || "").trim();

  // 1. Trim Whitespace (Global Rule)
  if (config.rules.trimWhitespace) {
    valStr = valStr.replace(/\s+/g, ""); // Remove internal whitespace
  }

  // 2. Remove Leading Zeros (Symmetric logic)
  if (isSourceA) {
    if (
      config.rules.removeLeadingZerosA &&
      config.rules.removeLeadingZerosFieldsA.includes(fieldName)
    ) {
      valStr = valStr.replace(/^0+/, "");
    }
  } else {
    if (
      config.rules.removeLeadingZerosB &&
      config.rules.removeLeadingZerosFieldsB.includes(fieldName)
    ) {
      valStr = valStr.replace(/^0+/, "");
    }
  }

  // 3. Normalize Dates (Symmetric logic)
  const shouldNormalizeDate = isSourceA
    ? config.rules.normalizeDatesA &&
      config.rules.dateFieldsA.includes(fieldName)
    : config.rules.normalizeDatesB &&
      config.rules.dateFieldsB.includes(fieldName);

  if (shouldNormalizeDate) {
    // Attempt parsing with heuristics (Day First preference for business CSVs)

    // Fix for DD-MON-YY format (e.g. 3-DEC-25 or 03-DEC-2025)
    // We normalize casing to Title Case (e.g. DEC -> Dec) because date parsers often expect Title Case for MMM
    if (/^\d{1,2}-[a-zA-Z]{3}-\d{2,4}$/.test(valStr)) {
      valStr = valStr
        .toLowerCase()
        .replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }

    const dateFormats = [
      "d/M/yyyy",
      "dd/MM/yyyy",
      "d-M-yyyy",
      "dd-MM-yyyy",
      "yyyy-MM-dd",
      "yyyy-MM-dd'T'HH:mm:ss",
      "M/d/yyyy",
      "MM/dd/yyyy",
      // Added formats for alphanumeric months
      "d-MMM-yy",
      "dd-MMM-yy",
      "d-MMM-yyyy",
      "dd-MMM-yyyy",
    ];

    let parsedDate: Date | null = null;

    // Try simple native first if ISO
    const simpleDate = new Date(valStr);
    if (
      isValid(simpleDate) &&
      valStr.includes("-") &&
      valStr.length >= 10 &&
      valStr.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      // High confidence if it looks like ISO YYYY-MM-DD
      parsedDate = simpleDate;
    } else {
      // Try specific formats using date-fns
      for (const fmt of dateFormats) {
        const d = parse(valStr, fmt, new Date());
        if (isValid(d)) {
          // Additional check: Ensure the year is reasonable (e.g., between 1900 and 2100)
          // This helps avoid parsing short strings as years (e.g. 1-2-3) if format is ambiguous
          const year = d.getFullYear();
          if (year > 1900 && year < 2100) {
            parsedDate = d;
            break;
          }
        }
      }
    }

    if (parsedDate && isValid(parsedDate)) {
      valStr = format(parsedDate, "yyyy-MM-dd");
    }
  }

  return valStr;
};

// Helper to normalize an entire row object for deduplication
const getNormalizedRow = (
  row: any,
  headers: string[],
  config: ComparisonConfig,
  isSourceA: boolean
) => {
  const normalized: any = {};
  headers.forEach((header) => {
    normalized[header] = normalizeValue(row[header], header, config, isSourceA);
  });
  return normalized;
};

interface ProcessedSource {
  validUniqueRows: any[];
  duplicatesCount: number;
  keyToRowsMap: Map<string, any[]>;
  allKeys: Set<string>;
}

const processSource = (
  file: CsvFile,
  config: ComparisonConfig,
  isSourceA: boolean,
  addLog: (level: LogEntry["level"], msg: string) => void
): ProcessedSource => {
  addLog(
    "info",
    `Processing ${isSourceA ? "Source A" : "Source B"}: ${file.name} (${
      file.data.length
    } rows)...`
  );

  // 1. Deduplicate Exact Rows (Post-Normalization)
  // We use a Map of JSON-stringified row -> row object to handle exact matches
  const uniqueRowsMap = new Map<string, any>();

  file.data.forEach((row, index) => {
    try {
      const normalizedRow = getNormalizedRow(
        row,
        file.headers,
        config,
        isSourceA
      );
      const signature = JSON.stringify(normalizedRow); // Simple signature for uniqueness

      // If signature exists, it's a duplicate row
      if (!uniqueRowsMap.has(signature)) {
        uniqueRowsMap.set(signature, normalizedRow);
      }
    } catch (e) {
      // Skip bad rows
    }
  });

  const validUniqueRows = Array.from(uniqueRowsMap.values());
  const duplicatesCount = file.data.length - validUniqueRows.length;

  if (duplicatesCount > 0) {
    addLog(
      "info",
      `${
        isSourceA ? "Source A" : "Source B"
      }: Removed ${duplicatesCount} duplicate rows.`
    );
  }

  // 2. Map Unique Rows to Comparison Keys
  // One Key might map to multiple unique rows (e.g. if key is ID, but rows differ by Date)
  const keyToRowsMap = new Map<string, any[]>();
  const allKeys = new Set<string>();

  validUniqueRows.forEach((row) => {
    // Build Key
    const keyParts = config.keyMappings.map((mapping) => {
      const fieldName = isSourceA ? mapping.fieldA : mapping.fieldB;
      // Note: Values in 'row' are already normalized
      return row[fieldName];
    });
    const key = keyParts.join("|");

    allKeys.add(key);

    if (!keyToRowsMap.has(key)) {
      keyToRowsMap.set(key, []);
    }
    keyToRowsMap.get(key)!.push(row);
  });

  return {
    validUniqueRows,
    duplicatesCount,
    keyToRowsMap,
    allKeys,
  };
};

export const runComparison = (
  fileA: CsvFile,
  fileB: CsvFile,
  config: ComparisonConfig,
  addLog: (level: LogEntry["level"], msg: string) => void
): ComparisonResult => {
  addLog("info", "Starting reconciliation process...");
  addLog(
    "info",
    `Config Active: Remove Zeros A=[${
      config.rules.removeLeadingZerosA ? "ON" : "OFF"
    }], B=[${config.rules.removeLeadingZerosB ? "ON" : "OFF"}]`
  );

  const startTime = performance.now();

  // Process Both Sources
  const procA = processSource(fileA, config, true, addLog);
  const procB = processSource(fileB, config, false, addLog);

  addLog("info", "Comparing keys...");

  // Identify Missing Keys
  const missingKeysInB: string[] = []; // Keys present in A but not B
  const missingKeysInA: string[] = []; // Keys present in B but not A

  // A missing in B
  procA.allKeys.forEach((key) => {
    if (!procB.allKeys.has(key)) {
      missingKeysInB.push(key);
    }
  });

  // B missing in A
  procB.allKeys.forEach((key) => {
    if (!procA.allKeys.has(key)) {
      missingKeysInA.push(key);
    }
  });

  // Retrieve Rows for Missing Keys
  // Note: Since a key can map to multiple rows (diff dates), we add ALL matching rows
  const rowsMissingInB: any[] = [];
  missingKeysInB.forEach((key) => {
    const rows = procA.keyToRowsMap.get(key);
    if (rows) rowsMissingInB.push(...rows);
  });

  const rowsMissingInA: any[] = [];
  missingKeysInA.forEach((key) => {
    const rows = procB.keyToRowsMap.get(key);
    if (rows) rowsMissingInA.push(...rows);
  });

  const matchedKeysCount = procA.allKeys.size - missingKeysInB.length;
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  addLog("success", `Comparison completed in ${duration}s.`);
  addLog(
    "info",
    `Found ${rowsMissingInB.length} rows in Source A missing from B.`
  );
  addLog(
    "info",
    `Found ${rowsMissingInA.length} rows in Source B missing from A.`
  );

  return {
    timestamp: new Date().toISOString(),
    rowsMissingInB,
    rowsMissingInA,
    sourceAName: fileA.name,
    sourceBName: fileB.name,
    stats: {
      totalA: fileA.data.length,
      totalB: fileB.data.length,
      validUniqueA: procA.validUniqueRows.length,
      validUniqueB: procB.validUniqueRows.length,
      duplicatesA: procA.duplicatesCount,
      duplicatesB: procB.duplicatesCount,
      missingInB: rowsMissingInB.length,
      missingInA: rowsMissingInA.length,
      matched: matchedKeysCount, // Keys matched
    },
  };
};

export const downloadCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data, { delimiter: ";" });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
