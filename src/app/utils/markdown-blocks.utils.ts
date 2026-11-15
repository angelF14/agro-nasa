export interface MarkdownInlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export type MarkdownBlock =
  | { type: 'heading'; level: 2 | 3; runs: MarkdownInlineRun[] }
  | { type: 'paragraph'; runs: MarkdownInlineRun[] }
  | { type: 'list'; ordered: boolean; items: MarkdownInlineRun[][] }
  | { type: 'blockquote'; runs: MarkdownInlineRun[] };

const INLINE_TOKEN_RE = /(\*\*[^*\n]+?\*\*|`[^`\n]+?`|\*[^*\n]+?\*|_[^_\n]+?_)/g;

/**
 * Parses inline markdown markers (**bold**, *italic*, `code`) into plain text runs
 * so templates can render them safely without innerHTML.
 */
export function parseInlineMarkdown(text: string): MarkdownInlineRun[] {
  const runs: MarkdownInlineRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const idx = match.index ?? 0;
    if (idx > cursor) {
      runs.push({ text: text.slice(cursor, idx) });
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      runs.push({ text: token.slice(1, -1), code: true });
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      runs.push({ text: token.slice(1, -1), italic: true });
    } else {
      runs.push({ text: token });
    }

    cursor = idx + token.length;
  }

  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor) });
  }

  return runs.length > 0 ? runs : [{ text }];
}

/**
 * Converts Gemini markdown output into structured blocks for safe, native Angular rendering.
 */
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listState: { ordered: boolean; items: MarkdownInlineRun[][] } | null = null;

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) return;
    blocks.push({
      type: 'paragraph',
      runs: parseInlineMarkdown(paragraphLines.join(' ')),
    });
    paragraphLines = [];
  };

  const flushList = (): void => {
    if (!listState || listState.items.length === 0) return;
    blocks.push({
      type: 'list',
      ordered: listState.ordered,
      items: listState.items,
    });
    listState = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length <= 2 ? 2 : 3;
      blocks.push({
        type: 'heading',
        level,
        runs: parseInlineMarkdown(headingMatch[2].trim()),
      });
      continue;
    }

    const quoteMatch = line.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'blockquote',
        runs: parseInlineMarkdown(quoteMatch[1].trim()),
      });
      continue;
    }

    const unorderedMatch = line.match(/^(?:[-*•])\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!listState || listState.ordered) {
        flushList();
        listState = { ordered: false, items: [] };
      }
      listState.items.push(parseInlineMarkdown(unorderedMatch[1].trim()));
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!listState || !listState.ordered) {
        flushList();
        listState = { ordered: true, items: [] };
      }
      listState.items.push(parseInlineMarkdown(orderedMatch[1].trim()));
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
