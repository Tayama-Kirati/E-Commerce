"use client";
import { useUIStore } from "@/app/lib/store";

export function ToastMessage() {
 const { toast } = useUIStore();
 if (!toast) return null;
 return (
 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl max-w-sm text-center">
 {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
 </div>
 );
}
