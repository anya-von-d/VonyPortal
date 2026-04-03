import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loan, Payment, Friendship, PublicProfile } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";

/* ── Accordion section ──────────────────────────────────────── */
function AccordionSection({ title, open, onToggle, badge, children }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '11px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 600, color: '#9B9A98',
          letterSpacing: '0.07em', textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {title}
          {badge > 0 && (
            <span style={{
              background: '#E8726E', color: 'white', fontSize: 9, fontWeight: 700,
              minWidth: 16, height: 16, borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>{badge}</span>
          )}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C7C6C4"
          strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 10px 10px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function DashboardSidebar({ activePage = "Dashboard", user }) {
  const avatarInitial = (user?.full_name || 'U').charAt(0).toUpperCase();
  const { logout } = useAuth();

  const [notifCount, setNotifCount] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [moreOpen, setMoreOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const moreRef = useRef(null);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [payments, loans, friendships, profiles] = await Promise.all([
        Payment.list().catch(() => []),
        Loan.list().catch(() => []),
        Friendship.list().catch(() => []),
        PublicProfile.list().catch(() => []),
      ]);

      const userLoans = loans.filter(l => l.lender_id === user.id || l.borrower_id === user.id);
      const userLoanIds = userLoans.map(l => l.id);
      const today = new Date();

      /* ── Notifications ── */
      const paymentsToConfirm = payments.filter(p =>
        p.status === 'pending_confirmation' && userLoanIds.includes(p.loan_id) && p.recorded_by !== user.id
      );
      const termChanges = loans.filter(l =>
        userLoanIds.includes(l.id) && l.status === 'pending_borrower_approval' && l.borrower_id === user.id
      );
      const offersReceived = loans.filter(l => l.borrower_id === user.id && l.status === 'pending');
      const friendRequests = friendships.filter(f => f.friend_id === user.id && f.status === 'pending');

      const notifItems = [
        ...paymentsToConfirm.map(p => ({ label: 'Payment awaiting confirmation', id: p.id })),
        ...termChanges.map(l => ({ label: 'Loan term change request', id: l.id })),
        ...offersReceived.map(l => ({ label: 'New loan offer received', id: l.id })),
        ...friendRequests.map(f => ({ label: 'New friend request', id: f.id })),
      ];
      setNotifCount(notifItems.length);
      setNotifications(notifItems.slice(0, 5));

      /* ── Upcoming ── */
      const getName = (userId) => {
        const p = profiles.find(pr => pr.user_id === userId);
        return p?.full_name?.split(' ')[0] || 'User';
      };

      const upcoming = userLoans
        .filter(l => l.status === 'active' && l.next_payment_date && new Date(l.next_payment_date) >= today)
        .sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date))
        .slice(0, 5)
        .map(l => ({
          id: l.id,
          amount: l.payment_amount || 0,
          date: l.next_payment_date,
          name: getName(l.lender_id === user.id ? l.borrower_id : l.lender_id),
          isLender: l.lender_id === user.id,
        }));
      setUpcomingPayments(upcoming);

      /* ── Completed ── */
      const completed = payments
        .filter(p => userLoanIds.includes(p.loan_id) && p.status === 'confirmed')
        .sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at))
        .slice(0, 5)
        .map(p => {
          const loan = userLoans.find(l => l.id === p.loan_id);
          if (!loan) return null;
          const isLender = loan.lender_id === user.id;
          return {
            id: p.id,
            amount: p.amount || 0,
            date: p.payment_date || p.created_at,
            name: getName(isLender ? loan.borrower_id : loan.lender_id),
            isLender,
          };
        })
        .filter(Boolean);
      setCompletedPayments(completed);

    } catch (e) {
      console.error("Sidebar data error:", e);
    }
  };

  /* ── Close More on outside click ── */
  useEffect(() => {
    const h = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { setMoreOpen(false); logout(); };

  /* ── Positive message ── */
  const positiveMessage = () => {
    if (notifCount === 0 && upcomingPayments.length === 0) return "You're all caught up — great financial health! ✨";
    if (notifCount > 0) return `You have ${notifCount} item${notifCount === 1 ? '' : 's'} that need${notifCount === 1 ? 's' : ''} your attention.`;
    if (upcomingPayments.length > 0) return `${upcomingPayments.length} upcoming payment${upcomingPayments.length === 1 ? '' : 's'} — you've got this! 💪`;
    return "Your loans are on track. Keep it up! 🌟";
  };

  /* ── Nav item styles ── */
  const active = (...pages) => pages.includes(activePage);
  const navStyle = (...pages) => ({
    display: 'flex', alignItems: 'center',
    padding: '6px 11px', borderRadius: 8, textDecoration: 'none',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap', transition: 'background 0.15s',
    color: active(...pages) ? '#1A1918' : '#5C5B5A',
    fontWeight: active(...pages) ? 600 : 500,
    background: active(...pages) ? 'rgba(0,0,0,0.07)' : 'transparent',
  });

  const moreIsActive = active('RecentActivity', 'LoanAgreements', 'ComingSoon');

  /* ── Payment chip ── */
  const PayChip = ({ p, accent }) => (
    <div style={{
      background: accent ? 'rgba(130,240,185,0.06)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${accent ? 'rgba(130,240,185,0.18)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: 10, padding: '7px 10px', marginBottom: 5,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1918' }}>
          ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span style={{ fontSize: 10, color: '#9B9A98' }}>
          {p.date ? format(new Date(p.date), 'MMM d') : ''}
        </span>
      </div>
      <p style={{ fontSize: 11, color: '#787776', margin: '2px 0 0' }}>
        {p.isLender ? `From ${p.name}` : `To ${p.name}`}
      </p>
    </div>
  );

  /* ── Dropdown link row ── */
  const MoreLink = ({ page, label, iconPath, filled = true }) => (
    <Link to={createPageUrl(page)} onClick={() => setMoreOpen(false)} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
      fontSize: 13, fontFamily: "'DM Sans', sans-serif",
      color: activePage === page ? '#1A1918' : '#5C5B5A',
      fontWeight: activePage === page ? 600 : 500,
      background: activePage === page ? 'rgba(0,0,0,0.05)' : 'transparent',
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => { if (activePage !== page) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
    onMouseLeave={e => { if (activePage !== page) e.currentTarget.style.background = activePage === page ? 'rgba(0,0,0,0.05)' : 'transparent'; }}
    >
      {filled
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#9B9A98"><path d={iconPath}/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9A98" strokeWidth="1.8" strokeLinecap="round">{iconPath}</svg>
      }
      {label}
    </Link>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          FLOATING GLASS PILL NAV
          ══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 8, left: 8, right: 8, height: 52,
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.80)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 100,
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 1,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Vony logo */}
        <Link to="/" style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 400, fontStyle: 'italic', fontSize: '1.3rem',
          letterSpacing: '-0.02em', color: '#1A1918', textDecoration: 'none',
          marginRight: 8, flexShrink: 0,
        }}>Vony</Link>

        {/* Primary nav links */}
        <Link to="/" style={navStyle('Dashboard')}>Home</Link>
        <Link to={createPageUrl("CreateOffer")} style={navStyle('CreateOffer')}>Create Loan</Link>
        <Link to={createPageUrl("RecordPayment")} style={navStyle('RecordPayment')}>Record Payment</Link>
        <Link to={createPageUrl("Upcoming")} style={navStyle('Upcoming')}>Upcoming</Link>
        <Link to={createPageUrl("YourLoans")} style={navStyle('YourLoans', 'Borrowing', 'Lending')}>Lending & Borrowing</Link>
        <Link to={createPageUrl("Friends")} style={navStyle('Friends')}>Friends</Link>

        {/* More dropdown */}
        <div ref={moreRef} style={{ position: 'relative' }}>
          <button onClick={() => setMoreOpen(!moreOpen)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            transition: 'background 0.15s',
            color: moreIsActive || moreOpen ? '#1A1918' : '#5C5B5A',
            fontWeight: moreIsActive || moreOpen ? 600 : 500,
            background: moreIsActive ? 'rgba(0,0,0,0.07)' : moreOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
          }}>
            More
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.55 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {moreOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 204,
              background: 'white', borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              padding: 6, zIndex: 200,
            }}>
              <MoreLink page="RecentActivity" label="Recent Activity"
                iconPath="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              <MoreLink page="LoanAgreements" label="Loan Documents"
                iconPath="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 6px' }} />
              <MoreLink page="ComingSoon" label="Settings" filled={false}
                iconPath={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 6px' }} />
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, width: '100%', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", color: '#E8726E', fontWeight: 500, textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,114,110,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8726E" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Notifications bell */}
        <Link to={createPageUrl("Requests")} style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 10, textDecoration: 'none', flexShrink: 0,
          background: active('Requests') ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.03)',
          marginRight: 6,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={active('Requests') ? '#1A1918' : '#787776'}>
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {notifCount > 0 && (
            <div style={{
              position: 'absolute', top: -3, right: -3, background: '#E8726E', color: 'white',
              fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1,
            }}>{notifCount > 99 ? '99+' : notifCount}</div>
          )}
        </Link>

        {/* Profile avatar */}
        <Link to={createPageUrl("Profile")} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%', background: '#1A1918',
          textDecoration: 'none', flexShrink: 0, overflow: 'hidden',
          outline: active('Profile') ? '2px solid #82F0B9' : 'none', outlineOffset: 2,
        }}>
          {user?.profile_picture_url
            ? <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white' }}>{avatarInitial}</span>
          }
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          WHITE INFO SIDEBAR
          ══════════════════════════════════════════════════════════ */}
      <aside style={{
        position: 'fixed', left: 0, top: 72, bottom: 0, width: 260,
        background: 'white',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
        zIndex: 80,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Vony glass card ── */}
        <div style={{ padding: 14 }}>
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            padding: '18px 18px 16px',
          }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400, fontStyle: 'italic', fontSize: '1.5rem',
              color: '#1A1918', letterSpacing: '-0.01em', marginBottom: 4,
            }}>Vony</div>
            {user?.full_name && (
              <p style={{
                fontSize: 11, color: '#9B9A98', margin: '0 0 10px',
                letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600,
              }}>
                Hi, {user.full_name.split(' ')[0]} 👋
              </p>
            )}
            <p style={{
              fontSize: 13, color: '#1A1918', margin: 0, lineHeight: 1.55,
              fontStyle: 'italic',
            }}>
              {positiveMessage()}
            </p>
          </div>
        </div>

        {/* ── Upcoming accordion ── */}
        <AccordionSection
          title="Upcoming"
          open={upcomingOpen}
          onToggle={() => setUpcomingOpen(v => !v)}
          badge={upcomingPayments.length}
        >
          {upcomingPayments.length === 0
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0, padding: '2px 4px' }}>No upcoming payments</p>
            : upcomingPayments.map(p => <PayChip key={p.id} p={p} accent />)
          }
        </AccordionSection>

        {/* ── Completed accordion ── */}
        <AccordionSection
          title="Completed"
          open={completedOpen}
          onToggle={() => setCompletedOpen(v => !v)}
          badge={0}
        >
          {completedPayments.length === 0
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0, padding: '2px 4px' }}>No completed payments yet</p>
            : completedPayments.map(p => <PayChip key={p.id} p={p} accent={false} />)
          }
        </AccordionSection>

        {/* ── Notifications accordion ── */}
        <AccordionSection
          title="Notifications"
          open={notifOpen}
          onToggle={() => setNotifOpen(v => !v)}
          badge={notifCount}
        >
          {notifications.length === 0
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0, padding: '2px 4px' }}>No pending notifications</p>
            : (
              <>
                {notifications.map((n, i) => (
                  <Link key={i} to={createPageUrl("Requests")} style={{
                    display: 'block', textDecoration: 'none',
                    background: 'rgba(232,114,110,0.05)',
                    border: '1px solid rgba(232,114,110,0.12)',
                    borderRadius: 10, padding: '7px 10px', marginBottom: 5,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#1A1918', margin: 0 }}>{n.label}</p>
                  </Link>
                ))}
                <Link to={createPageUrl("Requests")} style={{
                  display: 'block', fontSize: 12, color: '#03ACEA',
                  textDecoration: 'none', fontWeight: 500, padding: '4px 4px',
                }}>View all →</Link>
              </>
            )
          }
        </AccordionSection>
      </aside>
    </>
  );
}
