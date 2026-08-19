import type { ComponentType } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, History, Settings, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { to: "/", label: "今日", Icon: SquarePen },
  { to: "/mood", label: "調子", Icon: Activity },
  { to: "/history", label: "履歴", Icon: History },
  { to: "/settings", label: "設定", Icon: Settings },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ to, label, Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
