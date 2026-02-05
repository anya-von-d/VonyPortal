import React, { useState, useEffect, useRef } from "react";
import { Payment, Loan, PublicProfile, User, PayPalConnection } from "@/entities/all";
import { createPayPalOrder } from "@/functions/createPayPalOrder";
import { capturePayPalOrder } from "@/functions/capturePayPalOrder";
import { getPayPalClientId } from "@/functions/getPayPalClientId";
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
import { DollarSign, Send, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { addMonths } from "date-fns";

export default function SendMoneyModal({ loan, onClose, onPaymentComplete }) {
  const [amount, setAmount] = useState(loan.payment_amount?.toFixed(2) || "");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lenderEmail, setLenderEmail] = useState("");
  const [isLoadingLender, setIsLoadingLender] = useState(true);
  const [error, setError] = useState("");
  const [showPayPalButton, setShowPayPalButton] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalRef = useRef(null);

  const remainingBalance = (loan.total_amount || 0) - (loan.amount_paid || 0);
  const suggestedPayment = Math.min(loan.payment_amount || 0, remainingBalance);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lender PayPal email
        const connections = await PayPalConnection.filter({ user_id: loan.lender_id });
        if (connections.length > 0 && connections[0].paypal_email) {
          setLenderEmail(connections[0].paypal_email);
        } else {
          const users = await User.list();
          const lender = users.find(u => u.id === loan.lender_id);
          if (lender?.email) {
            setLenderEmail(lender.email);
          }
        }
      } catch (err) {
        console.error("Error fetching lender data:", err);
      }
      setIsLoadingLender(false);
    };
    fetchData();
  }, [loan.lender_id]);

  // Separate effect for loading PayPal SDK
  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        // Check if already loaded
        if (window.paypal) {
          setPaypalReady(true);
          return;
        }

        // Fetch client ID
        const clientIdResult = await getPayPalClientId();
        const clientId = clientIdResult.data?.clientId;
        
        if (!clientId) {
          throw new Error("PayPal Client ID not available");
        }

        setPaypalClientId(clientId);

        // Load PayPal SDK
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => {
          setPaypalReady(true);
        };
        script.onerror = () => {
          setError("Failed to load PayPal SDK");
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("Error loading PayPal SDK:", err);
        setError("Failed to load PayPal SDK");
      }
    };

    loadPayPalSDK();
  }, []);

  useEffect(() => {
    if (showPayPalButton && lenderEmail && amount && paypalRef.current && paypalReady) {
      const renderPayPalButton = () => {
        if (!window.paypal) {
          setTimeout(renderPayPalButton, 200);
          return;
        }

        if (paypalRef.current) {
          paypalRef.current.innerHTML = '';
        }
        
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: async () => {
            try {
              const paymentAmount = parseFloat(amount);
              const result = await createPayPalOrder({
                recipientEmail: lenderEmail,
                amount: paymentAmount,
                currency: "USD",
                loanId: loan.id,
                returnUrl: window.location.href
              });
              
              if (result.data?.error) {
                throw new Error(result.data.error);
              }
              
              return result.data.orderId;
            } catch (error) {
              console.error("Create order error:", error);
              setError(error.message);
              throw error;
            }
          },
          onApprove: async (data) => {
            setIsProcessing(true);
            try {
              const captureResult = await capturePayPalOrder({ orderId: data.orderID });
              
              if (captureResult.data?.error) {
                throw new Error(captureResult.data.error);
              }

              const paymentAmount = parseFloat(amount);
              
              await Payment.create({
                loan_id: loan.id,
                amount: paymentAmount,
                payment_date: format(new Date(), 'yyyy-MM-dd'),
                status: 'completed',
                notes: notes || `PayPal payment of $${paymentAmount.toFixed(2)} (Order: ${data.orderID})`
              });

              const newAmountPaid = (loan.amount_paid || 0) + paymentAmount;
              const newRemainingBalance = (loan.total_amount || 0) - newAmountPaid;

              const loanUpdate = {
                amount_paid: newAmountPaid,
              };

              if (newRemainingBalance <= 0.01) {
                loanUpdate.status = 'completed';
                loanUpdate.next_payment_date = null;
              } else {
                loanUpdate.next_payment_date = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
              }

              await Loan.update(loan.id, loanUpdate);

              setIsSuccess(true);
              setTimeout(() => {
                onPaymentComplete();
              }, 1500);
            } catch (error) {
              console.error("Error completing payment:", error);
              setError(error.message || "Failed to complete payment");
            }
            setIsProcessing(false);
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            setError('Payment failed. Please try again.');
            setShowPayPalButton(false);
          },
          onCancel: () => {
            setShowPayPalButton(false);
          }
        }).render(paypalRef.current);
      };

      renderPayPalButton();
    }
  }, [showPayPalButton, lenderEmail, amount, paypalReady]);

  const handleSendMoney = (e) => {
    e.preventDefault();
    setError("");

    const paymentAmount = parseFloat(amount);
    
    if (paymentAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (paymentAmount > remainingBalance) {
      setError(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    if (!lenderEmail) {
      setError("Lender's PayPal email is required");
      return;
    }

    setShowPayPalButton(true);
  };

  if (isSuccess) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Payment Sent!</h3>
            <p className="text-slate-600 text-center">
              Your payment of ${parseFloat(amount).toFixed(2)} has been successfully sent via PayPal.
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
            <Send className="w-5 h-5 text-green-600" />
            Send Money
          </DialogTitle>
          <DialogDescription>
            Make a payment towards your loan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendMoney} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Lender PayPal Email */}
          <div className="space-y-2">
            <Label htmlFor="lenderEmail" className="flex items-center gap-2">
              <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="w-4 h-4" />
              Lender's PayPal Email
            </Label>
            {isLoadingLender ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              <Input
                id="lenderEmail"
                type="email"
                placeholder="lender@email.com"
                value={lenderEmail}
                onChange={(e) => setLenderEmail(e.target.value)}
                required
                className="text-sm"
              />
            )}
            <p className="text-xs text-slate-500">Money will be sent to this PayPal account</p>
          </div>

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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a note for this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          {!showPayPalButton ? (
            <div className="flex gap-3">
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
                disabled={isProcessing || !amount}
                className="flex-1 bg-[#0070ba] hover:bg-[#005ea6]"
              >
                <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="w-4 h-4 mr-2" />
                Continue to PayPal
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-3 text-center">
                {paypalReady ? "Log in to PayPal to complete your payment" : "Loading PayPal..."}
              </p>
              <div ref={paypalRef} className="min-h-[150px] flex items-center justify-center">
                {!paypalReady && <div className="text-sm text-slate-400">Loading payment options...</div>}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayPalButton(false)}
                className="w-full mt-2"
              >
                Back
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}