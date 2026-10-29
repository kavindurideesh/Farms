"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Printer, X, FileText, Phone, MapPin, CheckCircle2 } from "lucide-react";
import type { Order } from "./OrdersClient";

interface InvoiceModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ orders, isOpen, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || orders.length === 0) return null;

  // Single or multiple orders logic
  const isSingleOrder = orders.length === 1;
  const primaryOrder = orders[0];

  // Distinct buyers
  const uniqueBuyers = Array.from(
    new Set(orders.map((o) => o.buyer?.name || "Unknown Buyer"))
  );
  const isSameBuyer = uniqueBuyers.length === 1;
  const primaryBuyer = primaryOrder.buyer;

  // Grand total calculation
  const grandTotal = orders.reduce(
    (sum, o) => sum + (Number(o.total_amount) || 0),
    0
  );

  // Total quantity
  const totalQuantity = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce((iSum, item) => iSum + (Number(item.quantity) || 0), 0),
    0
  );

  // Invoice Number
  const invoiceNumber = isSingleOrder
    ? `INV-${primaryOrder.id.slice(0, 8).toUpperCase()}`
    : `INV-COMBINED-${orders.length}O-${new Date().getTime().toString().slice(-6)}`;

  // Today's Date formatted
  const todayStr = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date());

  // Isolated, clean, 1-page printing mechanism
  const handlePrint = () => {
    // Generate clean self-contained HTML for isolated printing (0 blank pages, full image)
    const itemsRowsHtml = orders
      .flatMap((order, orderIdx) =>
        order.items.map((item, itemIdx) => {
          const lineTotal =
            (Number(item.quantity) || 0) * (Number(item.rate) || 0);
          const rowNum =
            orders
              .slice(0, orderIdx)
              .reduce((acc, o) => acc + o.items.length, 0) +
            itemIdx +
            1;

          return `
            <tr>
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-family: monospace;">${rowNum}</td>
              ${
                !isSameBuyer
                  ? `<td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${
                      order.buyer?.name || "-"
                    }</td>`
                  : ""
              }
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; color: #4b5563; white-space: nowrap;">${
                order.delivery_date
              }</td>
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">
                ${item.flower?.name || "Flower Item"} ${
            item.flower?.unit
              ? `<span style="font-weight: normal; color: #6b7280;">(${item.flower.unit})</span>`
              : ""
          }
              </td>
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-variant-numeric: tabular-nums;">${Number(
                item.quantity
              ).toLocaleString()}</td>
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-variant-numeric: tabular-nums; color: #4b5563;">Rs ${Number(
                item.rate
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td>
              <td style="padding: 7px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums;">Rs ${lineTotal.toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}</td>
            </tr>
          `;
        })
      )
      .join("");

    const buyerSectionHtml =
      isSameBuyer && primaryBuyer
        ? `
        <div style="font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 3px;">${
          primaryBuyer.name
        }</div>
        ${
          primaryBuyer.phone
            ? `<div style="font-size: 10px; color: #4b5563; margin-bottom: 2px;">Phone: ${primaryBuyer.phone}</div>`
            : ""
        }
        ${
          primaryBuyer.address
            ? `<div style="font-size: 10px; color: #4b5563;">Address: ${primaryBuyer.address}</div>`
            : ""
        }
      `
        : `
        <div style="font-size: 12px; font-weight: 700; color: #111827;">Multiple Buyers (${uniqueBuyers.length})</div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${uniqueBuyers.join(
          ", "
        )}</div>
      `;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Invoice - Kamali's Farms & Flowers</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #111827;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.4;
          }
          .invoice-box {
            width: 100%;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 12px;
            border-bottom: 3px solid #15803d;
          }
          .brand-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-logo {
            width: 72px;
            height: 72px;
            object-fit: contain;
          }
          .company-name {
            font-size: 18px;
            font-weight: 800;
            color: #14532d;
            margin: 0 0 2px 0;
          }
          .company-sub {
            font-size: 10px;
            color: #4b5563;
            margin: 0 0 2px 0;
          }
          .company-contact {
            font-size: 9.5px;
            color: #6b7280;
            margin: 0;
          }
          .meta-info {
            text-align: right;
          }
          .meta-title {
            font-size: 20px;
            font-weight: 900;
            color: #15803d;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin: 0 0 4px 0;
          }
          .meta-num {
            font-size: 11px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 2px 0;
          }
          .meta-line {
            font-size: 9.5px;
            color: #4b5563;
            margin: 1px 0;
          }
          .meta-line strong {
            color: #111827;
          }
          .details-grid {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            gap: 20px;
          }
          .col-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .summary-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            min-width: 220px;
          }
          .summary-line {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            margin: 2px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 10px;
          }
          th {
            background: #f3f4f6;
            color: #1f2937;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border-bottom: 2px solid #d1d5db;
            font-size: 9.5px;
          }
          tr:nth-child(even) td {
            background: #f9fafb;
          }
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-top: 10px;
            border-top: 2px solid #e5e7eb;
            gap: 20px;
            page-break-inside: avoid;
          }
          .terms {
            max-width: 55%;
            font-size: 9px;
            color: #6b7280;
            line-height: 1.4;
          }
          .terms strong {
            color: #374151;
          }
          .totals-box {
            width: 230px;
          }
          .totals-line {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            padding: 2px 0;
            color: #4b5563;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 800;
            color: #14532d;
            background: #dcfce7;
            border: 1.5px solid #86efac;
            padding: 6px 10px;
            border-radius: 6px;
            margin-top: 6px;
          }
          .signatures {
            margin-top: 36px;
            padding-top: 10px;
            border-top: 1px dashed #d1d5db;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-line {
            border-bottom: 1px solid #6b7280;
            width: 170px;
            margin-bottom: 4px;
          }
          .sig-label {
            font-size: 9px;
            font-weight: 700;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="brand-info">
              <img src="/logo.png" alt="Logo" class="brand-logo" />
              <div>
                <h1 class="company-name">Kamali&apos;s Farms &amp; Flowers</h1>
                <p class="company-sub">257/B, Palakudawa, Talawila Church, Puttalam, Sri Lanka</p>
                <p class="company-contact">+94 71 083 0983 &nbsp;|&nbsp; +94 77 831 1886 &nbsp;|&nbsp; kavindurideesh@gmail.com</p>
              </div>
            </div>
            <div class="meta-info">
              <div class="meta-title">Invoice</div>
              <div class="meta-num">${invoiceNumber}</div>
              <div class="meta-line"><strong>Issue Date:</strong> ${todayStr}</div>
              ${
                isSingleOrder
                  ? `<div class="meta-line"><strong>Delivery Date:</strong> ${primaryOrder.delivery_date}</div>`
                  : `<div class="meta-line"><strong>Orders Included:</strong> ${orders.length}</div>`
              }
              ${
                isSingleOrder
                  ? `<div class="meta-line"><strong>Status:</strong> ${primaryOrder.status}</div>`
                  : ""
              }
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="col-title">Billed To</div>
              ${buyerSectionHtml}
            </div>
            <div>
              <div class="col-title">Order Summary</div>
              <div class="summary-card">
                <div class="summary-line">
                  <span style="color: #6b7280;">Total Orders:</span>
                  <span style="font-weight: 700;">${orders.length}</span>
                </div>
                <div class="summary-line">
                  <span style="color: #6b7280;">Total Units:</span>
                  <span style="font-weight: 700;">${totalQuantity} units</span>
                </div>
                <div class="summary-line">
                  <span style="color: #6b7280;">Payment Terms:</span>
                  <span style="font-weight: 600; color: #15803d;">Upon Receipt / Deposit</span>
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                ${!isSameBuyer ? `<th>Buyer</th>` : ""}
                <th>Delivery Date</th>
                <th>Flower / Item</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Rate (Rs)</th>
                <th style="text-align: right;">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="bottom-section">
            <div class="terms">
              <p><strong>Payment &amp; Terms:</strong></p>
              <p>Please make all deposits or bank transfers directly to our account.</p>
              <p>For any queries or discrepancies, please contact us within 24 hours of delivery.</p>
              <p style="color: #15803d; font-weight: 600; margin-top: 6px;">Thank you for your business!</p>
            </div>
            <div class="totals-box">
              <div class="totals-line">
                <span>Subtotal:</span>
                <span style="font-weight: 700; font-variant-numeric: tabular-nums;">Rs ${grandTotal.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}</span>
              </div>
              <div class="totals-line">
                <span>Tax / Charges:</span>
                <span style="font-weight: 700;">Rs 0.00</span>
              </div>
              <div class="grand-total">
                <span>Grand Total:</span>
                <span style="font-variant-numeric: tabular-nums;">Rs ${grandTotal.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}</span>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">Authorized Signature</div>
              <div style="font-size: 8px; color: #9ca3af;">Kamali&apos;s Farms &amp; Flowers</div>
            </div>
            <div style="text-align: right;">
              <div class="sig-line" style="margin-left: auto;"></div>
              <div class="sig-label">Customer Acceptance</div>
              <div style="font-size: 8px; color: #9ca3af;">Received in Good Condition</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Trigger print once image is ready
    const logoImg = doc.querySelector("img");
    const doPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    };

    if (logoImg && !logoImg.complete) {
      logoImg.onload = () => setTimeout(doPrint, 150);
      logoImg.onerror = () => setTimeout(doPrint, 150);
    } else {
      setTimeout(doPrint, 250);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl my-auto bg-stone-100 rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Screen Controls Header */}
        <div className="bg-white px-6 py-4 border-b border-stone-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-700" />
            <div>
              <h2 className="font-bold text-stone-900 text-base">
                Invoice Preview
              </h2>
              <p className="text-xs text-stone-500">
                {isSingleOrder
                  ? `Order #${primaryOrder.id.slice(0, 8)}`
                  : `${orders.length} orders selected (${uniqueBuyers.join(", ")})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Screen Preview Container */}
        <div className="p-3 sm:p-8 max-h-[85vh] overflow-y-auto">
          <div
            ref={invoiceRef}
            className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-10 mx-auto text-stone-900 font-sans"
          >
            {/* Header: Company & Invoice Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-green-700">
              {/* Left: Brand info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl border border-green-100 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Kamali's Farms & Flowers"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-green-900">
                    Kamali&apos;s Farms &amp; Flowers
                  </h1>
                  <p className="text-xs text-stone-600 font-medium">
                    257/B, Palakudawa, Talawila Church, Puttalam, Sri Lanka
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    +94 71 083 0983 &nbsp;|&nbsp; +94 77 831 1886 &nbsp;|&nbsp; kavindurideesh@gmail.com
                  </p>
                </div>
              </div>

              {/* Right: Invoice Meta */}
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-green-50 text-green-800 text-xs font-bold rounded-md tracking-wider uppercase mb-2">
                  Invoice
                </span>
                <p className="text-lg font-bold text-stone-900">{invoiceNumber}</p>
                <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                  <p>
                    <span className="font-semibold text-stone-700">Date Issued:</span>{" "}
                    {todayStr}
                  </p>
                  {isSingleOrder ? (
                    <p>
                      <span className="font-semibold text-stone-700">
                        Delivery Date:
                      </span>{" "}
                      {primaryOrder.delivery_date}
                    </p>
                  ) : (
                    <p>
                      <span className="font-semibold text-stone-700">
                        Orders Included:
                      </span>{" "}
                      {orders.length}
                    </p>
                  )}
                  {isSingleOrder && (
                    <p>
                      <span className="font-semibold text-stone-700">Status:</span>{" "}
                      <span className="font-medium text-green-700">
                        {primaryOrder.status}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To & Delivery Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-2">
                  Billed To
                </h3>
                {isSameBuyer && primaryBuyer ? (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-stone-900">
                      {primaryBuyer.name}
                    </p>
                    {primaryBuyer.phone && (
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{primaryBuyer.phone}</span>
                      </p>
                    )}
                    {primaryBuyer.address && (
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{primaryBuyer.address}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      Multiple Buyers ({uniqueBuyers.length})
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {uniqueBuyers.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-2">
                  Order Summary
                </h3>
                <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1.5 border border-stone-100">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Orders:</span>
                    <span className="font-semibold text-stone-800">
                      {orders.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Line Items:</span>
                    <span className="font-semibold text-stone-800">
                      {orders.reduce((sum, o) => sum + o.items.length, 0)} items (
                      {totalQuantity} units)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Payment Status:</span>
                    <span className="font-semibold text-stone-800">
                      Pending Deposit / Settlement
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-200 bg-stone-50/75 text-stone-700">
                    <th className="py-2.5 px-3 font-semibold w-10">#</th>
                    {!isSameBuyer && (
                      <th className="py-2.5 px-3 font-semibold">Buyer</th>
                    )}
                    <th className="py-2.5 px-3 font-semibold">Delivery Date</th>
                    <th className="py-2.5 px-3 font-semibold">Flower / Item</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Rate (Rs)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.flatMap((order, orderIdx) =>
                    order.items.map((item, itemIdx) => {
                      const lineTotal =
                        (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                      const rowNum =
                        orders
                          .slice(0, orderIdx)
                          .reduce((acc, o) => acc + o.items.length, 0) +
                        itemIdx +
                        1;

                      return (
                        <tr
                          key={`${order.id}-${itemIdx}`}
                          className="hover:bg-stone-50/50"
                        >
                          <td className="py-3 px-3 text-stone-400 font-mono">
                            {rowNum}
                          </td>
                          {!isSameBuyer && (
                            <td className="py-3 px-3 font-medium text-stone-800">
                              {order.buyer?.name || "-"}
                            </td>
                          )}
                          <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                            {order.delivery_date}
                          </td>
                          <td className="py-3 px-3 font-semibold text-stone-900">
                            {item.flower?.name || "Flower Item"}
                            {item.flower?.unit && (
                              <span className="text-stone-500 font-normal ml-1">
                                ({item.flower.unit})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-stone-800 tabular-nums">
                            {Number(item.quantity).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-stone-600 tabular-nums">
                            {Number(item.rate).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-stone-900 tabular-nums">
                            {lineTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-stone-200 gap-6">
              <div className="max-w-md text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">Payment &amp; Terms:</p>
                <p>Please make all deposits or direct transfers to our registered account.</p>
                <p>Any discrepancies must be reported within 24 hours of delivery.</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you for choosing Kamali&apos;s Farms &amp; Flowers!</span>
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    Rs{" "}
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Discounts / Taxes:</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    Rs 0.00
                  </span>
                </div>
                <div className="border-t border-stone-300 pt-2 flex justify-between items-center text-sm font-bold text-green-950 bg-green-50/75 p-2.5 rounded-lg border">
                  <span>Grand Total:</span>
                  <span className="text-base text-green-900 tabular-nums">
                    Rs{" "}
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures section */}
            <div className="mt-12 pt-8 border-t border-dashed border-stone-300 grid grid-cols-2 gap-8 text-xs text-stone-500">
              <div>
                <div className="border-b border-stone-400 w-44 mb-1.5" />
                <p className="font-medium text-stone-700">Authorized Signature</p>
                <p className="text-[10px] text-stone-400">Kamali&apos;s Farms &amp; Flowers</p>
              </div>
              <div className="text-right">
                <div className="border-b border-stone-400 w-44 ml-auto mb-1.5" />
                <p className="font-medium text-stone-700">Customer Acceptance</p>
                <p className="text-[10px] text-stone-400">Received in Good Condition</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
