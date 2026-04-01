import type { ImageBlock as ImageBlockType } from '@/types/presentation';

export const ImageBlock = ({ src, alt }: ImageBlockType) => {
  // AI-generated image placeholders start with "image:"
  if (src.startsWith('image:')) {
    const description = src.slice(6).trim() || alt || 'AI image';
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl py-6 px-4 my-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
          border: '2px dashed color-mix(in srgb, var(--primary-color) 30%, transparent)',
          minHeight: '120px',
        }}
      >
        <span className="text-3xl mb-2">🖼️</span>
        <p className="text-xs italic text-center max-w-xs" style={{ color: 'var(--subtext-color, var(--text-color))' }}>
          {description}
        </p>
        <p className="text-[10px] mt-1 font-semibold uppercase tracking-wide opacity-60" style={{ color: 'var(--primary-color)' }}>
          Click "Edit Slide" → hover block → Edit to generate
        </p>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-56 object-cover rounded-xl"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};
