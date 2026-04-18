import PptxGenJS from 'pptxgenjs';

import { getThemeById } from '@/themes';
import type {
  PresentationSettings,
  SlideData,
  SpatialBlock,
  SpatialChartBlock,
  SpatialIconBlock,
  SpatialImageBlock,
  SpatialShapeBlock,
  SpatialTableBlock,
  SpatialTextBlock,
} from '@/types/presentation';

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_HEIGHT_IN = 7.5;

const toInches = (percent: number, total: number): number => (percent / 100) * total;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

const sanitizeText = (value: string): string => {
  const trimmed = value
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  if (typeof document === 'undefined') {
    return trimmed.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/\s{2,}/g, ' ').trim();
  }

  const textarea = document.createElement('textarea');
  textarea.innerHTML = trimmed;
  return textarea.value.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/\s{2,}/g, ' ').trim();
};

const isImageSource = (value: string): boolean => /^(https?:\/\/|data:image\/|blob:|\/)/i.test(value.trim());

const makeAcronym = (value: string): string => {
  const words = value
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);
  const letters = words.slice(0, 3).map((word) => word[0]?.toUpperCase() || '');
  const acronym = letters.join('');
  return acronym || 'AI';
};

const normalizeColor = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }
  const cleaned = value.trim();
  return cleaned.startsWith('#') ? cleaned : fallback;
};

const colorWithAlphaFallback = (color: string, alpha: string): string => {
  const cleaned = color.replace('#', '');
  if (cleaned.length !== 6) {
    return alpha;
  }
  return `#${cleaned}${alpha}`;
};

