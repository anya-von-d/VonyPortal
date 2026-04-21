import { useEffect, useState } from 'react';
import { Payment, Loan, Friendship } from '@/entities/all';
import { daysUntil as daysUntilDate } from '@/components/utils/dateUtils';

/**
 * Count every item the NotificationsPopup would surface for a user, so that:
 *   - home notification banner
 *   - desktop top-nav bell bubble
 *   - mobile top-nav bell bubble
 * all agree on the same number.
 *
 * Categories (mirroring NotificationsPopup):
 *   1. payments awaiting confirmation (counterparty recorded, we haven't confirmed)
 *   2. pending loan offers received (we're the borrower, loan status 'pending')
 *   3. loan term change requests awaiting our approval
 *   4. incoming friend requests
 *   5. reminders — active loans with next_payment_date within 5 days (incl. overdue)
 *      and a remaining payment amount > 0
 */
export function countNotifications({ userId, loans = [], payments = [], friendships = [] }) {
  if (!userId) return 0;

  const userLoans = loans.filter(l => l && (l.lender_id === userId || l.borrower_id === userId));
  const userLoanIds = userLoans.map(l => l.id);

  const paymentsToConfirm = payments.filter(p =>
    p && p.status === 'pending_confirmation' &&
    userLoanIds.includes(p.loan_id) &&
    p.recorded_by !== userId
  );

  const loanOffersReceived = loans.filter(l =>
    l && l.borrower_id === userId && l.status === 'pending'
  );

  const termChangeRequests = loans.filter(l =>
    l && userLoanIds.includes(l.id) &&
    l.status === 'pending_borrower_approval' &&
    l.borrower_id === userId
  );

  const friendRequests = friendships.filter(f =>
    f && f.friend_id === userId && f.status === 'pending'
  );

  // Reminders — same rule as NotificationsPopup.buildReminders
  const completedPayments = payments.filter(p => p && p.status === 'completed');
  const reminders = userLoans.filter(loan => {
    if (loan.status !== 'active' || !loan.next_payment_date) return false;
    const days = daysUntilDate(loan.next_payment_date);
    if (days > 5) return false;
    const totalPaid = completedPayments
      .filter(p => p.loan_id === loan.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = (loan.total_amount || loan.amount || 0) - totalPaid;
    const paymentAmount = Math.min(loan.payment_amount || 0, remaining);
    return paymentAmount > 0;
  });

  return (
    paymentsToConfirm.length +
    loanOffersReceived.length +
    termChangeRequests.length +
    friendRequests.length +
    reminders.length
  );
}

/**
 * Hook: fetches loans/payments/friendships for the given user and returns the
 * shared notification count. Used by nav bars that don't already have the data.
 */
export function useNotificationCount(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let cancelled = false;

    (async () => {
      try {
        const [payments, loans, friendships] = await Promise.all([
          Payment.list().catch(() => []),
          Loan.list().catch(() => []),
          Friendship.list().catch(() => []),
        ]);
        if (cancelled) return;
        setCount(countNotifications({ userId, loans, payments, friendships }));
      } catch {
        if (!cancelled) setCount(0);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return count;
}
