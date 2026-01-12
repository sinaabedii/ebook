import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ResponsiveLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, handleApiError } from '@/api/djangoApi';
import { 
  User, Mail, Phone, Building2, Shield, Calendar,
  Edit2, Save, X, Loader2, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    national_id: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        national_id: user.national_id || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      setSuccess('اطلاعات با موفقیت بروزرسانی شد');
      setIsEditing(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        national_id: user.national_id || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'مدیر سیستم',
      org_admin: 'مدیر سازمان',
      manager: 'مدیر',
      member: 'کاربر عادی',
    };
    return roles[role] || role;
  };

  if (authLoading) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5c0025' }} />
        </div>
      </ResponsiveLayout>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>پروفایل | ArianDoc</title>
      </Head>

      <ResponsiveLayout title="پروفایل" showBackButton>
        <div className="max-w-2xl mx-auto">
          {/* Header Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(92, 0, 37, 0.2), rgba(92, 0, 37, 0.1))', borderColor: 'rgba(92, 0, 37, 0.3)' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <User className="w-10 h-10" style={{ color: '#f27794' }} />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white mb-1">
                  {user.full_name || user.first_name || 'کاربر'}
                </h1>
                <p className="text-surface-400 ltr text-sm" dir="ltr">{user.phone}</p>
                {user.organization_name && (
                  <span className="badge-primary mt-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {user.organization_name}
                  </span>
                )}
              </div>
              <div className="badge-success">
                <Sparkles className="w-3.5 h-3.5" />
                فعال
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl flex items-center gap-3 text-accent-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Profile Form */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">اطلاعات شخصی</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-ghost text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  ویرایش
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {/* Name Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-2">نام</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="input"
                        placeholder="نام خود را وارد کنید"
                      />
                    ) : (
                      <p className="text-white py-3">{user.first_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-2">نام خانوادگی</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="input"
                        placeholder="نام خانوادگی خود را وارد کنید"
                      />
                    ) : (
                      <p className="text-white py-3">{user.last_name || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-surface-400 mb-2">ایمیل</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input text-left"
                      dir="ltr"
                      placeholder="email@example.com"
                    />
                  ) : (
                    <p className="text-white py-3 ltr" dir="ltr">{user.email || '-'}</p>
                  )}
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-sm text-surface-400 mb-2">کد ملی</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      maxLength={10}
                      className="input text-left"
                      dir="ltr"
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                    />
                  ) : (
                    <p className="text-white py-3 ltr" dir="ltr">{user.national_id || '-'}</p>
                  )}
                </div>

                {/* Read-only fields */}
                <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-surface-800">
                  <div className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-xl">
                    <div className="p-2 rounded-lg bg-surface-700">
                      <Phone className="w-4 h-4 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-500">شماره موبایل</p>
                      <p className="text-white text-sm ltr" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-xl">
                    <div className="p-2 rounded-lg bg-surface-700">
                      <Shield className="w-4 h-4 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-500">نقش</p>
                      <p className="text-white text-sm">{getRoleName(user.role)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-xl">
                    <div className="p-2 rounded-lg bg-surface-700">
                      <Calendar className="w-4 h-4 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-500">تاریخ عضویت</p>
                      <p className="text-white text-sm">
                        {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال ذخیره...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          ذخیره تغییرات
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      <X className="w-4 h-4" />
                      انصراف
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </ResponsiveLayout>
    </>
  );
}
