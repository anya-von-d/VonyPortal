import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, CheckCircle2, X, Shield, Lock, Clock, DollarSign, Percent, Calendar, CreditCard, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";
import { format } from "date-fns";
import { SuccessAnimation } from "@/components/ui/animations";

// Trust checklist items for borrower
const BORROWER_CHECKLIST = [
  { id: 1, text: "I confirm the terms above are correct, including the loan amount, interest rate, and payment schedule" },
  { id: 2, text: "I understand that, depending on the terms outlined above, this loan may include interest" },
  { id: 3, text: "I agree to repay the amount shown above to the Lender according to the terms above" },
];

export default function BorrowerSignatureModal({
  isOpen,
  onClose,
  onSign,
  onDecline,
  loanDetails,
  lenderName,
  borrowerFullName
}) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [showChecklistError, setShowChecklistError] = useState(false);

  const handleCheckItem = (id) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setShowChecklistError(false);
  };

  const allItemsChecked = BORROWER_CHECKLIST.every(item => checkedItems.includes(item.id));
  const isSignatureValid = signature.trim().toLowerCase() === borrowerFullName?.toLowerCase();

  const handleSign = async () => {
    if (!allItemsChecked) {
      setShowChecklistError(true);
      setError("Please confirm all items in the checklist");
      return;
    }
    if (!signature.trim()) {
      setError("Please type your full name to sign");
      return;
    }
    if (signature.trim().toLowerCase() !== borrowerFullName.toLowerCase()) {
      setError("Signature must match your full name");
      return;
    }

    setIsSigning(true);
    try {
      await onSign(signature.trim());
      setIsSuccess(true);
      setTimeout(() => {
        setSignature("");
        setError("");
        setCheckedItems([]);
        setIsSuccess(false);
      }, 2500);
    } catch (error) {
      console.error("Error signing:", error);
      setError("Failed to sign agreement. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline();
    } catch (error) {
      console.error("Error declining:", error);
      setError("Failed to decline offer. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg p-0 gap-0">
          <div className="relative">
            <SuccessAnimation
              show={true}
              title="Loan Accepted!"
              subtitle={`You have accepted the loan from ${lenderName}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-2 border-[#35B276]">
        {/* Header with solid green */}
        <div className="bg-[#35B276] p-6 rounded-t-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-2xl" style={{ color: '#F3F0EC' }}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5" style={{ color: '#F3F0EC' }} />
              </div>
              <span style={{ color: '#F3F0EC' }}>Loan Agreement</span>
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: '#F3F0EC' }}>
              <span style={{ color: '#F3F0EC' }}>Review the loan terms carefully before signing</span>
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-[#35B276]" />
              <span>Secure Agreement</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-[#35B276]" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-[#35B276]" />
              <span>Time-stamped</span>
            </div>
          </div>

          {/* Lender Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#35B276]" />
              <span className="font-semibold text-[#35B276]">Lender has signed</span>
            </div>
            <p className="text-sm text-slate-700">
              {lenderName} has reviewed and signed this loan agreement.
            </p>
          </motion.div>

          {/* Terms at a Glance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200"
          >
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Terms at a Glance
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.amount)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Interest</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{loanDetails.interest_rate}% APR</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Term</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{loanDetails.repayment_period} <span className="text-sm font-normal text-slate-500">months</span></p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.payment_amount)}</p>
                <p className="text-xs text-slate-500 capitalize">{loanDetails.payment_frequency || 'Monthly'}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Due</p>
                </div>
                <p className="text-xl font-bold text-green-600">{formatMoney(loanDetails.total_amount)}</p>
              </motion.div>
            </div>

            {loanDetails.purpose && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 pt-4 border-t border-slate-200"
              >
                <p className="text-sm text-slate-600">Purpose</p>
                <p className="font-semibold text-slate-900">{loanDetails.purpose}</p>
              </motion.div>
            )}
          </motion.div>

          {/* What You're Agreeing To - Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white rounded-xl p-4 space-y-3 border-2 transition-colors ${
              showChecklistError && !allItemsChecked
                ? 'border-red-400 bg-red-50/30'
                : 'border-slate-200'
            }`}
          >
            <h4 className={`font-medium flex items-center gap-2 ${
              showChecklistError && !allItemsChecked ? 'text-red-600' : 'text-slate-800'
            }`}>
              <CheckCircle className={`w-4 h-4 ${showChecklistError && !allItemsChecked ? 'text-red-500' : 'text-[#35B276]'}`} />
              What you're agreeing to
            </h4>
            <div className="space-y-2">
              {BORROWER_CHECKLIST.map((item, index) => (
                <motion.label
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div
                    onClick={() => handleCheckItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
                      checkedItems.includes(item.id)
                        ? 'bg-[#35B276] border-[#35B276]'
                        : showChecklistError && !checkedItems.includes(item.id)
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-300 group-hover:border-[#35B276]'
                    }`}
                  >
                    <AnimatePresence>
                      {checkedItems.includes(item.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={`text-sm leading-snug ${
                    checkedItems.includes(item.id)
                      ? 'text-slate-800'
                      : showChecklistError && !checkedItems.includes(item.id)
                      ? 'text-red-600'
                      : 'text-slate-600'
                  }`}>
                    {item.text}
                  </span>
                </motion.label>
              ))}
            </div>
          </motion.div>

          {/* Agreement Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-xl p-4"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing below, you acknowledge and agree to the loan terms stated above as the{' '}
              <span className="font-semibold text-[#35B276]">Borrower</span>.
              You commit to fulfilling all obligations outlined in this agreement.
            </p>
          </motion.div>

          {/* Signature Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Label htmlFor="signature" className="text-base font-medium text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Type your full name to sign <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="signature"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  setError("");
                }}
                placeholder="Enter your full name"
                className={`text-lg h-14 font-serif italic border-2 transition-all ${
                  signature && isSignatureValid
                    ? 'border-green-500 bg-green-50/50 focus:ring-green-500'
                    : signature && !isSignatureValid
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-slate-200 focus:border-green-500'
                }`}
              />
              {signature && isSignatureValid && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </motion.div>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <span className="text-slate-400">Please type:</span>
              <span className="font-medium text-slate-700">{borrowerFullName}</span>
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3 pt-4"
          >
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-12 transition-colors"
              disabled={isSigning || isDeclining}
            >
              <X className="w-4 h-4 mr-1" />
              {isDeclining ? 'Declining...' : 'Decline Offer'}
            </Button>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSign}
                className="w-full bg-[#35B276] hover:bg-[#2d9a65] h-12 shadow-lg shadow-green-600/25 transition-all"
                disabled={isSigning || isDeclining || !isSignatureValid || !allItemsChecked}
              >
                {isSigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  'Sign & Accept'
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
