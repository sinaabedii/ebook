import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  BookOpen, User, LogOut, Settings, ChevronDown, 
  Menu, X, Upload, Library, Home 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t, isRTL } = useLanguage();
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

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/library', label: t('nav.library'), icon: Library },
    { href: '/upload', label: t('nav.upload'), icon: Upload },
  ];

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5c0025' }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              {t('home.title')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={isActive 
                    ? { backgroundColor: 'rgba(92, 0, 37, 0.15)', color: '#f27794' }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(92, 0, 37, 0.15)' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" style={{ color: '#5c0025' }} />
                    )}
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user.full_name || user.first_name || user.phone}
                    </p>
                    {user.organization_name && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.organization_name}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-tertiary)' }} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg py-1 z-50" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.full_name || user.first_name || t('profile.user')}
                      </p>
                      <p className="text-xs mt-0.5 ltr" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>
                        {user.phone}
                      </p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.settings')}
                    </Link>
                    
                    <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 w-full transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#5c0025' }}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.login')} / {t('nav.register')}</span>
                <span className="sm:hidden">{t('nav.login')}</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--text-primary)' }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
                  style={isActive 
                    ? { backgroundColor: 'rgba(92, 0, 37, 0.15)', color: '#f27794' }
                    : { color: 'var(--text-secondary)' }
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
