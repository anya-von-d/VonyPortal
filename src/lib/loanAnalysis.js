import { addMonths, addWeeks, addDays } from "date-fns";
import { toLocalDate, getLocalToday } from "@/components/utils/dateUtils";

/**
 * Generate amortization schedule from a loan agreement.
 * Shared utility extracted from Borrowing/Lending pages.
 */
export function generateAmortizationSchedule(agreement) {
  const schedule = [];
  const loanAmount = agreement.amount || 0;
  const frequency = agreement.payment_frequency || 'monthly';
  const annualRate = agreement.interest_rate || 0;

  if (loanAmount <= 0) return schedule;

  const repaymentPeriod = agreement.repayment_period || 1;
  const repaymentUnit = agreement.repayment_unit || 'months';
  let totalMonths = repaymentPeriod;
  if (repaymentUnit === 'years') totalMonths = repaymentPeriod * 12;
  else if (repaymentUnit === 'weeks') totalMonths = repaymentPeriod / 4.333;

  let totalPayments;
  if (frequency === 'weekly') totalPayments = Math.round(totalMonths * 4.333);
  else if (frequency === 'biweekly') totalPayments = Math.round(totalMonths * 2.167);
  else if (frequency === 'daily') totalPayments = Math.round(totalMonths * 30.417);
  else totalPayments = Math.round(totalMonths);

  if (totalPayments <= 0) totalPayments = 1;

  let periodsPerYear = 12;
  if (frequency === 'weekly') periodsPerYear = 52;
  else if (frequency === 'biweekly') periodsPerYear = 26;
  else if (frequency === 'daily') periodsPerYear = 365;

  const r = annualRate > 0 ? (annualRate / 100) / periodsPerYear : 0;

  let rawPayment;
  if (r > 0) {
    rawPayment = loanAmount * r / (1 - Math.pow(1 + r, -totalPayments));
  } else {
    rawPayment = loanAmount / totalPayments;
  }

  let balance = loanAmount;
  let currentDate = new Date(agreement.created_at);
  let principalToDate = 0;
  let interestToDate = 0;

  for (let i = 1; i <= totalPayments; i++) {
    if (frequency === 'weekly') currentDate = addWeeks(currentDate, 1);
    else if (frequency === 'biweekly') currentDate = addWeeks(currentDate, 2);
    else if (frequency === 'daily') currentDate = addDays(currentDate, 1);
    else currentDate = addMonths(currentDate, 1);

    const startingBalance = balance;
    const interest = Math.round(balance * r * 100) / 100;
    let principal;

    if (i === totalPayments) {
      principal = balance;
      balance = 0;
    } else {
      const newBalance = Math.round((balance * (1 + r) - rawPayment) * 100) / 100;
      principal = Math.round((startingBalance - newBalance) * 100) / 100;
      balance = newBalance;
    }

    principalToDate = Math.round((principalToDate + principal) * 100) / 100;
    interestToDate = Math.round((interestToDate + interest) * 100) / 100;

    schedule.push({
      number: i,
      date: new Date(currentDate),
      startingBalance,
      principal,
      interest,
      principalToDate,
      interestToDate,
      endingBalance: balance
    });
  }

  return schedule;
}

/**
 * Analyze loan payments period-by-period.
 * Shared utility extracted from Borrowing page.
 */
