export function EmptyStateCard({
  icon,
  title,
  description,
  small = false
}: {
  icon: string;
  title: string;
  description: string;
  small?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center text-center ${
        small ? 'min-h-[120px] px-4 py-6' : 'min-h-[200px] px-6 py-10'
      }`}
    >
      <div className={`opacity-40 ${small ? 'text-2xl' : 'text-3xl'}`}>{icon}</div>
      <h3 className={`mt-3 font-medium text-app-text-secondary ${small ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      <p className={`mt-1 max-w-xs text-app-text-muted ${small ? 'text-xs' : 'text-sm'}`}>
        {description}
      </p>
    </div>
  );
}
