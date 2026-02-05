import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";

export default function SignatureModal({ isOpen, onClose, onSign, loanDetails, userFullName, signingAs }) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
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
      setSignature("");
      setError("");
    } catch (error) {
      console.error("Error signing:", error);
      setError("Failed to sign agreement. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-green-600" />
            Loan Agreement Signature
          </DialogTitle>
          <DialogDescription>
            Review the loan terms and sign by typing your full name below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agreement Details */}
          <div className="bg-slate-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Loan Terms</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                 <p className="text-sm text-slate-600">Loan Amount</p>
                 <p className="font-semibold text-slate-900">{formatMoney(loanDetails.amount)}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600">Interest Rate</p>
                 <p className="font-semibold text-slate-900">{loanDetails.interest_rate}%</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600">Repayment Period</p>
                 <p className="font-semibold text-slate-900">{loanDetails.repayment_period} months</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600">Payment Frequency</p>
                 <p className="font-semibold text-slate-900 capitalize">{loanDetails.payment_frequency}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600">Total Amount Due</p>
                 <p className="font-semibold text-slate-900">{formatMoney(loanDetails.total_amount)}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600">Payment Amount</p>
                 <p className="font-semibold text-slate-900">{formatMoney(loanDetails.payment_amount)}</p>
               </div>
            </div>

            {loanDetails.purpose && (
              <div>
                <p className="text-sm text-slate-600">Purpose</p>
                <p className="font-semibold text-slate-900">{loanDetails.purpose}</p>
              </div>
            )}
          </div>

          {/* Agreement Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing this agreement, you acknowledge and agree to the loan terms stated above. 
              You are signing as the <strong>{signingAs}</strong> and commit to fulfilling the obligations 
              outlined in this loan agreement.
            </p>
          </div>

          {/* Signature Input */}
          <div className="space-y-2">
            <Label htmlFor="signature" className="text-base">
              Type your full name to sign <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signature"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setError("");
              }}
              placeholder="Enter your full name"
              className="text-lg font-serif"
            />
            <p className="text-sm text-slate-500">
              Please type: {userFullName}
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
             variant="outline"
             onClick={onClose}
             className="flex-1"
             disabled={isSigning}
            >
             Cancel
            </Button>
            <Button
             onClick={handleSign}
             className="flex-1 bg-green-600 hover:bg-green-700"
             disabled={isSigning}
            >
             {isSigning ? 'Signing...' : 'Sign Agreement'}
            </Button>
          </div>
          </div>
          </DialogContent>
          </Dialog>
          );
          }