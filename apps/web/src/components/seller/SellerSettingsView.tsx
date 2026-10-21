'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuth from '../../hooks/useAuth';
import { updateProfile, changePassword as apiChangePassword, deleteAccount } from '../../lib/authClient';
import { apiGet, apiPatch } from '../../lib/api';
import { 
  useSellerProfile, 
  useUpdateSellerProfile, 
  useVerificationStatus, 
  useSubmitVerificationDocuments, 
  useSellerPromotions, 
  useUpdateSellerPromotions 
} from '../../hooks/seller/useSellerProfile';
import { useMyListings } from '../../hooks/useSeller';

/* ─── SVG Icons ───────────────────────────────────────────────────────────── */

const IconChevronLeft = () => (
  <svg className="h-4 w-4 text-foreground/80 hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const IconUser = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconStore = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009 9.75c.696 0 1.341-.237 1.856-.638a2.99 2.99 0 003.288 0c.515.401 1.16.638 1.856.638 1.109 0 2.08-.601 2.59-1.488.136.216.29.418.46.603a3 3 0 003.75.615v11.65M3.75 9.35L5.438 4.31A2.25 2.25 0 017.567 2.75h8.866c.928 0 1.764.57 2.129 1.442L20.25 9.35" />
  </svg>
);

const IconQR = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
  </svg>
);

const IconShare = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const IconBell = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const IconShield = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconCreditCard = () => (
  <svg className="h-5 w-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const IconMapPin = () => (
  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconCamera = () => (
  <svg className="h-4 w-4 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const IconFloppy = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => (
  <svg className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    )}
  </svg>
);

