import { Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-950">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
