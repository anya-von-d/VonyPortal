import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as AppUser } from "@/entities/all";
import TopNav from "@/components/TopNav";
import { 
  Home, 
  Plus, 
  CreditCard, 
  User as UserIcon,
  PiggyBank,
  Sparkles,
  LogOut,
  Send
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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const currentUser = await AppUser.me();
      setUser(currentUser);
    } catch (e) {
      console.log("User not authenticated or network error");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchUser();

    // Listen for theme changes from Profile page
    const handleThemeChange = () => {
      fetchUser();
    };
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

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
        {/* Top Nav for big screens */}
        <div className="hidden lg:block sticky top-0 z-50 shadow-lg bg-white/95">
          <TopNav location={location} colors={colors} user={user} isLoading={isLoading} theme={theme} />
        </div>

        {/* Horizontal navigation for small screens */}
        <nav className={`lg:hidden sticky top-0 z-40 bg-gradient-to-r ${colors.sidebarBg} border-b ${colors.sidebarBorder} backdrop-blur-xl shadow-sm`}>
          <div className="flex items-center justify-between px-4 py-3 overflow-x-auto">
            <img
              src={theme === 'afternoon'
                ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689b5da4ed66944b2307218f/0cdfad9ab_newLogoBlackOutline.png"
                : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689b5da4ed66944b2307218f/922791a92_newLogo.png"}
              alt="Vony Logo"
              className="h-8 w-auto mr-4 flex-shrink-0"
            />
            <div className="flex items-center gap-2">
              {navigationItems.map((item) => (
                <Link key={item.title} to={item.url} className={`flex flex-row items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium ${
                  location.pathname === item.url 
                    ? `${colors.activeItem} shadow-sm` 
                    : `${colors.hoverItem} ${colors.navText}`
                }`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content container */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
}
