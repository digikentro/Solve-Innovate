import { useCallback, useMemo, useRef, useState } from 'react';
import { FiCheck, FiFileText, FiLink, FiLoader, FiPlus, FiSave, FiTrash2, FiTrendingUp, FiUpload, FiX } from 'react-icons/fi';
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

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5 text-white" />
          </div>
          Project Information
        </h3>
      </div>

      <div className="p-8">
        <dl className="space-y-8">
          <div className="group">
            <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Description</dt>
            <dd className="text-gray-900 leading-relaxed bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              {project.description || 'No description provided'}
            </dd>
          </div>

          {project.skills && project.skills.length > 0 && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Skills & Technologies</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-3">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}

          {project.design_research?.generated_at && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Extreme User Analysis</dt>
              <dd className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold">Generated on: {new Date(project.design_research.generated_at).toLocaleString()}</span>
                  </div>
                  {project.design_research.form && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-green-300">
                      <p className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Generation Parameters
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-gray-700">Step:</span> <span className="text-gray-600">{project.design_research.form.painPointStep}</span></p>
                        <p><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-600">{project.design_research.form.painPointDescription}</span></p>
                        <p><span className="font-medium text-gray-700">User Context:</span> <span className="text-gray-600">{project.design_research.form.targetUserContext}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>
          )}

          {project.deep_empathy_data?.generated_at && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Deep Empathy Research</dt>
              <dd className="bg-purple-50/80 p-6 rounded-2xl border border-purple-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-semibold">Generated on: {new Date(project.deep_empathy_data.generated_at).toLocaleString()}</span>
                  </div>
                  {project.deep_empathy_data.form && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-purple-300">
                      <p className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Generation Parameters
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-gray-700">Prioritized Pain Point:</span> <span className="text-gray-600">{project.deep_empathy_data.form.prioritizedPainPoint}</span></p>
                        <p><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-600">{project.deep_empathy_data.form.painPointDescription}</span></p>
                        <p><span className="font-medium text-gray-700">Selected Extreme User:</span> <span className="text-gray-600">{project.deep_empathy_data.form.selectedExtremeUser}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
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

  // Drag-and-drop state
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

  // Inline validation memo
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
    const candidates = raw
      .split(/[\n,]+/g)
      .map(s => s.trim())
      .filter(Boolean);
    if (!candidates.length) return;
    setDraft(prev => ({
      ...prev,
      links: Array.from(new Set([...prev.links, ...candidates])),
      linkDraft: '',
    }));
  };


  const isSaving = isUploadingFiles;

  // ── Unified "Save and Upload" ──
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

    // Pre-flight validation
    if (hasFiles) {
      const invalid = fileValidations.find(Boolean);
      if (invalid) { setErrorMessage(invalid); return; }
    }
    if (hasLinks) {
      const badUrl = draft.links.find(l => !isValidHttpUrl(l));
      if (badUrl) { setErrorMessage(`Invalid URL: ${badUrl}`); return; }
    }

    setIsUploadingFiles(true); // spinner ON
    const allErrors: string[] = [];
    let newFileRefs: SecondaryResearchFileRef[] = [];

    try {
      // Step 1: Upload files to Supabase Storage
      if (hasFiles) {
        const { uploaded, errors } = await uploadSecondaryResearchFiles({
          projectId,
          files: draft.files,
          concurrency: 3,
        });
        newFileRefs = uploaded;
        if (errors.length) allErrors.push(...errors.map(e => `${e.file.name}: ${e.message}`));

        if (uploaded.length) {
          setUploadedFileRefs(prev => [...prev, ...uploaded]);
        }
      }

      // Step 2: Persist everything directly to Supabase (always works, no n8n needed)
      await saveSecondaryResearchToSupabase({
        projectId,
        newFiles: newFileRefs.length > 0 ? newFileRefs : undefined,
        newLinks: hasLinks ? draft.links.map(url => ({ url })) : undefined,
        newTexts: hasText ? [{ text: draft.quotesDraft.trim() }] : undefined,
      });

      // Step 3: Optionally fire n8n for AI processing (best-effort, non-blocking)
      const payload: Record<string, any> = { project_id: projectId, user_id: userId };
      if (newFileRefs.length) payload.files = newFileRefs;
      if (hasLinks) payload.links = draft.links.map(url => ({ url }));
      if (hasText) payload.texts = [{ text: draft.quotesDraft.trim() }];

      postSecondaryResearchToN8n({ webhookUrl: DEFAULT_SECONDARY_RESEARCH_WEBHOOK, payload: payload as any })
        .catch((e: Error) => console.warn('[SecondaryResearch] n8n webhook not available (non-critical):', e.message));

      // Reset draft
      setDraft({ files: [], links: [], linkDraft: '', quotesDraft: '' });

      if (allErrors.length) {
        setErrorMessage(allErrors.slice(0, 5).join('\n'));
      } else {
        setSuccessMessage('Saved! Research uploaded and stored. AI processing queued.');
      }

      await onRefreshProject();
    } catch (e) {
      allErrors.push(e instanceof Error ? e.message : 'Save failed.');
      setErrorMessage(allErrors.slice(0, 5).join('\n'));
    } finally {
      setIsUploadingFiles(false); // spinner OFF
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-blue-600 rounded-xl flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            Secondary Research
            <span className="text-sm font-normal text-gray-400 ml-1">(optional)</span>
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Allowed files: <strong>MD, TXT, PDF, DOCX</strong> · Max <strong>5 MB</strong> per file.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAndUpload}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-700 to-blue-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSaving
            ? <><FiLoader className="w-4 h-4 animate-spin" /> Saving…</>
            : <><FiSave className="w-4 h-4" /> Save and Upload</>
          }
        </button>
      </div>

      {/* ── Status Banner ── */}
      {(errorMessage || successMessage) && (
        <div
          className={`flex items-start gap-3 mx-8 mt-5 rounded-2xl border p-4 text-sm whitespace-pre-wrap
            ${errorMessage
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
        >
          {errorMessage
            ? <FiX className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          }
          <span>{errorMessage || successMessage}</span>
        </div>
      )}

      {/* ── Three-Column Body ── */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ─── Column 1: Upload Files ─── */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FiUpload className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-gray-800">Upload Files</span>
            {draft.files.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 tabular-nums">
                {draft.files.length} file{draft.files.length !== 1 ? 's' : ''} · {totalFileSizeLabel}
              </span>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 min-h-[110px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${isDragOver
                ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                : 'border-gray-300 bg-white/90 hover:border-blue-300 hover:bg-blue-50/30'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,.pdf,.docx"
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <FiUpload className={`w-5 h-5 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <p className="text-xs text-center text-gray-500 leading-relaxed px-4">
              <span className="font-semibold text-slate-700">Drop Files here</span><br />Or click to Upload
            </p>
          </div>

          {/* Staged files list */}
          {draft.files.length > 0 && (
            <div className="space-y-2">
              {draft.files.map((f, idx) => {
                const err = fileValidations[idx];
                return (
                  <div
                    key={`${f.name}-${f.size}-${idx}`}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${err ? 'bg-red-50 border-red-200' : 'bg-white/90 border-gray-200'}`}
                  >
                    <FiFileText className={`w-3.5 h-3.5 flex-shrink-0 ${err ? 'text-red-400' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{f.name}</p>
                      {err
                        ? <p className="text-xs text-red-600 mt-0.5">{err}</p>
                        : <p className="text-xs text-gray-500">{Math.round((f.size ?? 0) / 1024)} KB</p>
                      }
                    </div>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => setDraft(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-0.5"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Previously uploaded files */}
          {(persistedInputs.files.length > 0 || uploadedFileRefs.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Uploaded</p>
              <div className="space-y-2">
                {[...persistedInputs.files, ...uploadedFileRefs].map((f: any, idx: number) => {
                  const path = f.storagePath;
                  const bucket = f.bucket ?? 'secondary-research';
                  const url = path ? getPublicFileUrl({ bucket, storagePath: path }) : null;
                  return (
                    <div
                      key={`${path || 'local'}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-white/90 border border-emerald-100 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{f.originalName || path}</p>
                      </div>
                      {url ? (
                        <a
                          className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex-shrink-0"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 flex-shrink-0">No path</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Column 2: Upload Links ─── */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FiLink className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-gray-800">Upload Links</span>
          </div>

          {/* Link input row */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com"
              value={draft.linkDraft}
              onChange={(e) => setDraft(prev => ({ ...prev, linkDraft: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinks(); } }}
              className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              title="Add link"
              onClick={addLinks}
              disabled={!draft.linkDraft.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-slate-600 to-blue-600 text-white flex items-center justify-center shadow hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Staged link pills */}
          {draft.links.length > 0 && (
            <div className="flex flex-col gap-2">
              {draft.links.map((link, idx) => (
                <div
                  key={`${link}-${idx}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isValidHttpUrl(link) ? 'bg-white/90 border-gray-200' : 'bg-red-50 border-red-200'}`}
                >
                  <FiLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                  <span className="flex-1 truncate text-indigo-700">{link}</span>
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, links: [] }))}
                className="self-end text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <FiTrash2 className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}

          {/* Previously uploaded links */}
          {persistedInputs.links.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previously Uploaded</p>
              <div className="flex flex-col gap-2">
                {persistedInputs.links.map((l: any, idx: number) => (
                  <a
                    key={`${l.url}-${idx}`}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-indigo-700 hover:text-indigo-800 break-all bg-white/90 border border-emerald-100 rounded-xl px-3 py-2"
                  >
                    <FiLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    {l.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Column 3: Upload Text ─── */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-gray-800">Upload Text</span>
          </div>

          <textarea
            className="flex-1 w-full min-h-[150px] rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Write something… Paste quotes, verbatims, notes, or any raw research text here."
            value={draft.quotesDraft}
            onChange={(e) => setDraft(prev => ({ ...prev, quotesDraft: e.target.value }))}
          />

          {/* Previously uploaded texts */}
          {persistedInputs.texts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previously Uploaded</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {persistedInputs.texts.slice(-3).map((t: any, idx: number) => (
                  <div
                    key={`${idx}-${String(t.addedAt || '')}`}
                    className="text-xs text-gray-700 bg-white/90 border border-emerald-100 rounded-xl px-3 py-2 whitespace-pre-wrap line-clamp-4"
                  >
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
