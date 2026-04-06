/**
 * markdownParser.ts
 *
 * TypeScript port of the Python _parse_slide() from markdown_pptx_export.py.
 * Parses extended markdown syntax into MarkdownBlock[].
 *
 * Supported blocks: heading, metric, callout, chart, columns, quote,
 * bullet_list, numbered_list, table, image, paragraph (fallback).
 */

import type { MarkdownBlock, ChartData } from '@/types/presentation';

// ─── Inline markdown preservation ───────────────────────────────────────────

// Keep inline markdown (**bold**, *italic*) intact so formatting persists.
// Don't strip it - renderers will handle conversion to HTML.

// ─── Table parser helper ─────────────────────────────────────────────────────

function parseTableLines(
  lines: string[],
  startIdx: number
): { headers: string[]; rows: string[][]; endIndex: number } {
  const headers: string[] = [];
  const rows: string[][] = [];
  let i = startIdx;

  // First line should have headers
  if (i < lines.length && lines[i].includes('|')) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    headers.push(...cells);
    i++;
  }

  // Skip separator line (---|---)
  if (i < lines.length && lines[i].includes('---')) {
    i++;
  }

  // Data rows
  while (i < lines.length && lines[i].includes('|') && !lines[i].trim().startsWith(':::')) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    // Skip if it's a separator
    if (!cells.every((c) => /^-+$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }

  return { headers, rows, endIndex: i };
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseSlideMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Headings ───────────────────────────────────────────────────────────
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.slice(2).trim() });
      i++;
      continue;
    }

    // ── Metric block ───────────────────────────────────────────────────────
    if (line.trim() === ':::metric') {
      const metrics: { value: string; label: string; delta?: string }[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const parts = lines[i].split('|').map((p) => p.trim());
        if (parts.length >= 2 && parts[0]) {
          metrics.push({
            value: parts[0],
            label: parts[1],
            delta: parts[2] || undefined,
          });
        }
        i++;
      }
      if (metrics.length > 0) {
        blocks.push({ type: 'metric_row', metrics });
      }
      i++; // skip closing :::
      continue;
    }

    // ── Callout block ──────────────────────────────────────────────────────
    const calloutMatch = line.trim().match(/^:::callout\[icon=(\w+)\]/);
    if (calloutMatch) {
      const icon = calloutMatch[1];
      i++;
      let title = '';
      const bodyLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const l = lines[i].trim();
        const boldMatch = l.match(/^\*\*(.+)\*\*$/);
        if (boldMatch) {
          title = boldMatch[1];
        } else if (l) {
          bodyLines.push(l);
        }
        i++;
      }
      blocks.push({
        type: 'callout',
        icon,
        title,
        body: bodyLines.join('\n'),
      });
      i++; // skip closing :::
      continue;
    }

    // ── Chart block ────────────────────────────────────────────────────────
    const chartMatch = line.trim().match(/^:::chart\[type=(\w+)\]/);
    if (chartMatch) {
      const chartType = chartMatch[1] as 'bar' | 'line' | 'pie' | 'donut';
      i++;
      const tableData = parseTableLines(lines, i);
      i = tableData.endIndex;
      const data: ChartData = {
        headers: tableData.headers,
        rows: tableData.rows,
      };
      blocks.push({ type: 'chart', chartType, data });
      // Skip closing :::
      if (i < lines.length && lines[i].trim().startsWith(':::')) {
        i++;
      }
      continue;
    }

    // ── Columns block ──────────────────────────────────────────────────────
    if (line.trim() === ':::columns') {
      i++;
      // Collect raw lines until closing :::
      const rawColumnLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        rawColumnLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::

      // Split by --- to get individual column text blocks
      const columnTexts: string[] = [];
      let colBuffer: string[] = [];
      for (const rawLine of rawColumnLines) {
        if (rawLine.trim() === '---') {
          columnTexts.push(colBuffer.join('\n'));
          colBuffer = [];
        } else {
          colBuffer.push(rawLine);
        }
      }
      columnTexts.push(colBuffer.join('\n'));

      // Recursively parse each column
      const columns: MarkdownBlock[][] = columnTexts
        .map((txt) => txt.trim())
        .filter(Boolean)
        .map((txt) => parseSlideMarkdown(txt));

      if (columns.length > 0) {
        blocks.push({ type: 'columns', columns });
      }
      continue;
    }

    // ── Block quotes ───────────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      const textParts: string[] = [];
      let attribution: string | undefined;
      while (i < lines.length && lines[i].startsWith('> ')) {
        const content = lines[i].slice(2);
        const attrMatch = content.match(/^[—–-]\s*(.+)$/);
        if (attrMatch) {
          attribution = attrMatch[1];
        } else {
          textParts.push(
            content.replace(/^"|"$/g, '').replace(/\u201c|\u201d/g, '')
          );
        }
        i++;
      }
      blocks.push({
        type: 'quote',
        text: textParts.join(' '),
        attribution,
      });
      continue;
    }

    // ── Bullet list ────────────────────────────────────────────────────────
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: 'bullet_list', items });
      continue;
    }

    // ── Numbered list ──────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, '').trim());
        i++;
      }
      blocks.push({ type: 'numbered_list', items });
      continue;
    }

    // ── Table ──────────────────────────────────────────────────────────────
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableData = parseTableLines(lines, i);
      i = tableData.endIndex;
      blocks.push({
        type: 'table',
        headers: tableData.headers,
        rows: tableData.rows,
      });
      continue;
    }

    // ── Image ──────────────────────────────────────────────────────────────
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }

    // ── Paragraph (fallback) ───────────────────────────────────────────────
    if (line.trim()) {
      blocks.push({ type: 'paragraph', text: line.trim() });
    }
    i++;
  }

  return blocks;
}

/**
 * Split a full presentation markdown string into individual slide strings.
 */
export function splitSlidesMarkdown(fullMarkdown: string): string[] {
  return fullMarkdown
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
