import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiBox } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

interface GenericReportViewerProps {
  data: any;
  title?: string;
  onGenerateNew?: () => void;
}

export const GenericReportViewer = ({ data, title, onGenerateNew }: GenericReportViewerProps) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderValue = (value: any, key: string, depth: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">Empty list</span>;
      }

      // Check if array contains objects
      if (typeof value[0] === 'object' && value[0] !== null) {
        return (
          <div className="space-y-6 mt-4">
            {value.map((item, index) => (
              <div key={index} className="border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <FiBox className="w-3 h-3" /> Item {index + 1}
                </div>
                {renderObject(item, depth + 1)}
              </div>
            ))}
          </div>
        );
      }

      // Array of primitives
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          {value.map((item, index) => (
            <li key={index} className="text-gray-700">{String(item)}</li>
          ))}
        </ul>
      );
    }

    // Handle objects
    if (typeof value === 'object') {
      return renderObject(value, depth);
    }

    // Handle primitives
    if (typeof value === 'string' && value.length > 200) {
      return (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{value}</p>
      );
    }

    return <span className="text-gray-700">{String(value)}</span>;
  };

  const renderObject = (obj: any, depth: number = 0) => {
    const entries = Object.entries(obj);

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-4' : ''}`}>
        {entries.map(([key, value]) => {
          const sectionKey = `${depth}-${key}`;
          const isExpanded = expandedSections[sectionKey] !== false; // Default to expanded

          // Format the key to be more readable
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();

          const isComplex = typeof value === 'object' && value !== null;

          return (
            <div key={sectionKey} className="border-l border-gray-200 pl-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isComplex ? (
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      className="flex items-center gap-2 text-left w-full group"
                    >
                      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {formattedKey}
                      </span>
                      {isExpanded ? (
                        <FiChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-900">{formattedKey}:</span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2">
                  {renderValue(value, key, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Extract content if data has nested structure
  const reportData = data?.content || data;

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-gray-100 pb-6 mb-8 flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium text-gray-900">{title}</h2>
          {onGenerateNew && (
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white rounded-none h-10 px-6 font-normal transition-colors"
              onClick={onGenerateNew}
            >
              Generate New
            </Button>
          )}
        </div>
      )}

      {reportData ? (
        <div className="space-y-4">
          {renderObject(reportData)}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No report data available</p>
        </div>
      )}
    </div>
  );
};
