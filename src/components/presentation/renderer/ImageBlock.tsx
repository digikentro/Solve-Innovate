import type { ImageBlock as ImageBlockType } from '@/types/presentation';

export const ImageBlock = ({ src, alt }: ImageBlockType) => {
  // AI-generated image placeholders start with "image:"
  if (src.startsWith('image:')) {
    const description = src.slice(6) || alt;
    return (
      <div
        className="flex items-center justify-center rounded-xl py-8 px-4 my-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
          border: '2px dashed color-mix(in srgb, var(--primary-color) 30%, transparent)',
        }}
      >
        <p className="text-sm italic text-center" style={{ color: 'var(--subtext-color, var(--text-color))' }}>
          🖼️ {description}
        </p>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-64 object-cover rounded-xl"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};
