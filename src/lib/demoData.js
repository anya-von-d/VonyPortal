/**
 * Demo mode sample data.
 *
 * All dates are calculated RELATIVE to "now" so the demo always looks healthy
 * whenever the app is opened. A mix of lending & borrowing with varied terms,
 * every active loan has at least one completed payment, and the math between
 * Home and Lending/Borrowing pages is internally consistent.
 *
 * Consistency contract (so Home.jsx and LendingBorrowing.jsx agree):
 *   - loan.amount            = principal (what was borrowed)
 *   - loan.total_amount      = amount + simple interest over the term
 *   - loan.payment_amount    = per-period payment amount (used everywhere)
 *   - loan.repayment_period  = number of periods (used for "Term", "Payments Made N/X")
 *   - loan.repayment_unit    = 'months' | 'weeks' | 'years' (display unit)
 *   - loan.payment_frequency = 'monthly' | 'weekly' | 'biweekly' (used by analyzer)
 *   - loan.interest_rate     = annual %, used by analyzer
 *   - loan.amount_paid       = sum of completed payment amounts on this loan
 *   - Each active loan has >=1 completed payment; totals match individual payments.
 */

const DAY = 86400000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();
const dateOnly = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

// Stable fake peer ids
const PEERS = {
  maya:    'demo-peer-maya-0001',
  jordan:  'demo-peer-jordan-0002',
  sofia:   'demo-peer-sofia-0003',
  alex:    'demo-peer-alex-0004',
  priya:   'demo-peer-priya-0005',
  marcus:  'demo-peer-marcus-0006',
  elena:   'demo-peer-elena-0007',
};

// Demo user identity override — shown everywhere the real user name would be.
export const DEMO_USER = {
  full_name: 'Alex Morgan',
  username: 'alexmorgan',
  email: 'demo@vony-lending.com',
  profile_picture_url: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=54A6CF&color=fff&size=128',
};

