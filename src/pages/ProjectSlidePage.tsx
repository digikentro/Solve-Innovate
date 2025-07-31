import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/project';
import { PresentableSlideCard } from '@/components/project/PresentableSlideCard';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import { FiArrowLeft } from 'react-icons/fi';
// Add more sets as needed

const ICON_SETS = {
  fi: FiIcons,
  fa: FaIcons,
  md: MdIcons,
} as const;
type IconSetKey = keyof typeof ICON_SETS;

// Build a flat searchable icon list for the picker
type IconMeta = { iconSet: IconSetKey; iconName: string; icon: React.ComponentType<any> };
const ALL_ICONS: IconMeta[] = [
  ...Object.entries(FiIcons).map(([name, icon]) => ({ iconSet: 'fi' as IconSetKey, iconName: name, icon: icon as React.ComponentType<any> })),
  ...Object.entries(FaIcons).map(([name, icon]) => ({ iconSet: 'fa' as IconSetKey, iconName: name, icon: icon as React.ComponentType<any> })),
  ...Object.entries(MdIcons).map(([name, icon]) => ({ iconSet: 'md' as IconSetKey, iconName: name, icon: icon as React.ComponentType<any> })),
];

function DynamicIcon({ iconSet, iconName, ...props }: { iconSet: IconSetKey; iconName: string;[key: string]: any }) {
  if (!iconSet || !iconName) return null;
  const Set = ICON_SETS[iconSet];
  if (!Set) return null;
  const IconComp = (Set as Record<string, React.ComponentType<any>>)[iconName];
  if (!IconComp) return null;
  return <IconComp {...props} />;
}

export default function ProjectSlidePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [hmw, setHmw] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [iconSet, setIconSet] = useState<string>(''); // '' means no icon
  const [iconName, setIconName] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFD82B');
  const [saving, setSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const navigate = useNavigate();

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
          setIconSet(data.presentable_slide.iconSet || '');
          setIconName(data.presentable_slide.iconName || '');
          setBackgroundColor(data.presentable_slide.backgroundColor || '#FFD82B');
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
      setIconSet(project.presentable_slide.iconSet || '');
      setIconName(project.presentable_slide.iconName || '');
      setBackgroundColor(project.presentable_slide.backgroundColor || '#FFD82B');
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
    const newSlide = { hmw, bullets, iconSet, iconName, backgroundColor };
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

  const slide: { hmw: string; bullets: string[]; iconSet?: string; iconName?: string; backgroundColor?: string } = project.presentable_slide || { hmw: '', bullets: [], iconSet: '', iconName: '', backgroundColor: '' };
  const SlideIcon = iconSet && iconName ? () => <DynamicIcon iconSet={iconSet as IconSetKey} iconName={iconName} className="w-16 h-16 text-gray-700" /> : null;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center mb-6 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-indigo-700 shadow hover:bg-indigo-50 hover:text-indigo-900 transition border border-indigo-200"
          type="button"
          aria-label="Back"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold m-0">Presentable Slide</h1>
      </div>
      {slide ? (
        <PresentableSlideCard
          hmw={hmw}
          bullets={bullets}
          iconSet={iconSet as IconSetKey}
          iconName={iconName || ''}
          backgroundColor={backgroundColor}
          editing={editing}
          saving={saving}
          iconPickerOpen={iconPickerOpen}
          iconSearch={iconSearch}
          setIconPickerOpen={setIconPickerOpen}
          setIconSet={setIconSet}
          setIconName={setIconName}
          setIconSearch={setIconSearch}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          handleAddBullet={handleAddBullet}
          handleRemoveBullet={handleRemoveBullet}
          handleBulletChange={handleBulletChange}
          setHmw={setHmw}
          setBackgroundColor={setBackgroundColor}
        />
      ) : (
        <div className="text-gray-500">No presentable slide has been generated for this project yet.</div>
      )}
    </div>
  );
} 