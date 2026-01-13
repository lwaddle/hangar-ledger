type InactiveBadgeProps = {
  className?: string;
};

export function InactiveBadge({ className = "" }: InactiveBadgeProps) {
  return (
    <span
      className={`text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded ${className}`}
    >
      Inactive
    </span>
  );
}
