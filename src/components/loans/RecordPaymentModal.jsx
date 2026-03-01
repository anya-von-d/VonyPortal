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
  Check,
  ArrowRight,
  ArrowLeft,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { SuccessAnimation, TransactionId, AnimatedProgress } from "@/components/ui/animations";

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

// Generate a unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VNY-${timestamp}-${random}`.toUpperCase();
};

export default function RecordPaymentModal({ loan, onClose, onPaymentComplete, isLender = false, currentUserId = null }) {
  const [amount, setAmount] = useState(loan._prefillAmount || loan.payment_amount?.toFixed(2) || "");
  const [paymentMethod, setPaymentMethod] = useState(loan._prefillMethod || "");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [recipientPaymentHandles, setRecipientPaymentHandles] = useState({});
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [showDeepLinkOption, setShowDeepLinkOption] = useState(false);

  // New states for multi-step flow
  const [step, setStep] = useState(1); // 1: Enter details, 2: Confirm, 3: Success
  const [transactionId, setTransactionId] = useState("");
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);

  const remainingBalance = (loan.total_amount || 0) - (loan.amount_paid || 0);
  const suggestedPayment = Math.min(loan.payment_amount || 0, remainingBalance);

  // Inline validation states
  const [amountError, setAmountError] = useState("");
  const [methodError, setMethodError] = useState("");

  // Validate amount in real-time
  useEffect(() => {
    const paymentAmount = parseFloat(amount);
    if (amount && paymentAmount <= 0) {
      setAmountError("Amount must be greater than $0");
    } else if (amount && paymentAmount > remainingBalance + 0.01) {
      setAmountError(`Cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
    } else {
      setAmountError("");
    }
  }, [amount, remainingBalance]);

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

        // Venmo - fetch all connections and find recipient's
        const allVenmoConnections = await VenmoConnection.list();
        const recipientVenmo = allVenmoConnections.find(vc => vc.user_id === recipientId);
        if (recipientVenmo) {
          handles.venmo = recipientVenmo.venmo_username;
        }

        // PayPal - fetch all connections and find recipient's
        const allPaypalConnections = await PayPalConnection.list();
        const recipientPaypal = allPaypalConnections.find(pc => pc.user_id === recipientId);
        if (recipientPaypal) {
          handles.paypal = recipientPaypal.paypal_email || recipientPaypal.paypal_username;
        }

        // Try to get CashApp and Zelle from the user/profiles
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
          // Silently fail - CashApp/Zelle handles are optional
        }

        setRecipientPaymentHandles(handles);
      } catch (error) {
        console.error("Error fetching recipient info:", error);
      }
    };

    fetchRecipientInfo();
  }, [loan, isLender]);

  // Detect if user is on mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleOpenPaymentApp = () => {
    const handle = recipientPaymentHandles[paymentMethod];
    const paymentAmount = parseFloat(amount) || suggestedPayment;
    const paymentNote = `Loan payment to ${recipientInfo?.full_name || 'lender'}`;

    const links = generateDeepLink(paymentMethod, paymentAmount, handle, paymentNote);

    // On desktop, always use web links
    if (!isMobileDevice()) {
      if (links.web) {
        window.open(links.web, '_blank');
      }
      return;
    }

    // On mobile, try deep link first with web fallback
    if (links.mobile) {
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

  // Proceed to confirmation step
  const handleProceedToConfirm = () => {
    setError("");
    setMethodError("");

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }

    if (paymentAmount > remainingBalance + 0.01) {
      setAmountError(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    if (!paymentMethod) {
      setMethodError("Please select a payment method");
      return;
    }

    setStep(2);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError("");

    const paymentAmount = parseFloat(amount);

    setIsProcessing(true);

    try {
      // Get current user ID
      const user = await User.me();
      const recordedById = user?.id || currentUserId;

      // Generate transaction ID
      const txnId = generateTransactionId();
      setTransactionId(txnId);

      // Create the payment record with pending_confirmation status
      const methodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod;
      await Payment.create({
        loan_id: loan.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        recorded_by: recordedById,
        status: 'pending_confirmation',
        notes: notes || `${methodLabel} payment of $${paymentAmount.toFixed(2)} via ${methodLabel} [Ref: ${txnId}]`
      });

      // Don't update the loan yet - wait for confirmation from the other party

      setStep(3);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 3000);
    } catch (error) {
      console.error("Error recording payment:", error);
      setError(error.message || "Failed to record payment");
      setStep(1);
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

  // Step 3: Success
  if (step === 3 && isSuccess) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-[#DBEEE3] rounded-2xl overflow-hidden">
          <div className="relative p-6">
            <SuccessAnimation
              show={true}
              title="Payment Recorded!"
              subtitle={`Waiting for ${isLender ? 'the Borrower' : 'the Lender'} to confirm`}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-4 mt-4"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  ${parseFloat(amount).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">
                  via {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                </p>
              </div>
              {transactionId && (
                <TransactionId id={transactionId} />
              )}
              <p className="text-xs text-slate-400 text-center max-w-xs">
                The loan balance will update once both parties confirm this payment.
              </p>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Confirmation
  if (step === 2) {
    const methodInfo = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const MethodIcon = methodInfo?.icon || DollarSign;

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-[#DBEEE3] rounded-2xl overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#DBFFEB] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#00A86B]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Confirm Payment</h3>
                <p className="text-xs text-slate-500">Review and confirm the details</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Payment Summary Card */}
              <div className="bg-[#DBFFEB] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Amount</span>
                  <span className="text-2xl font-bold text-slate-800">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Method</span>
                  <div className="flex items-center gap-2">
                    <MethodIcon className={`w-4 h-4 ${methodInfo?.color}`} />
                    <span className="font-medium text-slate-800">{methodInfo?.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Date</span>
                  <span className="font-medium text-slate-800">
                    {format(new Date(paymentDate), 'MMM d, yyyy')}
                  </span>
                </div>
                {recipientInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">To</span>
                    <span className="font-medium text-slate-800">{recipientInfo.full_name}</span>
                  </div>
                )}
                {notes && (
                  <div className="pt-3 border-t border-white/40">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Notes</span>
                    <p className="text-sm text-slate-800 mt-1">{notes}</p>
                  </div>
                )}
              </div>

              {/* Warning Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-[#DBFFEB] rounded-xl p-3 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">
                  {isLender ? 'The Borrower' : 'The Lender'} will need to confirm this payment. Make sure the details are correct.
                </p>
              </motion.div>

              {error && (
                <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border-0 bg-white hover:bg-white/80"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={isProcessing}
                    className="w-full bg-[#00A86B] hover:bg-[#0D9B76] text-white rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Confirm Payment
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 1: Enter Details
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 border-0 bg-[#DBEEE3] rounded-2xl">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#DBFFEB] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#00A86B]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Record Payment</h3>
              <p className="text-xs text-slate-500">
                {isLender ? "Record a payment received from the borrower" : "Record a payment you made to the lender"}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center text-xs font-medium">1</div>
              <span className="text-xs text-slate-600 hidden sm:inline">Details</span>
            </div>
            <div className="w-8 h-0.5 bg-white/60" />
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-white/60 text-slate-400 flex items-center justify-center text-xs font-medium">2</div>
              <span className="text-xs text-slate-400 hidden sm:inline">Confirm</span>
            </div>
            <div className="w-8 h-0.5 bg-white/60" />
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-white/60 text-slate-400 flex items-center justify-center text-xs font-medium">3</div>
              <span className="text-xs text-slate-400 hidden sm:inline">Done</span>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-[#DBFFEB] rounded-xl p-3 flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#00A86B] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              {isLender ? 'The Borrower' : 'The Lender'} will need to confirm this payment before it updates the loan balance.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleProceedToConfirm(); }} className="space-y-4">
            {error && (
              <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Loan Summary */}
            <div className="bg-[#DBFFEB] rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2">Loan Balance</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Loan Amount</span>
                <span className="font-medium">${(loan.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Already Paid</span>
                <span className="font-medium text-[#00A86B]">${(loan.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/50">
                <span className="text-slate-800 font-medium">Remaining Balance</span>
                <span className="font-bold text-slate-800">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${methodError ? 'text-red-600' : 'text-slate-500'}`}>Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const hasHandle = !!recipientPaymentHandles[method.id];
                  return (
                    <motion.button
                      key={method.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setMethodError("");
                        setShowDeepLinkOption(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all relative ${
                        paymentMethod === method.id
                          ? 'bg-[#AAFFA3] shadow-sm'
                          : methodError
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-white hover:bg-[#DBFFEB]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${method.color}`} />
                      <span className="text-xs font-medium text-slate-700">{method.label}</span>
                      {hasHandle && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00A86B] rounded-full border-2 border-[#DBEEE3]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {methodError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {methodError}
                </motion.p>
              )}
              <p className="text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#00A86B] rounded-full"></span>
                  indicates recipient has connected this method
                </span>
              </p>
            </div>

            {/* Deep Link Section */}
            {paymentMethod && ['venmo', 'cashapp', 'paypal', 'zelle'].includes(paymentMethod) && !isLender && (
              <div className="bg-[#DBFFEB] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Quick Pay with {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                  </p>
                  {currentHandle && (
                    <span className="text-xs text-[#00A86B] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                  )}
                </div>

                {currentHandle ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-white rounded-xl p-2">
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
                          <Check className="w-4 h-4 text-[#00A86B]" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                    </div>

                    {currentLinks?.canDeepLink && (
                      <Button
                        type="button"
                        onClick={handleOpenPaymentApp}
                        className={`w-full ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.bgColor} hover:opacity-90 text-white rounded-xl`}
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
                        className="mt-2 rounded-xl border-0 bg-white"
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
              <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${amountError ? 'text-red-600' : 'text-slate-500'}`}>Payment Amount</p>
              <div className="relative">
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
                  className={`text-lg rounded-xl bg-white border-0 transition-all ${
                    amountError
                      ? 'ring-1 ring-red-300'
                      : amount && !amountError
                      ? 'ring-1 ring-[#00A86B]/30'
                      : ''
                  }`}
                />
                {amount && !amountError && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Check className="w-5 h-5 text-[#00A86B]" />
                  </motion.div>
                )}
              </div>
              {amountError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {amountError}
                </motion.p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAmount(suggestedPayment.toFixed(2))}
                  className="text-xs bg-white hover:bg-[#DBFFEB] text-slate-700 border-0 rounded-lg"
                >
                  Suggested: ${suggestedPayment.toFixed(2)}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAmount(remainingBalance.toFixed(2))}
                  className="text-xs bg-white hover:bg-[#DBFFEB] text-slate-700 border-0 rounded-lg"
                >
                  Pay Full: ${remainingBalance.toFixed(2)}
                </Button>
              </div>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Payment Date</p>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
                className="rounded-xl bg-white border-0"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Notes (Optional)</p>
              <Textarea
                id="notes"
                placeholder="Add any details about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="rounded-xl bg-white border-0"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white hover:bg-white/80 text-slate-700 border-0 rounded-xl"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isProcessing || !amount || !paymentMethod || !!amountError}
                  className="w-full bg-[#00A86B] hover:bg-[#0D9B76] text-white rounded-xl transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
