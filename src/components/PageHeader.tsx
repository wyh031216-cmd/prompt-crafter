import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: string;
  eyebrow?: string;
  className?: string;
}

export default function PageHeader({ title, description, eyebrow, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`.trim()}>
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-2xl text-espresso">{title}</h2>
      {description && (
        <p className="text-sm text-espresso-soft mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  );
}