import type { Prompt } from '../types/prompt';

export interface ExportData {
  version: '1.0';
  exportedAt: number;
  prompts: Array<{
    title: string;
    content: string;
    variables: Prompt['variables'];
    tags: string[];
    folderName?: string;
    createdAt: number;
    updatedAt: number;
    versions?: Array<{
      content: string;
      variables: Prompt['variables'];
      note: string;
      createdAt: number;
    }>;
  }>;
}

export function exportToMarkdown(prompt: Prompt): string {
  let md = `# ${prompt.title}\n\n`;

  if (prompt.tags.length > 0) {
    md += prompt.tags.map((t) => `\`${t}\``).join(' ') + '\n\n';
  }

  if (prompt.variables.length > 0) {
    md += '## 变量\n\n';
    for (const v of prompt.variables) {
      md += `- **{{${v.name}}}**${v.description ? `: ${v.description}` : ''}${v.defaultValue ? `（默认: \`${v.defaultValue}\`）` : ''}\n`;
    }
    md += '\n';
  }

  md += '---\n\n';
  md += prompt.content;
  md += '\n';

  return md;
}

export function exportToClipboard(prompt: Prompt, variableValues: Record<string, string>): string {
  let result = prompt.content;
  for (const [key, value] of Object.entries(variableValues)) {
    if (value) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
  }
  return result;
}

export function exportPromptsToJSON(prompts: Prompt[]): string {
  const data: ExportData = {
    version: '1.0',
    exportedAt: Date.now(),
    prompts: prompts.map((p) => ({
      title: p.title,
      content: p.content,
      variables: p.variables,
      tags: p.tags,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(md: string, filename: string): void {
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
