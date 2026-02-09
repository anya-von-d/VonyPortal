import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as AppUser } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";
import TopNav from "@/components/TopNav";
import {
  Home,
  Plus,
  CreditCard,
  User as UserIcon,
  PiggyBank,
  Sparkles,
  LogOut,
  Send,
  Menu,
  X
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "Create Offer",
    url: createPageUrl("CreateLoan"),
    icon: Plus,
  },
  {
    title: "My Loans",
    url: createPageUrl("MyLoans"),
    icon: CreditCard,
  },
  {
    title: "My Loan Offers",
    url: createPageUrl("MyLoanOffers"),
    icon: Send,
  },
  {
    title: "My Loan Agreements",
    url: createPageUrl("LoanAgreements"),
    icon: PiggyBank,
  },
  {
    title: "Recent Activity",
    url: createPageUrl("RecentActivity"),
    icon: Sparkles,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: UserIcon,
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { userProfile, isLoadingAuth, refreshProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Listen for theme changes from Profile page
    const handleThemeChange = () => {
      refreshProfile();
    };
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const user = userProfile;
  const isLoading = isLoadingAuth;

  // Use user preference or default to morning
  const theme = user?.theme_preference || 'morning';

  const themeColors = {
    morning: {
      sidebarBg: 'from-[#FCFBFA] to-[#FCFBFA]',
      sidebarBorder: 'border-[#E5E1DC]/60',
      activeItem: 'bg-[#35B276]/10 text-[#347571]',
      hoverItem: 'hover:bg-[#F3F0EC] hover:text-[#347571]',
      activeIcon: 'text-[#347571]',
      accentIcon: 'text-[#35B276]',
      navText: 'text-slate-600',
      cssVars: {
        '--theme-primary': '53 178 118',
        '--theme-primary-light': '243 240 236',
        '--theme-primary-dark': '52 117 113',
        '--theme-bg-from': '248 246 243',
        '--theme-bg-to': '243 240 236',
        '--theme-card-bg': '255 254 252',
        '--theme-border': '53 178 118 / 0.2'
      }
    },
    afternoon: {
      sidebarBg: 'from-[#35B276] to-[#2d9561]',
      sidebarBorder: 'border-[#35B276]/60',
      activeItem: 'bg-[#F3F0EC]/20 text-[#F3F0EC]',
      hoverItem: 'hover:bg-[#F3F0EC]/10 hover:text-[#F3F0EC]',
      activeIcon: 'text-[#F3F0EC]',
      accentIcon: 'text-[#F3F0EC]',
      navText: 'text-[#F3F0EC]',
      cssVars: {
        '--theme-primary': '53 178 118',
        '--theme-primary-light': '209 250 229',
        '--theme-primary-dark': '52 117 113',
        '--theme-bg-from': '209 250 229',
        '--theme-bg-to': '167 243 208',
        '--theme-card-bg': '240 253 244',
        '--theme-border': '53 178 118 / 0.3'
      }
    }
  };

  const colors = themeColors[theme] || themeColors['morning'];

      // Apply CSS variables to root and load Inter font
      React.useEffect(() => {
        Object.entries(colors.cssVars).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });

        // Load Inter font
        if (!document.getElementById('inter-font-link')) {
          const link = document.createElement('link');
          link.id = 'inter-font-link';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
          document.head.appendChild(link);
        }

        // Apply Inter font and theme-specific heading colors
        const existingStyle = document.getElementById('inter-font-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        const style = document.createElement('style');
        style.id = 'inter-font-style';

        // Check if current page is Home or Profile
        const isHomeOrProfile = location.pathname === createPageUrl("Home") || location.pathname === createPageUrl("Profile");

        style.textContent = `
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Inter', sans-serif !important;
          }
          ${!isHomeOrProfile ? `
            .text-center p, .text-lg.text-slate-600, p.text-slate-600 {
              color: #35B276 !important;
            }
          ` : ''}
        `;
        document.head.appendChild(style);
        }, [theme, location.pathname]);

  return (
      <div className="min-h-screen flex flex-col w-full" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        {/* Top Nav for big screens - only show when logged in */}
        {user && (
          <div className="hidden lg:block sticky top-0 z-50 shadow-lg bg-white/95">
            <TopNav location={location} colors={colors} user={user} isLoading={isLoading} theme={theme} />
          </div>
        )}

        {/* Mobile navigation header - only show when logged in */}
        {user && (
        <nav className={`lg:hidden sticky top-0 z-50 bg-gradient-to-r ${colors.sidebarBg} border-b ${colors.sidebarBorder} backdrop-blur-xl shadow-sm`}>
          <div className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
            {/* Logo on the left */}
            <Link to={createPageUrl("Home")} className="flex-shrink-0">
              <img
                src={theme === 'afternoon'
                  ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689b5da4ed66944b2307218f/0cdfad9ab_newLogoBlackOutline.png"
                  : "https://wvgqxgximcuhqhesoycw.supabase.co/storage/v1/object/public/Image%20Storage/LowercaseLogo.png"}
                alt="Vony Logo"
                className="h-12 w-auto"
              />
            </Link>

            {/* Hamburger menu button on the right */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen(prev => !prev);
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${colors.hoverItem} ${colors.navText} cursor-pointer`}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>
        )}

        {/* Mobile menu dropdown - separate from nav for proper positioning */}
        {user && mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu */}
            <div className={`lg:hidden fixed top-[72px] left-0 right-0 z-50 bg-gradient-to-b ${colors.sidebarBg} border-b ${colors.sidebarBorder} shadow-lg`}>
              <div className="px-4 py-3 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      location.pathname === item.url
                        ? `${colors.activeItem} shadow-sm`
                        : `${colors.hoverItem} ${colors.navText}`
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main content container */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
}
