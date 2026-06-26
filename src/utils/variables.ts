import type { Variable } from '../types/prompt';

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Extract variable names from a prompt template
 */
export function extractVariables(content: string): string[] {
  const matches = new Set<string>();
  let match;
  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Extract variables with surrounding context (snippet)
 */
export function extractVariableContexts(content: string): Array<{ name: string; snippet: string }> {
  const contexts: Array<{ name: string; snippet: string }> = [];
  let match;
  const regex = /\{\{(\w+)\}\}/g;
  while ((match = regex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 20);
    const end = Math.min(content.length, match.index + match[0].length + 20);
    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    contexts.push({ name: match[1], snippet });
  }
  return contexts;
}

/**
 * Sync variables declared on the prompt with those actually used in content.
 * Returns the updated variables array — keeps declared ones that are still used,
 * removes unused ones, and adds newly discovered ones with empty defaults.
 */
export function syncVariables(content: string, existingVariables: Variable[]): Variable[] {
  const usedNames = extractVariables(content);
  const existingMap = new Map(existingVariables.map((v) => [v.name, v]));

  return usedNames.map((name) => {
    const existing = existingMap.get(name);
    return existing ?? { name, defaultValue: '', description: '' };
  });
}

/**
 * Replace all {{variable}} placeholders with their values
 */
export function fillVariables(content: string, variableValues: Record<string, string>): string {
  return content.replace(VARIABLE_REGEX, (match, name: string) => {
    return variableValues[name] ?? match;
  });
}

/**
 * Get the default values map from variable definitions
 */
export function getDefaultVariableValues(variables: Variable[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variables) {
    map[v.name] = v.defaultValue;
  }
  return map;
}
