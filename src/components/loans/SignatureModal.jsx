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
  { id: 3, text: "I am comfortable moving forward with lending to the Borrower and understand that lending money can involve some risk" },
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
        <DialogContent className="max-w-lg p-0 gap-0">
          <div className="relative">
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-2 border-[#35B276]">
        {/* Header with solid green */}
        <div className="bg-[#35B276] p-6 rounded-t-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-2xl text-[#F3F0EC]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#F3F0EC]" />
              </div>
              Loan Agreement
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: '#F3F0EC' }}>
              Review the terms and sign to {signingAs === 'Lender' ? 'create this loan offer' : 'accept this loan'}
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

          {/* Terms at a Glance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200"
          >
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Terms at a Glance
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
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
                transition={{ delay: 0.15 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Interest</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{loanDetails.interest_rate}%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
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
                transition={{ delay: 0.25 }}
                className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.payment_amount)}</p>
                <p className="text-xs text-slate-500 capitalize">{loanDetails.payment_frequency}</p>
              </motion.div>
            </div>

            {/* Total Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center"
            >
              <span className="text-sm font-medium text-slate-600">Total Amount Due</span>
              <span className="text-2xl font-bold text-green-600">{formatMoney(loanDetails.total_amount)}</span>
            </motion.div>
          </motion.div>

          {/* What You're Agreeing To - Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
              {AGREEMENT_CHECKLIST.map((item, index) => (
                <motion.label
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
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

          {/* Agreement Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-xl p-4"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing below, you acknowledge and agree to the loan terms stated above as the{' '}
              <span className="font-semibold text-[#35B276]">{signingAs}</span>.
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
            <Label htmlFor="signature" className="text-base font-medium text-slate-700 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-green-600" />
              Type your full name to sign
            </Label>
            <div className="relative">
              <Input
                id="signature"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  setError("");
                }}
                placeholder={userFullName}
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
              <span className="font-medium text-slate-700">{userFullName}</span>
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
            transition={{ delay: 0.6 }}
            className="flex gap-3 pt-2"
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base border-slate-300 hover:bg-slate-50 transition-colors"
              disabled={isSigning}
            >
              Cancel
            </Button>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSign}
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25 transition-all"
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
