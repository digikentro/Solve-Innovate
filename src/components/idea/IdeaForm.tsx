import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { ideaService } from '@/services/ideaService';
import { ProjectService } from '@/services/projectService';
import { generateIdeas, refineIdea } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { IdeaInput } from '@/types/idea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/types/project';

const ideaSchema = z.object({
  content: z.string().min(10, 'Idea must be at least 10 characters'),
  status: z.enum(['draft', 'refining', 'validating', 'ready', 'archived']),
  notes: z.string().optional(),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

interface IdeaFormProps {
  initialData?: Partial<IdeaInput>;
  onSuccess?: () => void;
}

export const IdeaForm = ({ initialData, onSuccess }: IdeaFormProps) => {
  const { projectId, ideaId } = useParams<{ projectId?: string; ideaId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      content: initialData?.content || '',
      status: (initialData?.status as any) || 'draft',
      notes: initialData?.notes || '',
    },
  });

  // Load project title if projectId is available
  useEffect(() => {
    const loadProject = async () => {
      if (projectId && user?.id) {
        try {
          const project = await ProjectService.getProjectById(projectId, user.id);
          if (project) {
          setProjectTitle(project.title);
          }
        } catch (error) {
          console.error('Error loading project:', error);
        }
      }
    };

    loadProject();
  }, [projectId, user?.id]);

  const onSubmit = async (data: IdeaFormData) => {
    if (!user || (!projectId && !initialData?.project_id)) return;

    try {
      setIsLoading(true);
      
      const ideaData = {
        content: data.content,
        status: data.status,
        notes: data.notes || null,
        project_id: projectId || initialData?.project_id || '',
      };

      if (isEditing && initialData?.id) {
        await ideaService.updateIdea(initialData.id, ideaData);
        toast.success('Idea updated successfully');
      } else {
        await ideaService.createIdea(ideaData);
        toast.success('Idea created successfully');
      }

      onSuccess?.();
      
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else if (initialData?.project_id) {
        navigate(`/projects/${initialData.project_id}`);
      } else {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error('Failed to save idea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!projectTitle) return;
    
    try {
      setIsGenerating(true);
      const prompt = `Project: ${projectTitle}\n\nGenerate 3 innovative ideas for this project.`;
      const generatedIdeas = await generateIdeas(prompt, 3);
      
      if (generatedIdeas.length > 0) {
        setValue('content', generatedIdeas[0]);
        toast.success('Idea generated! Feel free to refine it.');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('Failed to generate ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineIdea = async () => {
    const currentContent = watch('content');
    if (!currentContent) return;

    try {
      setIsGenerating(true);
      const refined = await refineIdea(currentContent, 'Make this idea more detailed and actionable.');
      setValue('content', refined);
      setValue('status', 'refining');
      toast.success('Idea refined!');
    } catch (error) {
      console.error('Error refining idea:', error);
      toast.error('Failed to refine idea');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEditing ? 'Edit Idea' : 'New Idea'}
          </h2>
          {projectTitle && (
            <p className="mt-1 text-sm text-gray-500">
              For project: <span className="font-medium">{projectTitle}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Your Idea *
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleGenerateIdeas}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FiZap className="-ml-0.5 mr-1.5 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Ideas'}
              </button>
              <button
                type="button"
                onClick={handleRefineIdea}
                disabled={isGenerating || !watch('content')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FiRefreshCw className="-ml-0.5 mr-1.5 h-4 w-4" />
                {isGenerating ? 'Refining...' : 'Refine with AI'}
              </button>
            </div>
          </div>
          <div className="mt-1">
            <textarea
              id="content"
              rows={6}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              } rounded-md`}
              placeholder="Describe your idea in detail..."
              {...register('content')}
              disabled={isLoading || isGenerating}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={toggleAdvanced}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {showAdvanced ? (
              <>
                <span>Hide advanced options</span>
                <FiChevronUp className="ml-1 h-5 w-5" />
              </>
            ) : (
              <>
                <span>Show advanced options</span>
                <FiChevronDown className="ml-1 h-5 w-5" />
              </>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  {...register('status')}
                  disabled={isLoading || isGenerating}
                >
                  <option value="draft">Draft</option>
                  <option value="refining">Refining</option>
                  <option value="validating">Validating</option>
                  <option value="ready">Ready</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add any additional notes or context..."
                    {...register('notes')}
                    disabled={isLoading || isGenerating}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || isGenerating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading || isGenerating}
          >
            {isLoading ? (
              'Saving...'
            ) : isEditing ? (
              'Update Idea'
            ) : (
              'Create Idea'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
