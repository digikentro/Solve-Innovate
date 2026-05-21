import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FiCheck, FiFileText, FiInfo, FiLink, FiLoader, FiPlus, FiSave, FiTrash2, FiTrendingUp, FiUpload, FiX } from 'react-icons/fi';
import type { Project } from '@/types/project';
import {
  getPublicFileUrl,
  postSecondaryResearchToN8n,
  saveSecondaryResearchToSupabase,
  uploadSecondaryResearchFiles,
  validateSecondaryResearchFile,
  type SecondaryResearchFileRef,
} from '@/services/secondaryResearchService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ProjectInfoProps {
  project: Project;
}

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  return (
    <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
          <FiInfo className="size-5 shrink-0 text-gray-400" />
          Project Information
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-6">
        <dl className="flex flex-col gap-6">
          <div>
            <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Description</dt>
            <dd className="text-sm leading-relaxed text-gray-700">
              {project.description || 'No description provided'}
            </dd>
          </div>

          {project.skills && project.skills.length > 0 && (
            <div>
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Skills & Technologies</dt>
              <dd>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}

          {project.design_research?.generated_at && (
            <div className="border-t border-gray-100 pt-6">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Extreme User Analysis</dt>
              <dd className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">Generated on: {new Date(project.design_research.generated_at).toLocaleString()}</span>
                </div>
                {project.design_research.form && (
                  <div className="flex flex-col gap-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Step:</span> {project.design_research.form.painPointStep}</p>
                    <p><span className="font-semibold text-gray-900">Description:</span> {project.design_research.form.painPointDescription}</p>
                    <p><span className="font-semibold text-gray-900">User Context:</span> {project.design_research.form.targetUserContext}</p>
                  </div>
                )}
              </dd>
            </div>
          )}

          {project.deep_empathy_data?.generated_at && (
            <div className="border-t border-gray-100 pt-6">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Deep Empathy Research</dt>
              <dd className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">Generated on: {new Date(project.deep_empathy_data.generated_at).toLocaleString()}</span>
                </div>
                {project.deep_empathy_data.form && (
                  <div className="flex flex-col gap-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Prioritized Pain Point:</span> {project.deep_empathy_data.form.prioritizedPainPoint}</p>
                    <p><span className="font-semibold text-gray-900">Description:</span> {project.deep_empathy_data.form.painPointDescription}</p>
                    <p><span className="font-semibold text-gray-900">Selected Extreme User:</span> {project.deep_empathy_data.form.selectedExtremeUser}</p>
                  </div>
                )}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Secondary Research Section
// ─────────────────────────────────────────────────────────────────────────────

type SecondaryResearchDraft = {
  files: File[];
  links: string[];
  linkDraft: string;
  quotesDraft: string;
};

type SecondaryResearchSectionProps = {
  projectId: string;
  userId: string;
  secondaryresearch: any | null | undefined;
  onRefreshProject: () => Promise<void> | void;
};

const DEFAULT_SECONDARY_RESEARCH_WEBHOOK =
  (import.meta as any).env?.VITE_N8N_SECONDARY_RESEARCH_WEBHOOK ||
  'https://n8n.srv922914.hstgr.cloud/webhook/SecondaryResearch';

const isValidHttpUrl = (value: string) => /^https?:\/\/\S+/i.test(value.trim());

export const SecondaryResearchSection = ({
  projectId,
  userId,
  secondaryresearch,
  onRefreshProject,
}: SecondaryResearchSectionProps) => {
  const [draft, setDraft] = useState<SecondaryResearchDraft>({
    files: [],
    links: [],
    linkDraft: '',
    quotesDraft: '',
  });

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [uploadedFileRefs, setUploadedFileRefs] = useState<SecondaryResearchFileRef[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistedInputs = useMemo(() => {
    const content = secondaryresearch?.content;
    const inputs = content?.inputs;
    return {
      files: (inputs?.files ?? []) as Array<any>,
      links: (inputs?.links ?? []) as Array<any>,
      texts: (inputs?.texts ?? []) as Array<any>,
    };
  }, [secondaryresearch]);

  const totalFileSizeLabel = useMemo(() => {
    const totalBytes = draft.files.reduce((sum, f) => sum + (f.size ?? 0), 0);
    if (!totalBytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = totalBytes;
    let u = 0;
    while (n >= 1024 && u < units.length - 1) {
      n /= 1024;
      u += 1;
    }
    return `${n.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
  }, [draft.files]);

  const fileValidations = useMemo(
    () => draft.files.map(f => validateSecondaryResearchFile(f)),
    [draft.files]
  );

  const onFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDraft(prev => ({ ...prev, files: [...prev.files, ...Array.from(files)] }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      onFilesSelected(e.dataTransfer.files);
    },
    [onFilesSelected]
  );

  const addLinks = () => {
    const raw = draft.linkDraft.trim();
    if (!raw) return;
    const candidates = raw.split(/[\n,]+/g).map(s => s.trim()).filter(Boolean);
    if (!candidates.length) return;
    setDraft(prev => ({
      ...prev,
      links: Array.from(new Set([...prev.links, ...candidates])),
      linkDraft: '',
    }));
  };

  const isSaving = isUploadingFiles;

  const handleSaveAndUpload = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const hasFiles = draft.files.length > 0;
    const hasLinks = draft.links.length > 0;
    const hasText = draft.quotesDraft.trim().length > 0;
    if (!hasFiles && !hasLinks && !hasText) {
      setErrorMessage('Nothing to save. Add at least one file, link, or text before uploading.');
      return;
    }
    if (hasFiles) {
      const invalid = fileValidations.find(Boolean);
      if (invalid) { setErrorMessage(invalid); return; }
    }
    if (hasLinks) {
      const badUrl = draft.links.find(l => !isValidHttpUrl(l));
      if (badUrl) { setErrorMessage(`Invalid URL: ${badUrl}`); return; }
    }
    setIsUploadingFiles(true);
    let newFileRefs: SecondaryResearchFileRef[] = [];
    try {
      if (hasFiles) {
        const { uploaded, errors } = await uploadSecondaryResearchFiles({ projectId, files: draft.files, concurrency: 3 });
        newFileRefs = uploaded;
        if (uploaded.length) setUploadedFileRefs(prev => [...prev, ...uploaded]);
      }
      await saveSecondaryResearchToSupabase({ projectId, newFiles: newFileRefs.length > 0 ? newFileRefs : undefined, newLinks: hasLinks ? draft.links.map(url => ({ url })) : undefined, newTexts: hasText ? [{ text: draft.quotesDraft.trim() }] : undefined });
      const payload: Record<string, any> = { project_id: projectId, user_id: userId };
      if (newFileRefs.length) payload.files = newFileRefs;
      if (hasLinks) payload.links = draft.links.map(url => ({ url }));
      if (hasText) payload.texts = [{ text: draft.quotesDraft.trim() }];
      postSecondaryResearchToN8n({ webhookUrl: DEFAULT_SECONDARY_RESEARCH_WEBHOOK, payload: payload as any }).catch(() => {});
      setDraft({ files: [], links: [], linkDraft: '', quotesDraft: '' });
      setSuccessMessage('Saved successfully.');
      await onRefreshProject();
    } catch (e: any) {
      setErrorMessage(e.message || 'Save failed.');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
      <CardHeader className="flex flex-col items-start gap-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5 text-left">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
            <FiFileText className="size-5 shrink-0 text-gray-400" />
            Secondary Research
          </CardTitle>
          <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
            Optional · MD, TXT, PDF, DOCX (max 5MB)
          </CardDescription>
        </div>

        <Button
          type="button"
          onClick={handleSaveAndUpload}
          disabled={isSaving}
          className="w-full shrink-0 sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
              Saving...
            </>
          ) : (
            'Save and Upload'
          )}
        </Button>
      </CardHeader>

      {(errorMessage || successMessage) && (
        <div
          className={cn(
            'mx-6 mt-6 rounded-md border p-4 text-xs',
            errorMessage ? 'border-red-100 bg-red-50 text-red-800' : 'border-gray-100 bg-gray-50 text-gray-800'
          )}
        >
          {errorMessage || successMessage}
        </div>
      )}

      <CardContent className="grid grid-cols-1 gap-8 px-6 pb-6 pt-6 lg:grid-cols-3">
        {/* Column 1: Files */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <FiUpload className="size-3 shrink-0" /> Files
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex min-h-32 cursor-pointer flex-row items-center gap-3 rounded-md border border-dashed px-4 py-4 transition-all duration-200',
              isDragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'
            )}
          >
            <input ref={fileInputRef} type="file" multiple accept=".md,.txt,.pdf,.docx" className="hidden" onChange={(e) => onFilesSelected(e.target.files)} />
            <FiPlus className="size-5 shrink-0 text-gray-400" />
            <p className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">Upload or drop</p>
          </div>

          <div className="flex flex-col gap-2">
            {draft.files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs text-gray-600">
                <span className="truncate flex-1">{f.name}</span>
                <button onClick={() => setDraft(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))} className="ml-2 text-gray-400 hover:text-black">
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
            {[...persistedInputs.files, ...uploadedFileRefs].map((f: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs text-gray-900">
                <span className="truncate flex-1 font-medium">{f.originalName || f.storagePath}</span>
                <FiCheck className="w-3 h-3 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Links */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <FiLink className="size-3 shrink-0" /> Links
          </div>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://..."
              value={draft.linkDraft}
              onChange={(e) => setDraft(prev => ({ ...prev, linkDraft: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinks(); } }}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={addLinks} aria-label="Add link">
              <FiPlus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {draft.links.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs text-gray-600">
                <span className="truncate flex-1">{link}</span>
                <button onClick={() => setDraft(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))} className="ml-2 text-gray-400 hover:text-black">
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
            {persistedInputs.links.map((l: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs text-gray-900">
                <span className="truncate flex-1 font-medium">{l.url}</span>
                <FiCheck className="w-3 h-3 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Text */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <FiFileText className="size-3 shrink-0" /> Text Context
          </div>
          <Textarea
            className="min-h-32 resize-none"
            placeholder="Paste raw research here..."
            value={draft.quotesDraft}
            onChange={(e) => setDraft(prev => ({ ...prev, quotesDraft: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  );
};
