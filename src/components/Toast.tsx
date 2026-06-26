interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full bg-espresso text-cream text-sm shadow-lg pointer-events-none"
      role="status"
    >
      {message}
    </div>
  );
}