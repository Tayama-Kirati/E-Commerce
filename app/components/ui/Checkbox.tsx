"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

interface CheckboxProps {
 label: string;
 checked: boolean;
 onChange: () => void;
 count?: number;
 className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
 label, checked, onChange, count, className,
}) => (
 <label className={cn("flex items-center gap-2.5 cursor-pointer group py-1", className)}>
 <div
 onClick={onChange}
 className={cn(
 "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
 checked
 ? "bg-blue-600 border-blue-600"
 : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400",
 )}
 >
 {checked && (
 <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 9" fill="none">
 <path
 d="M1 4L4.5 7.5L11 1"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 )}
 </div>
 <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{label}</span>
 {count !== undefined && (
 <span className="text-xs text-gray-400">{count}</span>
 )}
 </label>
);
