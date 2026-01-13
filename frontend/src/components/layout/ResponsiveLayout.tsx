/**
 * Responsive Layout Component
 * Main layout wrapper with header, navigation, and footer
 */

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useResponsive } from '@/hooks';
import { useAuth, useLanguage } from '@/contexts';
import { SettingsMenu } from '@/components/common';
import {
  Home,
  Upload,
  BookOpen,
  Menu,
  X,
  Settings,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
  Library,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showNav?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// =============================================================================
// Navigation Items
// =============================================================================

const getNavItems = (t: (key: string) => string): NavItem[] => [
  { href: '/', label: t('nav.home'), icon: Home },
  { href: '/library', label: t('nav.library'), icon: Library },
  { href: '/upload', label: t('nav.upload'), icon: Upload },
];

// =============================================================================
// Component
// =============================================================================

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  showNav = true,
}) => {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = getNavItems(t);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => router.back();

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Main Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(92, 0, 37, 0.5) 0%, rgba(92, 0, 37, 0.2) 40%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[-15%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-float" style={{ background: 'radial-gradient(circle, rgba(138, 25, 69, 0.4) 0%, rgba(138, 25, 69, 0.15) 40%, transparent 70%)', animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[500px] rounded-full blur-[130px] opacity-25" style={{ background: 'radial-gradient(circle, rgba(92, 0, 37, 0.35) 0%, rgba(61, 0, 24, 0.15) 40%, transparent 70%)' }} />
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 animate-float" style={{ background: 'radial-gradient(circle, rgba(242, 119, 148, 0.3) 0%, transparent 60%)', animationDelay: '4s', transform: 'translate(-50%, -50%)' }} />
        
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30" style={{ 
          background: `
            radial-gradient(at 20% 30%, rgba(92, 0, 37, 0.15) 0%, transparent 50%),
            radial-gradient(at 80% 20%, rgba(138, 25, 69, 0.1) 0%, transparent 40%),
            radial-gradient(at 40% 80%, rgba(61, 0, 24, 0.12) 0%, transparent 45%),
            radial-gradient(at 90% 70%, rgba(242, 119, 148, 0.08) 0%, transparent 40%)
          `
        }} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: `
            linear-gradient(rgba(92, 0, 37, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 0, 37, 0.5) 1px, transparent 1px)
          `, 
          backgroundSize: '80px 80px' 
        }} />
        
        {/* Diagonal Lines */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(92, 0, 37, 0.3) 100px,
            rgba(92, 0, 37, 0.3) 101px
          )`
        }} />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
        
        {/* Floating Particles */}
        <div className="hidden md:block absolute top-[15%] left-[8%] w-2 h-2 rounded-full animate-float opacity-30" style={{ backgroundColor: '#5c0025', animationDelay: '0s', animationDuration: '6s' }} />
        <div className="hidden md:block absolute top-[25%] right-[12%] w-3 h-3 rounded-full animate-float opacity-20" style={{ backgroundColor: '#8a1945', animationDelay: '1s', animationDuration: '8s' }} />
        <div className="hidden md:block absolute bottom-[30%] left-[15%] w-2 h-2 rounded-full animate-float opacity-25" style={{ backgroundColor: '#5c0025', animationDelay: '2s', animationDuration: '7s' }} />
        <div className="hidden md:block absolute top-[60%] right-[20%] w-1.5 h-1.5 rounded-full animate-float opacity-35" style={{ backgroundColor: '#f27794', animationDelay: '0.5s', animationDuration: '5s' }} />
        <div className="hidden lg:block absolute top-[40%] left-[25%] w-2.5 h-2.5 rounded-full animate-float opacity-20" style={{ backgroundColor: '#8a1945', animationDelay: '3s', animationDuration: '9s' }} />
        <div className="hidden lg:block absolute bottom-[20%] right-[30%] w-1.5 h-1.5 rounded-full animate-float opacity-30" style={{ backgroundColor: '#f27794', animationDelay: '1.5s', animationDuration: '6s' }} />
        
        {/* Glowing Lines */}
        <div className="hidden lg:block absolute top-0 left-[30%] w-px h-[40%] opacity-10" style={{ background: 'linear-gradient(to bottom, transparent, #5c0025, transparent)' }} />
        <div className="hidden lg:block absolute bottom-0 right-[25%] w-px h-[35%] opacity-10" style={{ background: 'linear-gradient(to top, transparent, #8a1945, transparent)' }} />
        
        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-20" style={{ background: 'radial-gradient(circle at top right, rgba(92, 0, 37, 0.3), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] opacity-15" style={{ background: 'radial-gradient(circle at bottom left, rgba(138, 25, 69, 0.25), transparent 70%)' }} />
      </div>

      {/* Header - Boxed Style */}
      <div className="sticky top-0 z-50 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
        <header
          className="max-w-7xl mx-auto backdrop-blur-xl rounded-2xl sm:rounded-3xl border glass-premium"
          style={{ borderColor: 'var(--border-color)' }}
        >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Back */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button onClick={handleBack} className="btn-icon hover-scale" aria-label={t('common.back')}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(92, 0, 37, 0.4)' }}>
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                {!isMobile && (
                  <span className="text-lg font-bold" style={{ color: '#f27794' }}>
                    {t('home.title')}
                  </span>
                )}
              </Link>
            </div>

            {/* Center - Title (only show when nav is hidden or on mobile) */}
            {title && (!showNav || isMobile) && (
              <h1
                className="absolute left-1/2 -translate-x-1/2 font-semibold truncate max-w-[200px] sm:max-w-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h1>
            )}

            {/* Desktop Navigation */}
            {showNav && !isMobile && (
              <nav
                className="hidden md:flex items-center gap-1 rounded-xl p-1"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {navItems.map((item) => {
                  const isActive = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover-scale ${
                        isActive ? 'text-white shadow-lg shine' : 'hover:opacity-80'
                      }`}
                      style={isActive ? { backgroundColor: '#5c0025', boxShadow: '0 4px 15px rgba(92, 0, 37, 0.4)' } : { color: 'var(--text-secondary)' }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <SettingsMenu />

              {/* User Menu / Login Button */}
              {authLoading ? (
                <div
                  className="w-9 h-9 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                />
              ) : isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(92, 0, 37, 0.2), rgba(92, 0, 37, 0.1))' }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <User className="w-4 h-4" style={{ color: '#f27794' }} />
                      )}
                    </div>
                    {!isMobile && (
                      <span
                        className="text-sm max-w-[80px] truncate pr-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user.first_name || user.phone.slice(-4)}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute left-0 top-full mt-2 w-56 rounded-xl shadow-2xl py-2 z-50"
                      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.full_name || user.first_name || t('profile.title')}
                        </p>
                        <p className="text-xs mt-0.5 ltr" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>
                          {user.phone}
                        </p>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {t('nav.profile')}
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {t('common.settings')}
                      </Link>

                      <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors"
                  style={{ backgroundColor: '#5c0025' }}
                >
                  <User className="w-4 h-4" />
                  <span>{t('nav.login')}</span>
                </Link>
              )}

              {/* Mobile menu button */}
              {showNav && isMobile && (
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="btn-icon" aria-label="منو">
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showNav && isMenuOpen && isMobile && (
          <div
            className="md:hidden border-t backdrop-blur-xl animate-slide-down rounded-b-2xl sm:rounded-b-3xl"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? 'text-white' : ''
                    }`}
                    style={isActive ? { backgroundColor: '#5c0025' } : { color: 'var(--text-secondary)' }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
        </header>
      </div>

      {/* Main Content */}
      <main className={`relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isMobile ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Footer - Desktop only */}
      {!isMobile && (
        <footer className="relative z-10 border-t py-8 mt-auto" style={{ borderColor: 'var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center hover-scale overflow-hidden">
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {t('footer.copyright')} {t('home.title')}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <Link href="/privacy" className="hover:text-brand-400 transition-colors duration-300">
                  {t('footer.privacy')}
                </Link>
                <Link href="/terms" className="hover:text-brand-400 transition-colors duration-300">
                  {t('footer.terms')}
                </Link>
                <Link href="/about" className="hover:text-brand-400 transition-colors duration-300">
                  {t('footer.about')}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation */}
      {showNav && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-bottom">
          <nav
            className="backdrop-blur-xl rounded-2xl border glass-premium"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-around py-2 px-4">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-300 hover-scale`}
                    style={isActive ? { color: '#5c0025' } : { color: 'var(--text-tertiary)' }}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'shine' : ''}`} style={isActive ? { backgroundColor: 'rgba(92, 0, 37, 0.15)' } : {}}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ResponsiveLayout;
