"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Download,
  RotateCcw,
  Star,
  X,
  ChevronRight,
  RefreshCcw,
  CheckCircle,
  Clock,
  Truck,
  Home,
  AlertCircle,
  Phone,
  Copy,
  ExternalLink,
  Zap,
  Leaf,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/frontend/web/lib/utils";
import { toast } from "react-hot-toast";

// ─── Order Detail Page ────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load order");
        setLoading(false);
      });
  }, [id]);

  const cancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "CHANGED_MIND" }),
    });
    const json = await res.json();
    setCancelling(false);
    if (res.ok) {
      toast.success(json.message);
      setData((prev: any) => ({
        ...prev,
        order: { ...prev.order, status: "CANCELLED" },
        cancellable: false,
      }));
    } else toast.error(json.error);
  };

  const copyTracking = () => {
    if (!data?.order?.trackingNumber) return;
    navigator.clipboard.writeText(data.order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Tracking number copied!");
  };

  if (loading) return <OrderDetailSkeleton />;
  if (error)
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {error}
        </h2>
        <button
          onClick={() => router.back()}
          className="text-blue-600 font-semibold hover:underline"
        >
          Go back
        </button>
      </div>
    );

  const { order, cancellable, returnable, reviewableItems } = data;
  const STATUS_CFG: Record<
    string,
    { color: string; bg: string; label: string; icon: string }
  > = {
    PENDING: {
      color: "text-yellow-700",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Pending",
      icon: "⏳",
    },
    CONFIRMED: {
      color: "text-blue-700",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: "Confirmed",
      icon: "✅",
    },
    PROCESSING: {
      color: "text-blue-700",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: "Processing",
      icon: "📦",
    },
    SHIPPED: {
      color: "text-blue-700",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: "Shipped",
      icon: "🚚",
    },
    OUT_FOR_DELIVERY: {
      color: "text-orange-700",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      label: "Out for Delivery",
      icon: "🛵",
    },
    DELIVERED: {
      color: "text-green-700",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Delivered",
      icon: "🎉",
    },
    CANCELLED: {
      color: "text-red-700",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: "Cancelled",
      icon: "❌",
    },
    RETURN_REQUESTED: {
      color: "text-amber-700",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      label: "Return Requested",
      icon: "↩️",
    },
    RETURNED: {
      color: "text-gray-600",
      bg: "bg-gray-100 dark:bg-gray-800",
      label: "Returned",
      icon: "📮",
    },
    REFUNDED: {
      color: "text-teal-700",
      bg: "bg-teal-100 dark:bg-teal-900/30",
      label: "Refunded",
      icon: "💰",
    },
  };
  const cfg = STATUS_CFG[order.status] ?? {
    color: "text-gray-600",
    bg: "bg-gray-100",
    label: order.status,
    icon: "📦",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Order {order.orderNumber}
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full",
                cfg.bg,
                cfg.color,
              )}
            >
              {cfg.icon} {cfg.label}
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Placed {timeAgo(order.createdAt)} · {order.items.length} item
            {order.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button
            onClick={() =>
              window.open(`/api/orders/${order.id}/invoice`, "_blank")
            }
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> Invoice
          </button>
          {cancellable && (
            <button
              onClick={cancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {cancelling ? (
                <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Cancel Order
            </button>
          )}
          {returnable && (
            <Link
              href={`/account/orders/${order.id}/return`}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-sm font-semibold rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Return Items
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Tracking Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Order Timeline
            </h2>

            {/* Tracking number */}
            {order.trackingNumber && (
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 mb-5">
                <Truck className="w-5 h-5 text-blue-600  shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 font-semibold">
                    Tracking Number
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                    {order.trackingNumber}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={copyTracking}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                    aria-label="Copy"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                      aria-label="Track"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Visual timeline */}
            <TrackingTimeline
              timeline={order.statusHistory}
              currentStatus={order.status}
            />

            {/* Estimated delivery */}
            {order.estimatedDelivery &&
              !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(
                order.status,
              ) && (
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500  shrink-0" />
                  <span className="text-gray-500">Estimated delivery:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(order.estimatedDelivery).toLocaleDateString(
                      "en-NP",
                      { weekday: "long", day: "numeric", month: "long" },
                    )}
                  </span>
                </div>
              )}
            {order.deliveredAt && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500  shrink-0" />
                <span className="text-gray-500">Delivered on:</span>
                <span className="font-bold text-green-600">
                  {new Date(order.deliveredAt).toLocaleDateString("en-NP", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">
              Order Items
            </h2>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/products/${item.product?.slug}`}
                    className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden  shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🛍️</span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 text-sm"
                    >
                      {item.product?.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variant.name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-400">
                        ×{item.quantity}
                      </span>
                      <span className="text-xs text-gray-400">
                        Unit: {formatPrice(Number(item.price))}
                      </span>
                      {item.product?.isEco && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <Leaf className="w-3 h-3" />
                          Eco
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right  shrink-0">
                    <p className="font-bold text-blue-600">
                      {formatPrice(Number(item.total))}
                    </p>
                    {item.seller && (
                      <Link
                        href={`/sellers/${item.seller.storeSlug}`}
                        className="text-xs text-gray-400 hover:text-blue-600 transition-colors block mt-1"
                      >
                        by {item.seller.storeName}
                      </Link>
                    )}
                    {order.status === "DELIVERED" && !item.isReviewed && (
                      <Link
                        href={`/account/orders/${order.id}/review?item=${item.id}`}
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-600 font-semibold hover:underline"
                      >
                        <Star className="w-3 h-3" /> Review
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-2.5">
              {[
                {
                  label: `Subtotal (${order.items.length} items)`,
                  value: formatPrice(Number(order.subtotal)),
                },
                {
                  label: "Shipping",
                  value:
                    Number(order.shippingCost) === 0
                      ? "Free 🎉"
                      : formatPrice(Number(order.shippingCost)),
                  green: Number(order.shippingCost) === 0,
                },
                ...(Number(order.discount) > 0
                  ? [
                      {
                        label: `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
                        value: `−${formatPrice(Number(order.discount))}`,
                        red: true,
                      },
                    ]
                  : []),
                ...(order.pointsRedeemed > 0
                  ? [
                      {
                        label: `Loyalty Points (${order.pointsRedeemed} pts)`,
                        value: `−${formatPrice(order.pointsRedeemed / 10)}`,
                        purple: true,
                      },
                    ]
                  : []),
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      (r as any).green
                        ? "text-green-600"
                        : (r as any).red
                          ? "text-red-600"
                          : (r as any).purple
                            ? "text-blue-600"
                            : "text-gray-900 dark:text-white",
                    )}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between font-bold text-base">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600">
                  {formatPrice(Number(order.total))}
                </span>
              </div>
            </div>

            {order.pointsEarned > 0 && order.status === "DELIVERED" && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                <span className="text-xl">🏅</span>
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Points Earned
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    +{order.pointsEarned} loyalty points
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.paymentMethod === "KHALTI"
                    ? "🟣 Khalti"
                    : order.paymentMethod === "ESEWA"
                      ? "🟢 eSewa"
                      : order.paymentMethod === "STRIPE"
                        ? "💳 Card"
                        : order.paymentMethod === "CASH_ON_DELIVERY"
                          ? "💵 Cash on Delivery"
                          : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={cn(
                    "font-bold text-xs px-2 py-0.5 rounded-full",
                    order.paymentStatus === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : order.paymentStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.paymentStatus === "REFUNDED"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-gray-100 text-gray-600",
                  )}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid at</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(order.paidAt).toLocaleString()}
                  </span>
                </div>
              )}
              {order.paymentRef && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {order.paymentRef}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Delivery Address
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white text-base">
                {order.address.fullName}
              </p>
              <p>{order.address.street}</p>
              <p>
                {order.address.city}, {order.address.district}
              </p>
              <p>
                {order.address.province}, {order.address.country}
              </p>
              <a
                href={`tel:${order.address.phone}`}
                className="flex items-center gap-1 text-blue-600 font-semibold mt-1 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" /> {order.address.phone}
              </a>
            </div>
          </div>

          {/* Invoice */}
          {order.invoice && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" /> Invoice
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                    {order.invoice.invoiceNo}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.invoice.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    window.open(`/api/orders/${order.id}/invoice`, "_blank")
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          )}

          {/* Return request status */}
          {order.returnRequest && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
              <h2 className="font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Return Request
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {order.returnRequest.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reason</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {order.returnRequest.reason?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund</span>
                  <span className="font-bold text-blue-600">
                    {formatPrice(Number(order.returnRequest.refundAmount))}
                  </span>
                </div>
                {order.returnRequest.adminNote && (
                  <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 italic">
                    Admin: {order.returnRequest.adminNote}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TIMELINE_STEPS = [
  {
    key: "PENDING",
    label: "Order Placed",
    icon: <Package className="w-3.5 h-3.5" />,
    desc: "Your order has been received",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    desc: "Seller confirmed your order",
  },
  {
    key: "PROCESSING",
    label: "Packing",
    icon: <Package className="w-3.5 h-3.5" />,
    desc: "Your items are being packed",
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    icon: <Truck className="w-3.5 h-3.5" />,
    desc: "Your package is on its way",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: <Truck className="w-3.5 h-3.5" />,
    desc: "Your package is nearby",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: <Home className="w-3.5 h-3.5" />,
    desc: "Package delivered successfully",
  },
];

function TrackingTimeline({
  timeline,
  currentStatus,
}: {
  timeline: any[];
  currentStatus: string;
}) {
  const cancelStates = [
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
  ];
  const isCancelled = cancelStates.includes(currentStatus);
  const orderedKeys = TIMELINE_STEPS.map((s) => s.key);
  const currentIdx = orderedKeys.indexOf(currentStatus);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />

      <div className="space-y-5">
        {TIMELINE_STEPS.map((step, idx) => {
          const histEntry = timeline.find((h) => h.status === step.key);
          const done = !isCancelled && currentIdx >= idx;
          const active = !isCancelled && currentStatus === step.key;

          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              {/* Dot */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center  shrink-0 z-10 transition-all duration-300 border-2",
                  done && active
                    ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 scale-110"
                    : done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300",
                )}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      done ? "text-gray-900 dark:text-white" : "text-gray-400",
                    )}
                  >
                    {step.label}
                    {active && (
                      <span className="ml-2 text-xs text-blue-600 font-bold animate-pulse">
                        ● Current
                      </span>
                    )}
                  </p>
                  {histEntry && (
                    <span className="text-xs text-gray-400">
                      {timeAgo(histEntry.createdAt)}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    done ? "text-gray-500" : "text-gray-300",
                  )}
                >
                  {histEntry?.note ?? step.desc}
                </p>
              </div>
            </div>
          );
        })}

        {/* Cancellation step */}
        {isCancelled && (
          <div className="flex items-start gap-4 relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center  shrink-0 z-10 bg-red-500 border-2 border-red-500 text-white">
              <X className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-red-600">
                {currentStatus === "CANCELLED"
                  ? "Order Cancelled"
                  : currentStatus === "RETURN_REQUESTED"
                    ? "Return Requested"
                    : currentStatus === "RETURNED"
                      ? "Order Returned"
                      : currentStatus === "REFUNDED"
                        ? "Refund Processed"
                        : currentStatus}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {timeline.find((h) => cancelStates.includes(h.status))?.note ??
                  ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-5">
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="space-y-5">
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