export const getDemoPublicProfiles = (uid) => [
  { id: 'demo-pp-you', user_id: uid, username: DEMO_USER.username, full_name: DEMO_USER.full_name,
    profile_picture_url: DEMO_USER.profile_picture_url },
  { id: 'demo-pp-maya',   user_id: PEERS.maya,   username: 'mayac',    full_name: 'Maya Chen',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Maya+Chen&background=E8A87C&color=fff&size=128' },
  { id: 'demo-pp-jordan', user_id: PEERS.jordan, username: 'jordanp',  full_name: 'Jordan Park',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Jordan+Park&background=85B79D&color=fff&size=128' },
  { id: 'demo-pp-sofia',  user_id: PEERS.sofia,  username: 'sofiar',   full_name: 'Sofia Rivera',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Sofia+Rivera&background=C38D9E&color=fff&size=128' },
  { id: 'demo-pp-alex',   user_id: PEERS.alex,   username: 'alexk',    full_name: 'Alex Kim',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Alex+Kim&background=41B3A3&color=fff&size=128' },
  { id: 'demo-pp-priya',  user_id: PEERS.priya,  username: 'priyash',  full_name: 'Priya Sharma',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=F4B942&color=fff&size=128' },
  { id: 'demo-pp-marcus', user_id: PEERS.marcus, username: 'marcusw',  full_name: 'Marcus Wright',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Marcus+Wright&background=6C8EBF&color=fff&size=128' },
  { id: 'demo-pp-elena',  user_id: PEERS.elena,  username: 'elenat',   full_name: 'Elena Torres',
    profile_picture_url: 'https://ui-avatars.com/api/?name=Elena+Torres&background=B084CC&color=fff&size=128' },
];

export const getDemoFriendships = (uid) => [
  { id: 'demo-fr-1', user_id: uid, friend_id: PEERS.maya,   status: 'accepted', created_at: iso(-120) },
  { id: 'demo-fr-2', user_id: uid, friend_id: PEERS.jordan, status: 'accepted', created_at: iso(-100) },
  { id: 'demo-fr-3', user_id: uid, friend_id: PEERS.sofia,  status: 'accepted', created_at: iso(-80) },
  { id: 'demo-fr-4', user_id: uid, friend_id: PEERS.alex,   status: 'accepted', created_at: iso(-60) },
  { id: 'demo-fr-5', user_id: uid, friend_id: PEERS.priya,  status: 'accepted', created_at: iso(-45) },
  { id: 'demo-fr-6', user_id: uid, friend_id: PEERS.marcus, status: 'accepted', created_at: iso(-30) },
  { id: 'demo-fr-7', user_id: PEERS.elena, friend_id: uid,  status: 'pending',  created_at: iso(-2) },
];

/**
 * Each loan definition below specifies its own payment schedule to keep the
 * math internally consistent. `completed` counts the payments that show up as
 * `status: 'completed'` in getDemoPayments (with matching dates/amounts).
 *
 * amount_paid === completed × payment_amount (when no pending_confirmation).
 * total_amount === payment_amount × repayment_period (0% interest) unless
 * interest_rate > 0, in which case total_amount is pre-computed to match.
 */
export const getDemoLoans = (uid) => [
  // ── LENDING (you are the lender) ──
  // 1. Maya — 6-month, $100/mo, 4 completed + 1 pending_confirmation waiting on you
  {
    id: 'demo-loan-1',
    lender_id: uid, borrower_id: PEERS.maya,
    amount: 600, total_amount: 600, amount_paid: 400,
    payment_amount: 100, repayment_period: 6, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(8), status: 'active',
    reason: 'Flight home for the holidays',
    created_at: iso(-150), start_date: dateOnly(-150),
  },
  // 2. Jordan — 8-month, $150/mo, 2 completed
  {
    id: 'demo-loan-2',
    lender_id: uid, borrower_id: PEERS.jordan,
    amount: 1200, total_amount: 1200, amount_paid: 300,
    payment_amount: 150, repayment_period: 8, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(14), status: 'active',
    reason: 'First-month rent while between jobs',
    created_at: iso(-90), start_date: dateOnly(-90),
  },
  // 3. Sofia — 1-period, $250, 1 completed (done)
  {
    id: 'demo-loan-3',
    lender_id: uid, borrower_id: PEERS.sofia,
    amount: 250, total_amount: 250, amount_paid: 250,
    payment_amount: 250, repayment_period: 1, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: null, status: 'completed',
    reason: 'Concert tickets split',
    created_at: iso(-60), start_date: dateOnly(-60),
  },
  // 4. Priya — 3-month, $150/mo, 1 completed (fixes "0/0 full payments")
  {
    id: 'demo-loan-4',
    lender_id: uid, borrower_id: PEERS.priya,
    amount: 450, total_amount: 450, amount_paid: 150,
    payment_amount: 150, repayment_period: 3, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(21), status: 'active',
    reason: 'Textbooks for the semester',
    created_at: iso(-35), start_date: dateOnly(-35),
  },

  // ── BORROWING (you are the borrower) ──
  // 5. Alex — 8-month, $100/mo, 5 completed
  {
    id: 'demo-loan-5',
    lender_id: PEERS.alex, borrower_id: uid,
    amount: 800, total_amount: 800, amount_paid: 500,
    payment_amount: 100, repayment_period: 8, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(5), status: 'active',
    reason: 'Laptop repair after coffee spill',
    created_at: iso(-150), start_date: dateOnly(-150),
  },
  // 6. Marcus — 8-month, $250/mo, 2 completed + 1 pending_confirmation
  {
    id: 'demo-loan-6',
    lender_id: PEERS.marcus, borrower_id: uid,
    amount: 2000, total_amount: 2000, amount_paid: 500,
    payment_amount: 250, repayment_period: 8, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(18), status: 'active',
    reason: 'Security deposit on new apartment',
    created_at: iso(-75), start_date: dateOnly(-75),
  },
  // 7. Elena — 1-period, $180, 1 completed (done)
  {
    id: 'demo-loan-7',
    lender_id: PEERS.elena, borrower_id: uid,
    amount: 180, total_amount: 180, amount_paid: 180,
    payment_amount: 180, repayment_period: 1, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: null, status: 'completed',
    reason: 'Birthday dinner I hosted',
    created_at: iso(-40), start_date: dateOnly(-40),
  },

  // ── PENDING OFFER (someone offering to lend YOU) ──
  {
    id: 'demo-loan-8',
    lender_id: PEERS.jordan, borrower_id: uid,
    amount: 350, total_amount: 350, amount_paid: 0,
    payment_amount: 175, repayment_period: 2, repayment_unit: 'months', payment_frequency: 'monthly',
    interest_rate: 0,
    next_payment_date: dateOnly(30), status: 'pending',
    reason: 'Studio time for your EP',
    created_at: iso(-1), start_date: dateOnly(0),
  },
];

export const getDemoPayments = (uid) => [
  // Loan 1 (Maya → you): 4 completed × $100 + 1 pending_confirmation
  { id: 'demo-pay-1a', loan_id: 'demo-loan-1', amount: 100, status: 'completed',
    payment_date: dateOnly(-120), recorded_by: PEERS.maya, created_at: iso(-120) },
  { id: 'demo-pay-1b', loan_id: 'demo-loan-1', amount: 100, status: 'completed',
    payment_date: dateOnly(-90),  recorded_by: PEERS.maya, created_at: iso(-90) },
  { id: 'demo-pay-1c', loan_id: 'demo-loan-1', amount: 100, status: 'completed',
    payment_date: dateOnly(-60),  recorded_by: PEERS.maya, created_at: iso(-60) },
  { id: 'demo-pay-1d', loan_id: 'demo-loan-1', amount: 100, status: 'completed',
    payment_date: dateOnly(-30),  recorded_by: PEERS.maya, created_at: iso(-30) },
  { id: 'demo-pay-1e', loan_id: 'demo-loan-1', amount: 100, status: 'pending_confirmation',
    payment_date: dateOnly(-1),   recorded_by: PEERS.maya, created_at: iso(-1) },

  // Loan 2 (Jordan → you): 2 completed × $150
  { id: 'demo-pay-2a', loan_id: 'demo-loan-2', amount: 150, status: 'completed',
    payment_date: dateOnly(-60),  recorded_by: PEERS.jordan, created_at: iso(-60) },
  { id: 'demo-pay-2b', loan_id: 'demo-loan-2', amount: 150, status: 'completed',
    payment_date: dateOnly(-30),  recorded_by: PEERS.jordan, created_at: iso(-30) },

  // Loan 3 (Sofia → you): 1 completed × $250 (done)
  { id: 'demo-pay-3a', loan_id: 'demo-loan-3', amount: 250, status: 'completed',
    payment_date: dateOnly(-35),  recorded_by: PEERS.sofia, created_at: iso(-35) },

  // Loan 4 (Priya → you): 1 completed × $150
  { id: 'demo-pay-4a', loan_id: 'demo-loan-4', amount: 150, status: 'completed',
    payment_date: dateOnly(-5),   recorded_by: PEERS.priya, created_at: iso(-5) },

  // Loan 5 (you → Alex): 5 completed × $100
  { id: 'demo-pay-5a', loan_id: 'demo-loan-5', amount: 100, status: 'completed',
    payment_date: dateOnly(-125), recorded_by: uid, created_at: iso(-125) },
  { id: 'demo-pay-5b', loan_id: 'demo-loan-5', amount: 100, status: 'completed',
    payment_date: dateOnly(-95),  recorded_by: uid, created_at: iso(-95) },
  { id: 'demo-pay-5c', loan_id: 'demo-loan-5', amount: 100, status: 'completed',
    payment_date: dateOnly(-65),  recorded_by: uid, created_at: iso(-65) },
  { id: 'demo-pay-5d', loan_id: 'demo-loan-5', amount: 100, status: 'completed',
    payment_date: dateOnly(-35),  recorded_by: uid, created_at: iso(-35) },
  { id: 'demo-pay-5e', loan_id: 'demo-loan-5', amount: 100, status: 'completed',
    payment_date: dateOnly(-5),   recorded_by: uid, created_at: iso(-5) },

  // Loan 6 (you → Marcus): 2 completed × $250 + 1 pending_confirmation
  { id: 'demo-pay-6a', loan_id: 'demo-loan-6', amount: 250, status: 'completed',
    payment_date: dateOnly(-45),  recorded_by: uid, created_at: iso(-45) },
  { id: 'demo-pay-6b', loan_id: 'demo-loan-6', amount: 250, status: 'completed',
    payment_date: dateOnly(-15),  recorded_by: uid, created_at: iso(-15) },
  { id: 'demo-pay-6c', loan_id: 'demo-loan-6', amount: 250, status: 'pending_confirmation',
    payment_date: dateOnly(-2),   recorded_by: uid, created_at: iso(-2) },

  // Loan 7 (you → Elena): 1 completed × $180 (done)
  { id: 'demo-pay-7a', loan_id: 'demo-loan-7', amount: 180, status: 'completed',
    payment_date: dateOnly(-20),  recorded_by: uid, created_at: iso(-20) },
];

export const getDemoLoanAgreements = (uid) => [
  // Loan 1 — Alex Morgan lends $600 to Maya Chen, 6 × $100/mo
  {
    id: 'demo-agr-1', loan_id: 'demo-loan-1',
    lender_id: uid, borrower_id: PEERS.maya,
    amount: 600, total_amount: 600, payment_amount: 100,
    payment_frequency: 'monthly', repayment_period: 6, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Flight home for the holidays',
    lender_name: DEMO_USER.full_name, borrower_name: 'Maya Chen',
    created_at: iso(-150),
    lender_signed_date: iso(-148), borrower_signed_date: iso(-148),
    first_payment_date: dateOnly(-120), due_date: dateOnly(30),
  },
  // Loan 2 — Alex Morgan lends $1200 to Jordan Park, 8 × $150/mo
  {
    id: 'demo-agr-2', loan_id: 'demo-loan-2',
    lender_id: uid, borrower_id: PEERS.jordan,
    amount: 1200, total_amount: 1200, payment_amount: 150,
    payment_frequency: 'monthly', repayment_period: 8, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'First-month rent while between jobs',
    lender_name: DEMO_USER.full_name, borrower_name: 'Jordan Park',
    created_at: iso(-90),
    lender_signed_date: iso(-88), borrower_signed_date: iso(-88),
    first_payment_date: dateOnly(-60), due_date: dateOnly(150),
  },
  // Loan 3 — Alex Morgan lends $250 to Sofia Rivera, 1 × $250/mo (completed)
  {
    id: 'demo-agr-3', loan_id: 'demo-loan-3',
    lender_id: uid, borrower_id: PEERS.sofia,
    amount: 250, total_amount: 250, payment_amount: 250,
    payment_frequency: 'monthly', repayment_period: 1, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Concert tickets split',
    lender_name: DEMO_USER.full_name, borrower_name: 'Sofia Rivera',
    created_at: iso(-60),
    lender_signed_date: iso(-58), borrower_signed_date: iso(-58),
    first_payment_date: dateOnly(-35), due_date: dateOnly(-35),
  },
  // Loan 4 — Alex Morgan lends $450 to Priya Sharma, 3 × $150/mo
  {
    id: 'demo-agr-4', loan_id: 'demo-loan-4',
    lender_id: uid, borrower_id: PEERS.priya,
    amount: 450, total_amount: 450, payment_amount: 150,
    payment_frequency: 'monthly', repayment_period: 3, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Textbooks for the semester',
    lender_name: DEMO_USER.full_name, borrower_name: 'Priya Sharma',
    created_at: iso(-35),
    lender_signed_date: iso(-33), borrower_signed_date: iso(-33),
    first_payment_date: dateOnly(-5), due_date: dateOnly(55),
  },
  // Loan 5 — Alex Kim lends $800 to Alex Morgan, 8 × $100/mo
  {
    id: 'demo-agr-5', loan_id: 'demo-loan-5',
    lender_id: PEERS.alex, borrower_id: uid,
    amount: 800, total_amount: 800, payment_amount: 100,
    payment_frequency: 'monthly', repayment_period: 8, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Laptop repair after coffee spill',
    lender_name: 'Alex Kim', borrower_name: DEMO_USER.full_name,
    created_at: iso(-150),
    lender_signed_date: iso(-148), borrower_signed_date: iso(-148),
    first_payment_date: dateOnly(-125), due_date: dateOnly(85),
  },
  // Loan 6 — Marcus Wright lends $2000 to Alex Morgan, 8 × $250/mo
  {
    id: 'demo-agr-6', loan_id: 'demo-loan-6',
    lender_id: PEERS.marcus, borrower_id: uid,
    amount: 2000, total_amount: 2000, payment_amount: 250,
    payment_frequency: 'monthly', repayment_period: 8, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Security deposit on new apartment',
    lender_name: 'Marcus Wright', borrower_name: DEMO_USER.full_name,
    created_at: iso(-75),
    lender_signed_date: iso(-73), borrower_signed_date: iso(-73),
    first_payment_date: dateOnly(-45), due_date: dateOnly(165),
  },
  // Loan 7 — Elena Torres lends $180 to Alex Morgan, 1 × $180/mo (completed)
  {
    id: 'demo-agr-7', loan_id: 'demo-loan-7',
    lender_id: PEERS.elena, borrower_id: uid,
    amount: 180, total_amount: 180, payment_amount: 180,
    payment_frequency: 'monthly', repayment_period: 1, repayment_unit: 'months',
    interest_rate: 0,
    purpose: 'Birthday dinner I hosted',
    lender_name: 'Elena Torres', borrower_name: DEMO_USER.full_name,
    created_at: iso(-40),
    lender_signed_date: iso(-38), borrower_signed_date: iso(-38),
    first_payment_date: dateOnly(-20), due_date: dateOnly(-20),
  },
];

// Plan Your Month extras injected into the Home page list in demo mode.
export const getDemoPlanItems = () => [
  { id: 'demo-plan-rent',   label: 'Have to send rent payment to landlord', amount: -1450, date: dateOnly(6),  status: 'custom' },
  { id: 'demo-plan-income', label: 'Income',                                amount:  2800, date: dateOnly(10), status: 'custom' },
];

// Convenience selector used by entity wrappers
export const getDemoDataset = (uid) => ({
  public_profiles: getDemoPublicProfiles(uid),
  friendships:     getDemoFriendships(uid),
  loans:           getDemoLoans(uid),
  payments:        getDemoPayments(uid),
  loan_agreements: getDemoLoanAgreements(uid),
});
