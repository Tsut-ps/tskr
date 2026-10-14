import type { ReactNode } from "react";

export function Centered({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-4 text-center">{children}</div>;
}
