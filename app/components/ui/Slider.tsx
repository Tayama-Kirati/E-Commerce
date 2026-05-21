"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

interface SliderProps {
 min: number;
 max: number;
 value: [number, number];
 onChange: (value: [number, number]) => void;
 step?: number;
 className?: string;
}

export const Slider: React.FC<SliderProps> = ({
 min, max, value, onChange, step = 1000, className,
}) => {
 const [minVal, maxVal] = value;
 const range = max - min || 1;
 const minPct = ((minVal - min) / range) * 100;
 const maxPct = ((maxVal - min) / range) * 100;

 const thumbCls =
 "absolute w-full h-1 appearance-none bg-transparent pointer-events-none " +
 "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 " +
 "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full " +
 "[&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:appearance-none " +
 "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 " +
 "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm";

 return (
 <div className={cn("relative h-5 flex items-center", className)}>
 <div className="absolute h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
 <div
 className="absolute h-1 bg-blue-500 rounded-full"
 style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
 />
 <input
 type="range"
 min={min}
 max={max}
 step={step}
 value={minVal}
 onChange={(e) => {
 const v = Math.min(Number(e.target.value), maxVal - step);
 onChange([v, maxVal]);
 }}
 className={thumbCls}
 />
 <input
 type="range"
 min={min}
 max={max}
 step={step}
 value={maxVal}
 onChange={(e) => {
 const v = Math.max(Number(e.target.value), minVal + step);
 onChange([minVal, v]);
 }}
 className={thumbCls}
 />
 </div>
 );
};
