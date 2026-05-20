"use client";
import { useUIStore } from "@/app/lib/store";

export function SellerOnboardPage() {
  const { showToast } = useUIStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-5">🏪</div>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Start Selling on NexMart</h1>
      <p className="text-gray-400 mb-8">Join 85,000+ sellers reaching millions of customers.</p>
      <button onClick={() => showToast("Onboarding started! 🎉")} className="px-8 py-3.5 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-colors">Begin Application →</button>
    </div>
  );
}
