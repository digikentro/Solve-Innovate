import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiTerminal, FiChevronRight, FiDatabase, FiUsers } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

  // Check if user has been selected for Deep Empathy workflow
  const isUserSelected = formData?.selectedExtremeUser?.trim() ? true : false;

  // For Extreme User (asIs variant): both sections must be filled before showing form / enabling Generate
  const isPainPointFilled = isAsIsStyle
    ? !!(formData?.painPointStep?.trim() && formData?.painPointDescription?.trim())
    : true;
  const isTargetUserFilled = isAsIsStyle
    ? !!formData?.targetUserContext?.trim()
    : true;
  const isExtremeUserReady = isPainPointFilled && isTargetUserFilled;

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
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <div className="text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          </div>

          {/* Extreme User (asIs) variant: show selection buttons first */}
          {isAsIsStyle ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-8">

                {/* Step 1 — Pain Point */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-foreground">Step 1 — Pain Point</p>
                      <p className="text-sm text-muted-foreground">Select a pain point from your As-Is Map analysis.</p>
                    </div>
                    {isPainPointFilled && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-full px-2.5 py-1">
                        ✓ Selected
                      </span>
                    )}
                  </div>

                  {isPainPointFilled ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">{formData.painPointStep}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{formData.painPointDescription}</p>
                      {onShowPainPointsModal && (
                        <button
                          type="button"
                          onClick={onShowPainPointsModal}
                          className="self-start text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                          Change selection
                        </button>
                      )}
                    </div>
                  ) : (
                    onShowPainPointsModal && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onShowPainPointsModal}
                        className="w-full h-11 border-dashed text-sm font-medium"
                      >
                        Choose Pain Point
                      </Button>
                    )
                  )}
                </div>

                <Separator />

                {/* Step 2 — Target User Context */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-foreground">Step 2 — Target User Context</p>
                      <p className="text-sm text-muted-foreground">Populate from your As-Is Map or enter manually.</p>
                    </div>
                    {isTargetUserFilled && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-full px-2.5 py-1">
                        ✓ Filled
                      </span>
                    )}
                  </div>

                  {isTargetUserFilled ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-2">
                      <p className="text-sm text-gray-600 leading-relaxed">{formData.targetUserContext}</p>
                      {onPopulateFromAsIsMap && (
                        <button
                          type="button"
                          onClick={onPopulateFromAsIsMap}
                          className="self-start text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                          Re-populate from As-Is Map
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {onPopulateFromAsIsMap && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onPopulateFromAsIsMap}
                          className="w-full h-11 border-dashed text-sm font-medium"
                        >
                          Use As-Is Map
                        </Button>
                      )}
                      <Textarea
                        id="targetUserContext"
                        value={formData.targetUserContext || ''}
                        onChange={(e) => setFormData({ ...formData, targetUserContext: e.target.value })}
                        rows={3}
                        placeholder="Or describe the user's context, constraints, and environment manually..."
                      />
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading || isGenerating || !isExtremeUserReady}
                    className="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoading || isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="inline size-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate Extreme User'
                    )}
                  </Button>
                  {!isExtremeUserReady && (
                    <p className="text-xs text-muted-foreground">
                      Complete both steps above to enable generation.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Default variant: show all form fields normally */
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-8">
                {/* Render Form Fields */}
                <div className="flex flex-col gap-7">
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
                                  <label htmlFor={field.id} className="text-xs font-semibold uppercase tracking-widest text-gray-700">
                                    {field.label}
                                  </label>
                                </div>
                                {field.type === 'textarea' ? (
                                  <Textarea
                                    id={field.id}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                    rows={field.rows || 3}
                                    placeholder={field.placeholder}
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                  />
                                ) : (
                                  <Input
                                    type={field.type || 'text'}
                                    id={field.id}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      const field = element as FormField;
                      const isSelectedUserField = field.id === 'selectedExtremeUser';

                      return (
                        <div key={field.id} className="flex flex-col gap-2">
                          <label htmlFor={field.id} className="text-xs font-semibold uppercase tracking-widest text-gray-700">
                            {field.label}
                          </label>

                          {field.type === 'textarea' ? (
                            <Textarea
                              id={field.id}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              rows={field.rows || 3}
                              placeholder={field.placeholder}
                              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                            />
                          ) : (
                            <Input
                              type={field.type || 'text'}
                              id={field.id}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              placeholder={field.placeholder}
                              className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                            />
                          )}

                          {/* Show Choose User button below selectedExtremeUser field */}
                          {isSelectedUserField && onShowUsersModal && (
                            <div className="mt-3 flex justify-center">
                              <Button
                                type="button"
                                onClick={onShowUsersModal}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                              >
                                Choose User
                              </Button>
                            </div>
                          )}

                          {field.id === 'targetUserContext' && onPopulateFromAsIsMap && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              onClick={onPopulateFromAsIsMap}
                            >
                              Use As-Is Map
                            </Button>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Generate Button - Centered and Floating */}
                <div className="flex justify-center pt-8">
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading || isGenerating || (title === 'Deep Empathy Research Generator' && !isUserSelected)}
                    className="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoading || isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="inline size-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      `Generate ${title.split(' ').slice(0, -1).join(' ').toLowerCase()}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fadeIn">
          {renderReport && renderReport(data, handleReset)}
        </div>
      )}
    </>
  );
};
