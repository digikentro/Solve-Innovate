import type { CalloutBlock as CalloutBlockType } from '@/types/presentation';

const ICON_MAP: Record<string, string> = {
  lightbulb: '💡',
  warning: '⚠️',
  info: 'ℹ️',
  check: '✅',
};

export const CalloutBlock = ({ icon, title, body }: CalloutBlockType) => {
  const emoji = ICON_MAP[icon] || '•';

  return (
    <div
      className="p-4 rounded-xl my-2 break-words"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
        borderLeft: '4px solid var(--primary-color)',
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{emoji}</span>
          <span
            className="font-bold text-sm md:text-base"
            style={{ color: 'var(--primary-color)' }}
          >
            {title}
          </span>
        </div>
      )}
      {body && (
        <p
          className="text-sm md:text-[15px] leading-relaxed break-words"
          style={{ color: 'var(--text-color)' }}
        >
          {body}
        </p>
      )}
    </div>
  );
};
