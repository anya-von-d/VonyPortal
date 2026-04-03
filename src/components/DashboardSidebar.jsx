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
        <div style={{ padding: '0 12px 12px' }}>
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
  const firstName = user?.full_name?.split(' ')[0] || '';

  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);

  /* Nav dropdown state */
  const [openDropdown, setOpenDropdown] = useState(null);

  /* Sidebar accordion state */
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [friendsOpen, setFriendsOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);

  const dropdownWrapRef = useRef(null);

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

      const getName = (userId) => {
        const p = profiles.find(pr => pr.user_id === userId);
        return p?.full_name?.split(' ')[0] || 'Someone';
      };

      /* ── Notifications (actionable by current user) ── */
      const paymentsToConfirm = payments.filter(p =>
        p.status === 'pending_confirmation' && userLoanIds.includes(p.loan_id) && p.recorded_by !== user.id
      );
      const termChanges = loans.filter(l =>
        userLoanIds.includes(l.id) && l.status === 'pending_borrower_approval' && l.borrower_id === user.id
      );
      const offersReceived = loans.filter(l => l.borrower_id === user.id && l.status === 'pending');
      const friendRequests = friendships.filter(f => f.friend_id === user.id && f.status === 'pending');

      const notifItems = [
        ...offersReceived.map(l => ({
          id: l.id,
          text: `${getName(l.lender_id)} sent you a loan offer`,
          date: l.created_at,
        })),
        ...paymentsToConfirm.map(p => ({
          id: p.id,
          text: `Confirm payment from ${getName(p.recorded_by)}`,
          date: p.created_at,
        })),
        ...friendRequests.map(f => ({
          id: f.id,
          text: `${getName(f.user_id)} sent you a friend request`,
          date: f.created_at,
        })),
        ...termChanges.map(l => ({
          id: l.id,
          text: `${getName(l.lender_id)} updated loan terms`,
          date: l.updated_at,
        })),
      ];
      setNotifCount(notifItems.length);
      setNotifications(notifItems.slice(0, 6));

      /* ── Upcoming ── */
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

      /* ── Friends ── */
      const accepted = friendships.filter(f =>
        f.status === 'accepted' && (f.user_id === user.id || f.friend_id === user.id)
      );
      const friendProfiles = accepted
        .map(f => {
          const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
          return profiles.find(p => p.user_id === otherId);
        })
        .filter(Boolean);
      setFriends(friendProfiles);

      /* ── Pending (waiting for others to act) ── */
      const myRecordedPending = payments.filter(p =>
        p.recorded_by === user.id && p.status === 'pending_confirmation'
      );
      const myOffersOut = loans.filter(l => l.lender_id === user.id && l.status === 'pending');

      const pendingList = [
        ...myRecordedPending.map(p => {
          const loan = userLoans.find(l => l.id === p.loan_id);
          const otherId = loan ? (loan.lender_id === user.id ? loan.borrower_id : loan.lender_id) : null;
          return {
            id: p.id,
            text: `Waiting for ${otherId ? getName(otherId) : 'them'} to confirm payment`,
            date: p.created_at,
          };
        }),
        ...myOffersOut.map(l => ({
          id: l.id,
          text: `Waiting for ${getName(l.borrower_id)} to confirm loan offer`,
          date: l.created_at,
        })),
      ];
      setPendingItems(pendingList.slice(0, 8));

    } catch (e) {
      console.error("Sidebar data error:", e);
    }
  };

  /* ── Close nav dropdown on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (dropdownWrapRef.current && !dropdownWrapRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { setOpenDropdown(null); logout(); };

  /* ── Active page helpers ── */
  const active = (...pages) => pages.includes(activePage);

  const navLinkStyle = (...pages) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap', transition: 'background 0.15s', flexShrink: 0,
    color: active(...pages) ? '#1A1918' : '#5C5B5A',
    fontWeight: active(...pages) ? 600 : 500,
    background: active(...pages) ? 'rgba(0,0,0,0.07)' : 'transparent',
  });

  const dropdownBtnStyle = (key, ...pages) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap', transition: 'background 0.15s', flexShrink: 0,
    color: (active(...pages) || openDropdown === key) ? '#1A1918' : '#5C5B5A',
    fontWeight: (active(...pages) || openDropdown === key) ? 600 : 500,
    background: active(...pages) ? 'rgba(0,0,0,0.07)' : openDropdown === key ? 'rgba(0,0,0,0.04)' : 'transparent',
  });

  const chevronDown = (isOpen) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5, flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const dropdownPanel = (alignRight = false) => ({
    position: 'absolute', top: 'calc(100% + 6px)',
    left: alignRight ? 'auto' : 0,
    right: alignRight ? 0 : 'auto',
    minWidth: 180,
    background: 'white', borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
    padding: 5, zIndex: 200,
  });

  const DropdownItem = ({ page, label, search = '' }) => (
    <Link
      to={search ? { pathname: createPageUrl(page), search } : createPageUrl(page)}
      onClick={() => setOpenDropdown(null)}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        color: activePage === page ? '#1A1918' : '#5C5B5A',
        fontWeight: activePage === page ? 600 : 500,
        background: activePage === page ? 'rgba(0,0,0,0.05)' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (activePage !== page) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { if (activePage !== page) e.currentTarget.style.background = activePage === page ? 'rgba(0,0,0,0.05)' : 'transparent'; }}
    >
      {label}
    </Link>
  );

  const formatDate = (d) => {
    if (!d) return '';
    try { return format(new Date(d), 'MMM d'); } catch { return ''; }
  };

  return (
    <>
      {/* ── Mobile tab bar responsive CSS ── */}
      <style>{`
        @media (min-width: 900px) {
          .mobile-tab-bar { display: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          FLOATING GLASS PILL NAV
          ══════════════════════════════════════════════════════════ */}
      <div ref={dropdownWrapRef} style={{
        position: 'fixed', top: 8, left: 268, right: 8, height: 52, zIndex: 100,
      }}>
        <nav style={{
          width: '100%', height: '100%',
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.80)',
          boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 2,
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'visible', boxSizing: 'border-box',
        }}>
          <Link to="/" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400, fontStyle: 'italic', fontSize: '1.25rem',
            letterSpacing: '-0.02em', color: '#1A1918', textDecoration: 'none', flexShrink: 0,
          }}>Vony</Link>

          <div style={{ flex: 1 }} />
          <Link to="/" style={navLinkStyle('Dashboard')}>Home</Link>
          <div style={{ flex: 1 }} />
          <Link to={createPageUrl("CreateOffer")} style={navLinkStyle('CreateOffer')}>Create Loan</Link>
          <div style={{ flex: 1 }} />
          <Link to={createPageUrl("RecordPayment")} style={navLinkStyle('RecordPayment')}>Record Payment</Link>
          <div style={{ flex: 1 }} />

          {/* Upcoming dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={dropdownBtnStyle('upcoming', 'Upcoming')}
              onClick={() => setOpenDropdown(openDropdown === 'upcoming' ? null : 'upcoming')}>
              Upcoming {chevronDown(openDropdown === 'upcoming')}
            </button>
            {openDropdown === 'upcoming' && (
              <div style={dropdownPanel()}>
                <DropdownItem page="Upcoming" search="?tab=summary" label="Summary" />
                <DropdownItem page="Upcoming" search="?tab=calendar" label="Calendar" />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* My Loans dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={dropdownBtnStyle('loans', 'YourLoans', 'Borrowing', 'Lending')}
              onClick={() => setOpenDropdown(openDropdown === 'loans' ? null : 'loans')}>
              My Loans {chevronDown(openDropdown === 'loans')}
            </button>
            {openDropdown === 'loans' && (
              <div style={dropdownPanel()}>
                <DropdownItem page="YourLoans" search="?tab=lending" label="Lending" />
                <DropdownItem page="YourLoans" search="?tab=borrowing" label="Borrowing" />
                <DropdownItem page="YourLoans" search="?tab=details" label="Individual Loan Details" />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />
          <Link to={createPageUrl("Friends")} style={navLinkStyle('Friends')}>Friends</Link>
          <div style={{ flex: 1 }} />

          {/* More dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={dropdownBtnStyle('more', 'RecentActivity', 'LoanAgreements', 'ComingSoon')}
              onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}>
              More {chevronDown(openDropdown === 'more')}
            </button>
            {openDropdown === 'more' && (
              <div style={{ ...dropdownPanel(true), minWidth: 200 }}>
                <DropdownItem page="RecentActivity" label="Recent Activity" />
                <DropdownItem page="LoanAgreements" label="Loan Documents" />
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 5px' }} />
                <DropdownItem page="ComingSoon" label="Settings" />
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 5px' }} />
                <button onClick={handleLogout} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, width: '100%', border: 'none',
                  background: 'transparent', cursor: 'pointer', fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif", color: '#E8726E', fontWeight: 500, textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,114,110,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8726E" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════════
          WHITE INFO SIDEBAR
          ══════════════════════════════════════════════════════════ */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 260,
        background: 'white',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
        zIndex: 80,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{ position: 'relative', padding: '16px 16px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>

          {/* Notifications bell — top right, no box */}
          <Link to={createPageUrl("Requests")} style={{
            position: 'absolute', top: 14, right: 14,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={active('Requests') ? '#1A1918' : '#9B9A98'}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {notifCount > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -5,
                  background: '#E8726E', color: 'white',
                  fontSize: 8, fontWeight: 700, minWidth: 14, height: 14, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>{notifCount > 99 ? '99+' : notifCount}</div>
              )}
            </div>
          </Link>

          {/* Profile photo — centered, large, clickable */}
          <Link to={createPageUrl("Profile")} style={{
            display: 'flex', justifyContent: 'center', marginBottom: 10, textDecoration: 'none',
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%', background: '#1A1918',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: active('Profile') ? '3px solid #82F0B9' : '3px solid rgba(0,0,0,0.06)',
              outlineOffset: 2,
              transition: 'outline 0.15s',
            }}>
              {user?.profile_picture_url
                ? <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{avatarInitial}</span>
              }
            </div>
          </Link>

          {/* Name — centered */}
          <p style={{
            textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1A1918',
            margin: '0 0 10px', lineHeight: 1.2,
          }}>
            {user?.full_name || firstName || 'there'}
          </p>

          {/* My Profile button */}
          <Link to={createPageUrl("Profile")} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 14px', borderRadius: 10,
            background: active('Profile') ? '#1A1918' : 'rgba(0,0,0,0.05)',
            textDecoration: 'none',
            fontSize: 12, fontWeight: 600,
            color: active('Profile') ? 'white' : '#1A1918',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!active('Profile')) e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; }}
          onMouseLeave={e => { if (!active('Profile')) e.currentTarget.style.background = active('Profile') ? '#1A1918' : 'rgba(0,0,0,0.05)'; }}
          >
            My Profile
          </Link>
        </div>

        {/* ── Notifications — flat list, no accordion ── */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px 8px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9B9A98', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
              Notifications
              {notifCount > 0 && (
                <span style={{
                  background: '#E8726E', color: 'white', fontSize: 9, fontWeight: 700,
                  minWidth: 16, height: 16, borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>{notifCount}</span>
              )}
            </span>
            {notifCount > 0 && (
              <Link to={createPageUrl("Requests")} style={{ fontSize: 10, color: '#03ACEA', textDecoration: 'none', fontWeight: 600 }}>
                See all
              </Link>
            )}
          </div>

          {/* Items — no boxes, just text + date */}
          <div style={{ padding: '0 16px 12px' }}>
            {notifications.length === 0
              ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0 }}>No new notifications</p>
              : notifications.map((n, i) => (
                <Link key={n.id || i} to={createPageUrl("Requests")} style={{
                  display: 'block', textDecoration: 'none',
                  paddingBottom: i < notifications.length - 1 ? 10 : 0,
                  marginBottom: i < notifications.length - 1 ? 10 : 0,
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1A1918', margin: 0, lineHeight: 1.4 }}>{n.text}</p>
                  {n.date && (
                    <p style={{ fontSize: 10, color: '#9B9A98', margin: '2px 0 0' }}>
                      {formatDate(n.date)}
                    </p>
                  )}
                </Link>
              ))
            }
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
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0 }}>No upcoming payments</p>
            : upcomingPayments.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '7px 8px', borderRadius: 9, marginBottom: 4,
                background: 'rgba(130,240,185,0.05)',
                border: '1px solid rgba(130,240,185,0.16)',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: 'rgba(130,240,185,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#2DBD75">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1918', margin: 0 }}>
                    ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: 11, color: '#787776', margin: '1px 0 0' }}>
                    {p.isLender ? `From ${p.name}` : `To ${p.name}`}
                  </p>
                  {p.date && (
                    <p style={{ fontSize: 10, color: '#9B9A98', margin: '2px 0 0' }}>
                      {formatDate(p.date)}
                    </p>
                  )}
                </div>
              </div>
            ))
          }
        </AccordionSection>

        {/* ── Friends accordion ── */}
        <AccordionSection
          title="Friends"
          open={friendsOpen}
          onToggle={() => setFriendsOpen(v => !v)}
          badge={0}
        >
          {friends.length === 0
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: '0 0 10px' }}>No friends added yet</p>
            : (
              <div style={{ marginBottom: 10 }}>
                {friends.map((friend, i) => {
                  const initial = (friend.full_name || 'U').charAt(0).toUpperCase();
                  return (
                    <div key={friend.user_id || i} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '5px 4px', borderRadius: 8, marginBottom: 2,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: '#1A1918',
                        flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {friend.profile_picture_url
                          ? <img src={friend.profile_picture_url} alt={friend.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{initial}</span>
                        }
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1918', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {friend.full_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          }

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <Link to={createPageUrl("Friends")} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '7px 8px', borderRadius: 9, textDecoration: 'none',
              background: 'rgba(3,172,234,0.08)', border: '1px solid rgba(3,172,234,0.14)',
              fontSize: 11, fontWeight: 600, color: '#03ACEA', transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(3,172,234,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(3,172,234,0.08)'}
            >
              Find Friends
            </Link>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '7px 8px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(0,0,0,0.03)', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: '#5C5B5A',
              fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
            >
              Invite Friends
            </button>
          </div>
        </AccordionSection>

        {/* ── Pending accordion ── */}
        <AccordionSection
          title="Pending"
          open={pendingOpen}
          onToggle={() => setPendingOpen(v => !v)}
          badge={pendingItems.length}
        >
          {pendingItems.length === 0
            ? <p style={{ fontSize: 12, color: '#C7C6C4', margin: 0 }}>Nothing pending right now</p>
            : pendingItems.map((item, i) => (
              <div key={item.id || i} style={{
                padding: '6px 8px', borderRadius: 8, marginBottom: 4,
                background: 'rgba(0,0,0,0.025)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#5C5B5A', margin: 0, lineHeight: 1.4 }}>
                  {item.text}
                </p>
                {item.date && (
                  <p style={{ fontSize: 10, color: '#C7C6C4', margin: '2px 0 0' }}>
                    {formatDate(item.date)}
                  </p>
                )}
              </div>
            ))
          }
        </AccordionSection>
      </aside>
    </>
  );
}