const resolveImageDataUrl = async (source: string): Promise<string> => {
  const normalized = source.trim();
  if (!normalized) {
    throw new Error('Missing image source');
  }
  if (normalized.startsWith('data:image/') || normalized.startsWith('blob:')) {
    return normalized;
  }

  const response = await fetch(normalized);
  if (!response.ok) {
    throw new Error(`Failed to load image: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(blob);
  });
};

const normalizeBlocks = (blocks: SpatialBlock[]): SpatialBlock[] =>
  [...blocks].sort((left, right) => {
    const leftZ = typeof left.z_index === 'number' ? left.z_index : 0;
    const rightZ = typeof right.z_index === 'number' ? right.z_index : 0;
    if (leftZ !== rightZ) {
      return leftZ - rightZ;
    }
    return left.id.localeCompare(right.id);
  });

const addTextBlock = (
  slide: PptxGenJS.Slide,
  block: SpatialTextBlock,
  themeBodyFont: string,
  themeHeadingFont: string
) => {
  const { x, y, width, height } = block.position;
  const fontSize = block.style?.font_size || (block.style?.variant === 'title' ? 24 : block.style?.variant === 'heading' ? 16 : 12);
  const isHeading = block.style?.variant === 'title' || block.style?.variant === 'heading';
  slide.addText(sanitizeText(block.content), {
    x: toInches(x, SLIDE_WIDTH_IN),
    y: toInches(y, SLIDE_HEIGHT_IN),
    w: toInches(width, SLIDE_WIDTH_IN),
    h: toInches(height, SLIDE_HEIGHT_IN),
    margin: 0.06,
    fontFace: isHeading ? themeHeadingFont : themeBodyFont,
    fontSize: clamp(fontSize, 8, 34),
    bold: isHeading || block.style?.emphasis === 'strong',
    italic: block.style?.emphasis === 'normal' ? false : undefined,
    color: block.style?.color || '#1f2937',
    align: block.style?.align || 'left',
    breakLine: false,
    fit: 'shrink',
    valign: 'mid',
  });
};

const addImageBlock = async (slide: PptxGenJS.Slide, block: SpatialImageBlock) => {
  const { x, y, width, height } = block.position;
  const left = toInches(x, SLIDE_WIDTH_IN);
  const top = toInches(y, SLIDE_HEIGHT_IN);
  const slideWidth = toInches(width, SLIDE_WIDTH_IN);
  const slideHeight = toInches(height, SLIDE_HEIGHT_IN);
  const source = block.prompt.trim();

  slide.addShape((PptxGenJS as any).ShapeType?.roundRect || 'roundRect', {
    x: left,
    y: top,
    w: slideWidth,
    h: slideHeight,
    fill: { color: '#f8fafc' },
    line: { color: '#dbe4f0', width: 1 },
  });

  if (isImageSource(source)) {
    try {
      const data = await resolveImageDataUrl(source);
      slide.addImage({ data, x: left, y: top, w: slideWidth, h: slideHeight });
      return;
    } catch {
      // Fall through to prompt placeholder below.
    }
  }

  slide.addText(block.caption || 'Image', {
    x: left + 0.18,
    y: top + 0.18,
    w: slideWidth - 0.36,
    h: 0.28,
    fontSize: 10,
    bold: true,
    color: '#0f172a',
  });
  slide.addText(source || 'Visual asset placeholder', {
    x: left + 0.18,
    y: top + 0.52,
    w: slideWidth - 0.36,
    h: Math.max(0.4, slideHeight - 0.7),
    fontSize: 9,
    color: '#475569',
    fit: 'shrink',
  });
};

const addChartBlock = (slide: PptxGenJS.Slide, block: SpatialChartBlock, primary: string) => {
  const { x, y, width, height } = block.position;
  const chartData = [
    {
      name: block.title || 'Series 1',
      labels: block.data.map((point) => point.label),
      values: block.data.map((point) => point.value),
    },
  ];

  const chartTypeMap: Record<SpatialChartBlock['chart_type'], string> = {
    bar: 'bar',
    line: 'line',
    pie: 'pie',
    donut: 'doughnut',
    area: 'area',
  };

  slide.addChart(chartTypeMap[block.chart_type] as any, chartData, {
    x: toInches(x, SLIDE_WIDTH_IN),
    y: toInches(y, SLIDE_HEIGHT_IN),
    w: toInches(width, SLIDE_WIDTH_IN),
    h: toInches(height, SLIDE_HEIGHT_IN),
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
    valAxisMinVal: 0,
    showLegend: false,
    showTitle: Boolean(block.title),
    title: block.title || undefined,
    titleFontFace: 'Outfit',
    titleFontSize: 12,
    chartColors: [block.color || primary],
    showValue: false,
    showCatName: false,
    showSerName: false,
    dataLabelColor: '#334155',
    dataLabelPosition: 'outEnd',
    border: { color: '#e2e8f0', pt: 1 },
    showBorder: true,
    showCatAxisTitle: false,
    showValAxisTitle: false,
    valGridLine: { color: '#e2e8f0', pt: 0.5 },
    catAxisLabelColor: '#475569',
    valAxisLabelColor: '#475569',
  });
};

const addIconBlock = (slide: PptxGenJS.Slide, block: SpatialIconBlock, primary: string) => {
  const { x, y, width, height } = block.position;
  const left = toInches(x, SLIDE_WIDTH_IN);
  const top = toInches(y, SLIDE_HEIGHT_IN);
  const slideWidth = toInches(width, SLIDE_WIDTH_IN);
  const slideHeight = toInches(height, SLIDE_HEIGHT_IN);

  slide.addShape((PptxGenJS as any).ShapeType?.ellipse || 'ellipse', {
    x: left,
    y: top,
    w: slideWidth,
    h: slideHeight,
    fill: { color: normalizeColor(block.color, primary) },
    line: { color: normalizeColor(block.color, primary), width: 1 },
  });
  slide.addText(makeAcronym(block.icon_query), {
    x: left,
    y: top + slideHeight * 0.18,
    w: slideWidth,
    h: slideHeight * 0.56,
    fontSize: Math.max(10, Math.floor(slideHeight * 7)),
    bold: true,
    color: '#ffffff',
    align: 'center',
    valign: 'mid',
  });
};

const addShapeBlock = (slide: PptxGenJS.Slide, block: SpatialShapeBlock, primary: string) => {
  const { x, y, width, height } = block.position;
  const left = toInches(x, SLIDE_WIDTH_IN);
  const top = toInches(y, SLIDE_HEIGHT_IN);
  const slideWidth = toInches(width, SLIDE_WIDTH_IN);
  const slideHeight = toInches(height, SLIDE_HEIGHT_IN);
  const color = normalizeColor(block.color, primary);
  const shapeType = (PptxGenJS as any).ShapeType?.[block.shape_type] || block.shape_type;

  if (block.shape_type === 'line') {
    slide.addShape(shapeType, {
      x: left,
      y: top + slideHeight / 2,
      w: slideWidth,
      h: 0,
      line: { color, width: 2 },
    });
    return;
  }

  slide.addShape(shapeType, {
    x: left,
    y: top,
    w: slideWidth,
    h: slideHeight,
    fill: { color },
    line: { color, width: 1 },
  });
};

const addTableBlock = (slide: PptxGenJS.Slide, block: SpatialTableBlock, primary: string) => {
  const { x, y, width, height } = block.position;
  const left = toInches(x, SLIDE_WIDTH_IN);
  const top = toInches(y, SLIDE_HEIGHT_IN);
  const slideWidth = toInches(width, SLIDE_WIDTH_IN);
  const slideHeight = toInches(height, SLIDE_HEIGHT_IN);
  const headers = block.data.headers;
  const rows = block.data.rows;
  const columns = Math.max(1, headers.length || (rows[0]?.length ?? 1));
  const headerHeight = slideHeight * 0.2;
  const bodyHeight = Math.max(slideHeight - headerHeight, 0.2);
  const rowHeight = rows.length > 0 ? bodyHeight / rows.length : bodyHeight;
  const columnWidth = slideWidth / columns;
  const headerFill = colorWithAlphaFallback(normalizeColor(block.color, primary), 'E6');

  slide.addShape((PptxGenJS as any).ShapeType?.roundRect || 'roundRect', {
    x: left,
    y: top,
    w: slideWidth,
    h: slideHeight,
    fill: { color: '#ffffff' },
    line: { color: '#dbe4f0', width: 1 },
  });

  headers.forEach((header, index) => {
    const cellLeft = left + index * columnWidth;
    slide.addShape((PptxGenJS as any).ShapeType?.rect || 'rect', {
      x: cellLeft,
      y: top,
      w: columnWidth,
      h: headerHeight,
      fill: { color: headerFill },
      line: { color: '#dbe4f0', width: 0.5 },
    });
    slide.addText(header, {
      x: cellLeft + 0.08,
      y: top + 0.05,
      w: columnWidth - 0.16,
      h: headerHeight - 0.08,
      fontSize: 9,
      bold: true,
      color: normalizeColor(block.color, primary),
      align: 'center',
      valign: 'mid',
      fit: 'shrink',
    });
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      const cellLeft = left + columnIndex * columnWidth;
      const cellTop = top + headerHeight + rowIndex * rowHeight;
      slide.addShape((PptxGenJS as any).ShapeType?.rect || 'rect', {
        x: cellLeft,
        y: cellTop,
        w: columnWidth,
        h: rowHeight,
        fill: { color: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' },
        line: { color: '#e2e8f0', width: 0.5 },
      });
      slide.addText(cell, {
        x: cellLeft + 0.08,
        y: cellTop + 0.04,
        w: columnWidth - 0.16,
        h: rowHeight - 0.08,
        fontSize: 8.5,
        color: '#334155',
        valign: 'mid',
        fit: 'shrink',
      });
    });
  });
};

const addSlideNumber = (slide: PptxGenJS.Slide, slideNumber: number, color: string) => {
  slide.addText(String(slideNumber), {
    x: SLIDE_WIDTH_IN - 0.55,
    y: SLIDE_HEIGHT_IN - 0.28,
    w: 0.42,
    h: 0.16,
    fontSize: 8,
    color,
    align: 'right',
  });
};

export interface SpatialDeckExportInput {
  slides: SlideData[];
  settings: PresentationSettings;
  fileName: string;
  title?: string;
}

export const exportSpatialDeckToPptx = async ({
  slides,
  settings,
  fileName,
  title,
}: SpatialDeckExportInput): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('PPTX export is only available in the browser.');
  }

  const theme = getThemeById(settings.theme);
  const primary = normalizeColor(settings.customColors?.primary, theme.colors.primary);
  const accent = normalizeColor(settings.customColors?.accent || settings.customColors?.bg, theme.colors.accent || primary);
  const background = normalizeColor(settings.customColors?.background || settings.customColors?.bg, theme.colors.bg);
  const text = normalizeColor(settings.customColors?.text, theme.colors.text);
  const subtext = theme.colors.subtext || '#64748b';

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'SolveSmart';
  pptx.company = 'SolveSmart';
  pptx.subject = title || 'Presentation';
  pptx.title = title || fileName.replace(/\.pptx$/i, '');
  pptx.lang = settings.language || 'en-US';

  for (const [slideIndex, slideData] of slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: background.replace('#', '') };

    slide.addShape((PptxGenJS as any).ShapeType?.rect || 'rect', {
      x: 0,
      y: 0,
      w: SLIDE_WIDTH_IN,
      h: 0.08,
      fill: { color: primary.replace('#', '') },
      line: { color: primary.replace('#', ''), width: 0 },
    });

    slide.addText(slideData.title, {
      x: 0.28,
      y: 0.18,
      w: SLIDE_WIDTH_IN - 0.9,
      h: 0.32,
      fontFace: theme.fonts.heading,
      fontSize: 11,
      bold: true,
      color: text,
      fit: 'shrink',
    });

    const blocks = normalizeBlocks(slideData.blocks);
    for (const block of blocks) {
      if (block.type === 'text') {
        addTextBlock(slide, block as SpatialTextBlock, theme.fonts.body, theme.fonts.heading);
        continue;
      }

      if (block.type === 'image') {
        await addImageBlock(slide, block as SpatialImageBlock);
        continue;
      }

      if (block.type === 'chart') {
        addChartBlock(slide, block as SpatialChartBlock, primary);
        continue;
      }

      if (block.type === 'icon') {
        addIconBlock(slide, block as SpatialIconBlock, accent);
        continue;
      }

      if (block.type === 'shape') {
        addShapeBlock(slide, block as SpatialShapeBlock, primary);
        continue;
      }

      if (block.type === 'table') {
        addTableBlock(slide, block as SpatialTableBlock, primary);
      }
    }

    addSlideNumber(slide, slideIndex + 1, subtext);
  }

  await pptx.writeFile({ fileName });
};
