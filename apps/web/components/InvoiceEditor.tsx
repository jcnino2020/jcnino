'use client';

import React, { useState } from 'react';

interface Invoice {
  id: string;
  amount: string;
  isEscrowLock: boolean;
  isPaid: boolean;
}

interface Project {
  id: string;
  name: string;
  budget: string;
  invoices: Invoice[];
}

export default function InvoiceEditor({ project }: { project: Project }) {
  const [invoices, setInvoices] = useState<Invoice[]>(project.invoices || []);
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  const handlePaymentRedirect = async (invoiceId: string) => {
    setRedirectingId(invoiceId);
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert(`Stripe connection error: ${err.message}`);
    } finally {
      setRedirectingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-zinc-950 border border-white/5 rounded-2xl max-w-xl mx-auto">
      <div>
        <h3 className="text-lg font-bold text-white leading-snug">Billing Ledger: {project.name}</h3>
        <p className="text-xs text-zinc-500 mt-1">Manage payment status, contract terms, and client delivery escrow locks.</p>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-white/5 rounded-xl">
            <p className="text-xs text-zinc-500">No active invoices linked to this project.</p>
          </div>
        ) : (
          invoices.map((invoice, idx) => (
            <div
              key={invoice.id}
              className="p-4 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400">Milestone #{idx + 1}</span>
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      invoice.isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {invoice.isPaid ? 'Paid' : 'Unsettled'}
                  </span>
                </div>
                <p className="text-xl font-black text-white mt-2">${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                {invoice.isEscrowLock && !invoice.isPaid && (
                  <p className="text-[10px] text-indigo-400 mt-1">🔒 Escrow Lock: Downloads restricted until paid.</p>
                )}
              </div>

              {!invoice.isPaid && (
                <button
                  onClick={() => handlePaymentRedirect(invoice.id)}
                  disabled={redirectingId !== null}
                  className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-xs font-bold rounded-full transition-all select-none leading-none"
                >
                  {redirectingId === invoice.id ? 'Connecting...' : 'Pay Balance'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-white/5 pt-4 mt-6">
        <span>Total Project Value:</span>
        <span className="font-bold text-white text-sm">${Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
