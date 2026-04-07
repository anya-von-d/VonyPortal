import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loan, Payment, Friendship } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";

const PAGE_TITLES = {
  Dashboard: null, // handled separately as greeting
  CreateOffer: 'Create Loan',
  RecordPayment: 'Record Payment',
  Upcoming: 'Upcoming',
  YourLoans: 'My Loans',
  Borrowing: 'My Loans',
  Lending: 'My Loans',
  Friends: 'Friends',
  RecentActivity: 'Activity',
  LoanAgreements: 'Documents',
  ComingSoon: 'Shop & Learn',
  Profile: 'Profile',
  Requests: 'Notifications',
};

export default function DashboardSidebar({ activePage = "Dashboard", user, tabs, activeTab, onTabChange }) {
  const { logout } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || '';
  const [notifCount, setNotifCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const settingsRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => { if (user?.id) fetchData(); }, [user?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    try {
      const [payments, loans, friendships] = await Promise.all([
        Payment.list().catch(() => []),
        Loan.list().catch(() => []),
        Friendship.list().catch(() => []),
      ]);
      const userLoans   = loans.filter(l => l.lender_id === user.id || l.borrower_id === user.id);
      const userLoanIds = userLoans.map(l => l.id);
      const paymentsToConfirm = payments.filter(p =>
        p.status === 'pending_confirmation' && userLoanIds.includes(p.loan_id) && p.recorded_by !== user.id
      );
      const offersReceived = loans.filter(l => l.borrower_id === user.id && l.status === 'pending');
      const friendRequests = friendships.filter(f => f.friend_id === user.id && f.status === 'pending');
      setNotifCount(paymentsToConfirm.length + offersReceived.length + friendRequests.length);
    } catch (e) { console.error("Sidebar data error:", e); }
  };

  const active = (...pages) => pages.includes(activePage);

  const navStyle = (...pages) => ({
    display: 'flex', alignItems: 'center',
    padding: '5px 11px', borderRadius: 8, textDecoration: 'none',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap', transition: 'all 0.15s',
    color: active(...pages) ? '#1A1918' : 'rgba(255,255,255,0.88)',
    fontWeight: active(...pages) ? 600 : 400,
    background: active(...pages) ? 'rgba(255,255,255,0.88)' : 'transparent',
    boxShadow: active(...pages) ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
  });

  const dropdownItemStyle = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    color: '#1A1918', textAlign: 'left', textDecoration: 'none',
    borderRadius: 8, transition: 'background 0.12s',
  };

  const comingSoonBadge = {
    fontSize: 9, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.1)',
    borderRadius: 4, padding: '2px 5px', letterSpacing: '0.04em', textTransform: 'uppercase',
    marginLeft: 'auto', flexShrink: 0,
  };

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good night';

  const pageTitle = activePage === 'Dashboard'
    ? (firstName ? `${timeGreeting}, ${firstName}` : timeGreeting)
    : (PAGE_TITLES[activePage] || activePage);

  const isMoreActive = active('RecentActivity', 'LoanAgreements');

  return (
    <>
      {createPortal(
        <>
          {/* FLOATING TOP BAR */}
          <div style={{ position: 'fixed', top: 18, left: 8, right: 8, zIndex: 100, pointerEvents: 'none' }}>
            <div style={{ height: 52, pointerEvents: 'auto' }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', padding: '0 18px',
                fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', overflow: 'visible',
              }}>
                {/* Logo */}
                <Link to="/" style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 400, fontStyle: 'italic', fontSize: '1.25rem',
                  letterSpacing: '-0.02em', color: 'white', textDecoration: 'none', flexShrink: 0,
                }}>Vony</Link>

                {/* Nav links — centered */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                  <Link to="/" style={navStyle('Dashboard')}>Home</Link>
                  <Link to={createPageUrl("CreateOffer")} style={navStyle('CreateOffer')}>Create</Link>
                  <Link to={createPageUrl("RecordPayment")} style={navStyle('RecordPayment')}>Record</Link>
                  <Link to={createPageUrl("Upcoming")} style={navStyle('Upcoming')}>Upcoming</Link>
                  <Link to={createPageUrl("YourLoans")} style={navStyle('YourLoans', 'Borrowing', 'Lending')}>My Loans</Link>
                  <Link to={createPageUrl("Friends")} style={navStyle('Friends')}>Friends</Link>

                  {/* More dropdown (Activity + Docs) */}
                  <div ref={moreRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => { setMoreOpen(o => !o); setSettingsOpen(false); }}
                      style={{
                        ...navStyle('RecentActivity', 'LoanAgreements'),
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      More
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {moreOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                        background: 'white', borderRadius: 12, padding: 6, minWidth: 160,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)', zIndex: 200,
                      }}>
                        <Link to={createPageUrl("RecentActivity")} onClick={() => setMoreOpen(false)} style={{ ...dropdownItemStyle, color: active('RecentActivity') ? '#03ACEA' : '#1A1918' }}>
                          Activity
                        </Link>
                        <Link to={createPageUrl("LoanAgreements")} onClick={() => setMoreOpen(false)} style={{ ...dropdownItemStyle, color: active('LoanAgreements') ? '#03ACEA' : '#1A1918' }}>
                          Documents
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings gear */}
                <div ref={settingsRef} style={{ position: 'relative', marginRight: 10 }}>
                  <button
                    onClick={() => { setSettingsOpen(o => !o); setMoreOpen(false); }}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: settingsOpen ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </button>
                  {settingsOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'white', borderRadius: 12, padding: 6, minWidth: 200,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.06)', zIndex: 200,
                    }}>
                      <button style={{ ...dropdownItemStyle, color: '#9B9A98', cursor: 'default' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        Learn
                        <span style={comingSoonBadge}>Soon</span>
                      </button>
                      <button style={{ ...dropdownItemStyle, color: '#9B9A98', cursor: 'default' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Loan Help
                        <span style={comingSoonBadge}>Soon</span>
                      </button>
                      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 6px' }} />
                      <button style={{ ...dropdownItemStyle, color: '#787776', cursor: 'default' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Help & Support
                      </button>
                      <button onClick={() => { setSettingsOpen(false); logout(); }} style={{ ...dropdownItemStyle, color: '#E8726E' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>

                {/* Bell */}
                <Link to={createPageUrl("Requests")} style={{ textDecoration: 'none', display: 'inline-flex', position: 'relative', marginRight: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#C4EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#03ACEA">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  </div>
                  {notifCount > 0 && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#E8726E', color: 'white', fontSize: 8, fontWeight: 700, minWidth: 14, height: 14, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                      {notifCount > 99 ? '99+' : notifCount}
                    </div>
                  )}
                </Link>

                {/* Profile */}
                <Link to={createPageUrl("Profile")} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  {user?.profile_picture_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #03ACEA 0%, #7C3AED 100%)', borderRadius: 10, padding: '5px 12px 5px 5px', boxShadow: '0 2px 8px rgba(3,172,234,0.25)', outline: active('Profile') ? '2px solid rgba(3,172,234,0.5)' : 'none', outlineOffset: 2 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>{firstName || 'Profile'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #03ACEA 0%, #7C3AED 100%)', borderRadius: 10, padding: '5px 12px 5px 8px', boxShadow: '0 2px 8px rgba(3,172,234,0.25)', outline: active('Profile') ? '2px solid rgba(3,172,234,0.5)' : 'none', outlineOffset: 2 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>{firstName || 'Profile'}</span>
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* PAGE TITLE ROW — all pages */}
          <div style={{ position: 'fixed', top: 76, left: 8, right: 8, zIndex: 99, pointerEvents: 'none' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', paddingLeft: 40, paddingRight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, pointerEvents: 'auto' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 600, color: '#1A1918', margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {activePage === 'Dashboard' ? (
                  firstName ? (
                    <><span style={{ fontStyle: 'normal' }}>{timeGreeting}, </span><span style={{ fontStyle: 'italic' }}>{firstName}</span></>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>{timeGreeting}</span>
                  )
                ) : (
                  <span style={{ fontStyle: 'italic' }}>{PAGE_TITLES[activePage] || activePage}</span>
                )}
              </h1>
              {/* Tabs for pages that have them */}
              {tabs && tabs.length > 0 && onTabChange && (
                <div style={{ display: 'inline-flex', gap: 2, background: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 3 }}>
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => onTabChange(tab.key)} style={{
                      padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      fontWeight: activeTab === tab.key ? 600 : 500,
                      color: activeTab === tab.key ? '#1A1918' : '#787776',
                      background: activeTab === tab.key ? 'white' : 'transparent',
                      boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}>{tab.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
