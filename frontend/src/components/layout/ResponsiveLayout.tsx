import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useResponsive } from '@/hooks';
import { 
  Home, 
  Upload, 
  BookOpen, 
  Menu, 
  X, 
  Settings,
  ChevronLeft 
} from 'lucide-react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showNav?: boolean;
}

const navItems = [
  { href: '/', label: 'خانه', icon: Home },
  { href: '/upload', label: 'آپلود', icon: Upload },
  { href: '/library', label: 'کتابخانه', icon: BookOpen },
];

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  showNav = true,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className={`
          flex items-center justify-between
          ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}
          max-w-7xl mx-auto w-full
        `}>
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="control-btn"
                aria-label="بازگشت"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              {!isMobile && (
                <span className="text-xl font-bold text-white">FlipBook</span>
              )}
            </Link>
          </div>

          {/* Center - Title */}
          {title && (
            <h1 className={`
              font-semibold text-white truncate
              ${isMobile ? 'text-lg max-w-[150px]' : 'text-xl'}
            `}>
              {title}
            </h1>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            {showNav && isDesktop && (
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-primary-500/20 text-primary-400' 
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Settings button */}
            <button className="control-btn" aria-label="تنظیمات">
              <Settings className="w-5 h-5" />
            </button>

            {/* Mobile menu button */}
            {showNav && (isMobile || isTablet) && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="control-btn"
                aria-label="منو"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showNav && isMenuOpen && (isMobile || isTablet) && (
          <nav className="px-4 pb-4 animate-slide-down">
            <div className="glass rounded-lg p-2">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-primary-500/20 text-primary-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className={`
        flex-1 w-full max-w-7xl mx-auto
        ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}
      `}>
        {children}
      </main>

      {/* Footer - Only on desktop */}
      {isDesktop && (
        <footer className="border-t border-white/10 py-6">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
            <span>© 2024 Interactive E-Book Platform</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">
                حریم خصوصی
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                شرایط استفاده
              </Link>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation */}
      {showNav && isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 px-4 py-2 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'text-primary-400' 
                      : 'text-slate-500'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
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
