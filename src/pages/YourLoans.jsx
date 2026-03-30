import React, { useState, useEffect, useMemo } from "react";
import { createPageUrl } from "@/utils";
import { Loan, Payment, User, LoanAgreement, PublicProfile, Friendship } from "@/entities/all";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock, Calendar, DollarSign, AlertCircle, FileText, BarChart3,
  Pencil, X, Save, FolderOpen, ClipboardList, Info, TrendingUp,
  ArrowUpRight, ArrowDownLeft, Users, Percent, History, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, addMonths, addWeeks } from "date-fns";
import { formatMoney } from "@/components/utils/formatMoney";
import { toLocalDate, getLocalToday, daysUntil as daysUntilDate } from "@/components/utils/dateUtils";
import { generateAmortizationSchedule, analyzeLoanPayments } from "@/lib/loanAnalysis";
import DashboardSidebar from "@/components/DashboardSidebar";

const STAR_CIRCLES = [
  {cx:82,cy:45,o:0.7},{cx:195,cy:112,o:0.5},{cx:310,cy:28,o:0.8},{cx:420,cy:198,o:0.4},
  {cx:530,cy:67,o:0.65},{cx:640,cy:245,o:0.55},{cx:755,cy:88,o:0.75},{cx:860,cy:156,o:0.45},
  {cx:970,cy:34,o:0.7},{cx:1085,cy:201,o:0.6},{cx:1190,cy:78,o:0.5},{cx:1300,cy:267,o:0.7},
  {cx:1410,cy:45,o:0.55},{cx:1520,cy:134,o:0.65},{cx:48,cy:189,o:0.4},{cx:158,cy:278,o:0.6},
  {cx:268,cy:156,o:0.5},{cx:378,cy:89,o:0.7},{cx:488,cy:234,o:0.45},{cx:598,cy:145,o:0.6},
  {cx:708,cy:312,o:0.35},{cx:818,cy:56,o:0.75},{cx:928,cy:223,o:0.5},{cx:1038,cy:98,o:0.65},
  {cx:1148,cy:289,o:0.4},{cx:1258,cy:167,o:0.7},{cx:1368,cy:234,o:0.55},{cx:1478,cy:78,o:0.6},
  {cx:1560,cy:256,o:0.45},{cx:125,cy:312,o:0.5},{cx:345,cy:267,o:0.6},{cx:565,cy:34,o:0.75},
];

// Color constants
const LEND_COLOR = '#678AFB';  // blue for lending
const BORROW_COLOR = '#A79DEA'; // purple for borrowing
const OVERDUE_COLOR = '#E8726E'; // red for overdue

