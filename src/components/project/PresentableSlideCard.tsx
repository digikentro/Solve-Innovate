import React, { useState } from 'react';
import { FiEdit, FiPlus } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as RiIcons from 'react-icons/ri';

const ICON_SETS = { fi: FiIcons, fa: FaIcons, md: MdIcons, ri: RiIcons } as const;
type IconSetKey = keyof typeof ICON_SETS;

function DynamicIcon({ iconSet, iconName, ...props }: { iconSet?: IconSetKey | ''; iconName?: string;[key: string]: any }) {
    if (!iconSet || !iconName) return null;
    const Set = ICON_SETS[iconSet];
    if (!Set) return null;
    const IconComp = (Set as Record<string, React.ComponentType<any>>)[iconName];
    if (!IconComp) return null;
    return <IconComp {...props} />;
}

// Icon meta for picker (should be imported or generated elsewhere in real app)
const ALL_ICONS: { iconSet: IconSetKey; iconName: string; icon: React.ComponentType<any> }[] = [
    ...Object.entries(FiIcons).map(([name, icon]) => ({ iconSet: 'fi' as IconSetKey, iconName: name, icon })),
    ...Object.entries(FaIcons).map(([name, icon]) => ({ iconSet: 'fa' as IconSetKey, iconName: name, icon })),
    ...Object.entries(MdIcons).map(([name, icon]) => ({ iconSet: 'md' as IconSetKey, iconName: name, icon })),
    ...Object.entries(RiIcons).map(([name, icon]) => ({ iconSet: 'ri' as IconSetKey, iconName: name, icon })),
];

interface PresentableSlideCardProps {
    hmw: string;
    bullets: string[];
    iconSet?: IconSetKey | '';
    iconName?: string;
    editing?: boolean;
    saving?: boolean;
    iconPickerOpen?: boolean;
    iconSearch?: string;
    setIconPickerOpen?: (open: boolean) => void;
    setIconSet?: (set: IconSetKey | '') => void;
    setIconName?: (name: string) => void;
    setIconSearch?: (search: string) => void;
    handleEdit?: () => void;
    handleCancel?: () => void;
    handleSave?: () => void;
    handleAddBullet?: () => void;
    handleRemoveBullet?: (i: number) => void;
    handleBulletChange?: (i: number, value: string) => void;
    setHmw?: (hmw: string) => void;
}

