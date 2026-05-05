import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiTerminal, FiChevronRight, FiDatabase, FiUsers } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  variant?: 'default' | 'asIs';
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
  variant = 'default',
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
  const isAsIsStyle = variant === 'asIs';

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
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
          <CardHeader className="flex flex-col items-start gap-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5 text-left">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
                {isAsIsStyle ? (
                  <FiUsers className="size-5 shrink-0 text-gray-400" />
                ) : (
                  <FiTerminal className="size-5 shrink-0 text-gray-400" />
                )}
                {title}
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
                {description.split('.')[0]}
              </CardDescription>
            </div>
            {onShowPainPointsModal && (
              <Button
                type="button"
                variant="outline"
                onClick={onShowPainPointsModal}
                className="w-full shrink-0 sm:w-auto"
              >
                Choose Pain Point
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex flex-col gap-6 px-6 pb-6 pt-6">
            <div className="border-l-2 border-gray-900 py-2 pl-4">
              <p className="max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>
            </div>

            <div className="flex flex-col gap-6">
                {formFields.map((element, index) => {
                  if ('type' in element && element.type === 'inline') {
                    return (
                      <div key={`inline-${index}`} className="grid grid-cols-12 gap-4">
                        {element.fields.map((field) => {
                          const widthClass = field.width === '1/3' ? 'col-span-12 md:col-span-4' :
                            field.width === '2/3' ? 'col-span-12 md:col-span-8' :
                              field.width === '1/2' ? 'col-span-12 md:col-span-6' : 'col-span-12';

                          return (
                            <div key={field.id} className={widthClass}>
                              <div className="mb-2 flex items-center justify-between">
                                <label htmlFor={field.id} className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {field.label}
                                </label>
                                {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-gray-500 hover:text-gray-900"
                                    onClick={onShowUsersModal}
                                  >
                                    <FiUsers className="mr-1 size-3" /> Choose User
                                  </Button>
                                )}
                                {field.id === 'targetUserContext' && onPopulateFromAsIsMap && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-gray-500 hover:text-gray-900"
                                    onClick={onPopulateFromAsIsMap}
                                  >
                                    <FiDatabase className="mr-1 size-3" /> Use As-Is Map
                                  </Button>
                                )}
                              </div>
                              {field.type === 'textarea' ? (
                                <Textarea
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  rows={field.rows || 3}
                                  placeholder={field.placeholder}
                                  className={isAsIsStyle
                                    ? "min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    : "resize-none"
                                  }
                                />
                              ) : (
                                <Input
                                  type={field.type || 'text'}
                                  id={field.id}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                  placeholder={field.placeholder}
                                  className={isAsIsStyle
                                    ? "h-11 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-primary focus:ring-primary/20"
                                    : undefined
                                  }
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
                      <div key={field.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor={field.id} className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {field.label}
                          </label>
                          {field.id === 'selectedExtremeUser' && onShowUsersModal && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-gray-500 hover:text-gray-900"
                              onClick={onShowUsersModal}
                            >
                              <FiUsers className="mr-1 size-3" /> Choose User
                            </Button>
                          )}
                          {field.id === 'targetUserContext' && onPopulateFromAsIsMap && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-gray-500 hover:text-gray-900"
                              onClick={onPopulateFromAsIsMap}
                            >
                              <FiDatabase className="mr-1 size-3" /> Use As-Is Map
                            </Button>
                          )}
                        </div>
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            rows={field.rows || 3}
                            placeholder={field.placeholder}
                            className={isAsIsStyle
                              ? "min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              : "resize-none"
                            }
                          />
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                            className={isAsIsStyle
                              ? "h-11 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-primary focus:ring-primary/20"
                              : undefined
                            }
                          />
                        )}
                      </div>
                    );
                  }
                })}
                <div className="flex justify-start pt-2">
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading || isGenerating}
                      className={isAsIsStyle
                        ? "rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        : undefined
                      }
                  >
                    {isLoading || isGenerating ? (
                      <>
                        <Loader2 className="mr-2 inline size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        Generate {title} <FiChevronRight className="size-4" />
                      </span>
                    )}
                  </Button>
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
