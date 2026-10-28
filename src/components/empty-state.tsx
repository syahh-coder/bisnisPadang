import { Icon, type IconName } from "@/components/icon";

export function EmptyState({ icon = "store", title, children }: {
  icon?: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} /></span>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}
