"use client";
import { useState } from "react";
import { cn, formatPrice, generateOrderNumber, useCartStore, useUIStore, useAuthStore, apiPost } from "@/app/lib/store";

export function CheckoutPage() {
 const { cartItems, cartTotal, cartShipping, cartGrand, clearCart } = useCartStore();
 const { nav, showToast } = useUIStore();
 const { user } = useAuthStore();
 const [step, setStep] = useState("address");
 const [address, setAddress] = useState<{ [k: string]: string }>({ fullName:user?.name??"", phone:"", street:"", city:"Kathmandu", district:"Kathmandu", province:"Bagmati", country:"Nepal" });
 const [payMethod, setPayMethod] = useState("KHALTI");
 const [placing, setPlacing] = useState(false);
 const [orderNum, setOrderNum] = useState("");

 const placeOrder = async () => {
 setPlacing(true);
 const res = await apiPost("/api/orders", {
 addressId: "temp-addr",
 paymentMethod: payMethod,
 items: cartItems.map(i => ({ productId: i.id, quantity: i.qty })),
 });
 setPlacing(false);
 const num = res?.order?.orderNumber ?? res?.orderNumber ?? generateOrderNumber();
 setOrderNum(num);
 clearCart();
 setStep("confirmed");
 showToast("Order placed successfully! 🎉");
 };

 if (step === "confirmed") return (
 <div className="max-w-lg mx-auto px-4 py-16 text-center">
 <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">✅</div>
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed! 🎉</h2>
 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-6 inline-block">
 <p className="text-xs text-gray-500">Order Number</p>
 <p className="text-2xl font-black text-blue-600">{orderNum}</p>
 </div>
 <p className="text-gray-400 mb-8 text-sm">We'll send a confirmation to your email.</p>
 <div className="flex gap-3 justify-center">
 <button onClick={() => nav("orders")} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Track Order</button>
 <button onClick={() => nav("home")} className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Continue Shopping</button>
 </div>
 </div>
 );

 return (
 <div className="max-w-5xl mx-auto px-4 py-8">
 <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Checkout</h1>
 <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
 <div className="space-y-5">
 {step === "address" && (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
 <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">📍 Delivery Address</h2>
 <div className="space-y-4">
 {[{l:"Full Name *",k:"fullName",ph:"Arun Kumar"},{l:"Phone *",k:"phone",ph:"+977 9800000000"},{l:"Street Address *",k:"street",ph:"Ward No., Locality, Street"}].map(f => (
 <div key={f.k}>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.l}</label>
 <input value={address[f.k]} onChange={e => setAddress(a => ({...a,[f.k]:e.target.value}))} placeholder={f.ph}
 className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
 </div>
 ))}
 <div className="grid grid-cols-2 gap-4">
 {[{l:"City *",k:"city"},{l:"District *",k:"district"}].map(f => (
 <div key={f.k}>
 <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.l}</label>
 <input value={address[f.k]} onChange={e => setAddress(a => ({...a,[f.k]:e.target.value}))}
 className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all" />
 </div>
 ))}
 </div>
 </div>
 <button onClick={() => setStep("payment")} className="w-full mt-5 py-3 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">Continue to Payment →</button>
 </div>
 )}
 {step === "payment" && (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
 <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">💳 Payment Method</h2>
 <div className="space-y-3 mb-5">
 {[{id:"KHALTI",name:"Khalti",desc:"Digital wallet",logo:"🟣",rec:true},{id:"ESEWA",name:"eSewa",desc:"Nepal's most popular wallet",logo:"🟢"},{id:"STRIPE",name:"Card (Visa/MC)",desc:"Secured by Stripe",logo:"💳"},{id:"CASH_ON_DELIVERY",name:"Cash on Delivery",desc:"Pay when delivered",logo:"💵"}].map(m => (
 <label key={m.id} className={cn("flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all", payMethod===m.id?"border-blue-500 bg-blue-50 dark:bg-blue-900/20":"border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
 <input type="radio" name="pay" value={m.id} checked={payMethod===m.id} onChange={() => setPayMethod(m.id)} className="sr-only" />
 <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0">{m.logo}</div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</span>
 {m.rec && <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">Recommended</span>}
 </div>
 <p className="text-xs text-gray-500">{m.desc}</p>
 </div>
 <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", payMethod===m.id?"border-blue-600":"border-gray-300")}>
 {payMethod===m.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
 </div>
 </label>
 ))}
 </div>
 <div className="flex gap-3">
 <button onClick={() => setStep("address")} className="flex items-center gap-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← Back</button>
 <button onClick={() => setStep("review")} className="flex-1 py-3 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 transition-colors">Review Order →</button>
 </div>
 </div>
 )}
 {step === "review" && (
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
 <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">✅ Review Order</h2>
 <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-sm">
 <p className="font-semibold text-gray-900 dark:text-white">{address.fullName}</p>
 <p className="text-gray-500">{address.street}, {address.city}, {address.district}</p>
 </div>
 <div className="space-y-3 mb-5">
 {cartItems.map(item => (
 <div key={item.id} className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shrink-0">{item.emoji ?? "🛍️"}</div>
 <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p><p className="text-xs text-gray-400">×{item.qty}</p></div>
 <p className="text-sm font-bold text-blue-600">{formatPrice(Number(item.basePrice??item.price??0)*item.qty)}</p>
 </div>
 ))}
 </div>
 <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 flex items-center gap-2">
 <span>🚚</span><p className="text-sm font-semibold text-green-700 dark:text-green-400">Estimated delivery in 2-3 business days</p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setStep("payment")} className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">← Back</button>
 <button onClick={placeOrder} disabled={placing} className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl disabled:opacity-60 transition-all active:scale-[0.98]">
 {placing ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "🔒"} {placing ? "Placing Order…" : `Place Order · ${formatPrice(cartGrand)}`}
 </button>
 </div>
 </div>
 )}
 </div>
 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-fit sticky top-24">
 <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
 <div className="space-y-2 text-sm mb-4">
 <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold dark:text-white">{formatPrice(cartTotal)}</span></div>
 <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={cn("font-semibold", cartShipping===0?"text-green-600":"dark:text-white")}>{cartShipping===0?"Free 🎉":formatPrice(cartShipping)}</span></div>
 <div className="flex justify-between font-black text-base border-t border-gray-100 dark:border-gray-800 pt-2"><span className="dark:text-white">Total</span><span className="text-blue-600">{formatPrice(cartGrand)}</span></div>
 </div>
 <div className="space-y-1.5 text-xs text-gray-400">
 <div className="flex items-center gap-1.5">🔒 256-bit SSL Encrypted</div>
 <div className="flex items-center gap-1.5">↩️ 7-Day Easy Returns</div>
 <div className="flex items-center gap-1.5">🛡️ 100% Buyer Protection</div>
 </div>
 </div>
 </div>
 </div>
 );
}