export default function YourLoans() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [allLoans, setAllLoans] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [loanAgreements, setLoanAgreements] = useState([]);

  // Loan Details tab state
  const [manageLoanSelected, setManageLoanSelected] = useState(null);
  const [manageLoanInitialized, setManageLoanInitialized] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loanToCancel, setLoanToCancel] = useState(null);
  const [showEditLoanModal, setShowEditLoanModal] = useState(false);
  const [editLoanData, setEditLoanData] = useState(null);
  const [activeDocPopup, setActiveDocPopup] = useState(null);
  const [docPopupAgreement, setDocPopupAgreement] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    let currentUser = null;
    try {
      currentUser = await User.me();
      setUser(currentUser);
    } catch {
      setIsLoading(false);
      return;
    }
    try {
      const [loans, profiles, agreements, payments] = await Promise.all([
        Loan.list('-created_at').catch(() => []),
        PublicProfile.list().catch(() => []),
        LoanAgreement.list().catch(() => []),
        Payment.list('-payment_date').catch(() => [])
      ]);
      const myLoans = (loans || []).filter(l => l.lender_id === currentUser.id || l.borrower_id === currentUser.id);
      setAllLoans(myLoans);
      setPublicProfiles(profiles || []);
      setLoanAgreements(agreements || []);
      setAllPayments(payments || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  // Derived data
  const lentLoans = useMemo(() => allLoans.filter(l => l.lender_id === user?.id), [allLoans, user]);
  const borrowedLoans = useMemo(() => allLoans.filter(l => l.borrower_id === user?.id), [allLoans, user]);
  const activeLentLoans = useMemo(() => lentLoans.filter(l => l.status === 'active'), [lentLoans]);
  const activeBorrowedLoans = useMemo(() => borrowedLoans.filter(l => l.status === 'active'), [borrowedLoans]);
  const manageableLoans = useMemo(() => allLoans.filter(l => l.status === 'active' || l.status === 'cancelled' || l.status === 'completed'), [allLoans]);

  const getUserById = (userId) => {
    return publicProfiles.find(p => p.user_id === userId) || { full_name: 'Unknown', username: 'user', profile_picture_url: null };
  };
  const getLoanRole = (loan) => loan.lender_id === user?.id ? 'lender' : 'borrower';
  const getOtherParty = (loan) => getUserById(getLoanRole(loan) === 'lender' ? loan.borrower_id : loan.lender_id);
  const getAgreementForLoan = (loanId) => loanAgreements.find(a => a.loan_id === loanId);

  // Auto-select first manageable loan
  useEffect(() => {
    if (!manageLoanInitialized && manageableLoans.length > 0) {
      setManageLoanSelected(manageableLoans[0]);
      setManageLoanInitialized(true);
    }
  }, [manageableLoans, manageLoanInitialized]);

  // Loan analysis for selected loan
  const loanAnalysis = useMemo(() => {
    if (!manageLoanSelected) return null;
    const agreement = getAgreementForLoan(manageLoanSelected.id);
    return analyzeLoanPayments(manageLoanSelected, allPayments, agreement);
  }, [manageLoanSelected, allPayments, loanAgreements]);

  // Handlers
  const handleMakePayment = () => {
    window.location.href = createPageUrl("RecordPayment");
  };
  const handleCancelLoan = (loan) => { setLoanToCancel(loan); setShowCancelDialog(true); };
  const confirmCancelLoan = async () => {
    if (!loanToCancel) return;
    try {
      await Loan.update(loanToCancel.id, { status: 'cancelled' });
      const agreements = await LoanAgreement.list();
      const agreement = agreements.find(a => a.loan_id === loanToCancel.id);
      if (agreement) {
        await LoanAgreement.update(agreement.id, {
          cancelled_by: user.full_name,
          cancelled_date: new Date().toISOString(),
          cancellation_note: `Loan Cancelled by ${user.full_name}`
        });
      }
      setShowCancelDialog(false);
      setLoanToCancel(null);
      await loadData();
    } catch (error) {
      console.error("Error cancelling loan:", error);
    }
  };
  const handleEditLoan = (loan) => {
    if (getLoanRole(loan) !== 'lender') {
      alert('Only the lender can edit loan terms.');
      return;
    }
    setEditLoanData({
      id: loan.id, amount: loan.amount || 0, interest_rate: loan.interest_rate || 0,
      repayment_period: loan.repayment_period || 0, payment_frequency: loan.payment_frequency || 'monthly',
      due_date: loan.due_date || '', payment_amount: loan.payment_amount || 0,
      purpose: loan.purpose || '', notes: ''
    });
    setShowEditLoanModal(true);
  };
  const handleSaveEditLoan = async () => {
    if (!editLoanData || !manageLoanSelected) return;
    try {
      const amount = parseFloat(editLoanData.amount) || 0;
      const interestRate = parseFloat(editLoanData.interest_rate) || 0;
      const period = parseInt(editLoanData.repayment_period) || 0;
      const totalAmount = amount * (1 + (interestRate / 100) * (period / 12));
      let paymentAmount = editLoanData.payment_amount;
      if (editLoanData.payment_frequency !== 'none' && period > 0) {
        switch (editLoanData.payment_frequency) {
          case 'daily': paymentAmount = totalAmount / (period * 30); break;
          case 'weekly': paymentAmount = totalAmount / (period * (52 / 12)); break;
          case 'biweekly': paymentAmount = totalAmount / (period * (26 / 12)); break;
          default: paymentAmount = totalAmount / period;
        }
      }
      await Loan.update(editLoanData.id, {
        amount: parseFloat(editLoanData.amount), interest_rate: parseFloat(editLoanData.interest_rate),
        repayment_period: parseInt(editLoanData.repayment_period), payment_frequency: editLoanData.payment_frequency,
        due_date: editLoanData.due_date, total_amount: totalAmount, payment_amount: paymentAmount,
        purpose: editLoanData.purpose, contract_modified: true,
        contract_modified_date: new Date().toISOString(), contract_modification_notes: editLoanData.notes || 'Terms updated',
        status: 'pending_borrower_approval'
      });
      setShowEditLoanModal(false);
      setEditLoanData(null);
      await loadData();
    } catch (error) {
      console.error("Error saving loan edit:", error);
    }
  };
  const openDocPopup = (type, agreement) => { setActiveDocPopup(type); setDocPopupAgreement(agreement); };
  const closeDocPopup = () => { setActiveDocPopup(null); setDocPopupAgreement(null); };

  // ─── SUMMARY TAB ANALYTICS ─────────────────────────────────────

  const summaryData = useMemo(() => {
    if (!user) return null;

    // Per-Friend Exposure
    const friendMap = {};
    allLoans.filter(l => l.status === 'active').forEach(loan => {
      const role = getLoanRole(loan);
      const otherId = role === 'lender' ? loan.borrower_id : loan.lender_id;
      const other = getUserById(otherId);
      if (!friendMap[otherId]) friendMap[otherId] = { name: other.full_name, username: other.username, avatar: other.profile_picture_url, lentTo: 0, borrowedFrom: 0, lentCount: 0, borrowedCount: 0 };
      if (role === 'lender') {
        friendMap[otherId].lentTo += (loan.amount || 0);
        friendMap[otherId].lentCount++;
      } else {
        friendMap[otherId].borrowedFrom += (loan.amount || 0);
        friendMap[otherId].borrowedCount++;
      }
    });
    const friendExposure = Object.entries(friendMap).map(([id, d]) => ({
      id, ...d, net: d.lentTo - d.borrowedFrom
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    // Interest Analysis
    let interestEarned = 0;
    let interestOwed = 0;
    let lendingWeightedRate = 0;
    let borrowingWeightedRate = 0;
    let totalLentAmt = 0;
    let totalBorrowedAmt = 0;

    activeLentLoans.forEach(loan => {
      const rate = loan.interest_rate || 0;
      const amt = loan.amount || 0;
      interestEarned += (loan.total_amount || amt) - amt;
      lendingWeightedRate += rate * amt;
      totalLentAmt += amt;
    });
    activeBorrowedLoans.forEach(loan => {
      const rate = loan.interest_rate || 0;
      const amt = loan.amount || 0;
      interestOwed += (loan.total_amount || amt) - amt;
      borrowingWeightedRate += rate * amt;
      totalBorrowedAmt += amt;
    });
    const avgLendingRate = totalLentAmt > 0 ? (lendingWeightedRate / totalLentAmt) : 0;
    const avgBorrowingRate = totalBorrowedAmt > 0 ? (borrowingWeightedRate / totalBorrowedAmt) : 0;

    // Payment Reliability
    let borrowerOnTime = 0;
    let borrowerTotal = 0;
    const borrowerReliability = {};
    allLoans.filter(l => l.status === 'active').forEach(loan => {
      const agreement = getAgreementForLoan(loan.id);
      const analysis = analyzeLoanPayments(loan, allPayments, agreement);
      if (!analysis) return;
      const role = getLoanRole(loan);
      if (role === 'borrower') {
        analysis.periodResults.filter(p => p.isPast).forEach(p => {
          borrowerTotal++;
          if (p.isFullPayment) borrowerOnTime++;
        });
      } else {
        // Track reliability of each borrower
        const bId = loan.borrower_id;
        const bInfo = getUserById(bId);
        if (!borrowerReliability[bId]) borrowerReliability[bId] = { name: bInfo.full_name, username: bInfo.username, onTime: 0, total: 0 };
        analysis.periodResults.filter(p => p.isPast).forEach(p => {
          borrowerReliability[bId].total++;
          if (p.isFullPayment) borrowerReliability[bId].onTime++;
        });
      }
    });
    const yourOnTimeRate = borrowerTotal > 0 ? Math.round((borrowerOnTime / borrowerTotal) * 100) : null;
    const borrowerReliabilityList = Object.entries(borrowerReliability)
      .map(([id, d]) => ({ id, ...d, rate: d.total > 0 ? Math.round((d.onTime / d.total) * 100) : 0 }))
      .sort((a, b) => a.rate - b.rate);

    // Cash Flow Forecast (next 3 months)
    const today = getLocalToday();
    const cashFlowMonths = [];
    for (let m = 0; m < 3; m++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + m + 1, 0);
      let inflows = 0;
      let outflows = 0;
      allLoans.filter(l => l.status === 'active').forEach(loan => {
        const agreement = getAgreementForLoan(loan.id);
        const schedule = agreement ? generateAmortizationSchedule(agreement) : [];
        schedule.forEach(entry => {
          const entryDate = toLocalDate(entry.date);
          if (entryDate >= monthStart && entryDate <= monthEnd) {
            const role = getLoanRole(loan);
            const pmt = (loan.payment_amount || 0);
            if (role === 'lender') inflows += pmt;
            else outflows += pmt;
          }
        });
      });
      cashFlowMonths.push({
        label: format(monthStart, 'MMM yyyy'),
        inflows: Math.round(inflows * 100) / 100,
        outflows: Math.round(outflows * 100) / 100,
        net: Math.round((inflows - outflows) * 100) / 100
      });
    }

    // At-Risk Loans
    const atRiskLoans = [];
    allLoans.filter(l => l.status === 'active').forEach(loan => {
      const role = getLoanRole(loan);
      const other = getOtherParty(loan);
      const nextDue = loan.next_payment_date ? daysUntilDate(loan.next_payment_date) : null;
      const isOverdue = nextDue !== null && nextDue < 0;
      const isDueSoon = nextDue !== null && nextDue >= 0 && nextDue <= 7;
      if (isOverdue || isDueSoon) {
        atRiskLoans.push({
          id: loan.id, loan, role, otherName: other.full_name, otherUsername: other.username,
          amount: loan.amount, isOverdue, isDueSoon, daysUntil: nextDue,
          paymentAmount: loan.payment_amount
        });
      }
    });
    atRiskLoans.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

    // Loan Timeline
    const loanTimeline = allLoans.filter(l => l.status === 'active').map(loan => {
      const role = getLoanRole(loan);
      const other = getOtherParty(loan);
      const paid = loan.amount_paid || 0;
      const total = loan.total_amount || loan.amount || 1;
      const progress = Math.min(100, (paid / total) * 100);
      return { id: loan.id, role, otherName: other.full_name, otherUsername: other.username, amount: loan.amount, progress, dueDate: loan.due_date, purpose: loan.purpose };
    }).sort((a, b) => b.progress - a.progress);

    return {
      friendExposure, interestEarned, interestOwed, avgLendingRate, avgBorrowingRate,
      totalLentAmt, totalBorrowedAmt, yourOnTimeRate, borrowerReliabilityList,
      cashFlowMonths, atRiskLoans, loanTimeline
    };
  }, [user, allLoans, allPayments, loanAgreements, publicProfiles]);

  // ─── DOCUMENT POPUPS ────────────────────────────────────────────

  const PromissoryNotePopup = ({ agreement }) => {
    const lenderInfo = getUserById(agreement.lender_id);
    const borrowerInfo = getUserById(agreement.borrower_id);
    return (
      <div className="space-y-6">
        <div className="text-center border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-800">PROMISSORY NOTE</h2>
          <p className="text-sm text-slate-500 mt-1">Document ID: {agreement.id}</p>
        </div>
        <div style={{ background: 'rgba(103,138,251,0.1)', borderRadius: 12, padding: 16 }}>
          <p className="text-sm text-slate-600 mb-1">Principal Amount</p>
          <p className="text-3xl font-bold text-slate-800">{formatMoney(agreement.amount)}</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed">
            FOR VALUE RECEIVED, the undersigned Borrower, <span className="font-semibold">{borrowerInfo.full_name}</span> (@{borrowerInfo.username}),
            promises to pay to the order of <span className="font-semibold">{lenderInfo.full_name}</span> (@{lenderInfo.username}),
            the principal sum of <span className="font-semibold">{formatMoney(agreement.amount)}</span>,
            together with interest at the rate of <span className="font-semibold">{agreement.interest_rate}%</span> per annum.
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-slate-800 mb-3">Terms of Repayment</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Total Amount Due:</span> <span className="font-medium">{formatMoney(agreement.total_amount)}</span></div>
            <div><span className="text-slate-500">Interest Rate:</span> <span className="font-medium">{agreement.interest_rate}%</span></div>
            <div><span className="text-slate-500">Payment:</span> <span className="font-medium">{formatMoney(agreement.payment_amount)} {agreement.payment_frequency}</span></div>
            <div><span className="text-slate-500">Term:</span> <span className="font-medium">{agreement.repayment_period} {agreement.repayment_unit || 'months'}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Borrower</p>
            <p className="text-lg font-serif italic text-slate-800">{agreement.borrower_name || borrowerInfo.full_name}</p>
            {agreement.borrower_signed_date && <p className="text-xs text-slate-500 mt-1">Signed {format(new Date(agreement.borrower_signed_date), 'MMM d, yyyy')}</p>}
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Lender</p>
            <p className="text-lg font-serif italic text-slate-800">{agreement.lender_name || lenderInfo.full_name}</p>
            {agreement.lender_signed_date && <p className="text-xs text-slate-500 mt-1">Signed {format(new Date(agreement.lender_signed_date), 'MMM d, yyyy')}</p>}
          </div>
        </div>
      </div>
    );
  };

  const AmortizationSchedulePopup = ({ agreement }) => {
    const schedule = generateAmortizationSchedule(agreement);
    const loan = manageLoanSelected;
    const paidPayments = loan?.amount_paid ? Math.floor(loan.amount_paid / agreement.payment_amount) : 0;
    return (
      <div className="space-y-6">
        <div className="text-center border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-800">AMORTIZATION SCHEDULE</h2>
          <p className="text-sm text-slate-500 mt-1">{schedule.length} payments · {agreement.payment_frequency}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Principal', value: formatMoney(agreement.amount) },
            { label: 'Interest', value: formatMoney((agreement.total_amount || 0) - (agreement.amount || 0)) },
            { label: 'Total', value: formatMoney(agreement.total_amount) }
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(103,138,251,0.1)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <p className="text-xs text-slate-600">{item.label}</p>
              <p className="text-lg font-bold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="max-h-[300px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs min-w-[700px]">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {['Payment', 'Date', 'Starting Bal', 'Principal', 'Interest', 'Prin. to Date', 'Int. to Date', 'Ending Bal'].map(h => (
                  <th key={h} className="px-2 py-2 text-left font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((row, index) => (
                <tr key={row.number} className={index < paidPayments ? 'bg-green-50' : ''}>
                  <td className="px-2 py-2 text-slate-600">{row.number}</td>
                  <td className="px-2 py-2 text-slate-800">{format(row.date, 'MMM d, yyyy')}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{formatMoney(row.startingBalance)}</td>
                  <td className="px-2 py-2 text-right font-medium text-slate-800">{formatMoney(row.principal)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{formatMoney(row.interest)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{formatMoney(row.principalToDate)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{formatMoney(row.interestToDate)}</td>
                  <td className="px-2 py-2 text-right font-medium text-slate-800">{formatMoney(row.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const LoanSummaryPopup = ({ agreement }) => {
    const lenderInfo = getUserById(agreement.lender_id);
    const borrowerInfo = getUserById(agreement.borrower_id);
    const loan = manageLoanSelected;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Loan Summary</h2>
            <p className="text-sm text-slate-500 mt-1">{format(new Date(agreement.created_at), 'MMMM d, yyyy')}</p>
          </div>
          <Badge className={`capitalize ${loan?.status === 'active' ? 'bg-green-100 text-green-800' : loan?.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{loan?.status || 'active'}</Badge>
        </div>
        {loan?.purpose && (
          <div style={{ background: 'rgba(103,138,251,0.1)', borderRadius: 12, padding: 16 }}>
            <p className="text-xs text-slate-600 mb-1">Purpose</p>
            <p className="text-sm font-semibold text-slate-800">{loan.purpose}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ background: 'rgba(103,138,251,0.1)', borderRadius: 12, padding: 16 }}>
            <p className="text-xs text-slate-600 mb-1">Loan Amount</p>
            <p className="text-2xl font-bold text-slate-800">{formatMoney(agreement.amount)}</p>
          </div>
          <div style={{ background: 'rgba(103,138,251,0.1)', borderRadius: 12, padding: 16 }}>
            <p className="text-xs text-slate-600 mb-1">Total Due</p>
            <p className="text-2xl font-bold" style={{ color: LEND_COLOR }}>{formatMoney(agreement.total_amount)}</p>
          </div>
        </div>
        {loan && (
          <div style={{ background: 'rgba(103,138,251,0.06)', borderRadius: 12, padding: 16 }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Payment Progress</span>
              <span className="text-sm font-medium text-slate-800">{formatMoney(loan.amount_paid || 0)} / {formatMoney(agreement.total_amount)}</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, ((loan.amount_paid || 0) / agreement.total_amount) * 100)}%`, background: LEND_COLOR }} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><div><p className="text-slate-500">Interest Rate</p><p className="font-semibold text-slate-800">{agreement.interest_rate}%</p></div></div>
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><div><p className="text-slate-500">Payment Amount</p><p className="font-semibold text-slate-800">{formatMoney(agreement.payment_amount)}</p></div></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><div><p className="text-slate-500">Payment Frequency</p><p className="font-semibold text-slate-800 capitalize">{agreement.payment_frequency}</p></div></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><div><p className="text-slate-500">Due Date</p><p className="font-semibold text-slate-800">{agreement.due_date ? format(new Date(agreement.due_date), 'MMM d, yyyy') : 'N/A'}</p></div></div>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <h4 className="font-semibold text-slate-800 mb-3">Parties</h4>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Lender', info: lenderInfo }, { label: 'Borrower', info: borrowerInfo }].map(({ label, info }) => (
              <div key={label} className="flex items-center gap-3">
                <img src={info.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((info.full_name || 'U').charAt(0))}&background=678AFB&color=fff&size=64`} alt={info.full_name} className="w-10 h-10 rounded-full" />
                <div><p className="text-xs text-slate-500">{label}</p><p className="font-medium text-slate-800">{info.full_name}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #678AFB', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin" />
          <p style={{ fontSize: 14, color: '#787776', fontFamily: "'DM Sans', sans-serif" }}>Loading your loans...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Document Popup Modal */}
      <AnimatePresence>
        {activeDocPopup && docPopupAgreement && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeDocPopup}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(103,138,251,0.1)' }}>
                    <FileText className="w-4 h-4" style={{ color: LEND_COLOR }} />
                  </div>
                  <span className="font-medium text-slate-800">
                    {activeDocPopup === 'promissory' && 'Promissory Note'}
                    {activeDocPopup === 'amortization' && 'Amortization Schedule'}
                    {activeDocPopup === 'summary' && 'Loan Summary'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={closeDocPopup} className="text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></Button>
              </div>
              <div className="p-6">
                {activeDocPopup === 'promissory' && <PromissoryNotePopup agreement={docPopupAgreement} />}
                {activeDocPopup === 'amortization' && <AmortizationSchedulePopup agreement={docPopupAgreement} />}
                {activeDocPopup === 'summary' && <LoanSummaryPopup agreement={docPopupAgreement} />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="home-with-sidebar" style={{ minHeight: '100vh', background: '#F7F7F7', paddingLeft: 240, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontSize: 14, lineHeight: 1.5 }}>
        <DashboardSidebar activePage="YourLoans" user={user} />

        {/* Galaxy gradient header */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 520, background: 'linear-gradient(180deg, #527DFF 0%, #5580FF 5%, #678AFB 13%, #7792F4 22%, #8C9BEE 32%, #A19EEB 42%, #A79DEA 50%, #BB98E8 58%, #C89CE6 65%, #D4A0E4 72%, #DDA5E2 76%, #F0D8EA 80%, #F7F7F7 84%)', zIndex: 0 }} />
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 320, zIndex: 1, opacity: 0.6 }} viewBox="0 0 1617 329" fill="none">
            <defs><radialGradient id="ylStarGlow"><stop offset="0%" stopColor="#EAF9F3"/><stop offset="100%" stopColor="#9FEBFB"/></radialGradient></defs>
            {STAR_CIRCLES.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r="1.75" fill="url(#ylStarGlow)" opacity={s.o}/>)}
          </svg>
          <div className="twinkle-star" /><div className="twinkle-star" /><div className="twinkle-star" /><div className="twinkle-star" /><div className="twinkle-star" />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
            {/* Hero */}
            <div style={{ paddingTop: 80, paddingBottom: 20, textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '3.2rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'white', margin: 0 }}>Your Loans</h1>
            </div>

            {/* Glass tab selector */}
            <div className="glass-nav" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: '6px 24px', height: 48, margin: '0 auto 36px', maxWidth: 420, zIndex: 10 }}>
              {[{ key: 'summary', label: 'Summary' }, { key: 'details', label: 'Loan Details' }].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 500, color: activeTab === tab.key ? '#1A1918' : '#787776', background: activeTab === tab.key ? 'rgba(0,0,0,0.06)' : 'transparent', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════ SUMMARY TAB ═══════════════════ */}
          {activeTab === 'summary' && summaryData && (
            <div style={{ position: 'relative', zIndex: 10, maxWidth: 1080, margin: '0 auto', padding: '0 28px 60px' }}>

              {/* Quick Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Total Lent', value: formatMoney(summaryData.totalLentAmt), color: LEND_COLOR, icon: <ArrowUpRight className="w-4 h-4" /> },
                  { label: 'Total Borrowed', value: formatMoney(summaryData.totalBorrowedAmt), color: BORROW_COLOR, icon: <ArrowDownLeft className="w-4 h-4" /> },
                  { label: 'Active Lending', value: activeLentLoans.length, color: LEND_COLOR, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: 'Active Borrowing', value: activeBorrowedLoans.length, color: BORROW_COLOR, icon: <ClipboardList className="w-4 h-4" /> }
                ].map((stat, i) => (
                  <div key={i} className="glass-card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
                      <span style={{ fontSize: 11, color: '#787776', fontWeight: 500 }}>{stat.label}</span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1918', margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* ── Per-Friend Exposure ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Users className="w-4 h-4" style={{ color: LEND_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Per-Friend Exposure</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>Net lending position with each friend</p>
                  </div>
                  <div style={{ padding: '0 24px 20px', maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                    {summaryData.friendExposure.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#C7C6C4', padding: '12px 0' }}>No active loans yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {summaryData.friendExposure.map(friend => (
                          <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                            <img src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((friend.name || 'U').charAt(0))}&background=678AFB&color=fff&size=64`} alt="" className="w-8 h-8 rounded-full" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1918', margin: 0 }}>{friend.name}</p>
                              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#787776' }}>
                                {friend.lentTo > 0 && <span>Lent: <span style={{ color: LEND_COLOR, fontWeight: 600 }}>{formatMoney(friend.lentTo)}</span></span>}
                                {friend.borrowedFrom > 0 && <span>Borrowed: <span style={{ color: BORROW_COLOR, fontWeight: 600 }}>{formatMoney(friend.borrowedFrom)}</span></span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: friend.net > 0 ? LEND_COLOR : friend.net < 0 ? BORROW_COLOR : '#787776', margin: 0 }}>
                                {friend.net > 0 ? '+' : ''}{formatMoney(friend.net)}
                              </p>
                              <p style={{ fontSize: 9, color: '#787776' }}>{friend.net > 0 ? 'They owe you' : friend.net < 0 ? 'You owe them' : 'Even'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Interest Analysis ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Percent className="w-4 h-4" style={{ color: LEND_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Interest Analysis</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>Interest earned vs owed across your loans</p>
                  </div>
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div style={{ background: `${LEND_COLOR}10`, borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${LEND_COLOR}` }}>
                        <p style={{ fontSize: 10, color: '#787776', marginBottom: 4 }}>Interest Earned (Lending)</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: LEND_COLOR, margin: 0 }}>{formatMoney(summaryData.interestEarned)}</p>
                        <p style={{ fontSize: 10, color: '#787776', marginTop: 4 }}>Avg rate: {summaryData.avgLendingRate.toFixed(1)}%</p>
                      </div>
                      <div style={{ background: `${BORROW_COLOR}10`, borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${BORROW_COLOR}` }}>
                        <p style={{ fontSize: 10, color: '#787776', marginBottom: 4 }}>Interest Owed (Borrowing)</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: BORROW_COLOR, margin: 0 }}>{formatMoney(summaryData.interestOwed)}</p>
                        <p style={{ fontSize: 10, color: '#787776', marginTop: 4 }}>Avg rate: {summaryData.avgBorrowingRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: '#787776', marginBottom: 2 }}>Net Interest Position</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: (summaryData.interestEarned - summaryData.interestOwed) >= 0 ? LEND_COLOR : BORROW_COLOR, margin: 0 }}>
                        {(summaryData.interestEarned - summaryData.interestOwed) >= 0 ? '+' : ''}{formatMoney(summaryData.interestEarned - summaryData.interestOwed)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Payment Reliability ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <BarChart3 className="w-4 h-4" style={{ color: LEND_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Payment Reliability</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>On-time payment rates</p>
                  </div>
                  <div style={{ padding: '0 24px 20px' }}>
                    {/* Your reliability as borrower */}
                    {summaryData.yourOnTimeRate !== null && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: BORROW_COLOR }}>Your Reliability (as borrower)</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: summaryData.yourOnTimeRate >= 80 ? '#22c55e' : summaryData.yourOnTimeRate >= 50 ? '#F59E0B' : OVERDUE_COLOR }}>{summaryData.yourOnTimeRate}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                          <div style={{ height: 6, borderRadius: 3, width: `${summaryData.yourOnTimeRate}%`, background: BORROW_COLOR, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )}
                    {/* Borrower reliability (as lender) */}
                    {summaryData.borrowerReliabilityList.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: LEND_COLOR, marginBottom: 8 }}>Your Borrowers' Reliability</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                          {summaryData.borrowerReliabilityList.map(b => (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.03)' }}>
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#1A1918', flex: 1 }}>@{b.username}</span>
                              <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
                                <div style={{ height: 4, borderRadius: 2, width: `${b.rate}%`, background: b.rate >= 80 ? '#22c55e' : b.rate >= 50 ? '#F59E0B' : OVERDUE_COLOR }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: b.rate >= 80 ? '#22c55e' : b.rate >= 50 ? '#F59E0B' : OVERDUE_COLOR, minWidth: 32, textAlign: 'right' }}>{b.rate}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {summaryData.yourOnTimeRate === null && summaryData.borrowerReliabilityList.length === 0 && (
                      <p style={{ fontSize: 12, color: '#C7C6C4' }}>No payment data yet.</p>
                    )}
                  </div>
                </div>

                {/* ── Cash Flow Forecast ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <TrendingUp className="w-4 h-4" style={{ color: LEND_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Cash Flow Forecast</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>Projected inflows & outflows over the next 3 months</p>
                  </div>
                  <div style={{ padding: '0 24px 20px' }}>
                    {summaryData.cashFlowMonths.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {summaryData.cashFlowMonths.map((month, i) => {
                          const maxVal = Math.max(...summaryData.cashFlowMonths.map(m => Math.max(m.inflows, m.outflows)), 1);
                          return (
                            <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1918' }}>{month.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: month.net >= 0 ? LEND_COLOR : BORROW_COLOR }}>
                                  Net: {month.net >= 0 ? '+' : ''}{formatMoney(month.net)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#787776', marginBottom: 3 }}>
                                    <span>Inflows</span><span style={{ color: LEND_COLOR, fontWeight: 600 }}>{formatMoney(month.inflows)}</span>
                                  </div>
                                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                                    <div style={{ height: 5, borderRadius: 3, width: `${(month.inflows / maxVal) * 100}%`, background: LEND_COLOR }} />
                                  </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#787776', marginBottom: 3 }}>
                                    <span>Outflows</span><span style={{ color: BORROW_COLOR, fontWeight: 600 }}>{formatMoney(month.outflows)}</span>
                                  </div>
                                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                                    <div style={{ height: 5, borderRadius: 3, width: `${(month.outflows / maxVal) * 100}%`, background: BORROW_COLOR }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: '#C7C6C4' }}>No upcoming payments.</p>
                    )}
                  </div>
                </div>

                {/* ── At-Risk / Overdue Loans (full width) ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', gridColumn: '1 / -1' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertCircle className="w-4 h-4" style={{ color: OVERDUE_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>At-Risk Loans</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>Overdue or due within 7 days</p>
                  </div>
                  <div style={{ padding: '0 24px 20px' }}>
                    {summaryData.atRiskLoans.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>All clear! No at-risk loans.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                        {summaryData.atRiskLoans.map(item => {
                          const roleColor = item.role === 'lender' ? LEND_COLOR : BORROW_COLOR;
                          const roleLabel = item.role === 'lender' ? 'You lent to' : 'You borrowed from';
                          return (
                            <div key={item.id} style={{ padding: '14px 16px', borderRadius: 10, background: item.isOverdue ? 'rgba(232,114,110,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${item.isOverdue ? 'rgba(232,114,110,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div>
                                  <span style={{ fontSize: 9, fontWeight: 600, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleLabel}</span>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1918', margin: 0 }}>@{item.otherUsername}</p>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: item.isOverdue ? 'rgba(232,114,110,0.15)' : 'rgba(245,158,11,0.15)', color: item.isOverdue ? OVERDUE_COLOR : '#F59E0B' }}>
                                  {item.isOverdue ? `${Math.abs(item.daysUntil)}d overdue` : `Due in ${item.daysUntil}d`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#787776' }}>
                                <span>Loan: {formatMoney(item.amount)}</span>
                                <span>Payment: {formatMoney(item.paymentAmount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Loan Timeline / Completion (full width) ── */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', gridColumn: '1 / -1' }}>
                  <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <History className="w-4 h-4" style={{ color: LEND_COLOR }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Loan Progress Timeline</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#787776', marginBottom: 16 }}>All active loans sorted by completion progress</p>
                  </div>
                  <div style={{ padding: '0 24px 20px', maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                    {summaryData.loanTimeline.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#C7C6C4', padding: '12px 0' }}>No active loans.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {summaryData.loanTimeline.map(item => {
                          const roleColor = item.role === 'lender' ? LEND_COLOR : BORROW_COLOR;
                          const roleTag = item.role === 'lender' ? 'LENDING' : 'BORROWING';
                          return (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                              <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: roleColor, margin: 0 }}>{Math.round(item.progress)}%</p>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <span style={{ fontSize: 8, fontWeight: 700, color: roleColor, background: `${roleColor}15`, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>{roleTag}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1918' }}>@{item.otherUsername}</span>
                                  <span style={{ fontSize: 11, color: '#787776' }}>{formatMoney(item.amount)}</span>
                                </div>
                                <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}>
                                  <div style={{ height: 5, borderRadius: 3, width: `${item.progress}%`, background: roleColor, transition: 'width 0.5s' }} />
                                </div>
                                {item.purpose && <p style={{ fontSize: 10, color: '#787776', marginTop: 4 }}>{item.purpose}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ LOAN DETAILS TAB ═══════════════════ */}
          {activeTab === 'details' && (
            <div style={{ position: 'relative', zIndex: 10, maxWidth: 1080, margin: '0 auto', padding: '0 28px 60px' }}>
              {manageableLoans.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1918', marginBottom: 8 }}>No loans yet</p>
                  <p style={{ fontSize: 13, color: '#787776' }}>Create a loan or accept a loan offer to get started.</p>
                </div>
              ) : (() => {
                // Group loans by role
                const lendingLoans = manageableLoans.filter(l => l.lender_id === user?.id);
                const borrowingLoans = manageableLoans.filter(l => l.borrower_id === user?.id);
                const selectedRole = manageLoanSelected ? getLoanRole(manageLoanSelected) : null;
                const selectedColor = selectedRole === 'lender' ? LEND_COLOR : BORROW_COLOR;
                const agreement = manageLoanSelected ? getAgreementForLoan(manageLoanSelected.id) : null;
                const otherParty = manageLoanSelected ? getOtherParty(manageLoanSelected) : null;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
                    {/* Loan Selector */}
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 20 }}>
                      <div style={{ padding: '16px 20px 0' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0C', marginBottom: 12 }}>Select a Loan</p>
                      </div>
                      <div style={{ maxHeight: 460, overflowY: 'auto', scrollbarWidth: 'thin', padding: '0 12px 12px' }}>
                        {/* Lending Section */}
                        {lendingLoans.length > 0 && (
                          <>
                            <p style={{ fontSize: 10, fontWeight: 700, color: LEND_COLOR, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 8px 6px', margin: 0 }}>You're Lending ({lendingLoans.length})</p>
                            {lendingLoans.map(loan => {
                              const other = getOtherParty(loan);
                              const isSelected = manageLoanSelected?.id === loan.id;
                              return (
                                <button key={loan.id} onClick={() => setManageLoanSelected(loan)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isSelected ? `${LEND_COLOR}12` : 'transparent', transition: 'background 0.15s', textAlign: 'left', marginBottom: 2 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${LEND_COLOR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ArrowUpRight className="w-3.5 h-3.5" style={{ color: LEND_COLOR }} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: '#1A1918', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{other.username}</p>
                                    <p style={{ fontSize: 10, color: '#787776', margin: 0 }}>{formatMoney(loan.amount)} · {loan.status}</p>
                                  </div>
                                  {isSelected && <div style={{ width: 4, height: 20, borderRadius: 2, background: LEND_COLOR, flexShrink: 0 }} />}
                                </button>
                              );
                            })}
                          </>
                        )}
                        {/* Borrowing Section */}
                        {borrowingLoans.length > 0 && (
                          <>
                            <p style={{ fontSize: 10, fontWeight: 700, color: BORROW_COLOR, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 8px 6px', margin: 0 }}>You're Borrowing ({borrowingLoans.length})</p>
                            {borrowingLoans.map(loan => {
                              const other = getOtherParty(loan);
                              const isSelected = manageLoanSelected?.id === loan.id;
                              return (
                                <button key={loan.id} onClick={() => setManageLoanSelected(loan)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isSelected ? `${BORROW_COLOR}12` : 'transparent', transition: 'background 0.15s', textAlign: 'left', marginBottom: 2 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${BORROW_COLOR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: BORROW_COLOR }} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: '#1A1918', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{other.username}</p>
                                    <p style={{ fontSize: 10, color: '#787776', margin: 0 }}>{formatMoney(loan.amount)} · {loan.status}</p>
                                  </div>
                                  {isSelected && <div style={{ width: 4, height: 20, borderRadius: 2, background: BORROW_COLOR, flexShrink: 0 }} />}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Loan Detail Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {manageLoanSelected && otherParty && (
                        <>
                          {/* Role Banner */}
                          <div className="glass-card" style={{ padding: '16px 24px', borderLeft: `4px solid ${selectedColor}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={otherParty.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((otherParty.full_name || 'U').charAt(0))}&background=${selectedColor.replace('#','')}&color=fff&size=64`} alt="" className="w-10 h-10 rounded-full" />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 8, fontWeight: 700, color: selectedColor, background: `${selectedColor}15`, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>
                                      {selectedRole === 'lender' ? 'LENDING TO' : 'BORROWING FROM'}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1918', margin: '2px 0 0' }}>{otherParty.full_name}</p>
                                  <p style={{ fontSize: 11, color: '#787776' }}>@{otherParty.username}</p>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 22, fontWeight: 700, color: selectedColor, margin: 0 }}>{formatMoney(manageLoanSelected.amount)}</p>
                                <Badge className={`capitalize text-xs ${manageLoanSelected.status === 'active' ? 'bg-green-100 text-green-700' : manageLoanSelected.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{manageLoanSelected.status}</Badge>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '4px 0' }}>
                            <button onClick={handleMakePayment} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
                              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${selectedColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign className="w-5 h-5" style={{ color: selectedColor }} />
                              </div>
                              <p style={{ fontSize: 10, fontWeight: 600, color: '#1A1918', textAlign: 'center', lineHeight: 1.3 }}>Record<br/>Payment</p>
                            </button>
                            {selectedRole === 'lender' && manageLoanSelected.status === 'active' && (
                              <button onClick={() => handleEditLoan(manageLoanSelected)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${selectedColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Pencil className="w-5 h-5" style={{ color: selectedColor }} />
                                </div>
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#1A1918', textAlign: 'center', lineHeight: 1.3 }}>Edit<br/>Loan</p>
                              </button>
                            )}
                            {manageLoanSelected.status === 'active' && (
                              <button onClick={() => handleCancelLoan(manageLoanSelected)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(232,114,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <X className="w-5 h-5" style={{ color: OVERDUE_COLOR }} />
                                </div>
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#1A1918', textAlign: 'center', lineHeight: 1.3 }}>Request<br/>Cancel</p>
                              </button>
                            )}
                          </div>

                          {/* Document Icons */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 20, padding: '4px 0' }}>
                            {[
                              { type: 'promissory', label: 'Promissory\nNote', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> },
                              { type: 'amortization', label: 'Amortization\nSchedule', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
                              { type: 'summary', label: 'Loan\nSummary', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> }
                            ].map(doc => (
                              <button key={doc.type} onClick={() => { const ag = getAgreementForLoan(manageLoanSelected.id); if (ag) openDocPopup(doc.type, ag); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${selectedColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{doc.icon}</div>
                                <p style={{ fontSize: 10, fontWeight: 600, color: '#1A1918', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{doc.label}</p>
                              </button>
                            ))}
                          </div>

                          {/* Loan Progress Stats */}
                          <div className="glass-card">
                            <div style={{ padding: '20px 26px 0' }}>
                              <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Loan Progress</span>
                            </div>
                            <div style={{ padding: '14px 26px 26px' }}>
                              {(() => {
                                const repaymentPeriod = manageLoanSelected.repayment_period || 0;
                                const paymentFrequency = manageLoanSelected.payment_frequency || 'monthly';
                                const totalOwedDisplay = loanAnalysis ? loanAnalysis.totalOwedNow : (manageLoanSelected.total_amount || manageLoanSelected.amount || 0);
                                const amountPaidDisplay = loanAnalysis ? loanAnalysis.totalPaid : (manageLoanSelected.amount_paid || 0);
                                const fullPayments = loanAnalysis ? loanAnalysis.fullPaymentCount : 0;
                                const paymentAmountDisplay = loanAnalysis ? loanAnalysis.nextPaymentAmount : (manageLoanSelected.payment_amount || 0);
                                const freqLabel = paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1);
                                const otherLabel = selectedRole === 'lender' ? `from @${otherParty.username}` : `to @${otherParty.username}`;
                                const items = [
                                  { label: selectedRole === 'lender' ? 'Total Owed to You' : 'Total You Owe', value: `$${totalOwedDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'with interest' },
                                  { label: 'Amount Paid', value: `$${amountPaidDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: null },
                                  { label: 'Payments Made', value: `${fullPayments}/${repaymentPeriod}`, sub: 'full payments' },
                                  { label: `${freqLabel} Payments`, value: `$${paymentAmountDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: otherLabel },
                                ];
                                return (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                    {items.map((item, idx) => (
                                      <div key={idx} style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: 10, color: '#787776', fontWeight: 500, marginBottom: 2 }}>{item.label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1918', margin: 0 }}>{item.value}</p>
                                        {item.sub && <p style={{ fontSize: 9, color: '#787776', marginTop: 2 }}>{item.sub}</p>}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Payments Table */}
                          <div className="glass-card">
                            <div style={{ padding: '20px 26px 0' }}>
                              <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em' }}>Payments</span>
                            </div>
                            <div style={{ padding: '14px 26px 26px' }}>
                              {(() => {
                                const paymentAmt = manageLoanSelected.payment_amount || 0;
                                let firstRecordFound = false;
                                const paymentRows = loanAnalysis ? loanAnalysis.periodResults.map((pr) => {
                                  let status;
                                  if (pr.hasConfirmedPayments && pr.isFullPayment) status = 'completed';
                                  else if (pr.hasAnyPayments && !pr.isPast) status = 'in_progress';
                                  else if (pr.hasConfirmedPayments && !pr.isFullPayment) status = 'partial';
                                  else if (pr.hasPendingPayments && !pr.hasConfirmedPayments) status = 'pending';
                                  else if (pr.isPast && !pr.hasAnyPayments) status = 'missed';
                                  else if (!firstRecordFound) { status = 'record'; firstRecordFound = true; }
                                  else status = 'upcoming';
                                  const scheduledAmount = pr.scheduledAmount || (loanAnalysis.recalcPayment > 0 ? loanAnalysis.recalcPayment : paymentAmt);
                                  const paidAmount = pr.actualPaid || 0;
                                  const paidPercentage = scheduledAmount > 0 ? Math.min(100, (paidAmount / scheduledAmount) * 100) : 0;
                                  return { number: pr.period, date: pr.date, amount: scheduledAmount, paidAmount, paidPercentage, status, isFullPayment: pr.isFullPayment, deficit: pr.deficit };
                                }) : [];
                                const statusConfig = {
                                  completed: { label: 'Completed', bg: `${selectedColor}15`, text: selectedColor, ringColor: selectedColor, fillColor: selectedColor },
                                  in_progress: { label: 'In Progress', bg: `${selectedColor}15`, text: selectedColor, ringColor: selectedColor, fillColor: selectedColor },
                                  partial: { label: 'Partial', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', ringColor: '#F59E0B', fillColor: '#F59E0B' },
                                  pending: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', ringColor: '#F59E0B', fillColor: '#F59E0B' },
                                  missed: { label: 'Missed', bg: 'rgba(232,114,110,0.1)', text: OVERDUE_COLOR, ringColor: OVERDUE_COLOR, fillColor: OVERDUE_COLOR },
                                  record: { label: 'Record Payment', bg: selectedColor, text: 'white', ringColor: selectedColor, fillColor: selectedColor },
                                  upcoming: { label: 'Upcoming', bg: 'rgba(0,0,0,0.03)', text: '#787776', ringColor: `${selectedColor}50`, fillColor: `${selectedColor}50` },
                                };
                                const PieCircle = ({ percentage, ringColor, fillColor, number, size = 32 }) => {
                                  const r = (size / 2) - 2; const pcx = size / 2; const pcy = size / 2;
                                  const circumference = 2 * Math.PI * r; const filled = (percentage / 100) * circumference;
                                  return (
                                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                                      <circle cx={pcx} cy={pcy} r={r} fill="#F7F7F7" stroke={ringColor} strokeWidth="2" strokeOpacity="0.3" />
                                      {percentage > 0 && (<circle cx={pcx} cy={pcy} r={r} fill="none" stroke={fillColor} strokeWidth="2" strokeDasharray={`${filled} ${circumference - filled}`} strokeDashoffset={circumference * 0.25} strokeLinecap="round" transform={`rotate(-90 ${pcx} ${pcy})`} />)}
                                      <text x={pcx} y={pcy} textAnchor="middle" dominantBaseline="central" fill="#1A1918" fontSize="11" fontWeight="bold" fontFamily="'DM Sans', sans-serif">{number}</text>
                                    </svg>
                                  );
                                };
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                                    {paymentRows.map((row) => {
                                      const cfg = statusConfig[row.status];
                                      return (
                                        <div key={row.number} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                                          <PieCircle percentage={row.paidPercentage} ringColor={cfg.ringColor} fillColor={cfg.fillColor} number={row.number} />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1918', margin: 0 }}>${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <p style={{ fontSize: 10, color: '#787776', margin: 0 }}>{format(row.date, 'MMM d, yyyy')}</p>
                                          </div>
                                          {row.status === 'record' ? (
                                            <button onClick={handleMakePayment} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.text, border: 'none', cursor: 'pointer' }}>{cfg.label}</button>
                                          ) : (
                                            <span style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Activity Timeline */}
                          <div className="glass-card" style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '20px 26px 0' }}>
                              <p style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0C', letterSpacing: '-0.02em', marginBottom: 10, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Activity</p>
                            </div>
                            <div style={{ padding: '14px 26px 26px' }}>
                              {(() => {
                                const ag = getAgreementForLoan(manageLoanSelected.id);
                                const loanPmts = allPayments.filter(p => p.loan_id === manageLoanSelected.id);
                                const lenderProfile = getUserById(manageLoanSelected.lender_id);
                                const borrowerProfile = getUserById(manageLoanSelected.borrower_id);
                                const lenderName = lenderProfile?.username || 'lender';
                                const borrowerName = borrowerProfile?.username || 'borrower';

                                const activities = [];
                                if (manageLoanSelected.created_at) activities.push({ timestamp: new Date(manageLoanSelected.created_at), type: 'created', description: `Loan created between @${borrowerName} and @${lenderName}` });
                                if (ag?.borrower_signed_date) activities.push({ timestamp: new Date(ag.borrower_signed_date), type: 'signature', description: `@${borrowerName} signed the loan agreement` });
                                if (ag?.lender_signed_date) activities.push({ timestamp: new Date(ag.lender_signed_date), type: 'signature', description: `@${lenderName} signed the loan agreement` });
                                loanPmts.forEach(payment => {
                                  const isConfirmed = payment.status === 'confirmed';
                                  const isRecordedByUser = payment.recorded_by === user?.id;
                                  const pmtAmount = `$${(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  let desc;
                                  if (isRecordedByUser) desc = `You ${isConfirmed ? 'made' : 'recorded'} a ${pmtAmount} payment`;
                                  else desc = `@${getUserById(payment.recorded_by)?.username || 'user'} recorded a ${pmtAmount} payment`;
                                  activities.push({ timestamp: new Date(payment.payment_date || payment.created_at), type: 'payment', description: desc, isAwaitingConfirmation: !isConfirmed });
                                });
                                if (ag?.cancelled_date) activities.push({ timestamp: new Date(ag.cancelled_date), type: 'cancellation', description: 'Loan was cancelled' });
                                if (manageLoanSelected.status === 'completed') activities.push({ timestamp: new Date(), type: 'completion', description: 'Loan repaid in full' });
                                activities.sort((a, b) => a.timestamp - b.timestamp);

                                const getIcon = (type) => {
                                  const strokeColor = type === 'cancellation' ? OVERDUE_COLOR : selectedColor;
                                  const paths = {
                                    created: 'M12 4v16m8-8H4',
                                    signature: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
                                    payment: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
                                    cancellation: 'M6 18L18 6M6 6l12 12',
                                    completion: 'M5 13l4 4L19 7'
                                  };
                                  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={strokeColor} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || ''} /></svg>;
                                };
                                const getDotColor = (type) => type === 'cancellation' ? `bg-red-50 border-[${OVERDUE_COLOR}]` : 'bg-blue-50 border-[#678AFB]';

                                if (activities.length === 0) return <p style={{ fontSize: 11, color: '#C7C6C4' }}>No activity recorded yet.</p>;
                                return (
                                  <div className="space-y-0 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                    {activities.map((activity, idx) => (
                                      <div key={idx} className="flex items-start gap-2.5 relative">
                                        {idx < activities.length - 1 && <div className="absolute left-[11px] top-[22px] w-[1px]" style={{ height: 'calc(100% - 6px)', background: `${selectedColor}30` }} />}
                                        <div className={`w-[23px] h-[23px] rounded-full border-[1.5px] ${getDotColor(activity.type)} flex items-center justify-center flex-shrink-0 z-10 mt-1`}>{getIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0 pb-3">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p style={{ fontSize: 11, color: '#1A1918', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.4 }}>{activity.description}</p>
                                            {activity.isAwaitingConfirmation && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 whitespace-nowrap">Awaiting Confirmation</span>}
                                          </div>
                                          <p style={{ fontSize: 9, color: '#C7C6C4', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>{format(activity.timestamp, 'MMM d, yyyy · h:mm a')}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Cancelled notice */}
                          {manageLoanSelected.status === 'cancelled' && (
                            <div className="bg-red-50 rounded-xl px-4 py-3 shadow-sm border border-red-200">
                              <p className="text-sm text-red-600 font-medium">This loan has been cancelled.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Loan Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-2xl border-0 p-0 overflow-hidden" style={{ backgroundColor: '#F7F7F7' }}>
          <div className="p-6 pb-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1A1918' }}>Cancel Loan</AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-1" style={{ color: '#787776' }}>Are you sure you want to cancel this loan? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="flex-1 rounded-xl border-0 font-semibold text-white text-[14px] h-12 hover:opacity-90 transition-all" style={{ backgroundColor: LEND_COLOR }}>Keep Loan</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelLoan} className="flex-1 rounded-xl border-0 font-semibold text-white text-[14px] h-12 hover:opacity-90 transition-all" style={{ backgroundColor: OVERDUE_COLOR }}>Request Loan Cancellation</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Loan Modal */}
      {showEditLoanModal && editLoanData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><Pencil className="w-5 h-5 text-amber-600" /></div>
                  <div><h2 className="text-xl font-bold text-slate-800">Edit Loan Contract</h2><p className="text-sm text-slate-500">Changes will be sent to borrower for approval</p></div>
                </div>
                <button onClick={() => { setShowEditLoanModal(false); setEditLoanData(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800"><p className="font-medium">Contract Modification Notice</p><p className="text-amber-700">All changes will be recorded in the loan history and the borrower will need to approve the new terms.</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="edit-amount" className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-600" />Loan Amount</Label><Input id="edit-amount" type="number" step="0.01" min="0" value={editLoanData.amount} onChange={(e) => setEditLoanData(prev => ({ ...prev, amount: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-interest" className="flex items-center gap-2"><Percent className="w-4 h-4 text-amber-600" />Interest Rate (% per year)</Label><Input id="edit-interest" type="number" step="0.1" min="0" max="100" value={editLoanData.interest_rate} onChange={(e) => setEditLoanData(prev => ({ ...prev, interest_rate: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-period" className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" />Repayment Period (months)</Label><Input id="edit-period" type="number" min="1" value={editLoanData.repayment_period} onChange={(e) => setEditLoanData(prev => ({ ...prev, repayment_period: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600" />Payment Frequency</Label>
                  <Select value={editLoanData.payment_frequency} onValueChange={(value) => setEditLoanData(prev => ({ ...prev, payment_frequency: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="edit-due-date" className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600" />Due Date</Label><Input id="edit-due-date" type="date" value={editLoanData.due_date || ''} onChange={(e) => setEditLoanData(prev => ({ ...prev, due_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="edit-purpose" className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" />Purpose</Label><Input id="edit-purpose" type="text" value={editLoanData.purpose} onChange={(e) => setEditLoanData(prev => ({ ...prev, purpose: e.target.value }))} maxLength={100} /></div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes" className="flex items-center gap-2"><History className="w-4 h-4 text-amber-600" />Notes for Borrower (optional)</Label>
                  <textarea id="edit-notes" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" rows={3} placeholder="Explain why you're making these changes..." value={editLoanData.notes} onChange={(e) => setEditLoanData(prev => ({ ...prev, notes: e.target.value }))} maxLength={500} />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <Button onClick={() => { setShowEditLoanModal(false); setEditLoanData(null); }} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={handleSaveEditLoan} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"><Save className="w-4 h-4 mr-2" />Save & Send to Borrower</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
