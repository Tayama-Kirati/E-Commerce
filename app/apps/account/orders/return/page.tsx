"use client";

import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";
import { formatPrice } from "@/app/lib/utils";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RotateCcw, X } from "lucide-react";

const ReturnFormSchema = z.object({
 reason: z.enum(
 [
 "WRONG_ITEM",
 "DAMAGED",
 "NOT_AS_DESCRIBED",
 "CHANGED_MIND",
 "QUALITY_ISSUE",
 "MISSING_PARTS",
 "OTHER",
 ],
 {
 error: () => ({ message: "Please select a reason" }),
 },
 ),
 description: z
 .string()
 .min(10, "Describe the issue in at least 10 characters")
 .max(1000),
 itemIds: z.array(z.string()).min(1, "Select at least one item to return"),
});
type ReturnFormData = z.infer<typeof ReturnFormSchema>;

export default function ReturnRequestPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [order, setOrder] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [submitted, setSubmitted] = useState(false);
 const [images, setImages] = useState<string[]>([]);

 const {
 register,
 handleSubmit,
 watch,
 setValue,
 formState: { errors, isSubmitting },
 } = useForm<ReturnFormData>({
 resolver: zodResolver(ReturnFormSchema),
 defaultValues: { itemIds: [] },
 });

 const watchedItems = watch("itemIds");

 useEffect(() => {
 fetch(`/api/orders/${id}`)
 .then((r) => r.json())
 .then((d) => {
 setOrder(d.order);
 setLoading(false);
 });
 }, [id]);

 const toggleItem = (itemId: string) => {
 const curr = watchedItems ?? [];
 setValue(
 "itemIds",
 curr.includes(itemId)
 ? curr.filter((i) => i !== itemId)
 : [...curr, itemId],
 );
 };

 const onSubmit = async (data: ReturnFormData) => {
 const res = await fetch(`/api/orders/${id}/return`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...data, images }),
 });
 const json = await res.json();
 if (res.ok) setSubmitted(true);
 else toast.error(json.error ?? "Submission failed");
 };

 if (loading)
 return (
 <div className="max-w-xl mx-auto px-4 py-16">
 <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
 </div>
 );

 if (submitted) {
 return (
 <div className="max-w-md mx-auto px-4 py-16 text-center">
 <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
 <CheckCircle className="w-10 h-10 text-green-600" />
 </div>
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
 Return Requested!
 </h2>
 <p className="text-gray-500 mb-6">
 Your return request for order <strong>{order?.orderNumber}</strong>{" "}
 has been submitted. We'll review it within 24 hours and contact you.
 </p>
 <Link
 href="/account/orders"
 className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
 >
 Back to Orders
 </Link>
 </div>
 );
 }

 const REASONS = [
 {
 value: "WRONG_ITEM",
 label: "🔄 Received wrong item",
 desc: "Different product, color, or size than ordered",
 },
 {
 value: "DAMAGED",
 label: "💔 Item arrived damaged",
 desc: "Physical damage during shipping or manufacturing",
 },
 {
 value: "NOT_AS_DESCRIBED",
 label: "📝 Not as described",
 desc: "Product doesn't match the listing",
 },
 {
 value: "QUALITY_ISSUE",
 label: "⚠️ Quality issue",
 desc: "Product quality is below expectations",
 },
 {
 value: "MISSING_PARTS",
 label: "🧩 Missing parts or accessories",
 desc: "Box was incomplete",
 },
 {
 value: "CHANGED_MIND",
 label: "💭 Changed my mind",
 desc: "No longer need the product",
 },
 {
 value: "OTHER",
 label: "❓ Other reason",
 desc: "Something else — describe below",
 },
 ];

 const refundableItems = (watchedItems ?? []).reduce(
 (sum: number, itemId: string) => {
 const item = order?.items?.find((i: any) => i.id === itemId);
 return sum + Number(item?.total ?? 0);
 },
 0,
 );

 return (
 <div className="max-w-2xl mx-auto px-4 py-8">
 <div className="flex items-center gap-3 mb-6">
 <button
 onClick={() => router.back()}
 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="text-xl font-black text-gray-900 dark:text-white">
 Return Items
 </h1>
 <p className="text-sm text-gray-400">Order {order?.orderNumber}</p>
 </div>
 </div>

 {/* Info banner */}
 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
 <div className="text-sm text-blue-700 dark:text-blue-400">
 <p className="font-semibold mb-1">Return Policy</p>
 <p>
 Returns must be requested within <strong>7 days</strong> of
 delivery. Items must be unused, in original packaging. Refunds
 processed within 5–7 business days after item is picked up.
 </p>
 </div>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 {/* Select items */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white mb-4">
 Select Items to Return *
 </h2>
 {errors.itemIds && (
 <p className="text-xs text-red-500 mb-3">
 {errors.itemIds.message}
 </p>
 )}
 <div className="space-y-3">
 {order?.items?.map((item: any) => {
 const selected = (watchedItems ?? []).includes(item.id);
 return (
 <label
 key={item.id}
 className={cn(
 "flex items-center gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all",
 selected
 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
 : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
 )}
 onClick={() => toggleItem(item.id)}
 >
 <div
 className={cn(
 "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
 selected
 ? "border-blue-600 bg-blue-600"
 : "border-gray-300",
 )}
 >
 {selected && <CheckCircle className="w-3 h-3 text-white" />}
 </div>
 <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
 {item.product?.images?.[0] ? (
 <img
 src={item.product.images[0].url}
 alt="item"
 width={48}
 height={48}
 className="object-cover"
 />
 ) : (
 "🛍️"
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
 {item.product?.name}
 </p>
 {item.variant && (
 <p className="text-xs text-gray-400">
 {item.variant.name}
 </p>
 )}
 <p className="text-xs text-gray-400">×{item.quantity}</p>
 </div>
 <p className="font-bold text-blue-600 shrink-0">
 formatPrice(Number(item.total))
 </p>
 </label>
 );
 })}
 </div>
 {refundableItems > 0 && (
 <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm font-bold">
 <span className="text-gray-600 dark:text-gray-400">
 Estimated Refund
 </span>
 <span className="text-blue-600">
 {formatPrice(refundableItems)}
 </span>
 </div>
 )}
 </div>

 {/* Reason */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white mb-4">
 Reason for Return *
 </h2>
 {errors.reason && (
 <p className="text-xs text-red-500 mb-3">{errors.reason.message}</p>
 )}
 <div className="space-y-2">
 {REASONS.map((r) => (
 <label
 key={r.value}
 className={cn(
 "flex items-start gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all",
 watch("reason") === r.value
 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
 : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
 )}
 >
 <input
 type="radio"
 value={r.value}
 {...register("reason")}
 className="sr-only"
 />
 <div
 className={cn(
 "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors",
 watch("reason") === r.value
 ? "border-blue-600"
 : "border-gray-300",
 )}
 >
 {watch("reason") === r.value && (
 <div className="w-2 h-2 bg-blue-600 rounded-full m-0.5" />
 )}
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">
 {r.label}
 </p>
 <p className="text-xs text-gray-400">{r.desc}</p>
 </div>
 </label>
 ))}
 </div>
 </div>

 {/* Description */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white mb-1">
 Describe the Issue *
 </h2>
 <p className="text-sm text-gray-400 mb-4">
 Please provide as much detail as possible to help us process your
 return quickly.
 </p>
 <textarea
 {...register("description")}
 rows={4}
 placeholder="e.g. I received a Black iPhone instead of the Desert Titanium I ordered. The box was also slightly damaged. Order confirmation clearly shows Desert Titanium..."
 className={cn(
 "w-full px-4 py-3 border rounded-2xl text-sm outline-none transition-all resize-none",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.description
 ? "border-red-400 focus:border-red-500"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
 )}
 />
 {errors.description && (
 <p className="text-xs text-red-500 mt-1">
 {errors.description.message}
 </p>
 )}
 </div>

 {/* Photo evidence */}
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
 <h2 className="font-bold text-gray-900 dark:text-white mb-1">
 Photo Evidence
 </h2>
 <p className="text-sm text-gray-400 mb-4">
 Upload photos to support your claim (up to 5). Strongly recommended
 for damaged/wrong items.
 </p>
 <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
 <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
 Drag & drop or click to upload
 </p>
 <p className="text-xs text-gray-400 mt-1">
 PNG, JPG · Max 5MB each · Up to 5 photos
 </p>
 <label className="inline-block mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-semibold rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
 <input
 type="file"
 multiple
 accept="image/*"
 className="hidden"
 onChange={async (e) => {
 const files = Array.from(e.target.files ?? []).slice(0, 5);
 const urls = await Promise.all(
 files.map(
 (f) =>
 new Promise<string>((res) => {
 const reader = new FileReader();
 reader.onload = (ev) =>
 res(ev.target?.result as string);
 reader.readAsDataURL(f);
 }),
 ),
 );
 setImages(urls);
 toast.success(`${urls.length} photo(s) selected`);
 }}
 />
 Select Photos
 </label>
 </div>
 {images.length > 0 && (
 <div className="flex gap-2 mt-3 flex-wrap">
 {images.map((src, i) => (
 <div key={i} className="relative w-16 h-16">
 <Image
 src={src}
 alt={`Evidence ${i + 1}`}
 width={64}
 height={64}
 className="object-cover rounded-xl border border-gray-200"
 />
 <button
 type="button"
 onClick={() =>
 setImages((prev) => prev.filter((_, j) => j !== i))
 }
 className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
 aria-label="Remove"
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Submit */}
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full flex items-center justify-center gap-2 py-4 bg-linear-to-r from-blue-500 to-blue-400 text-white font-bold text-base rounded-2xl hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 active:scale-[0.98] transition-all"
 >
 {isSubmitting ? (
 <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <RotateCcw className="w-5 h-5" />
 )}
 Submit Return Request
 </button>
 <p className="text-xs text-gray-400 text-center">
 By submitting, you agree to our{" "}
 <Link
 href="/returns-policy"
 className="text-blue-600 hover:underline"
 >
 Returns Policy
 </Link>
 . Refunds are processed within 5–7 business days after pickup.
 </p>
 </form>
 </div>
 );
}
