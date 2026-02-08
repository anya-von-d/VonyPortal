import React, { useState } from "react";
import { Payment, Loan } from "@/entities/all";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { format, addMonths } from "date-fns";

const PAYMENT_METHODS = [
  { id: 'venmo', label: 'Venmo', icon: Smartphone, color: 'text-blue-500' },
  { id: 'zelle', label: 'Zelle', icon: Smartphone, color: 'text-purple-500' },
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-500' },
  { id: 'bank', label: 'Bank Transfer', icon: CreditCard, color: 'text-slate-500' },
  { id: 'other', label: 'Other', icon: DollarSign, color: 'text-gray-500' },
];

export default function RecordPaymentModal({ loan, onClose, onPaymentComplete, isLender = false }) {
  const [amount, setAmount] = useState(loan.payment_amount?.toFixed(2) || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const remainingBalance = (loan.total_amount || 0) - (loan.amount_paid || 0);
  const suggestedPayment = Math.min(loan.payment_amount || 0, remainingBalance);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError("");

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (paymentAmount > remainingBalance + 0.01) {
      setError(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      // Create the payment record
      const methodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod;
      await Payment.create({
        loan_id: loan.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        status: 'completed',
        notes: notes || `${methodLabel} payment of $${paymentAmount.toFixed(2)}`
      });

      // Update the loan with new amount paid
      const newAmountPaid = (loan.amount_paid || 0) + paymentAmount;
      const newRemainingBalance = (loan.total_amount || 0) - newAmountPaid;

      const loanUpdate = {
        amount_paid: newAmountPaid,
      };

      // Mark as completed if fully paid
      if (newRemainingBalance <= 0.01) {
        loanUpdate.status = 'completed';
        loanUpdate.next_payment_date = null;
      } else {
        // Update next payment date
        loanUpdate.next_payment_date = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      }

      await Loan.update(loan.id, loanUpdate);

      setIsSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 1500);
    } catch (error) {
      console.error("Error recording payment:", error);
      setError(error.message || "Failed to record payment");
    }
    setIsProcessing(false);
  };

  if (isSuccess) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Payment Recorded!</h3>
            <p className="text-slate-600 text-center">
              The payment of ${parseFloat(amount).toFixed(2)} has been recorded successfully.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            {isLender
              ? "Record a payment received from the borrower"
              : "Record a payment you made to the lender"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRecordPayment} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loan Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Loan Amount:</span>
              <span className="font-medium">${(loan.total_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Already Paid:</span>
              <span className="font-medium text-green-600">${(loan.amount_paid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-800 font-medium">Remaining Balance:</span>
              <span className="font-bold text-slate-800">${remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${method.color}`} />
                    <span className="text-xs font-medium text-slate-700">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Payment Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingBalance}
              placeholder={suggestedPayment.toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(suggestedPayment.toFixed(2))}
                className="text-xs"
              >
                Suggested: ${suggestedPayment.toFixed(2)}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingBalance.toFixed(2))}
                className="text-xs"
              >
                Pay Full: ${remainingBalance.toFixed(2)}
              </Button>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any details about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !amount || !paymentMethod}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
