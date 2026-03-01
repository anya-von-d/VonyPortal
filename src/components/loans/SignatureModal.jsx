import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, DollarSign, Percent, Calendar, CreditCard, CheckCircle, PenLine, Shield, Lock, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";
import { AnimatedCheckmark, SuccessAnimation, ConfettiBurst } from "@/components/ui/animations";

// Trust checklist items for Lender
const LENDER_CHECKLIST = [
  { id: 1, text: "I confirm the terms above are correct, including the loan amount, interest rate, and payment schedule" },
  { id: 2, text: "I agree to lend the Borrower the amount shown above" },
  { id: 3, text: "I am comfortable lending to the Borrower, and understand that lending money can involve some risk" },
];

// Trust checklist items for Borrower (fallback)
const BORROWER_CHECKLIST = [
  { id: 1, text: "I understand the loan amount and interest rate" },
  { id: 2, text: "I agree to the repayment schedule" },
  { id: 3, text: "I have reviewed all terms carefully" },
];

export default function SignatureModal({ isOpen, onClose, onSign, loanDetails, userFullName, signingAs }) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [showChecklistError, setShowChecklistError] = useState(false);

  // Use lender checklist for lenders, borrower checklist for borrowers
  const AGREEMENT_CHECKLIST = signingAs === 'Lender' ? LENDER_CHECKLIST : BORROWER_CHECKLIST;

  const handleCheckItem = (id) => {
    setCheckedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setShowChecklistError(false);
  };

  const allItemsChecked = AGREEMENT_CHECKLIST.every(item => checkedItems.includes(item.id));

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
    if (signature.trim().toLowerCase() !== userFullName.toLowerCase()) {
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

  const isSignatureValid = signature.trim().toLowerCase() === userFullName?.toLowerCase();

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg p-0 gap-0 border-0 bg-[#DBEEE3] rounded-2xl overflow-hidden">
          <div className="relative p-6">
            <SuccessAnimation
              show={true}
              title="Agreement Signed!"
              subtitle={`You have successfully signed as ${signingAs}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-[#DBEEE3] rounded-2xl">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#DBFFEB] rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#00A86B]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Loan Agreement</h2>
              <p className="text-xs text-slate-500">
                Review the terms and sign to {signingAs === 'Lender' ? 'create this loan offer' : 'accept this loan'}
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-5 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Time-stamped</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Terms at a Glance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#DBFFEB] rounded-2xl p-4"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-3">Terms at a Glance</p>

            {loanDetails.purpose && (
              <div className="mb-3 pb-3 border-b border-white/50">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-1">Purpose</p>
                <p className="text-slate-800 font-medium">{loanDetails.purpose}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-[#AAFFA3] rounded-xl p-3"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5">Amount</p>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.amount)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-[#30FFA8] rounded-xl p-3"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5">Interest</p>
                <p className="text-xl font-bold text-slate-800">{loanDetails.interest_rate}%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-[#96FFD0] rounded-xl p-3"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5">Term</p>
                <p className="text-xl font-bold text-slate-800">{loanDetails.repayment_period} <span className="text-sm font-normal text-slate-500">{loanDetails.repayment_unit || 'months'}</span></p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-[#6EE8A2] rounded-xl p-3"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5">Payment</p>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.payment_amount)}</p>
                <p className="text-xs text-slate-500 capitalize">{loanDetails.payment_frequency}</p>
              </motion.div>
            </div>

            {/* Total Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 pt-3 border-t border-white/50 flex justify-between items-center"
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Total Due</span>
              <span className="text-2xl font-bold text-[#00A86B]">{formatMoney(loanDetails.total_amount)}</span>
            </motion.div>
          </motion.div>

          {/* What You're Agreeing To - Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-[#DBFFEB] rounded-2xl p-4 space-y-3 transition-colors ${
              showChecklistError && !allItemsChecked
                ? 'ring-2 ring-red-400'
                : ''
            }`}
          >
            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 ${
              showChecklistError && !allItemsChecked ? 'text-red-600' : 'text-slate-500'
            }`}>
              <CheckCircle className={`w-3.5 h-3.5 ${showChecklistError && !allItemsChecked ? 'text-red-500' : 'text-[#00A86B]'}`} />
              What you're agreeing to
            </p>
            <div className="space-y-2">
              {AGREEMENT_CHECKLIST.map((item, index) => (
                <motion.label
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/40 cursor-pointer transition-colors group"
                >
                  <div
                    onClick={() => handleCheckItem(item.id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
                      checkedItems.includes(item.id)
                        ? 'bg-[#00A86B]'
                        : showChecklistError && !checkedItems.includes(item.id)
                        ? 'bg-red-100'
                        : 'bg-white group-hover:bg-[#AAFFA3]'
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

          {/* Agreement Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#DBFFEB] rounded-xl p-4"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing below, you acknowledge and agree to the loan terms stated above as the{' '}
              <span className="font-semibold text-[#00A86B]">{signingAs}</span>.
              You commit to fulfilling all obligations outlined in this agreement.
            </p>
          </motion.div>

          {/* Signature Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <PenLine className="w-3.5 h-3.5 text-[#00A86B]" />
              Type your full name to sign
            </p>
            <div className="relative">
              <Input
                id="signature"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  setError("");
                }}
                placeholder={userFullName}
                className={`text-lg h-14 font-serif italic rounded-xl bg-white border-0 transition-all ${
                  signature && isSignatureValid
                    ? 'ring-2 ring-[#00A86B]/40 bg-[#DBFFEB]/30'
                    : signature && !isSignatureValid
                    ? 'ring-1 ring-amber-300'
                    : ''
                }`}
              />
              {signature && isSignatureValid && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle className="w-6 h-6 text-[#00A86B]" />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-slate-400">Please type:</span>
              <span className="font-medium text-slate-700">{userFullName}</span>
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-xl"
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
            transition={{ delay: 0.6 }}
            className="flex gap-3 pt-1"
          >
            <Button
              onClick={onClose}
              className="flex-1 h-12 text-base bg-white hover:bg-white/80 text-slate-700 border-0 rounded-xl"
              disabled={isSigning}
            >
              Cancel
            </Button>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSign}
                className="w-full h-12 text-base bg-[#00A86B] hover:bg-[#0D9B76] text-white rounded-xl transition-all"
                disabled={isSigning || !isSignatureValid || !allItemsChecked}
              >
                {isSigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  <>
                    <PenLine className="w-5 h-5 mr-2" />
                    Sign Agreement
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