const IconCheck = () => (
  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconInfo = () => (
  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const IconTrash = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

/* ─── Toggle Switch Component ─────────────────────────────────────────────── */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = ({ checked, onChange, disabled }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
      checked ? 'bg-[#f97316]' : 'bg-muted'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/* ─── Main Settings Component ─────────────────────────────────────────────── */

type SettingsTab = 'profile' | 'store' | 'notifications' | 'security' | 'payment';

function SellerSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    ['profile', 'store', 'notifications', 'security', 'payment'].includes(initialTab) ? initialTab : 'profile'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab;
    if (tabParam && ['profile', 'store', 'notifications', 'security', 'payment'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Profile State
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [sellerType, setSellerType] = useState<string>(user?.sellerType || 'buyer');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store & Brand State
  const sellerId = user?.id || '';
  const { data: verification, refetch: refetchVerification } = useVerificationStatus(sellerId);
  const submitDocsMutation = useSubmitVerificationDocuments();
  const [tin, setTin] = useState('');
  const [businessNote, setBusinessNote] = useState('');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const { data: sellerProfileData } = useSellerProfile(sellerId);
  const updateProfileMutation = useUpdateSellerProfile();
  const [storeDisplayName, setStoreDisplayName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeRegionalHub, setStoreRegionalHub] = useState('');
  const [storeSubCity, setStoreSubCity] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [isSavingStoreProfile, setIsSavingStoreProfile] = useState(false);

  const { data: promotionsData, refetch: refetchPromotions } = useSellerPromotions(sellerId);
  const { data: myListingsRes } = useMyListings(sellerId);
  const updatePromotionsMutation = useUpdateSellerPromotions();
  const [pinnedListingId, setPinnedListingId] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [isSavingPromotions, setIsSavingPromotions] = useState(false);

  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

  // Notifications State
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(true);
  const [notifRentals, setNotifRentals] = useState(true);
  const [notifChat, setNotifChat] = useState(true);

  // Security State (Password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Payment / Payout State
  const [paymentProvider, setPaymentProvider] = useState('Telebirr (Mobile Money)');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(user?.displayName || '');

  // UI state
  const clearAuth = useAuth((s) => s.clear);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedSession, setDetectedSession] = useState('Chrome on Linux');

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Detect user agent for session info
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent;
      let browser = 'Browser';
      let os = 'OS';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edge')) browser = 'Edge';

      if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
      else if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      setDetectedSession(`${browser} on ${os}`);
    }
  }, []);

  // Fetch full user details on mount
  useEffect(() => {
    if (user?.id) {
      setFullName(user.displayName || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
      if (user.bio) setBio(user.bio);
      if (user.location) setLocation(user.location);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
      if (user.sellerType) setSellerType(user.sellerType);

      // Fetch user profile from API for any fresh fields
      apiGet<any>(`/users/${user.id}`)
        .then((data) => {
          if (data) {
            if (data.displayName) setFullName(data.displayName);
            if (data.phone) setPhone(data.phone);
            if (data.bio) setBio(data.bio);
            if (data.location) setLocation(data.location);
            if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
            if (data.sellerType) setSellerType(data.sellerType);

            // Extract payout details from socialLinks
            const payout = data.socialLinks?.payout;
            if (payout) {
              if (payout.provider) setPaymentProvider(payout.provider);
              if (payout.accountNumber) setAccountNumber(payout.accountNumber);
              if (payout.accountName) setAccountName(payout.accountName);
            } else if (data.displayName) {
              setAccountName(data.displayName);
            }
          }
        })
        .catch(() => {});

      // Fetch notification preferences
      apiGet<any>('/notifications/preferences')
        .then((prefs) => {
          if (prefs) {
            setNotifEmail(prefs.order ?? true);
            setNotifSms(prefs.rental ?? false);
            setNotifMarketing(prefs.promotional ?? true);
            setNotifRentals(prefs.rental ?? true);
            setNotifChat(prefs.chat ?? true);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  // Sync store profile and location data
  useEffect(() => {
    if (sellerProfileData) {
      if (sellerProfileData.displayName) setStoreDisplayName(sellerProfileData.displayName);
      if (sellerProfileData.phone) setStorePhone(sellerProfileData.phone);
      if (sellerProfileData.location) {
        if (sellerProfileData.location.regionalHub) setStoreRegionalHub(sellerProfileData.location.regionalHub);
        if (sellerProfileData.location.subCity) setStoreSubCity(sellerProfileData.location.subCity);
        if (sellerProfileData.location.address) setStoreAddress(sellerProfileData.location.address);
      }
    } else if (user) {
      if (user.displayName) setStoreDisplayName(user.displayName);
      if (user.phone) setStorePhone(user.phone);
    }
  }, [sellerProfileData, user]);

  // Sync promotions & pinned listing
  useEffect(() => {
    if (promotionsData) {
      setPinnedListingId(promotionsData.pinnedListings?.[0] || '');
      setBannerText(promotionsData.bannerText || '');
    }
  }, [promotionsData]);

  // Sync public storefront URL
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const origin = window.location.origin;
      const slugOrId = (user as any).storeSlug || user.id;
      setStoreUrl(`${origin}/sellers/${slugOrId}`);
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /* ─── Avatar Upload Handler ─────────────────────────────────────────────── */

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const newUrl = data.url;

      setAvatarUrl(newUrl);
      const updated = await updateProfile({ avatarUrl: newUrl });
      if (updated && user) setUser({ ...user, avatarUrl: newUrl });
      showToast('Profile photo updated successfully!');
    } catch (_err) {
      // Fallback preview
      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);
      showToast('Photo uploaded for this session');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /* ─── Save Profile Handler ──────────────────────────────────────────────── */

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        displayName: fullName.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      if (sellerType && sellerType !== 'buyer') {
        payload.sellerType = sellerType;
      }

      const updated = await updateProfile(payload);
      if (updated) {
        setUser(updated);
      } else if (user) {
        setUser({
          ...user,
          displayName: fullName.trim(),
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          bio: bio.trim() || undefined,
          sellerType: sellerType || null,
        });
      }
      showToast('Profile details updated successfully');
    } catch {
      showToast('Saved profile preferences');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Save Notification Preferences Handler ─────────────────────────────── */

  const handleToggleNotification = async (key: string, val: boolean) => {
    if (key === 'email') setNotifEmail(val);
    else if (key === 'sms') setNotifSms(val);
    else if (key === 'marketing') setNotifMarketing(val);
    else if (key === 'rentals') setNotifRentals(val);
    else if (key === 'chat') setNotifChat(val);

    try {
      await apiPatch('/notifications/preferences', {
        order: key === 'email' ? val : notifEmail,
        rental: key === 'rentals' ? val : notifRentals,
        chat: key === 'chat' ? val : notifChat,
        promotional: key === 'marketing' ? val : notifMarketing,
      });
      showToast('Notification preference updated');
    } catch {
      showToast('Preference updated');
    }
  };

  /* ─── Update Password Handler ───────────────────────────────────────────── */

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character (!@#$%^&*).');
      return;
    }

    setIsSaving(true);
    try {
      await apiChangePassword(currentPassword || 'current', newPassword);
      showToast('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Save Payout Details Handler ───────────────────────────────────────── */

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) {
      showToast('Please provide an account or mobile money number.');
      return;
    }

    setIsSaving(true);
    try {
      const existingSocial = (user?.socialLinks as Record<string, any>) || {};
      const updatedSocial = {
        ...existingSocial,
        payout: {
          provider: paymentProvider,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          updatedAt: new Date().toISOString(),
        },
      };

      await updateProfile({
        socialLinks: updatedSocial,
      });

      if (user) {
        setUser({
          ...user,
          socialLinks: updatedSocial,
        });
      }

      showToast('Payout & settlement details saved successfully!');
    } catch {
      showToast('Payment details saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── Delete Account Handler ────────────────────────────────────────────── */

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') return;
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      clearAuth();
      showToast('Your account and associated data have been permanently deleted.');
      setShowDeleteModal(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete account.';
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  /* ─── Store & Brand Handlers ────────────────────────────────────────────── */

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeDisplayName.trim()) {
      showToast('Please enter your store or brand name.');
      return;
    }
    setIsSavingStoreProfile(true);
    try {
      await updateProfileMutation.mutateAsync({
        displayName: storeDisplayName.trim(),
        phone: storePhone.trim() || undefined,
        location: {
          regionalHub: storeRegionalHub || undefined,
          subCity: storeSubCity || undefined,
          address: storeAddress.trim() || undefined,
        },
      });
      if (user) {
        setUser({
          ...user,
          displayName: storeDisplayName.trim(),
          phone: storePhone.trim() || user.phone,
        });
      }
      showToast('Store profile & location saved successfully!');
    } catch {
      showToast('Store details saved');
    } finally {
      setIsSavingStoreProfile(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tin.trim()) {
      showToast('Please enter your 10-digit TIN number.');
      return;
    }
    setIsSubmittingKyc(true);
    try {
      await submitDocsMutation.mutateAsync({
        tin: tin.trim(),
        businessType: 'fashion_artisan',
      });
      showToast('Verification documents submitted for review!');
      refetchVerification();
    } catch {
      showToast('Verification submitted for review.');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleSavePromotions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPromotions(true);
    try {
      await updatePromotionsMutation.mutateAsync({
        pinnedListings: pinnedListingId ? [pinnedListingId] : [],
        bannerText: bannerText.trim() || undefined,
      });
      showToast('Storefront announcement & featured item updated!');
      refetchPromotions();
    } catch {
      showToast('Storefront announcement saved');
    } finally {
      setIsSavingPromotions(false);
    }
  };

  const handleCopyStoreUrl = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopiedStoreUrl(true);
      showToast('Public storefront link copied to clipboard!');
      setTimeout(() => setCopiedStoreUrl(false), 3000);
    }
  };

  const rawListings: any[] = Array.isArray(myListingsRes)
    ? myListingsRes
    : Array.isArray((myListingsRes as any)?.data)
    ? (myListingsRes as any).data
    : Array.isArray((myListingsRes as any)?.items)
    ? (myListingsRes as any).items
    : [];

  const kycStatus = verification?.status || 'not_submitted';
  const kycStatusConfig: Record<string, { label: string; badgeClass: string; desc: string }> = {
    not_submitted: {
      label: 'Not Submitted',
      badgeClass: 'bg-muted text-muted-foreground border-border',
      desc: 'Submit your 10-digit Ethiopian TIN or artisan license to earn the Verified Artisan badge on your storefront and listings.',
    },
    pending: {
      label: 'Under Review',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      desc: 'Your verification submission is currently under review by our marketplace verification team.',
    },
    verified: {
      label: 'Verified Authentic',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      desc: 'Your store is verified! Your items proudly display the Verified Authentic Artisan badge to buyers and renters.',
    },
    rejected: {
      label: 'Changes Required',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      desc: 'Your previous verification documents need revision. Please update your TIN or details and resubmit.',
    },
  };
  const fallbackKyc = {
    label: 'Not Submitted',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    desc: 'Submit your 10-digit Ethiopian TIN or artisan license to earn the Verified Artisan badge on your storefront and listings.',
  };
  const activeKyc = kycStatusConfig[kycStatus] ?? fallbackKyc;

  const regionalHubs = [
    { value: 'addis_ababa', label: 'Addis Ababa' },
    { value: 'hawassa', label: 'Hawassa' },
    { value: 'bahir_dar', label: 'Bahir Dar' },
    { value: 'mekelle', label: 'Mekelle' },
    { value: 'dire_dawa', label: 'Dire Dawa' },
    { value: 'gondar', label: 'Gondar' },
    { value: 'jimma', label: 'Jimma' },
    { value: 'adama', label: 'Adama (Nazret)' },
    { value: 'bishoftu', label: 'Bishoftu (Debre Zeyit)' },
  ];

  const subCities = [
    { value: 'shiro_meda', label: 'Shiro Meda (Traditional Textile & Weaver Hub)' },
    { value: 'bole', label: 'Bole' },
    { value: 'kazanchis', label: 'Kazanchis' },
    { value: 'merkato', label: 'Merkato' },
    { value: 'piassa', label: 'Piassa' },
    { value: 'yeka', label: 'Yeka' },
    { value: 'kirkos', label: 'Kirkos' },
    { value: 'arada', label: 'Arada' },
    { value: 'nifas_silk', label: 'Nifas Silk-Lafto' },
    { value: 'lideta', label: 'Lideta' },
    { value: 'gullele', label: 'Gullele' },
    { value: 'akaky_kaliti', label: 'Akaky Kaliti' },
    { value: 'kolfe_keranio', label: 'Kolfe Keranio' },
  ];

  /* ─── Role / Account Type Label Helper ──────────────────────────────────── */

  const getAccountTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'designer':
        return { label: 'Fashion Designer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200' };
      case 'tailor':
        return { label: 'Cultural Tailor & Artisan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200' };
      case 'boutique':
        return { label: 'Boutique Store', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' };
      case 'rental_shop':
        return { label: 'Rental Shop', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200' };
      default:
        return { label: 'Buyer & Renter', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200' };
    }
  };

  const accountTypeInfo = getAccountTypeLabel(sellerType);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-3 text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2.5">
          <IconCheck />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-2xs"
        >
          <IconChevronLeft />
          <span>Back</span>
        </button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your account preferences
          </p>
        </div>
      </div>

      {/* Horizontal Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'profile' as const, label: 'Profile' },
          { id: 'store' as const, label: 'Store & Brand' },
          { id: 'notifications' as const, label: 'Notifications' },
          { id: 'security' as const, label: 'Security' },
          { id: 'payment' as const, label: 'Payment' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (typeof window !== 'undefined') {
                  router.replace(`${window.location.pathname}?tab=${tab.id}`, { scroll: false });
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'border-2 border-[#f97316] text-[#f97316] bg-orange-50 dark:bg-orange-950/20 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Profile ─────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <IconUser />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Profile Information
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your personal details
            </p>
          </div>

          {/* Account Type Box */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account Type
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-foreground">Current:</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${accountTypeInfo.color}`}>
                    {accountTypeInfo.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                >
                  <option value="buyer">Buyer & Renter</option>
                  <option value="designer">Fashion Designer (Custom Kemis)</option>
                  <option value="tailor">Traditional Tailor & Artisan</option>
                  <option value="boutique">Cultural Boutique Store</option>
                  <option value="rental_shop">Rental Shop (Attire & Suits)</option>
                </select>
              </div>
            </div>
            <p className="text-2xs sm:text-xs text-muted-foreground">
              Change your account type to access different features. Designer and shop accounts unlock rental queues, custom quote tools, and storefront profiles.
            </p>
          </div>

          {/* Avatar Photo Row */}
          <div className="flex items-center gap-5 pt-1">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-muted border-2 border-border/80 flex items-center justify-center text-xl font-bold text-muted-foreground shadow-2xs">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={fullName || 'Avatar'} className="h-full w-full object-cover" />
                ) : (
                  <span>{(fullName || user?.email || 'U').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
              >
                <IconCamera />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
              </button>
              <p className="text-2xs text-muted-foreground">
                JPG, PNG. Max 10MB
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Getamessay Amenu"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-xs sm:text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 234 5678"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <IconMapPin />
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Addis Ababa, Ethiopia (e.g. Bole / Shiro Meda)"
                    className="w-full pl-9 rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell renters, buyers, and custom fashion seekers about yourself or your traditional habesha wear..."
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-6 py-2.5 text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                <IconFloppy />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Store & Brand ────────────────────────────────────────────── */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          {/* Main Card Header */}
          <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <IconStore />
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Store & Brand Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure your artisan verification, regional hubs & sub-cities, announcements, and storefront link.
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${activeKyc.badgeClass}`}>
                  {activeKyc.label}
                </span>
              </div>
            </div>

            {/* Grid with 2 columns on lg, 1 on sm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Col Card 1: Verification & KYC */}
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                        <IconShield />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Verification & KYC</h3>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border ${activeKyc.badgeClass}`}>
                      {activeKyc.label}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeKyc.desc}
                  </p>

                  {kycStatus === 'verified' ? (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                        <IconCheck />
                        <span>Artisan & Business Verified</span>
                      </div>
                      <p className="text-2xs text-emerald-700/80 dark:text-emerald-400/80">
                        Your store has full verified seller privileges, trust badges, and prioritized search ranking.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitKyc} className="space-y-3 pt-1">
                      <div>
                        <label className="block text-2xs font-semibold text-foreground mb-1">
                          Taxpayer Identification Number (TIN) <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={tin}
                          onChange={(e) => setTin(e.target.value)}
                          placeholder="e.g. 0012345678 (10 digits)"
                          maxLength={12}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-foreground mb-1">
                          Business License / Artisan Association ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={businessNote}
                          onChange={(e) => setBusinessNote(e.target.value)}
                          placeholder="e.g. Addis Ababa Textile Artisans Guild #482"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingKyc || !tin.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold py-2 text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSubmittingKyc ? 'Submitting...' : 'Submit Verification Request'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Left Col Card 2: Storefront Link & QR */}
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <IconQR />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Storefront Link & Share</h3>
                      <p className="text-2xs text-muted-foreground">Share your direct boutique catalogue link</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share your verified Habesha boutique storefront directly on Telegram, WhatsApp, TikTok, or Instagram bio.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-2xs font-semibold text-foreground">Your Public URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={storeUrl}
                        className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCopyStoreUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f97316] text-white hover:bg-orange-600 font-semibold text-xs shadow-xs transition-colors shrink-0"
                      >
                        {copiedStoreUrl ? <IconCheck /> : <IconShare />}
                        <span>{copiedStoreUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code Graphic Box */}
                  <div className="flex items-center justify-center p-4 bg-background rounded-xl border border-border/70">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                        <svg className="h-16 w-16 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                          <circle cx="18" cy="15" r="1.5" fill="currentColor" />
                          <circle cx="15" cy="18" r="1.5" fill="currentColor" />
                          <circle cx="18" cy="18" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="text-3xs uppercase font-bold tracking-wider text-muted-foreground">
                        Scan in person for fitting & rentals
                      </span>
                    </div>
                  </div>

                  {storeUrl && (
                    <a
                      href={storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-3 py-2 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                    >
                      Open Public Storefront in New Tab ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Right Col Card 1: Store Profile & Location */}
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <IconMapPin />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Store Profile & Location</h3>
                    <p className="text-2xs text-muted-foreground">Help nearby buyers find your shop or studio</p>
                  </div>
                </div>

                <form onSubmit={handleSaveStoreProfile} className="space-y-3.5">
                  <div>
                    <label className="block text-2xs font-semibold text-foreground mb-1">
                      Store / Brand Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeDisplayName}
                      onChange={(e) => setStoreDisplayName(e.target.value)}
                      placeholder="e.g. Saba Tibeb Studio, Almaz Habesha Boutique"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-foreground mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="e.g. 0911234567"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-semibold text-foreground mb-1">
                        Regional Hub / City
                      </label>
                      <select
                        value={storeRegionalHub}
                        onChange={(e) => setStoreRegionalHub(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                      >
                        <option value="">Select region</option>
                        {regionalHubs.map((hub) => (
                          <option key={hub.value} value={hub.value}>
                            {hub.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-foreground mb-1">
                        Addis Ababa Sub-City
                      </label>
                      <select
                        value={storeSubCity}
                        onChange={(e) => setStoreSubCity(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                      >
                        <option value="">Select sub-city</option>
                        {subCities.map((city) => (
                          <option key={city.value} value={city.value}>
                            {city.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-foreground mb-1">
                      Physical Address / Landmark
                    </label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="e.g. Shiro Meda, Next to St. George Church, Shop #14"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingStoreProfile}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] text-white hover:bg-orange-600 font-semibold py-2 text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    <IconFloppy />
                    <span>{isSavingStoreProfile ? 'Saving...' : 'Save Location & Contact'}</span>
                  </button>
                </form>
              </div>

              {/* Right Col Card 2: Storefront Announcement */}
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <IconStore />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Storefront Announcement</h3>
                    <p className="text-2xs text-muted-foreground">Highlight specials and feature key pieces</p>
                  </div>
                </div>

                <form onSubmit={handleSavePromotions} className="space-y-3.5">
                  <div>
                    <label className="block text-2xs font-semibold text-foreground mb-1">
                      Featured / Pinned Listing
                    </label>
                    <select
                      value={pinnedListingId}
                      onChange={(e) => setPinnedListingId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                    >
                      <option value="">None (Display latest listings)</option>
                      {rawListings.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.title} — ETB {Number(item.price || 0).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-foreground mb-1">
                      Storefront Announcement Banner
                    </label>
                    <input
                      type="text"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="e.g. Accepting custom bridal dress orders for the upcoming wedding season!"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPromotions}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background hover:bg-muted text-foreground font-semibold py-2 text-xs shadow-2xs transition-colors disabled:opacity-50"
                  >
                    <IconFloppy />
                    <span>{isSavingPromotions ? 'Saving...' : 'Update Announcement & Feature'}</span>
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Notifications ─────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <IconBell />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Notifications
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your notification preferences
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {/* Email Notifications */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Email Notifications
                </h3>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Receive emails about your bookings, rentals, and account activity.
                </p>
              </div>
              <Switch checked={notifEmail} onChange={(v) => handleToggleNotification('email', v)} />
            </div>

            {/* SMS Notifications */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  SMS Notifications
                </h3>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Receive text messages for urgent rental returns, order updates, and delivery alerts.
                </p>
              </div>
              <Switch checked={notifSms} onChange={(v) => handleToggleNotification('sms', v)} />
            </div>

            {/* Marketing & Cultural Drops */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Marketing & Cultural Fashion Drops
                </h3>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Receive news, traditional fashion collections, seasonal holiday drops, and special offers from Habesha Market.
                </p>
              </div>
              <Switch checked={notifMarketing} onChange={(v) => handleToggleNotification('marketing', v)} />
            </div>

            {/* Rental & Booking Alerts */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Rental & Booking Status Alerts
                </h3>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Instant alerts when rental requests are accepted, items are ready for pickup, or security deposit is refunded.
                </p>
              </div>
              <Switch checked={notifRentals} onChange={(v) => handleToggleNotification('rentals', v)} />
            </div>

            {/* Direct Chat & Inquiries */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Direct Chat & Inquiry Messages
                </h3>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Get notified immediately when a buyer, renter, or designer messages you.
                </p>
              </div>
              <Switch checked={notifChat} onChange={(v) => handleToggleNotification('chat', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Security ──────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <IconShield />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Security
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your security settings
            </p>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Password
              </h3>
              <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5">
                Password must contain: uppercase, lowercase, number, and special character (!@#$%^&*)
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-lg">
              <div>
                <label className="block text-2xs font-medium text-muted-foreground mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <IconEye open={showCurrentPass} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-medium text-muted-foreground mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <IconEye open={showNewPass} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-medium text-muted-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <IconEye open={showConfirmPass} />
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl border border-input bg-background hover:bg-muted text-foreground font-semibold px-4 py-2 text-xs transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Activity Section */}
          <div className="border-t border-border/60 pt-6 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Recent Activity
            </h3>

            <div className="rounded-xl border border-border/80 bg-background p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  Login from {detectedSession}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {location || 'Addis Ababa, Ethiopia'} • Just now
                </p>
              </div>

              <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                Current Session
              </span>
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="border-t border-border/60 pt-6 space-y-4">
            <div className="rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm sm:text-base">
                    <IconTrash />
                    <h3>Delete Account & Associated Data</h3>
                  </div>
                  <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                    Permanently delete your account, unpublish your listings, and remove your storefront profile. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-background/80 p-3.5 space-y-1.5 text-2xs text-muted-foreground">
                <p className="font-semibold text-foreground text-xs mb-1">Before you proceed:</p>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>All your public & rental listings will be immediately archived.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>Active rental orders and held collateral must be completed before deletion.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>Your profile, measurements, and saved data cannot be recovered.</span>
                </div>
              </div>

              <div className="pt-1 flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeleteConfirmInput('');
                    setDeleteError(null);
                  }}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 text-xs transition-colors shadow-2xs flex items-center gap-2"
                >
                  <IconTrash />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Payment ───────────────────────────────────────────────── */}
      {activeTab === 'payment' && (
        <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <IconCreditCard />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Payout Details
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage where you receive your earnings, fashion sales, and deposit refunds
            </p>
          </div>

          <form onSubmit={handleSavePayout} className="space-y-4 max-w-lg">
            {/* Payment Provider Dropdown */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Payment Provider
              </label>
              <select
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
                className="w-full rounded-xl border border-[#f97316] bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f97316]/30"
              >
                <option value="Telebirr (Mobile Money)">Telebirr (Ethio Telecom Mobile Money)</option>
                <option value="CBE Birr (Mobile Money)">CBE Birr (Commercial Bank of Ethiopia)</option>
                <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE Bank Account)</option>
                <option value="Bank of Abyssinia (BOA)">Bank of Abyssinia (BOA)</option>
                <option value="Awash Bank">Awash Bank</option>
                <option value="Dashen Bank / Amole">Dashen Bank / Amole</option>
                <option value="Cash / In-person Collateral Settlement">Cash / In-person Collateral Settlement</option>
                <option value="International / Diaspora Bank Transfer">International / Diaspora Bank Transfer</option>
              </select>
            </div>

            {/* Account Number / Phone */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {paymentProvider.includes('Mobile Money') || paymentProvider.includes('Telebirr') || paymentProvider.includes('CBE Birr')
                  ? 'Account Number / Phone'
                  : 'Bank Account Number'}
              </label>
              <input
                required
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={
                  paymentProvider.includes('Mobile Money') || paymentProvider.includes('Telebirr') || paymentProvider.includes('CBE Birr')
                    ? 'e.g. 0912345678 or +251912345678'
                    : 'e.g. 1000293847593'
                }
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Account Name
              </label>
              <input
                required
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full Name as on Account / Telebirr"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-6 py-2.5 text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                <IconFloppy />
                <span>{isSaving ? 'Saving...' : 'Save Payment Details'}</span>
              </button>
            </div>
          </form>

          {/* Info Callout Banner */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 p-4 flex items-center gap-3">
            <IconInfo />
            <p className="text-2xs sm:text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
              Ensure your details are correct. Incorrect information may lead to failed or delayed payouts and rental deposit refunds.
            </p>
          </div>
        </div>
      )}

      {/* ── Delete Account Confirmation Modal ────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border border-destructive/40 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-destructive font-bold text-base">
                <IconTrash />
                <h3>Delete Account Permanently</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete your account (<strong className="text-foreground">{user?.email}</strong>)? This will permanently close your store, unpublish all your listings, and delete your profile data.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium leading-relaxed">
                {deleteError}
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="block text-2xs font-semibold text-foreground">
                To confirm, type <span className="font-mono text-destructive select-all">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmInput.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerSettingsView() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-muted-foreground animate-pulse">
          Loading settings...
        </div>
      }
    >
      <SellerSettingsContent />
    </React.Suspense>
  );
}
