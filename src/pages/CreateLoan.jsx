import React, { useState, useEffect } from "react";
import { Loan, LoanAgreement, User, PublicProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelector } from "@/components/ui/user-selector";
import SignatureModal from "@/components/loans/SignatureModal";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PlusCircle, DollarSign, Calendar, Percent, FileText, User as UserIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { addMonths, format } from "date-fns";

export default function CreateLoan() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingLoanData, setPendingLoanData] = useState(null);
  const [formData, setFormData] = useState({
    borrower_username: '',
    amount: '',
    interest_rate: '',
    repayment_period: '',
    repayment_unit: 'months',
    custom_due_date: '',
    payment_frequency: 'monthly',
    purpose: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const publicProfiles = await PublicProfile.list();
      const safeProfiles = Array.isArray(publicProfiles) ? publicProfiles : [];
      
      // Filter out the current user's profile and any potential sample users left in DB
      const otherRealUsers = safeProfiles.filter(p => p && p.user_id !== user.id && !p.user_id.startsWith('sample-user-'));
      
      // Remove duplicates by user_id
      const uniqueUsers = Array.from(new Map(otherRealUsers.map(u => [u.user_id, u])).values());
      
      setUsers(uniqueUsers);
      
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
    setIsLoadingUsers(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateLoanDetails = () => {
    const amount = parseFloat(formData.amount) || 0;
    const interestRate = parseFloat(formData.interest_rate) || 0;
    const period = parseInt(formData.repayment_period) || 0;
    
    let periodInMonths = period;
    if (formData.repayment_unit === 'days') {
      periodInMonths = period / 30;
    } else if (formData.repayment_unit === 'weeks') {
      periodInMonths = period / 4.33;
    } else if (formData.repayment_unit === 'custom' && formData.custom_due_date) {
      const today = new Date();
      const dueDate = new Date(formData.custom_due_date);
      const diffTime = Math.abs(dueDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      periodInMonths = diffDays / 30;
    }
    
    if (amount > 0 && interestRate >= 0 && periodInMonths > 0) {
      const totalAmount = amount * (1 + (interestRate / 100) * (periodInMonths / 12));
      let paymentAmount;
      switch (formData.payment_frequency) {
        case 'none':
          paymentAmount = 0;
          break;
        case 'weekly':
          paymentAmount = totalAmount / (periodInMonths * (52 / 12));
          break;
        case 'biweekly':
          paymentAmount = totalAmount / (periodInMonths * (26 / 12));
          break;
        default: // monthly
          paymentAmount = totalAmount / periodInMonths;
      }
      return { totalAmount, paymentAmount, totalInterest: totalAmount - amount };
    }
    return { totalAmount: 0, paymentAmount: 0, totalInterest: 0 };
  };

  const findUserByUsername = async (username) => {
    if (!username) return null;
    
    const foundInLocal = users.find(u => u && u.username === username);
    if (foundInLocal) return foundInLocal;

    try {
      const profiles = await PublicProfile.filter({ username: { eq: username.trim() } });
      if (profiles && profiles.length > 0) return profiles[0];
    } catch (error) {
      console.error(`Error searching for profile with username ${username}:`, error);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!currentUser) {
        alert("Please log in to create a loan offer.");
        setIsSubmitting(false);
        return;
      }

      if (!formData.borrower_username.trim()) {
        alert("Please select or enter a borrower's username.");
        setIsSubmitting(false);
        return;
      }

      const borrowerProfile = await findUserByUsername(formData.borrower_username.trim());

      if (!borrowerProfile || !borrowerProfile.user_id) {
        alert(`User "${formData.borrower_username}" could not be found. They may need to log in once to activate their public profile.`);
        setIsSubmitting(false);
        return;
      }

      if (borrowerProfile.user_id === currentUser.id) {
        alert("You cannot create a loan offer to yourself.");
        setIsSubmitting(false);
        return;
      }

      const details = calculateLoanDetails();
      let dueDate;
      if (formData.repayment_unit === 'custom') {
        dueDate = new Date(formData.custom_due_date);
      } else if (formData.repayment_unit === 'days') {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(formData.repayment_period));
      } else if (formData.repayment_unit === 'weeks') {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(formData.repayment_period) * 7);
      } else {
        dueDate = addMonths(new Date(), parseInt(formData.repayment_period));
      }

      const loanData = {
        lender_id: currentUser.id,
        borrower_id: borrowerProfile.user_id,
        amount: parseFloat(formData.amount),
        interest_rate: parseFloat(formData.interest_rate),
        repayment_period: parseInt(formData.repayment_period),
        payment_frequency: formData.payment_frequency,
        purpose: formData.purpose,
        status: 'pending',
        due_date: format(dueDate, 'yyyy-MM-dd'),
        total_amount: details.totalAmount,
        payment_amount: details.paymentAmount,
        next_payment_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
      };

      // Store loan data and show signature modal
      setPendingLoanData(loanData);
      setShowSignatureModal(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error creating loan:", error);
      alert(`Error creating loan offer: ${error.message || "Please try again."}`);
      setIsSubmitting(false);
    }
  };

  const handleSign = async (signature) => {
    setIsSubmitting(true);
    try {
      // Create the loan
      const createdLoan = await Loan.create(pendingLoanData);

      // Create the agreement with lender signature
      await LoanAgreement.create({
        loan_id: createdLoan.id,
        lender_id: pendingLoanData.lender_id,
        lender_name: signature,
        lender_signed_date: new Date().toISOString(),
        borrower_id: pendingLoanData.borrower_id,
        amount: pendingLoanData.amount,
        interest_rate: pendingLoanData.interest_rate,
        repayment_period: pendingLoanData.repayment_period,
        payment_frequency: pendingLoanData.payment_frequency,
        purpose: pendingLoanData.purpose || '',
        due_date: pendingLoanData.due_date,
        total_amount: pendingLoanData.total_amount,
        payment_amount: pendingLoanData.payment_amount,
        is_fully_signed: false
      });

      setShowSignatureModal(false);
      navigate(createPageUrl("MyLoans"));
    } catch (error) {
      console.error("Error creating loan and agreement:", error);
      alert(`Error: ${error.message || "Please try again."}`);
    }
    setIsSubmitting(false);
  };

  const details = calculateLoanDetails();

  return (
    <>
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setPendingLoanData(null);
        }}
        onSign={handleSign}
        loanDetails={pendingLoanData || {}}
        userFullName={currentUser?.full_name || ''}
        signingAs="Lender"
      />
      <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <div className="max-w-4xl mx-auto space-y-7">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-5"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight text-center">
            Create Loan Offer
          </h1>
          <p className="text-lg text-slate-600 text-center">
            Create and send a loan offer
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <PlusCircle className="w-5 h-5 text-green-600" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Borrower Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="borrower_username" className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-green-600" />
                      Select Borrower
                    </Label>
                    
                    {isLoadingUsers ? (
                      <div className="h-10 bg-slate-100 rounded-md animate-pulse flex items-center px-3">
                        <span className="text-slate-500">Loading users...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <UserSelector
                          users={users}
                          value={formData.borrower_username}
                          onSelect={(username) => handleInputChange('borrower_username', username)}
                          placeholder="Choose a user or type their username..."
                        />
                        {users.length === 0 && !isLoadingUsers && (
                           <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-blue-800 text-sm">
                                <strong>No other users found.</strong> Invite others to the platform to start lending. Once they sign up, they will appear here.
                              </p>
                            </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Loan Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Loan Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5000"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      required
                    />
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate" className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-green-600" />
                      Interest Rate (% per year)
                    </Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="8"
                      placeholder="Enter rate (max 8%)"
                      value={formData.interest_rate}
                      onChange={(e) => handleInputChange('interest_rate', e.target.value)}
                      required
                    />
                  </div>

                  {/* Repayment Period */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      Repayment Period
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={formData.repayment_unit}
                        onValueChange={(value) => handleInputChange('repayment_unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.repayment_unit === 'custom' ? (
                        <Input
                          type="text"
                          placeholder="MM/DD/YYYY"
                          value={formData.custom_due_date}
                          onChange={(e) => handleInputChange('custom_due_date', e.target.value)}
                          required
                        />
                      ) : (
                        <Input
                          id="repayment_period"
                          type="number"
                          min="1"
                          placeholder={`Enter ${formData.repayment_unit}`}
                          value={formData.repayment_period}
                          onChange={(e) => handleInputChange('repayment_period', e.target.value)}
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Payment Frequency */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      Payment Frequency
                    </Label>
                    <Select
                      value={formData.payment_frequency}
                      onValueChange={(value) => handleInputChange('payment_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.borrower_username || !formData.amount || !formData.interest_rate || (formData.repayment_unit === 'custom' ? !formData.custom_due_date : !formData.repayment_period)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                  >
                    {isSubmitting ? "Sending Loan Offer..." : "Send Loan Offer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Loan Summary */}
          <div className="lg:col-span-1">
            <Card className="text-white sticky top-6" style={{backgroundColor: '#35B276'}}>
              <CardHeader>
                <CardTitle className="text-2xl">Loan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="opacity-90">Loan Amount:</span>
                    <span className="font-bold">
                      ${parseFloat(formData.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="opacity-90">Total Interest:</span>
                    <span className="font-bold">
                      ${details.totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  
                  <div className="border-t opacity-80 pt-3">
                    <div className="flex justify-between text-lg">
                      <span>Total Repayment:</span>
                      <span className="font-bold">
                        ${details.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </div>

                {((formData.repayment_period && formData.repayment_unit !== 'custom') || (formData.repayment_unit === 'custom' && formData.custom_due_date)) && (
                  <div className="text-sm opacity-90 border-t border-green-400 pt-3">
                    <p>Loan will be fully repaid by:</p>
                    <p className="font-semibold text-green-100">
                      {formData.repayment_unit === 'custom' && formData.custom_due_date
                        ? format(new Date(formData.custom_due_date), 'MMMM d, yyyy')
                        : formData.repayment_unit === 'days'
                        ? format(new Date(new Date().setDate(new Date().getDate() + parseInt(formData.repayment_period || 0))), 'MMMM d, yyyy')
                        : formData.repayment_unit === 'weeks'
                        ? format(new Date(new Date().setDate(new Date().getDate() + parseInt(formData.repayment_period || 0) * 7)), 'MMMM d, yyyy')
                        : format(addMonths(new Date(), parseInt(formData.repayment_period || 0)), 'MMMM d, yyyy')
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}