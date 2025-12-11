import React, { useState } from 'react';
import { Plus, Trash2, Settings, ArrowRight } from 'lucide-react';
import { ComparisonConfig, CsvFile } from '../types';

interface ConfigPanelProps {
  fileA: CsvFile;
  fileB: CsvFile;
  config: ComparisonConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComparisonConfig>>;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ fileA, fileB, config, setConfig }) => {
  const [selectedA, setSelectedA] = useState<string>(fileA.headers[0] || '');
  const [selectedB, setSelectedB] = useState<string>(fileB.headers[0] || '');

  const addMapping = () => {
    if (selectedA && selectedB) {
      setConfig(prev => ({
        ...prev,
        keyMappings: [
          ...prev.keyMappings,
          { id: Math.random().toString(36).substr(2, 9), fieldA: selectedA, fieldB: selectedB }
        ]
      }));
    }
  };

  const removeMapping = (id: string) => {
    setConfig(prev => ({
      ...prev,
      keyMappings: prev.keyMappings.filter(k => k.id !== id)
    }));
  };

  const toggleRule = (key: keyof ComparisonConfig['rules']) => {
    setConfig(prev => ({
      ...prev,
      rules: { ...prev.rules, [key]: !prev.rules[key] }
    }));
  };

  const toggleFieldInList = (
    listKey: 'removeLeadingZerosFieldsA' | 'removeLeadingZerosFieldsB' | 'dateFieldsA' | 'dateFieldsB',
    field: string
  ) => {
    setConfig(prev => {
      const currentList = prev.rules[listKey];
      const exists = currentList.includes(field);
      return {
        ...prev,
        rules: {
          ...prev.rules,
          [listKey]: exists 
            ? currentList.filter(f => f !== field)
            : [...currentList, field]
        }
      };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Settings className="w-5 h-5 text-slate-500" />
        <h2 className="font-semibold text-slate-800">Configuration</h2>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Key Mapping Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">1. Map Comparison Keys</h3>
          <p className="text-sm text-slate-500 mb-4">Select columns that form the unique identifier for comparison.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
            <div className="w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">Source A Column</label>
              <select 
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500"
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
              >
                {fileA.headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div className="hidden sm:flex pb-2 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">Source B Column</label>
              <select 
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500"
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
              >
                 {fileB.headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <button 
              onClick={addMapping}
              disabled={!selectedA || !selectedB}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2">
            {config.keyMappings.length === 0 && (
              <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-100">
                No keys mapped. Comparison will fail without a unique key.
              </div>
            )}
            {config.keyMappings.map(mapping => (
              <div key={mapping.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-blue-700">{mapping.fieldA}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-indigo-700">{mapping.fieldB}</span>
                </div>
                <button onClick={() => removeMapping(mapping.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100" />

        {/* Normalization Rules */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">2. Normalization Rules</h3>
             {/* Global Whitespace Toggle */}
             <div className="flex items-center gap-2">
               <input 
                  type="checkbox" 
                  id="trimWhitespace"
                  checked={config.rules.trimWhitespace}
                  onChange={() => toggleRule('trimWhitespace')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="trimWhitespace" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Global Whitespace Trim</label>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Source A Column */}
            <div className="space-y-6">
              <h4 className="font-semibold text-blue-800 text-sm border-b border-blue-100 pb-2">Source A: {fileA.name}</h4>
              
              {/* Leading Zeros A */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="zerosA"
                    checked={config.rules.removeLeadingZerosA}
                    onChange={() => toggleRule('removeLeadingZerosA')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="zerosA" className="text-sm font-medium text-slate-700">Remove Leading Zeros</label>
                </div>
                {config.rules.removeLeadingZerosA && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 h-32 overflow-y-auto">
                    {fileA.headers.map(h => (
                       <label key={`A-zero-${h}`} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                         <input 
                            type="checkbox"
                            checked={config.rules.removeLeadingZerosFieldsA.includes(h)}
                            onChange={() => toggleFieldInList('removeLeadingZerosFieldsA', h)}
                            className="text-blue-600 rounded"
                         />
                         <span className="text-xs text-slate-600 truncate">{h}</span>
                       </label>
                    ))}
                  </div>
                )}
              </div>

               {/* Dates A */}
               <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="datesA"
                    checked={config.rules.normalizeDatesA}
                    onChange={() => toggleRule('normalizeDatesA')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="datesA" className="text-sm font-medium text-slate-700">Normalize Dates (YYYY-MM-DD)</label>
                </div>
                {config.rules.normalizeDatesA && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 h-32 overflow-y-auto">
                    {fileA.headers.map(h => (
                       <label key={`A-date-${h}`} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                         <input 
                            type="checkbox"
                            checked={config.rules.dateFieldsA.includes(h)}
                            onChange={() => toggleFieldInList('dateFieldsA', h)}
                            className="text-blue-600 rounded"
                         />
                         <span className="text-xs text-slate-600 truncate">{h}</span>
                       </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Source B Column */}
            <div className="space-y-6">
              <h4 className="font-semibold text-indigo-800 text-sm border-b border-indigo-100 pb-2">Source B: {fileB.name}</h4>
              
              {/* Leading Zeros B */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="zerosB"
                    checked={config.rules.removeLeadingZerosB}
                    onChange={() => toggleRule('removeLeadingZerosB')}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="zerosB" className="text-sm font-medium text-slate-700">Remove Leading Zeros</label>
                </div>
                {config.rules.removeLeadingZerosB && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 h-32 overflow-y-auto">
                    {fileB.headers.map(h => (
                       <label key={`B-zero-${h}`} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                         <input 
                            type="checkbox"
                            checked={config.rules.removeLeadingZerosFieldsB.includes(h)}
                            onChange={() => toggleFieldInList('removeLeadingZerosFieldsB', h)}
                            className="text-indigo-600 rounded"
                         />
                         <span className="text-xs text-slate-600 truncate">{h}</span>
                       </label>
                    ))}
                  </div>
                )}
              </div>

               {/* Dates B */}
               <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="datesB"
                    checked={config.rules.normalizeDatesB}
                    onChange={() => toggleRule('normalizeDatesB')}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="datesB" className="text-sm font-medium text-slate-700">Normalize Dates (YYYY-MM-DD)</label>
                </div>
                {config.rules.normalizeDatesB && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 h-32 overflow-y-auto">
                    {fileB.headers.map(h => (
                       <label key={`B-date-${h}`} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                         <input 
                            type="checkbox"
                            checked={config.rules.dateFieldsB.includes(h)}
                            onChange={() => toggleFieldInList('dateFieldsB', h)}
                            className="text-indigo-600 rounded"
                         />
                         <span className="text-xs text-slate-600 truncate">{h}</span>
                       </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};