export function analyzeLoanPayments(loan, payments, agreement) {
  if (!loan) return null;

  const principal = loan.amount || 0;
  const annualRate = loan.interest_rate || 0;
  const totalPeriods = loan.repayment_period || 1;
  const frequency = loan.payment_frequency || 'monthly';
  const originalPaymentAmount = loan.payment_amount || 0;

  let periodsPerYear = 12;
  if (frequency === 'weekly') periodsPerYear = 52;
  else if (frequency === 'biweekly') periodsPerYear = 26;
  else if (frequency === 'daily') periodsPerYear = 365;
  const r = annualRate > 0 ? (annualRate / 100) / periodsPerYear : 0;

  const confirmedPayments = payments
    .filter(p => p.loan_id === loan.id && p.status === 'confirmed')
    .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));

  const allLoanPayments = payments
    .filter(p => p.loan_id === loan.id && (p.status === 'confirmed' || p.status === 'pending_confirmation'))
    .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));

  let scheduleDates = [];
  if (agreement) {
    const sched = generateAmortizationSchedule(agreement);
    scheduleDates = sched.map(s => s.date);
  } else {
    let dt = new Date(loan.created_at);
    for (let i = 0; i < totalPeriods; i++) {
      if (frequency === 'weekly') dt = addWeeks(new Date(dt), 1);
      else if (frequency === 'biweekly') dt = addWeeks(new Date(dt), 2);
      else if (frequency === 'daily') dt = addDays(new Date(dt), 1);
      else dt = addMonths(new Date(dt), 1);
      scheduleDates.push(new Date(dt));
    }
  }

  const loanStart = new Date(loan.created_at);
  const periodConfirmedPayments = [];
  const periodAllPayments = [];
  const effectivePeriods = Math.min(totalPeriods, scheduleDates.length);
  for (let i = 0; i < effectivePeriods; i++) {
    const periodStart = i === 0 ? loanStart : scheduleDates[i - 1];
    const periodEnd = scheduleDates[i];
    const confirmedInPeriod = confirmedPayments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate > periodStart && pDate <= periodEnd;
    });
    const allInPeriod = allLoanPayments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate > periodStart && pDate <= periodEnd;
    });
    periodConfirmedPayments.push(confirmedInPeriod);
    periodAllPayments.push(allInPeriod);
  }

  if (scheduleDates.length > 0) {
    const lastDate = scheduleDates[scheduleDates.length - 1];
    const lateConfirmed = confirmedPayments.filter(p => new Date(p.payment_date) > lastDate);
    const lateAll = allLoanPayments.filter(p => new Date(p.payment_date) > lastDate);
    if (lateConfirmed.length > 0 && effectivePeriods > 0) {
      periodConfirmedPayments[effectivePeriods - 1] = [...periodConfirmedPayments[effectivePeriods - 1], ...lateConfirmed];
    }
    if (lateAll.length > 0 && effectivePeriods > 0) {
      periodAllPayments[effectivePeriods - 1] = [...periodAllPayments[effectivePeriods - 1], ...lateAll];
    }
  }

  let remainingPrincipal = principal;
  let totalInterestAccrued = 0;
  let totalPaid = 0;
  let fullPaymentCount = 0;
  let deficit = 0;
  const periodResults = [];

  for (let i = 0; i < effectivePeriods; i++) {
    const periodInterest = Math.round(remainingPrincipal * r * 100) / 100;
    totalInterestAccrued += periodInterest;

    const scheduledAmount = originalPaymentAmount + deficit;
    const confirmedPaidSum = periodConfirmedPayments[i].reduce((sum, p) => sum + (p.amount || 0), 0);
    totalPaid += confirmedPaidSum;

    const allPaidSum = periodAllPayments[i].reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPaidSum = allPaidSum - confirmedPaidSum;

    const isFullPayment = confirmedPaidSum >= scheduledAmount && scheduledAmount > 0;
    if (isFullPayment) fullPaymentCount++;

    let periodDeficit = 0;
    let periodOverpayment = 0;
    if (confirmedPaidSum < scheduledAmount) {
      periodDeficit = Math.round((scheduledAmount - confirmedPaidSum) * 100) / 100;
    } else if (confirmedPaidSum > scheduledAmount) {
      periodOverpayment = Math.round((confirmedPaidSum - scheduledAmount) * 100) / 100;
    }

    let paymentToInterest = Math.min(confirmedPaidSum, periodInterest);
    let paymentToPrincipal = Math.max(0, confirmedPaidSum - paymentToInterest);
    remainingPrincipal = Math.max(0, Math.round((remainingPrincipal - paymentToPrincipal) * 100) / 100);

    const isPast = toLocalDate(scheduleDates[i]) <= getLocalToday();

    periodResults.push({
      period: i + 1,
      date: scheduleDates[i],
      scheduledAmount: Math.round(scheduledAmount * 100) / 100,
      confirmedPaid: Math.round(confirmedPaidSum * 100) / 100,
      pendingPaid: Math.round(pendingPaidSum * 100) / 100,
      actualPaid: Math.round(allPaidSum * 100) / 100,
      isFullPayment,
      isPast,
      hasConfirmedPayments: periodConfirmedPayments[i].length > 0,
      hasPendingPayments: periodAllPayments[i].length > periodConfirmedPayments[i].length,
      hasAnyPayments: periodAllPayments[i].length > 0,
      deficit: periodDeficit,
      overpayment: periodOverpayment,
      interestThisPeriod: periodInterest,
      remainingPrincipal,
      confirmedPayments: periodConfirmedPayments[i],
      allPayments: periodAllPayments[i]
    });

    deficit = periodDeficit;
  }

  const remainingPeriodsCount = Math.max(1, totalPeriods - periodResults.filter(p => p.isPast && p.hasConfirmedPayments).length);
  const totalOwedNow = Math.max(0, Math.round((principal + totalInterestAccrued - totalPaid) * 100) / 100);

  const unpaidPeriods = totalPeriods - fullPaymentCount;
  const recalcPayment = unpaidPeriods > 0 && totalOwedNow > 0
    ? Math.round((totalOwedNow / unpaidPeriods) * 100) / 100
    : 0;

  const currentPeriodIdx = periodResults.findIndex(p => !p.isPast || (p.isPast && !p.hasConfirmedPayments));
  const nextPeriodDeficit = currentPeriodIdx > 0 ? periodResults[currentPeriodIdx - 1]?.deficit || 0 : 0;
  const nextPaymentAmount = recalcPayment > 0 ? Math.round((recalcPayment + nextPeriodDeficit) * 100) / 100 : originalPaymentAmount;

  return {
    principal,
    totalOwedNow,
    totalPaid,
    totalInterestAccrued,
    remainingPrincipal,
    fullPaymentCount,
    totalPeriods,
    recalcPayment,
    nextPaymentAmount,
    originalPaymentAmount,
    periodResults,
    deficit: periodResults.length > 0 ? periodResults[periodResults.length - 1].deficit : 0,
    paidPercentage: (principal + totalInterestAccrued) > 0
      ? Math.min(100, (totalPaid / (principal + totalInterestAccrued)) * 100)
      : 0
  };
}
