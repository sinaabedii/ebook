/**
 * Settings Menu Components
 * Theme and language toggle components
 */

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Check, X } from 'lucide-react';
import { useTheme, useLanguage } from '@/contexts';

// =============================================================================
// Types
// =============================================================================

interface SettingsMenuProps {
  className?: string;
}

interface ToggleButtonProps {
  className?: string;
}

// =============================================================================
// Settings Menu Component
// =============================================================================

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage, t, isRTL } = useLanguage();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          isOpen ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'btn-icon'
        }`}
        aria-label={t('common.settings')}
        title={t('common.settings')}
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-64 rounded-xl overflow-hidden shadow-xl ${
            isRTL ? 'left-0' : 'right-0'
          }`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('common.settings')}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Options */}
          <div className="p-2">
            {/* Theme Toggle */}
            <div className="mb-2">
              <p
                className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('common.theme')}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => !isDark || toggleTheme()}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                    !isDark ? 'bg-primary-500/20 text-primary-500 font-medium' : ''
                  }`}
                  style={isDark ? { color: 'var(--text-secondary)' } : {}}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">{t('common.lightMode')}</span>
                  {!isDark && <Check className="w-4 h-4 mr-auto" />}
                </button>
                <button
                  onClick={() => isDark || toggleTheme()}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                    isDark ? 'bg-primary-500/20 text-primary-500 font-medium' : ''
                  }`}
                  style={!isDark ? { color: 'var(--text-secondary)' } : {}}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">{t('common.darkMode')}</span>
                  {isDark && <Check className="w-4 h-4 mr-auto" />}
                </button>
              </div>
            </div>

            {/* Language Toggle */}
            <div>
              <p
                className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('common.language')}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => language !== 'fa' && toggleLanguage()}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                    language === 'fa' ? 'bg-primary-500/20 text-primary-500 font-medium' : ''
                  }`}
                  style={language !== 'fa' ? { color: 'var(--text-secondary)' } : {}}
                >
                  <span className="text-sm">🇮🇷</span>
                  <span className="text-sm">{t('common.persian')}</span>
                  {language === 'fa' && <Check className="w-4 h-4 mr-auto" />}
                </button>
                <button
                  onClick={() => language !== 'en' && toggleLanguage()}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                    language === 'en' ? 'bg-primary-500/20 text-primary-500 font-medium' : ''
                  }`}
                  style={language !== 'en' ? { color: 'var(--text-secondary)' } : {}}
                >
                  <span className="text-sm">🇺🇸</span>
                  <span className="text-sm">{t('common.english')}</span>
                  {language === 'en' && <Check className="w-4 h-4 mr-auto" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Theme Toggle Button
// =============================================================================

export const ThemeToggle: React.FC<ToggleButtonProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl transition-all duration-200 bg-surface-800/50 text-surface-400 hover:bg-surface-700 hover:text-white ${className}`}
      aria-label={isDark ? t('common.lightMode') : t('common.darkMode')}
      title={isDark ? t('common.lightMode') : t('common.darkMode')}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

// =============================================================================
// Language Toggle Button
// =============================================================================

export const LanguageToggle: React.FC<ToggleButtonProps> = ({ className = '' }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`p-2.5 rounded-xl transition-all duration-200 bg-surface-800/50 text-surface-400 hover:bg-surface-700 hover:text-white ${className}`}
      aria-label={t('common.language')}
      title={language === 'fa' ? 'English' : 'فارسی'}
    >
      <span className="text-sm font-medium">{language === 'fa' ? 'EN' : 'فا'}</span>
    </button>
  );
};

export default SettingsMenu;
