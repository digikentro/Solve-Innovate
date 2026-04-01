import { renderToStaticMarkup } from 'react-dom/server';
import { SlideRenderer } from '@/components/presentation/renderer/SlideRenderer';
import type { HeadingBlock, MarkdownBlock, SlideData, Theme } from '@/types/presentation';
import { parseSlideMarkdown } from './markdownParser';
import { blocksToMarkdown } from './slideEditor';

interface PaginationOptions {
  theme: Theme;
  logoUrl?: string | null;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

let measureHost: HTMLDivElement | null = null;

const getMeasureHost = (): HTMLDivElement | null => {
  if (typeof document === 'undefined') return null;
  if (measureHost) return measureHost;

  const host = document.createElement('div');
  host.setAttribute('data-slide-measure-host', 'true');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.width = '1280px';
  host.style.height = '720px';
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.visibility = 'hidden';
  host.style.zIndex = '-1';
  document.body.appendChild(host);
  measureHost = host;
  return measureHost;
};

const measureOverflow = (blocks: MarkdownBlock[], options: PaginationOptions): boolean => {
  const host = getMeasureHost();
  if (!host) return false;

  host.innerHTML = renderToStaticMarkup(
    <SlideRenderer
      blocks={blocks}
      theme={options.theme}
      logoUrl={options.logoUrl || undefined}
      logoPosition={options.logoPosition}
      role="measure"
      scale={1}
    />
  );

  const content = host.querySelector('[data-slide-content="true"]') as HTMLElement | null;
  if (!content) return false;
  return content.scrollHeight > content.clientHeight + 1;
};

const stripContinuation = (text: string): string =>
  text.replace(/\s*\(cont\.\)\s*$/i, '').trim();

const splitWords = (text: string, maxWords: number): string[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  if (words.length <= maxWords) return [words.join(' ')];
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(' '));
  }
  return chunks;
};

const splitSentenceLike = (text: string, maxWords: number): string[] => {
  const sentenceParts = text
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!sentenceParts.length) return splitWords(text, maxWords);

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  sentenceParts.forEach((part) => {
    const words = part.split(/\s+/).filter(Boolean).length;
    if (words > maxWords) {
      if (current.length) {
        chunks.push(current.join(' '));
        current = [];
        currentWords = 0;
      }
      chunks.push(...splitWords(part, maxWords));
      return;
    }
    if (currentWords + words > maxWords && current.length) {
      chunks.push(current.join(' '));
      current = [part];
      currentWords = words;
      return;
    }
    current.push(part);
    currentWords += words;
  });

  if (current.length) chunks.push(current.join(' '));
  return chunks.filter(Boolean);
};

const chunkArray = <T,>(values: T[], chunkSize: number): T[][] => {
  const size = Math.max(1, chunkSize);
  const output: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    output.push(values.slice(i, i + size));
  }
  return output;
};

const splitTableRowCells = (row: string[], maxWordsPerCell: number): string[][] => {
  const cellChunks = row.map((cell) => splitWords(cell, maxWordsPerCell));
  const rowCount = Math.max(1, ...cellChunks.map((chunks) => chunks.length || 1));
  const rows: string[][] = [];
  for (let i = 0; i < rowCount; i += 1) {
    rows.push(
      cellChunks.map((chunks) => {
        if (!chunks.length) return '';
        return chunks[Math.min(i, chunks.length - 1)];
      })
    );
  }
  return rows;
};

const splitBlockFiner = (block: MarkdownBlock, depth: number): MarkdownBlock[] => {
  switch (block.type) {
    case 'paragraph': {
      if (depth >= 3) return splitWords(block.text, 9).map((text) => ({ type: 'paragraph', text }));
      const maxWords = depth === 1 ? 22 : 12;
      return splitSentenceLike(block.text, maxWords).map((text) => ({ type: 'paragraph', text }));
    }
    case 'bullet_list': {
      if (depth === 1) {
        return chunkArray(block.items, 4).map((items) => ({ type: 'bullet_list', items }));
      }
      const items = block.items.flatMap((item) => splitSentenceLike(item, depth >= 3 ? 9 : 12));
      return items.map((item) => ({ type: 'bullet_list', items: [item] }));
    }
    case 'numbered_list': {
      if (depth === 1) {
        return chunkArray(block.items, 4).map((items) => ({ type: 'numbered_list', items }));
      }
      const items = block.items.flatMap((item) => splitSentenceLike(item, depth >= 3 ? 9 : 12));
      return items.map((item) => ({ type: 'numbered_list', items: [item] }));
    }
    case 'table': {
      if (!block.rows.length) return [block];
      if (depth === 1) {
        return chunkArray(block.rows, 4).map((rows) => ({
          type: 'table',
          headers: [...block.headers],
          rows,
        }));
      }
      const expandedRows = block.rows.flatMap((row) => splitTableRowCells(row, depth >= 3 ? 8 : 12));
      return chunkArray(expandedRows, depth >= 3 ? 1 : 2).map((rows) => ({
        type: 'table',
        headers: [...block.headers],
        rows,
      }));
    }
    case 'metric_row': {
      const chunkSize = depth >= 2 ? 1 : 3;
      return chunkArray(block.metrics, chunkSize).map((metrics) => ({
        type: 'metric_row',
        metrics,
      }));
    }
    default:
      return [block];
  }
};

