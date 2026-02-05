import React, { useState } from "react";
import { Payment, Loan } from "@/entities/all";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, CreditCard, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function PaymentModal({ loan, onClose, onPaymentComplete }) {
  const [paymentAmount, setPaymentAmount] = useState(loan.payment_amount?.toString() || '');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    routingNumber: ''
  });

  const remainingBalance = loan.total_amount - loan.amount_paid;
  const suggestedAmount = Math.min(loan.payment_amount || 0, remainingBalance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const amount = parseFloat(paymentAmount);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create payment record
      await Payment.create({
        loan_id: loan.id,
        amount: amount,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: notes + ` (Paid via ${paymentMethod === 'paypal' ? 'PayPal' : 'Bank Transfer'})`,
        status: 'completed'
      });

      // Update loan with new amount paid
      const newAmountPaid = loan.amount_paid + amount;
      const updatedLoanData = {
        amount_paid: newAmountPaid
      };

      // Check if loan is fully paid
      if (newAmountPaid >= loan.total_amount) {
        updatedLoanData.status = 'completed';
      }

      await Loan.update(loan.id, updatedLoanData);
      
      onPaymentComplete();
    } catch (error) {
      console.error("Error processing payment:", error);
    }
    
    setIsProcessing(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Make Payment
          </DialogTitle>
        </DialogHeader>

        {/* Loan Summary */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Loan Amount:</span>
              <span className="font-medium">${loan.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Owed:</span>
              <span className="font-medium">${loan.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Already Paid:</span>
              <span className="font-medium">${loan.amount_paid?.toLocaleString() || 0}</span>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Remaining Balance:</span>
                <span className="text-green-700">${remainingBalance.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Payment Amount
            </Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              max={remainingBalance}
              step="0.01"
              placeholder={suggestedAmount.toString()}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              className="text-lg"
            />
            <p className="text-xs text-slate-500">
              Suggested payment: ${suggestedAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paypal" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  PayPal
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Bank Transfer
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="paypal" className="mt-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PayPal</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Pay with PayPal</p>
                        <p className="text-xs text-blue-600">Secure payment processing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bank" className="mt-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Bank Transfer Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="routing" className="text-xs">Routing Number</Label>
                        <Input
                          id="routing"
                          placeholder="123456789"
                          value={bankDetails.routingNumber}
                          onChange={(e) => setBankDetails(prev => ({...prev, routingNumber: e.target.value}))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="account" className="text-xs">Account Number</Label>
                        <Input
                          id="account"
                          placeholder="1234567890"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isProcessing || (paymentMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.routingNumber))}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                `Pay $${parseFloat(paymentAmount || 0).toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}