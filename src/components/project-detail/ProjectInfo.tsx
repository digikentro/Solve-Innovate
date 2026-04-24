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

interface ProjectInfoProps {
  project: Project;
}

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  return (
    <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden mb-8">
      <CardHeader className="border-b border-gray-100 py-6">
        <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-3">
          <FiInfo className="w-5 h-5 text-gray-400" />
          Project Information
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8">
        <dl className="space-y-10">
          <div className="group">
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Description</dt>
            <dd className="text-gray-600 leading-relaxed text-lg">
              {project.description || 'No description provided'}
            </dd>
          </div>

          {project.skills && project.skills.length > 0 && (
            <div className="group">
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Skills & Technologies</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-white text-gray-600 border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}

          {project.design_research?.generated_at && (
            <div className="group pt-6 border-t border-gray-100">
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Extreme User Analysis</dt>
              <dd className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium">Generated on: {new Date(project.design_research.generated_at).toLocaleString()}</span>
                </div>
                {project.design_research.form && (
                  <div className="space-y-4 text-sm text-gray-600">
                    <p><span className="font-semibold text-gray-900">Step:</span> {project.design_research.form.painPointStep}</p>
                    <p><span className="font-semibold text-gray-900">Description:</span> {project.design_research.form.painPointDescription}</p>
                    <p><span className="font-semibold text-gray-900">User Context:</span> {project.design_research.form.targetUserContext}</p>
                  </div>
                )}
              </dd>
            </div>
          )}

          {project.deep_empathy_data?.generated_at && (
            <div className="group pt-6 border-t border-gray-100">
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Deep Empathy Research</dt>
              <dd className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium">Generated on: {new Date(project.deep_empathy_data.generated_at).toLocaleString()}</span>
                </div>
                {project.deep_empathy_data.form && (
                  <div className="space-y-4 text-sm text-gray-600">
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
    <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden mb-8">
      <CardHeader className="border-b border-gray-100 py-5 flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-3">
            <FiFileText className="w-5 h-5 text-gray-400" />
            Secondary Research
          </CardTitle>
          <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest">
            Optional · MD, TXT, PDF, DOCX (Max 5MB)
          </p>
        </div>

        <Button
          onClick={handleSaveAndUpload}
          disabled={isSaving}
          className="bg-[#0f121f] text-white hover:bg-[#0f121f]/90 rounded-xl h-10 px-6 font-normal"
        >
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Saving...</> : 'Save and Upload'}
        </Button>
      </CardHeader>

      {(errorMessage || successMessage) && (
        <div className={`mx-6 mt-6 p-4 text-xs border ${errorMessage ? 'bg-red-50 border-red-100 text-red-800' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
          {errorMessage || successMessage}
        </div>
      )}

      <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Files */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            <FiUpload className="w-3 h-3" /> Files
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 h-32 border border-dashed transition-all duration-200 cursor-pointer
              ${isDragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}
            `}
          >
            <input ref={fileInputRef} type="file" multiple accept=".md,.txt,.pdf,.docx" className="hidden" onChange={(e) => onFilesSelected(e.target.files)} />
            <FiPlus className="w-5 h-5 text-gray-300" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Upload or Drop</p>
          </div>

          <div className="space-y-2">
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            <FiLink className="w-3 h-3" /> Links
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={draft.linkDraft}
              onChange={(e) => setDraft(prev => ({ ...prev, linkDraft: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinks(); } }}
              className="flex-1 border-b border-gray-200 py-1 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors"
            />
            <button onClick={addLinks} className="text-gray-400 hover:text-black">
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            <FiFileText className="w-3 h-3" /> Text Context
          </div>
          <textarea
            className="w-full h-32 p-3 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-black resize-none"
            placeholder="Paste raw research here..."
            value={draft.quotesDraft}
            onChange={(e) => setDraft(prev => ({ ...prev, quotesDraft: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  );
};
