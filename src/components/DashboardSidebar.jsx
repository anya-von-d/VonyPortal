import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loan, Payment, Friendship } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardSidebar({ activePage = "Dashboard", user }) {
  const { logout } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || '';
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => { if (user?.id) fetchData(); }, [user?.id]);

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

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good night';

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
                fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
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
                  <Link to={createPageUrl("RecentActivity")} style={navStyle('RecentActivity')}>Activity</Link>
                  <Link to={createPageUrl("LoanAgreements")} style={navStyle('LoanAgreements')}>Docs</Link>
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

          {/* PAGE TITLE ROW — Home only */}
          {activePage === 'Dashboard' && (
            <div style={{ position: 'fixed', top: 76, left: 8, right: 8, zIndex: 99, pointerEvents: 'none' }}>
              <div style={{ maxWidth: 1080, margin: '0 auto', paddingLeft: 40, paddingRight: 40, display: 'flex', alignItems: 'center', height: 48, pointerEvents: 'auto' }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 600, color: '#1A1918', margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>
                  {firstName ? (
                    <><span style={{ fontStyle: 'normal' }}>{timeGreeting}, </span><span style={{ fontStyle: 'italic' }}>{firstName}</span></>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>{timeGreeting}</span>
                  )}
                </h1>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
