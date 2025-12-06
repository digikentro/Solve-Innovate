import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea' | 'number';
  rows?: number;
  width?: 'full' | '1/3' | '2/3' | '1/2'; // Add width support
  inline?: boolean; // Add inline support
  showCustomButton?: boolean; // Add support for custom field buttons
}

interface InlineFieldGroup {
  type: 'inline';
  fields: FormField[];
}

type FormElement = FormField | InlineFieldGroup;

interface ResearchGeneratorSectionProps {
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  iconBgFrom: string;
  iconBgTo: string;
  formFields: FormElement[];
  formData: any;
  setFormData: (data: any) => void;
  data: any | null;
  setData: (data: any) => void;
  isGenerating: boolean;
  projectId: string;
  apiEndpoint: string;
  requestBodyMapper?: (formData: any, projectId: string) => Record<string, any>;
  onShowPainPointsModal?: () => void;
  onShowUsersModal?: () => void; // Add callback for user selection modal
  onGenerate?: () => void; // Add callback for when Generate button is clicked
  renderReport?: (data: any, onGenerateNew: () => void) => React.ReactNode; // Updated: Accepts handler
  onRefreshProject?: () => void; // Add this to refresh project data after generation
}

export const ResearchGeneratorSection = ({
  title,
  description,
  gradientFrom,
  gradientTo,
  iconBgFrom,
  iconBgTo,
  formFields,
  formData,
  setFormData,
  data,
  setData,
  isGenerating,
  projectId,
  apiEndpoint,
  requestBodyMapper,
  onShowPainPointsModal,
  onShowUsersModal,
  onGenerate,
  renderReport,
  onRefreshProject,
}: ResearchGeneratorSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Check if data exists - either from local state or passed from parent (database)
  const hasData = data !== null && data !== undefined;

  // Auto-show report when data is available (from database on page load)
  useEffect(() => {
    if (hasData && !isLoading) {
      setShowReport(true);
    }
  }, [hasData, isLoading]);

  const handleGenerate = async () => {
    // Call onGenerate callback if provided (for syncing data between forms)
    if (onGenerate) {
      onGenerate();
    }
    
    // Validate all fields
    const allFields: FormField[] = [];
    formFields.forEach(element => {
      if ('type' in element && element.type === 'inline') {
        allFields.push(...element.fields);
      } else {
        allFields.push(element as FormField);
      }
    });
    const missingFields = allFields.filter(field => !formData[field.id]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Please fill in all fields for ${title.toLowerCase()}.`);
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = requestBodyMapper
        ? requestBodyMapper(formData, projectId)
        : { project_id: projectId, ...formData };

      console.log(`Sending ${title} Request:`, requestBody);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let responseData = await response.json();
      console.log(`${title} raw response:`, responseData);

      // Handle different response formats
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error('Failed to parse string response:', parseError);
          throw new Error('Invalid response format');
        }
      }



      setData(responseData);
      setShowReport(true);
      
      // Refresh project data to get the latest from database
      if (onRefreshProject) {
        setTimeout(() => {
          onRefreshProject();
        }, 2000);
      }
      
      toast.success(`${title} generated successfully!`, {
        duration: 3000,
      });
      
      // Clear form
      const allFields: FormField[] = [];
      formFields.forEach(element => {
        if ('type' in element && element.type === 'inline') {
          allFields.push(...element.fields);
        } else {
          allFields.push(element as FormField);
        }
      });
      const clearedForm = allFields.reduce((acc, field) => {
        acc[field.id] = '';
        return acc;
      }, {} as any);
      setFormData(clearedForm);
    } catch (error) {
      console.error(`Error generating ${title}:`, error);
      if (error instanceof Error) {
        toast.error(`Failed to generate ${title}: ${error.message}`);
      } else {
        toast.error(`Failed to generate ${title}. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Trigger regeneration instead of clearing form
    setData(null);
    setShowReport(false);
    // Keep form data and trigger regeneration
    if (Object.values(formData).some(value => value && value.toString().trim())) {
      handleGenerate();
    } else {
      // Only clear form if no data exists
      const allFields: FormField[] = [];
      formFields.forEach(element => {
        if ('type' in element && element.type === 'inline') {
          allFields.push(...element.fields);
        } else {
          allFields.push(element as FormField);
        }
      });
      const clearedForm = allFields.reduce((acc, field) => {
        acc[field.id] = '';
        return acc;
      }, {} as any);
      setFormData(clearedForm);
    }
  };

  return (
    <>
      {!hasData ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className={`px-8 py-6 bg-gradient-to-r from-${gradientFrom} to-${gradientTo} border-b border-gray-100`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 bg-gradient-to-r from-${iconBgFrom} to-${iconBgTo} rounded-xl flex items-center justify-center`}>
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
              {onShowPainPointsModal && (
                <button
                  type="button"
                  className={`px-6 py-3 bg-gradient-to-r from-${iconBgFrom} to-${iconBgTo} text-white text-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
                  onClick={onShowPainPointsModal}
                  title="Choose from AS-IS Map Pain Points"
                >
                  Choose Pain Point
                </button>
              )}
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              <div className={`bg-${gradientFrom}/80 p-6 rounded-2xl border border-${gradientFrom.replace('-50', '-200')}`}>
                <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
              </div>
              <div className="space-y-6">
                {formFields.map((element, index) => {
                  if ('type' in element && element.type === 'inline') {
                    // Render inline field group
                    return (
                      <div key={`inline-${index}`} className="grid grid-cols-12 gap-4">
                        {element.fields.map((field) => {
                          const widthClass = field.width === '1/3' ? 'col-span-4' : 
                                           field.width === '2/3' ? 'col-span-8' : 
                                           field.width === '1/2' ? 'col-span-6' : 'col-span-12';
                          
                          return (
                            <div key={field.id} className={widthClass}>
                              <div className="flex items-center justify-between mb-3">
                                <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700">
                                  {field.label}
                                </label>
                                {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                                  <button
                                    type="button"
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                    onClick={onShowUsersModal}
                                    title="Choose from Extreme User Analysis"
                                  >
                                    Choose User
                                  </button>
                                )}
                              </div>
                              {field.type === 'textarea' ? (
                                <textarea
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  rows={field.rows || 3}
                                  placeholder={field.placeholder}
                                  className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-${iconBgFrom} focus:border-transparent resize-none transition-all duration-200`}
                                />
                              ) : (
                                <input
                                  type={field.type || 'text'}
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  placeholder={field.placeholder}
                                  className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-${iconBgFrom} focus:border-transparent transition-all duration-200`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    // Render regular field
                    const field = element as FormField;
                    return (
                      <div key={field.id}>
                        <div className="flex items-center justify-between mb-3">
                          <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700">
                            {field.label}
                          </label>
                          {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                            <button
                              type="button"
                              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                              onClick={onShowUsersModal}
                              title="Choose from Extreme User Analysis"
                            >
                              Choose User
                            </button>
                          )}
                        </div>
                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            rows={field.rows || 3}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-${iconBgFrom} focus:border-transparent resize-none transition-all duration-200`}
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-${iconBgFrom} focus:border-transparent transition-all duration-200`}
                          />
                        )}
                      </div>
                    );
                  }
                })}
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || isGenerating}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isGenerating ? 'Generating...' : `Generate ${title}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Inline Report Display */}
          {renderReport && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fadeIn">
              {renderReport(data, handleReset)}
            </div>
          )}
        </div>
      )}
    </>
  );
};
