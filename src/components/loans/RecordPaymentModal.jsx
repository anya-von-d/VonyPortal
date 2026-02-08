import React, { useState, useEffect } from "react";
import { Payment, Loan, User, PublicProfile, VenmoConnection, PayPalConnection } from "@/entities/all";
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
  Smartphone,
  Clock,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { format } from "date-fns";

const PAYMENT_METHODS = [
  { id: 'venmo', label: 'Venmo', icon: Smartphone, color: 'text-blue-500', bgColor: 'bg-blue-500' },
  { id: 'zelle', label: 'Zelle', icon: Smartphone, color: 'text-purple-500', bgColor: 'bg-purple-500' },
  { id: 'cashapp', label: 'Cash App', icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500' },
  { id: 'paypal', label: 'PayPal', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-600' },
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-500', bgColor: 'bg-emerald-500' },
  { id: 'other', label: 'Other', icon: DollarSign, color: 'text-gray-500', bgColor: 'bg-gray-500' },
];

// Deep link generators for payment apps
const generateDeepLink = (method, amount, recipientHandle, note) => {
  const encodedNote = encodeURIComponent(note || 'Loan payment via Vony');

  switch (method) {
    case 'venmo':
      // Venmo deep link format
      // Mobile: venmo://paycharge?txn=pay&recipients={username}&amount={amount}&note={note}
      // Web fallback: https://venmo.com/{username}
      if (recipientHandle) {
        const username = recipientHandle.replace('@', '');
        return {
          mobile: `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encodedNote}`,
          web: `https://venmo.com/${username}`,
          canDeepLink: true
        };
      }
      return { mobile: null, web: 'https://venmo.com', canDeepLink: false };

    case 'cashapp':
      // Cash App deep link format
      // Mobile: cashapp://cash.app/pay/{cashtag}/{amount}
      // Web fallback: https://cash.app/{cashtag}
      if (recipientHandle) {
        const cashtag = recipientHandle.replace('$', '');
        return {
          mobile: `cashapp://cash.app/$${cashtag}/${amount}`,
          web: `https://cash.app/$${cashtag}`,
          canDeepLink: true
        };
      }
      return { mobile: null, web: 'https://cash.app', canDeepLink: false };

    case 'paypal':
      // PayPal.me link format
      // https://paypal.me/{username}/{amount}
      if (recipientHandle) {
        const username = recipientHandle.includes('@')
          ? recipientHandle // email
          : recipientHandle.replace('paypal.me/', ''); // PayPal.me username

        if (username.includes('@')) {
          // Email - can't use paypal.me, just open PayPal
          return {
            mobile: `https://www.paypal.com/paypalme/my/send?amount=${amount}`,
            web: `https://www.paypal.com`,
            canDeepLink: false
          };
        }
        return {
          mobile: `https://paypal.me/${username}/${amount}`,
          web: `https://paypal.me/${username}/${amount}`,
          canDeepLink: true
        };
      }
      return { mobile: null, web: 'https://paypal.com', canDeepLink: false };

    case 'zelle':
      // Zelle doesn't have public deep links, but we can provide info
      // Users need to use their bank's app
      return {
        mobile: null,
        web: 'https://www.zellepay.com',
        canDeepLink: false,
        instructions: recipientHandle
          ? `Send to: ${recipientHandle}`
          : 'Open your bank app to send via Zelle'
      };

    default:
      return { mobile: null, web: null, canDeepLink: false };
  }
};

export default function RecordPaymentModal({ loan, onClose, onPaymentComplete, isLender = false, currentUserId = null }) {
  const [amount, setAmount] = useState(loan.payment_amount?.toFixed(2) || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [recipientPaymentHandles, setRecipientPaymentHandles] = useState({});
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [showDeepLinkOption, setShowDeepLinkOption] = useState(false);

  const remainingBalance = (loan.total_amount || 0) - (loan.amount_paid || 0);
  const suggestedPayment = Math.min(loan.payment_amount || 0, remainingBalance);

  // Fetch recipient's payment handles
  useEffect(() => {
    const fetchRecipientInfo = async () => {
      try {
        // Determine who the recipient is (opposite party)
        const recipientId = isLender ? loan.borrower_id : loan.lender_id;

        // Get recipient's profile
        const profiles = await PublicProfile.list();
        const recipientProfile = profiles.find(p => p.user_id === recipientId);
        setRecipientInfo(recipientProfile);

        // Get payment handles
        const handles = {};

        // Venmo - use { eq: } syntax for filtering
        const venmoConnections = await VenmoConnection.filter({ user_id: { eq: recipientId } });
        if (venmoConnections && venmoConnections.length > 0) {
          handles.venmo = venmoConnections[0].venmo_username;
        }

        // PayPal - use { eq: } syntax for filtering
        const paypalConnections = await PayPalConnection.filter({ user_id: { eq: recipientId } });
        if (paypalConnections && paypalConnections.length > 0) {
          handles.paypal = paypalConnections[0].paypal_email || paypalConnections[0].paypal_username;
        }

        // CashApp and Zelle are stored on User profile, need to fetch from users
        // Get user data directly if available through profiles
        if (recipientProfile) {
          // These would be on the user object, but we might need to fetch User data
          // For now, check if the profile has these fields synced
        }

        // Try to get CashApp and Zelle from the user entity
        try {
          const users = await User.list();
          const recipientUser = users?.find(u => u.id === recipientId);
          if (recipientUser) {
            if (recipientUser.cashapp_handle) {
              handles.cashapp = recipientUser.cashapp_handle;
            }
            if (recipientUser.zelle_email) {
              handles.zelle = recipientUser.zelle_email;
            }
          }
        } catch (err) {
          console.log("Could not fetch user payment handles:", err);
        }

        setRecipientPaymentHandles(handles);
      } catch (error) {
        console.error("Error fetching recipient info:", error);
      }
    };

    fetchRecipientInfo();
  }, [loan, isLender]);

  const handleOpenPaymentApp = () => {
    const handle = recipientPaymentHandles[paymentMethod];
    const paymentAmount = parseFloat(amount) || suggestedPayment;
    const paymentNote = `Loan payment to ${recipientInfo?.full_name || 'lender'}`;

    const links = generateDeepLink(paymentMethod, paymentAmount, handle, paymentNote);

    if (links.mobile) {
      // Try mobile deep link first
      const startTime = Date.now();
      window.location.href = links.mobile;

      // Fallback to web after a short delay if app doesn't open
      setTimeout(() => {
        if (Date.now() - startTime < 2000 && links.web) {
          window.open(links.web, '_blank');
        }
      }, 1500);
    } else if (links.web) {
      window.open(links.web, '_blank');
    }
  };

  const handleCopyHandle = () => {
    const handle = recipientPaymentHandles[paymentMethod];
    if (handle) {
      navigator.clipboard.writeText(handle);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    }
  };

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
      // Get current user ID
      const user = await User.me();
      const recordedById = user?.id || currentUserId;

      // Create the payment record with pending_confirmation status
      const methodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod;
      await Payment.create({
        loan_id: loan.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        status: 'pending_confirmation',
        recorded_by: recordedById,
        recorded_by_role: isLender ? 'lender' : 'borrower',
        notes: notes || `${methodLabel} payment of $${paymentAmount.toFixed(2)}`
      });

      // Don't update the loan yet - wait for confirmation from the other party

      setIsSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    } catch (error) {
      console.error("Error recording payment:", error);
      setError(error.message || "Failed to record payment");
    }
    setIsProcessing(false);
  };

  // Get current deep link info
  const currentHandle = recipientPaymentHandles[paymentMethod];
  const currentLinks = paymentMethod ? generateDeepLink(
    paymentMethod,
    parseFloat(amount) || suggestedPayment,
    currentHandle,
    `Loan payment`
  ) : null;

  if (isSuccess) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Payment Recorded!</h3>
            <p className="text-slate-600 text-center">
              Waiting for {isLender ? 'the borrower' : 'your lender'} to confirm this payment of ${parseFloat(amount).toFixed(2)}.
            </p>
            <p className="text-sm text-slate-500 mt-2 text-center">
              The loan balance will update once both parties confirm.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

        {/* Info banner about confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            {isLender ? 'The borrower' : 'Your lender'} will need to confirm this payment before it updates the loan balance.
          </p>
        </div>

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
                const hasHandle = !!recipientPaymentHandles[method.id];
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setShowDeepLinkOption(false);
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all relative ${
                      paymentMethod === method.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${method.color}`} />
                    <span className="text-xs font-medium text-slate-700">{method.label}</span>
                    {hasHandle && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                indicates recipient has connected this payment method
              </span>
            </p>
          </div>

          {/* Deep Link Section - Show when a method with deep link capability is selected */}
          {paymentMethod && ['venmo', 'cashapp', 'paypal', 'zelle'].includes(paymentMethod) && !isLender && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  Quick Pay with {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                </p>
                {currentHandle && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                )}
              </div>

              {currentHandle ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white rounded-md p-2 border border-slate-200">
                    <span className="text-sm text-slate-600 flex-1 font-mono">
                      {currentHandle}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyHandle}
                      className="h-8 px-2"
                    >
                      {copiedHandle ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>

                  {currentLinks?.canDeepLink && (
                    <Button
                      type="button"
                      onClick={handleOpenPaymentApp}
                      className={`w-full ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.bgColor} hover:opacity-90 text-white`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label} to Pay ${parseFloat(amount) || suggestedPayment}
                    </Button>
                  )}

                  {paymentMethod === 'zelle' && (
                    <p className="text-xs text-slate-500">
                      Open your bank app and send to the phone/email above via Zelle.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  <p>
                    {recipientInfo?.full_name || 'The recipient'} hasn't connected their {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label} account yet.
                  </p>
                  {currentLinks?.web && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(currentLinks.web, '_blank')}
                      className="mt-2"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

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