export const PresentableSlideCard: React.FC<PresentableSlideCardProps> = ({
    hmw,
    bullets,
    iconSet,
    iconName,
    editing = false,
    saving = false,
    iconPickerOpen = false,
    iconSearch = '',
    setIconPickerOpen = () => { },
    setIconSet = () => { },
    setIconName = () => { },
    setIconSearch = () => { },
    handleEdit = () => { },
    handleCancel = () => { },
    handleSave = () => { },
    handleAddBullet = () => { },
    handleRemoveBullet = () => { },
    handleBulletChange = () => { },
    setHmw = () => { },
}) => {
    return (
        <div className="relative rounded-2xl border-2 border-gray-300 shadow p-0 overflow-hidden">
            {/* Subtle Edit Icon Button */}
            {!editing && (
                <button
                    onClick={handleEdit}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 transition"
                    title="Edit Slide"
                    aria-label="Edit Slide"
                >
                    <FiEdit className="w-5 h-5" />
                </button>
            )}
            {/* HMW Statement */}
            <div className="bg-[#FFD82B] text-gray-900 font-bold text-5xl px-12 py-8 leading-[1.2]">
                {editing ? (
                    <textarea
                        className="w-full font-bold text-5xl bg-yellow-200 rounded resize-none px-2 leading-[1.2]"
                        value={hmw}
                        onChange={e => {
                            setHmw(e.target.value);
                            const ta = e.target as HTMLTextAreaElement;
                            ta.style.height = 'auto';
                            ta.style.height = ta.scrollHeight + 'px';
                        }}
                        rows={1}
                        maxLength={200}
                        style={{ overflow: 'hidden', minHeight: 48 }}
                        ref={el => {
                            if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                            }
                        }}
                    />
                ) : (
                    hmw
                )}
            </div>
            {/* Bullets + Icon */}
            <div className={`bg-white px-10 py-10 flex ${(iconSet && iconName) || (editing ? 'gap-8 items-start' : '')}`}>
                {/* Icon on the left, or placeholder if editing and no icon */}
                {((iconSet && iconName) || editing) ? (
                    <div className="flex flex-col items-center pt-2 pr-10 min-w-[64px]">
                        {iconSet && iconName && (
                            <span
                                className="cursor-pointer"
                                onClick={editing ? () => setIconPickerOpen(true) : undefined}
                                title="Change Icon"
                            >
                                <DynamicIcon
                                    iconSet={iconSet as IconSetKey}
                                    iconName={iconName}
                                    className="w-64 h-64 text-gray-700"
                                />
                            </span>
                        )}

                        {!(iconSet && iconName) && editing && (
                            <button
                                className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-yellow-400 hover:text-yellow-600 transition cursor-pointer"
                                type="button"
                                onClick={() => setIconPickerOpen(true)}
                                title="Add Icon"
                            >
                                <FiPlus className="w-8 h-8" />
                            </button>
                        )}

                        {editing && iconSet && iconName && (
                            <button
                                className="mt-2 text-xs text-indigo-600"
                                type="button"
                                onClick={() => setIconPickerOpen(true)}
                            >
                                Change Icon
                            </button>
                        )}
                    </div>
                ) : (
                    // ELSE: Placeholder content here
                    <div className="flex flex-col items-center pt-2 pr-10 min-w-[64px]">
                    </div>
                )}

                {/* Bullets on the right */}
                <div className={`flex-1 ${!iconSet ? '' : ''}`}>
                    {editing ? (
                        <div className={`space-y-3 text-gray-800 ${iconSet ? 'ml-8' : ''}`}>
                            {bullets.map((b, i) => (
                                <div key={i} className="relative flex items-center">
                                    <textarea
                                        className="w-full text-xl bg-gray-100 rounded p-2 resize-none pr-8"
                                        value={b}
                                        onChange={e => {
                                            handleBulletChange(i, e.target.value);
                                            const ta = e.target as HTMLTextAreaElement;
                                            ta.style.height = 'auto';
                                            ta.style.height = ta.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        maxLength={200}
                                        style={{ overflow: 'hidden', minHeight: 40 }}
                                        ref={el => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = el.scrollHeight + 'px';
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRemoveBullet(i)}
                                        className="absolute top-1 right-1 text-gray-400 hover:text-red-500 text-lg px-1"
                                        title="Remove"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div>
                                <button onClick={handleAddBullet} className="text-indigo-600 hover:underline text-sm mt-2">+ Add Point</button>
                            </div>
                        </div>
                    ) : (
                        <ul className={`list-disc text-2xl space-y-3 text-gray-800 ${iconSet ? 'ml-8' : ''}`}>
                            {bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {/* Icon Picker Modal */}
            {editing && iconPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative">
                        <h3 className="text-lg font-semibold mb-4">Select an Icon</h3>
                        <input
                            type="text"
                            className="mb-4 w-full border rounded px-3 py-2"
                            placeholder="Search icons..."
                            value={iconSearch}
                            onChange={e => setIconSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="grid grid-cols-4 gap-6 mb-4 max-h-96 overflow-y-auto">
                            <button
                                type="button"
                                className={`flex flex-col items-center p-4 rounded border ${(iconSet === '' && iconName === '') ? 'border-yellow-500 bg-yellow-100' : 'border-gray-200 bg-white'} hover:border-yellow-400`}
                                onClick={() => { setIconSet(''); setIconName(''); setIconPickerOpen(false); }}
                            >
                                <span className="w-20 h-20 flex items-center justify-center text-gray-400 text-4xl"> </span>
                            </button>
                            {ALL_ICONS.filter((meta) => meta.iconName.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 200).map(({ iconSet: setKey, iconName: name, icon: IconComp }) => {
                                // Format the icon name for display: remove prefix and add spaces
                                const displayName = name.replace(/^(Fi|Fa|Md|Ri)/, '').replace(/([A-Z])/g, ' $1').trim();
                                return (
                                  <button
                                    key={setKey + name}
                                    type="button"
                                    className={`flex flex-col items-center p-4 rounded border ${(iconSet === setKey && iconName === name) ? 'border-yellow-500 bg-yellow-100' : 'border-gray-200 bg-white'} hover:border-yellow-400`}
                                    onClick={() => { setIconSet(setKey); setIconName(name); setIconPickerOpen(false); }}
                                    title={displayName}
                                  >
                                    <IconComp className="w-20 h-20 text-4xl" />
                                    <span className="mt-2 text-xs text-gray-700 text-center">{displayName}</span>
                                  </button>
                                );
                              })}
                        </div>
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                            onClick={() => setIconPickerOpen(false)}
                            title="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            {editing && (
                <div className="flex justify-end gap-3 px-8 py-1 border-t">
                    <>
                        <button onClick={handleCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    </>
                </div>
            )}
        </div>
    );
}; 