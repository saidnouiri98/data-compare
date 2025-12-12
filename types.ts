export interface CsvFile {
  name: string;
  data: any[];
  headers: string[];
  size: number;
}

export interface KeyMapping {
  id: string;
  fieldA: string;
  fieldB: string;
}

export interface NormalizationRules {
  trimWhitespace: boolean;

  // Source A Rules
  removeLeadingZerosA: boolean;
  removeLeadingZerosFieldsA: string[];
  normalizeDatesA: boolean;
  dateFieldsA: string[];

  // Source B Rules
  removeLeadingZerosB: boolean;
  removeLeadingZerosFieldsB: string[];
  normalizeDatesB: boolean;
  dateFieldsB: string[];
}

export interface ComparisonConfig {
  keyMappings: KeyMapping[];
  rules: NormalizationRules;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  message: string;
}

export interface ComparisonStats {
  totalA: number;
  totalB: number;
  validUniqueA: number;
  validUniqueB: number;
  duplicatesA: number;
  duplicatesB: number;
  missingInB: number; // Present in A, missing in B
  missingInA: number; // Present in B, missing in A
  matched: number;
}

export interface DuplicateEntry {
  row: any;
  count: number;
}

export interface ComparisonResult {
  stats: ComparisonStats;
  rowsMissingInB: any[];
  rowsMissingInA: any[];
  duplicatedRowsA: DuplicateEntry[];
  duplicatedRowsB: DuplicateEntry[];
  timestamp: string;
  sourceAName: string;
  sourceBName: string;
}
