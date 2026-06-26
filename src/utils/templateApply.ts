import type { PromptTemplate } from './templates/types';
import { AI_PLATFORMS } from './templates/types';
import type { TemplatePayload } from './templateBridge';

export function buildTemplatePayload(template: PromptTemplate): TemplatePayload {
  let content = template.template;
  for (const v of template.variables) {
    if (v.defaultValue) {
      content = content.replaceAll(`{{${v.name}}}`, v.defaultValue);
    }
  }
  return {
    title: `${AI_PLATFORMS[template.category].name} · ${template.name}`,
    content,
    variables: template.variables.map((v) => ({
      name: v.name,
      description: v.description,
      defaultValue: v.defaultValue,
    })),
    tags: [AI_PLATFORMS[template.category].name, '模板'],
    templateId: template.id,
    templateName: template.name,
  };
}