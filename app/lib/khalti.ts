const KHALTI_BASE = "https://dev.khalti.com/api/v2";
 
export async function initiateKhaltiPayment(params: {
  orderId:    string;
  amount:     number;  // in paisa (NPR * 100)
  orderName:  string;
  returnUrl:  string;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
}) {
  const res = await fetch(`${KHALTI_BASE}/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url:      params.returnUrl,
      website_url:     process.env.NEXTAUTH_URL,
      amount:          params.amount,
      purchase_order_id:   params.orderId,
      purchase_order_name: params.orderName,
      customer_info: {
        name:  params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
    }),
  });
 
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Khalti initiation failed: ${JSON.stringify(err)}`);
  }
  return res.json() as Promise<{ pidx: string; payment_url: string; expires_at: string }>;
}
 
export async function verifyKhaltiPayment(pidx: string) {
  const res = await fetch(`${KHALTI_BASE}/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });
 
  if (!res.ok) throw new Error("Khalti verification failed");
  return res.json() as Promise<{
    pidx:   string;
    status: string; // "Completed" | "Pending" | "Expired"
    total_amount: number;
    transaction_id: string;
  }>;
}
 