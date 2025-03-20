// src/services/paymentService.js
import supabase from "../lib/supabase";

export const processPayment = async (userId, planId, paymentDetails) => {
  try {
    // Integration with payment gateway (PayFast, Yoco, etc.)
    // Example implementation with PayFast
    const paymentResponse = await fetch("https://api.payfast.co.za/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        amount: paymentDetails.amount,
        item_name: paymentDetails.planName,
        custom_str1: userId,
        custom_str2: planId,
        // Add other required fields
      }),
    });

    const data = await paymentResponse.json();

    if (data.success) {
      // Record successful subscription
      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        plan_id: planId,
        plan_name: paymentDetails.planName,
        status: "active",
        next_billing_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        payment_method: { provider: "payfast", details: data.payment_id },
      });

      if (error) throw error;
      return { success: true, data };
    } else {
      throw new Error(data.error || "Payment processing failed");
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return { success: false, error };
  }
};
