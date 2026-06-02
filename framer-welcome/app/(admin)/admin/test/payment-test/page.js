"use client";
import React, { useState } from "react";
import Script from "next/script";

function Page() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: "TripID",
          amount: 500,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Boundless Society",
        description: "Test Transaction",
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                sessionId: data.sessionId,
                tripId: "TripID", // Hardcoded matching the init call
              }),
            });

            if (verifyRes.ok) {
              alert(
                `Payment Successful & Verified! Payment ID: ${response.razorpay_payment_id}`,
              );
            } else {
              alert("Payment successful but verification failed.");
            }
          } catch (err) {
            console.error(err);
            alert("Verification error");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();
    } catch (error) {
      console.error(error);
      alert("Error initializing payment");
    } finally {
      setLoading(false);
    }
  };

  // Load Test State
  const [testCount, setTestCount] = useState(5);
  const [testLogs, setTestLogs] = useState([]);
  const [testStats, setTestStats] = useState({
    success: 0,
    failed: 0,
    total: 0,
  });

  const handleLoadTest = async () => {
    if (testCount > 50) {
      alert("Max 50 requests allowed for safety.");
      return;
    }

    setLoading(true);
    setTestLogs([]);
    setTestStats({ success: 0, failed: 0, total: 0 });

    const requests = [];
    for (let i = 0; i < testCount; i++) {
      requests.push(
        fetch("/api/payment/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: "TripID",
            amount: 500,
          }),
        }).then(async (res) => {
          const data = await res.json();
          return { status: res.status, data, index: i + 1 };
        }),
      );
    }

    try {
      const results = await Promise.all(requests);

      let success = 0;
      let failed = 0;
      const logs = [];

      results.forEach((r) => {
        if (r.status === 200) {
          success++;
          logs.push(`Req #${r.index}: Success (Session: ${r.data.sessionId})`);
        } else {
          failed++;
          logs.push(`Req #${r.index}: Failed (${r.status} - ${r.data.error})`);
        }
      });

      setTestStats({ success, failed, total: testCount });
      setTestLogs(logs);
    } catch (err) {
      console.error("Load Test Error:", err);
      alert("Load test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-8 max-w-2xl mx-auto">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Manual Payment Section */}
      <div className="border p-6 rounded-lg shadow-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4">Manual Payment</h2>
        <p className="mb-4 text-gray-600">
          Try to book a single seat normally.
        </p>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay Now (500 INR)"}
        </button>
      </div>

      {/* Load Test Section just for test*/}
      <div className="border p-6 rounded-lg shadow-sm w-full bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Concurrency Load Test</h2>
        <p className="mb-4 text-gray-600 text-sm">
          Simulate multiple users trying to pay at the exact same time...
        </p>

        <div className="flex gap-4 justify-center items-center mb-6">
          <div className="flex flex-col items-start">
            <label className="text-xs font-semibold mb-1">Request Count</label>
            <input
              type="number"
              value={testCount}
              onChange={(e) => setTestCount(Number(e.target.value))}
              className="border p-2 rounded w-24"
              min="1"
              max="50"
            />
          </div>
          <button
            onClick={handleLoadTest}
            disabled={loading}
            className="px-4 py-2 h-10 mt-5 bg-purple-600 text-white rounded disabled:opacity-50 hover:bg-purple-700"
          >
            {loading ? "Running Test..." : "Start Load Test"}
          </button>
        </div>

        {testStats.total > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold">{testStats.total}</div>
              <div className="text-xs text-gray-500 uppercase">Total</div>
            </div>
            <div className="bg-green-100 p-3 rounded border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {testStats.success}
              </div>
              <div className="text-xs text-green-600 uppercase">Acquired</div>
            </div>
            <div className="bg-red-100 p-3 rounded border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {testStats.failed}
              </div>
              <div className="text-xs text-red-600 uppercase">Rejected</div>
            </div>
          </div>
        )}

        {testLogs.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded text-xs  h-64 overflow-y-auto text-left">
            {testLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
