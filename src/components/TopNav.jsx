import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Plus,
  CreditCard,
  Send,
  PiggyBank,
  Sparkles,
  User,
  MoreHorizontal,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainNavItems = [
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
];

const moreMenuItems = [
  {
    title: "Loan Agreements",
    url: createPageUrl("LoanAgreements"),
    icon: PiggyBank,
  },
  {
    title: "Recent Activity",
    url: createPageUrl("RecentActivity"),
    icon: Sparkles,
  },
  {
    title: "My Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
];

const allNavItems = [...mainNavItems, ...moreMenuItems];

export default function TopNav({ location, colors, user, isLoading, theme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Light mode (morning) uses the standard logo, green mode (afternoon) uses the dark logo
  const logoUrl = theme === 'afternoon'
    ? "https://wvgqxgximcuhqhesoycw.supabase.co/storage/v1/object/public/Image%20Storage/all_lowercase_dark_logo.png"
    : "https://wvgqxgximcuhqhesoycw.supabase.co/storage/v1/object/public/Image%20Storage/all_lowercase_logo.png";

  return (
    <div className={`border-b ${colors.sidebarBorder} bg-gradient-to-r ${colors.sidebarBg} backdrop-blur-xl px-6 py-3`}>
      <div className="flex items-center justify-between">
        {/* Logo on the left - switches based on theme */}
        <img
          src={logoUrl}
          alt="Vony Logo"
          className="h-12 w-auto"
        />

        {/* Mobile Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <button className="p-2">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <nav className="flex flex-col gap-2 mt-8">
              {allNavItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-sm font-medium ${
                    location.pathname === item.url
                      ? `${colors.activeItem}`
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* Centered navigation */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {mainNavItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex flex-row items-center gap-2 text-sm font-medium whitespace-nowrap ${
                location.pathname === item.url
                  ? `${colors.activeItem} shadow-sm`
                  : `${colors.hoverItem} ${colors.navText}`
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.title}</span>
            </Link>
          ))}
          
          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-4 py-2 rounded-lg transition-all duration-200 flex flex-row items-center gap-2 text-sm font-medium whitespace-nowrap ${colors.hoverItem} ${colors.navText}`}>
                <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                <span>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {moreMenuItems.map((item) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link
                    to={item.url}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        {/* Empty space on the right for balance */}
        <div className="w-10 h-10"></div>
      </div>
    </div>
  );
}