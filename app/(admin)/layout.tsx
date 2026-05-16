import { ReactNode } from "react";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { AdminShell } from "@/components/layout/AdminShell";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0F172A",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
    </SessionProvider>
  );
}
