import { FileText, FolderOpen } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: 'default' | 'panel';
  accentColor?: string;
  icon?: 'file' | 'folder';
}

export default function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  accentColor,
  icon = 'file',
}: EmptyStateProps) {
  const Icon = icon === 'folder' ? FolderOpen : FileText;

  const iconNode = (
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
        accentColor ? '' : 'bg-terracotta/10'
      }`}
      style={accentColor ? { backgroundColor: `${accentColor}22` } : undefined}
    >
      <Icon
        className="w-7 h-7"
        style={accentColor ? { color: accentColor } : undefined}
      />
    </div>
  );

  const actions = (action || secondaryAction) && (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {action && (
        <button
          onClick={action.onClick}
          className={action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
        >
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className={secondaryAction.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );

  if (variant === 'panel') {
    return (
      <div className="card border-dashed border-espresso/15 bg-cream/30 px-6 py-10 text-center">
        <div className="flex flex-col items-center">
          {iconNode}
          <h3 className="font-serif text-lg text-espresso mb-1.5">{title}</h3>
          <p className="text-sm text-espresso-soft max-w-md mb-5 leading-relaxed">{description}</p>
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {iconNode}
      <h3 className="font-serif text-xl text-espresso mb-1">{title}</h3>
      <p className="text-sm text-espresso-soft max-w-sm mb-4 leading-relaxed">{description}</p>
      {actions}
    </div>
  );
}
