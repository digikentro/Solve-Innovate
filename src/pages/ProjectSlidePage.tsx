import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/project';
import { FiEdit } from 'react-icons/fi';

export default function ProjectSlidePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [hmw, setHmw] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProject(data);
        if (data.presentable_slide) {
          setHmw(data.presentable_slide.hmw || '');
          setBullets(data.presentable_slide.bullets || []);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    if (project?.presentable_slide) {
      setHmw(project.presentable_slide.hmw || '');
      setBullets(project.presentable_slide.bullets || []);
    }
    setEditing(false);
  };
  const handleBulletChange = (i: number, value: string) => {
    setBullets(bullets.map((b, idx) => (idx === i ? value : b)));
  };
  const handleAddBullet = () => setBullets([...bullets, '']);
  const handleRemoveBullet = (i: number) => setBullets(bullets.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    const newSlide = { hmw, bullets };
    try {
      await supabase.from('projects').update({ presentable_slide: newSlide }).eq('id', project.id);
      setProject({ ...project, presentable_slide: newSlide });
      setEditing(false);
    } catch (e) {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error || !project) return <div className="text-center py-12 text-red-600">{error || 'Project not found'}</div>;

  const slide = project.presentable_slide;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Link to={`/projects/${project.id}`} className="text-indigo-600 hover:underline text-sm">← Back to Project</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Presentable Slide</h1>
      {slide ? (
        <div className="relative rounded-2xl border-2 border-gray-300 shadow p-0 overflow-hidden">
          {/* Subtle Edit Icon Button */}
          {!editing && (
            <button
              onClick={handleEdit}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-yellow-600 hover:bg-yellow-100 transition"
              title="Edit Slide"
              aria-label="Edit Slide"
            >
              <FiEdit className="w-5 h-5" />
            </button>
          )}
          {/* HMW Statement */}
          <div className="bg-yellow-200 text-gray-900 font-bold text-2xl text-center px-12 py-8">
            {editing ? (
              <input
                className="w-full text-center font-bold text-2xl bg-yellow-100 rounded p-2"
                value={hmw}
                onChange={e => setHmw(e.target.value)}
                maxLength={200}
              />
            ) : (
              hmw
            )}
          </div>
          {/* Bullets */}
          <div className="bg-white px-16 py-10">
            {editing ? (
              <ul className="list-disc space-y-3 text-gray-800 ml-8">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <textarea
                      className="w-full bg-gray-50 rounded p-2 resize-none"
                      value={b}
                      onChange={e => handleBulletChange(i, e.target.value)}
                      rows={2}
                      maxLength={200}
                    />
                    <button onClick={() => handleRemoveBullet(i)} className="text-red-500 hover:underline text-xs">Remove</button>
                  </li>
                ))}
                <li>
                  <button onClick={handleAddBullet} className="text-indigo-600 hover:underline text-sm">+ Add Point</button>
                </li>
              </ul>
            ) : (
              <ul className="list-disc space-y-3 text-gray-800 ml-8">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-3 px-8 py-4 bg-gray-50 border-t">
            {editing && (
              <>
                <button onClick={handleCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No presentable slide has been generated for this project yet.</div>
      )}
    </div>
  );
} 