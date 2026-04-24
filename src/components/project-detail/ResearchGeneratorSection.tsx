import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiTerminal, FiChevronRight, FiDatabase, FiUsers } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  onPopulateFromAsIsMap?: () => void; // Add callback for populating from As-Is Map
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
  onPopulateFromAsIsMap,
  onGenerate,
  renderReport,
  onRefreshProject,
}: ResearchGeneratorSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // COMPREHENSIVE DEBUG for transformation framework
  if (title === 'Transformation Framework') {
    console.log('=== RESEARCH GENERATOR SECTION DEBUG ===');
    console.log('Title:', title);
    console.log('Data received from parent:', data);
    console.log('Data type:', typeof data);
    console.log('Data is null?', data === null);
    console.log('Data is undefined?', data === undefined);
    if (data) {
      console.log('Data keys:', Object.keys(data));
      console.log('Has content property?', 'content' in data);
      console.log('Content value:', data.content);
    }
    console.log('=== END DEBUG ===');
  }

  // Check if data exists - either from local state or passed from parent (database)
  const hasData = data !== null && data !== undefined &&
    (typeof data === 'object' && Object.keys(data).length > 0);

  // Additional debug for transformation framework
  if (title === 'Transformation Framework') {
    console.log('Transformation hasData result:', hasData);
  }

  // DEBUG: Log data evaluation for transformation framework
  if (title === 'Transformation Framework') {
    console.log('ResearchGeneratorSection DEBUG:', {
      title,
      data,
      hasData,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'no data'
    });
  }

  // Auto-show report when data is available (from database on page load)
  useEffect(() => {
    console.log(`${title} useEffect:`, { hasData, isLoading, showReport });
    if (hasData && !isLoading) {
      setShowReport(true);
      console.log(`${title}: Setting showReport to true`);
    } else if (!hasData && !isLoading) {
      setShowReport(false);
      console.log(`${title}: Setting showReport to false (no data)`);
    }
  }, [hasData, isLoading, title]);

  const handleGenerate = async () => {
    // Call onGenerate callback if provided (for syncing data between forms)
    if (onGenerate) {
      onGenerate();
    }

    // Validate all fields - only if there are form fields
    if (formFields.length > 0) {
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
    }

    setIsLoading(true);
    const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || 'http://localhost:8000';

    try {
      const requestBody = requestBodyMapper
        ? requestBodyMapper(formData, projectId)
        : { project_id: projectId, ...formData };

      console.log(`Sending ${title} Request via proxy:`, requestBody);

      const response = await fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          target_url: apiEndpoint,
          payload: requestBody
        })
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

      // Clear form - only if there are form fields
      if (formFields.length > 0) {
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
    // Clear data and show form
    setData(null);
    setShowReport(false);

    // Don't clear form fields - keep existing data so users can regenerate with same inputs
    // This is especially useful for sections like Deep Empathy where users want to keep
    // the pain point and description when regenerating

    // Note: Form data is preserved, users can modify if needed before clicking Generate
  };

  // DEBUG: Log render decision
  console.log(`${title} render decision:`, { hasData, showReport, willShowForm: !showReport });

  return (
    <>
      {!showReport ? (
        <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                <FiTerminal className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-medium text-gray-900">{title}</CardTitle>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{description.split('.')[0]}</p>
              </div>
            </div>
            {onShowPainPointsModal && (
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white rounded-xl h-10 px-6 font-normal transition-colors"
                onClick={onShowPainPointsModal}
              >
                Choose Pain Point
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-10">
              <div className="border-l-2 border-gray-900 pl-6 py-2">
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{description}</p>
              </div>

              <div className="space-y-8">
                {formFields.map((element, index) => {
                  if ('type' in element && element.type === 'inline') {
                    return (
                      <div key={`inline-${index}`} className="grid grid-cols-12 gap-8">
                        {element.fields.map((field) => {
                          const widthClass = field.width === '1/3' ? 'col-span-4' :
                            field.width === '2/3' ? 'col-span-8' :
                              field.width === '1/2' ? 'col-span-6' : 'col-span-12';

                          return (
                            <div key={field.id} className={widthClass}>
                              <div className="flex items-center justify-between mb-4">
                                <label htmlFor={field.id} className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                  {field.label}
                                </label>
                                {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-black h-auto p-0 flex items-center gap-2"
                                    onClick={onShowUsersModal}
                                  >
                                    <FiUsers className="w-3 h-3" /> Choose User
                                  </Button>
                                )}
                                {field.id === 'targetUserContext' && onPopulateFromAsIsMap && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-black h-auto p-0 flex items-center gap-2"
                                    onClick={onPopulateFromAsIsMap}
                                  >
                                    <FiDatabase className="w-3 h-3" /> Use As-Is Map
                                  </Button>
                                )}
                              </div>
                              {field.type === 'textarea' ? (
                                <textarea
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  rows={field.rows || 3}
                                  placeholder={field.placeholder}
                                  className="w-full bg-white border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black resize-none transition-colors"
                                />
                              ) : (
                                <input
                                  type={field.type || 'text'}
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  placeholder={field.placeholder}
                                  className="w-full bg-white border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    const field = element as FormField;
                    return (
                      <div key={field.id}>
                        <div className="flex items-center justify-between mb-4">
                          <label htmlFor={field.id} className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                            {field.label}
                          </label>
                          {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-black h-auto p-0 flex items-center gap-2"
                              onClick={onShowUsersModal}
                            >
                              <FiUsers className="w-3 h-3" /> Choose User
                            </Button>
                          )}
                          {field.id === 'targetUserContext' && onPopulateFromAsIsMap && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-black h-auto p-0 flex items-center gap-2"
                              onClick={onPopulateFromAsIsMap}
                            >
                              <FiDatabase className="w-3 h-3" /> Use As-Is Map
                            </Button>
                          )}
                        </div>
                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            rows={field.rows || 3}
                            placeholder={field.placeholder}
                            className="w-full bg-white border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black resize-none transition-colors"
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full bg-white border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors"
                          />
                        )}
                      </div>
                    );
                  }
                })}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || isGenerating}
                    className="bg-black text-white hover:bg-black/90 rounded-xl h-14 px-10 font-normal transition-all"
                  >
                    {isLoading || isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Generating...</> : (
                      <span className="flex items-center gap-2">
                        Generate {title} <FiChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fadeIn">
          {renderReport && renderReport(data, handleReset)}
        </div>
      )}
    </>
  );
};
