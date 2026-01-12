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
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Back */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button onClick={handleBack} className="btn-icon" aria-label={t('common.back')}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                {!isMobile && (
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t('home.title')}
                  </span>
                )}
              </Link>
            </div>

            {/* Center - Title */}
            {title && (
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : ''
                      }`}
                      style={!isActive ? { color: 'var(--text-secondary)' } : {}}
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary-400" />
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
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
            className="md:hidden border-t backdrop-blur-xl animate-slide-down"
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
                      isActive ? 'bg-primary-500 text-white' : ''
                    }`}
                    style={!isActive ? { color: 'var(--text-secondary)' } : {}}
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

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isMobile ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Footer - Desktop only */}
      {!isMobile && (
        <footer className="border-t py-8 mt-auto" style={{ borderColor: 'var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  © ۱۴۰۳ {t('home.title')}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <Link href="/privacy" className="hover:opacity-70 transition-opacity">
                  حریم خصوصی
                </Link>
                <Link href="/terms" className="hover:opacity-70 transition-opacity">
                  قوانین استفاده
                </Link>
                <Link href="/about" className="hover:opacity-70 transition-opacity">
                  درباره ما
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation */}
      {showNav && isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-bottom"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-around py-2 px-4">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                    isActive ? 'text-primary-400' : ''
                  }`}
                  style={!isActive ? { color: 'var(--text-tertiary)' } : {}}
                >
                  <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary-500/20' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default ResponsiveLayout;
