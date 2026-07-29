import { ReactNode } from "react";
import CartToast from "@/components/layout/CartToast";

type MobileShellProps = {
  children: ReactNode;
};

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto min-h-screen max-w-sm bg-white shadow-2xl">
        {children}
      </div>

      <CartToast />
    </div>
  );
}