const ensureUnitFits = (
  block: MarkdownBlock,
  options: PaginationOptions,
  depth = 0
): MarkdownBlock[] => {
  if (!measureOverflow([block], options)) return [block];
  if (depth >= 3) return [block];
  const finer = splitBlockFiner(block, depth + 1);
  if (finer.length <= 1) return [block];
  return finer.flatMap((item) => ensureUnitFits(item, options, depth + 1));
};

const isHeadingBlock = (block: MarkdownBlock | undefined): block is HeadingBlock =>
  Boolean(block && block.type === 'heading');

const buildContinuationHeading = (heading: HeadingBlock | null): HeadingBlock | null => {
  if (!heading) return null;
  return {
    type: 'heading',
    level: heading.level,
    text: `${stripContinuation(heading.text)} (cont.)`,
  };
};

const hasBodyContent = (blocks: MarkdownBlock[], heading: HeadingBlock | null): boolean =>
  heading ? blocks.length > 1 : blocks.length > 0;

const splitOverflowPage = (
  page: MarkdownBlock[],
  options: PaginationOptions,
  continuationHeading: HeadingBlock | null,
  depth = 0
): MarkdownBlock[][] => {
  if (!measureOverflow(page, options)) return [page];
  if (depth >= 4) return [page];

  const heading = isHeadingBlock(page[0]) ? page[0] : null;
  const body = heading ? page.slice(1) : page.slice();
  if (body.length <= 1) return [page];

  const middle = Math.ceil(body.length / 2);
  const first = [...(heading ? [heading] : []), ...body.slice(0, middle)];
  const second = [
    ...(continuationHeading ? [continuationHeading] : heading ? [heading] : []),
    ...body.slice(middle),
  ];

  return [
    ...splitOverflowPage(first, options, continuationHeading, depth + 1),
    ...splitOverflowPage(second, options, continuationHeading, depth + 1),
  ];
};

const paginateSingleSlide = (
  slide: SlideData,
  options: PaginationOptions,
  globalStartIndex: number
): SlideData[] => {
  if (!slide.blocks.length || !measureOverflow(slide.blocks, options)) {
    return [{ ...slide, index: globalStartIndex }];
  }

  const leadHeading = isHeadingBlock(slide.blocks[0]) ? slide.blocks[0] : null;
  const continuationHeading = buildContinuationHeading(leadHeading);
  const sourceBody = leadHeading ? slide.blocks.slice(1) : slide.blocks.slice();
  const units = sourceBody.flatMap((block) => ensureUnitFits(block, options));

  const pages: MarkdownBlock[][] = [];
  let current: MarkdownBlock[] = [...(leadHeading ? [leadHeading] : [])];

  const pushCurrent = () => {
    if (hasBodyContent(current, leadHeading)) {
      pages.push(current);
    }
  };

  units.forEach((unit) => {
    const candidate = [...current, unit];
    if (!measureOverflow(candidate, options)) {
      current = candidate;
      return;
    }

    pushCurrent();
    current = [...(continuationHeading ? [continuationHeading] : leadHeading ? [leadHeading] : []), unit];

    if (measureOverflow(current, options)) {
      const unitOnly = [unit];
      if (!measureOverflow(unitOnly, options)) {
        pages.push(unitOnly);
        current = [...(continuationHeading ? [continuationHeading] : leadHeading ? [leadHeading] : [])];
      }
    }
  });

  pushCurrent();

  const strictPages = pages.flatMap((page) =>
    splitOverflowPage(page, options, continuationHeading, 0)
  );
  const finalPages = strictPages.length ? strictPages : [slide.blocks];

  return finalPages.map((blocks, idx) => {
    const id = idx === 0 ? slide.id : `${slide.id}--cont-${idx}`;
    const markdown = blocksToMarkdown(blocks);
    return {
      id,
      index: globalStartIndex + idx,
      markdown,
      blocks: parseSlideMarkdown(markdown),
    };
  });
};

export const paginateSlidesByDomMeasurement = (
  slides: SlideData[],
  options: PaginationOptions
): SlideData[] => {
  const output: SlideData[] = [];
  slides.forEach((slide) => {
    const paginated = paginateSingleSlide(slide, options, output.length);
    output.push(...paginated);
  });
  return output.map((slide, index) => ({ ...slide, index }));
};
