import React from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { CsvFile } from '../types';

interface FileUploaderProps {
  label: string;
  file: CsvFile | null;
  onFileLoaded: (file: CsvFile) => void;
  color?: 'blue' | 'indigo';
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, file, onFileLoaded, color = 'blue' }) => {
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Dynamic import to avoid circular dependencies if we put logic here, 
      // but simpler to pass the logic in or import the service. 
      // Importing service here is fine.
      const { parseCSV } = await import('../services/csvService');
      
      try {
        const result = await parseCSV(selectedFile);
        onFileLoaded(result);
      } catch (err) {
        alert("Error parsing file: " + err);
      }
    }
  };

  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-indigo-500';
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-indigo-50';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-indigo-700';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      
      {!file ? (
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${file ? borderColor : 'border-slate-300'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-slate-400" />
            <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> CSV</p>
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
      ) : (
        <div className={`flex items-center justify-between p-4 border rounded-lg ${bgColor} ${borderColor} border-opacity-30`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white rounded-full`}>
               <FileText className={`w-5 h-5 ${textColor}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${textColor} truncate max-w-[200px]`}>{file.name}</p>
              <p className="text-xs text-slate-500">{file.data.length.toLocaleString()} rows • {file.headers.length} columns</p>
            </div>
          </div>
          <button 
            onClick={() => (document.querySelector(`input[id="${label}-input"]`) as HTMLInputElement)?.click()}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
          >
            Change
          </button>
          {/* Hidden input for changing file */}
          <input id={`${label}-input`} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      )}
    </div>
  );
};
