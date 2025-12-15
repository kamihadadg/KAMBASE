'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import api, { uploadApi } from '@/lib/api';
import FilePreview from '@/components/kyc/FilePreview';

const createSchemas = (t: (key: string) => string) => {
  const profileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  });

  const passwordSchema = z.object({
    currentPassword: z.string().min(1, t('profile.currentPasswordRequired') || 'Current password is required'),
    newPassword: z.string().min(8, t('profile.newPasswordMin') || 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, t('profile.confirmPasswordMin') || 'Password must be at least 8 characters'),
    twoFactorCode: z.string().optional(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('profile.passwordsMismatch') || 'Passwords do not match',
    path: ['confirmPassword'],
  });

  return { profileSchema, passwordSchema };
};

type Schemas = ReturnType<typeof createSchemas>;
type ProfileForm = z.infer<Schemas['profileSchema']>;
type PasswordForm = z.infer<Schemas['passwordSchema']>;

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const { profileSchema, passwordSchema } = useMemo(() => createSchemas(t), [t]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'kyc' | 'activity'>('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  // KYC Form States
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycActiveLevel, setKycActiveLevel] = useState<'level1' | 'level2' | 'level3'>('level1');

  // Update active level when kyc status changes
  useEffect(() => {
    if (!kyc) {
      setKycActiveLevel('level1');
    } else {
      // Determine available levels and set appropriate active level
      let availableLevels: ('level1' | 'level2' | 'level3')[] = ['level1'];

      if (kyc.level === 'level1' && kyc.status === 'approved') {
        availableLevels = ['level1', 'level2'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      } else if (kyc.level === 'level2' && kyc.status === 'approved') {
        availableLevels = ['level1', 'level2', 'level3'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      } else if (kyc.level === 'level3' && kyc.status === 'approved') {
        availableLevels = ['level1', 'level2', 'level3'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      } else if (kyc.level === 'level1' && kyc.status === 'pending') {
        availableLevels = ['level1'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      } else if (kyc.level === 'level2') {
        availableLevels = ['level1', 'level2'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      } else if (kyc.level === 'level3') {
        availableLevels = ['level1', 'level2', 'level3'];
        if (!availableLevels.includes(kycActiveLevel)) {
          setKycActiveLevel('level1');
        }
      }
    }
  }, [kyc, kycActiveLevel]);
  const [kycErrors, setKycErrors] = useState<{[key: string]: string}>({});

  // KYC Level 1 Form
  const [level1Form, setLevel1Form] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
  });

  // KYC Level 2 Form
  const [level2Form, setLevel2Form] = useState({
    nationalCardFront: null as File | string | null,
    nationalCardBack: null as File | string | null,
    selfie: null as File | string | null,
  });
  const [level2Previews, setLevel2Previews] = useState({
    nationalCardFront: null as File | string | null,
    nationalCardBack: null as File | string | null,
    selfie: null as File | string | null,
  });

  // KYC Level 3 Form
  const [level3Form, setLevel3Form] = useState({
    additionalDocuments: [] as (File | string)[],
    notes: '',
  });
  const [level3Previews, setLevel3Previews] = useState<(File | string)[]>([]);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '';
  const placeholderImageUrl = backendBaseUrl
    ? `${backendBaseUrl}/uploads/placeholder.jpg`
    : '/uploads/placeholder.jpg';

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to convert base64 to file
  const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  };

  // Load saved files from localStorage on component mount
  useEffect(() => {
    const loadSavedFiles = async () => {
      try {
        const savedLevel2 = localStorage.getItem('kyc_level2_files');
        if (savedLevel2) {
          const parsed = JSON.parse(savedLevel2);
          const restoredForm: any = {};
          const restoredPreviews: any = {};

          for (const [key, fileData] of Object.entries(parsed) as [string, any][]) {
            if (fileData) {
              try {
                const file = base64ToFile(fileData.base64, fileData.name, fileData.type);
                restoredForm[key] = file;
                restoredPreviews[key] = file;
              } catch (error) {
                console.warn(`Failed to restore ${key}:`, error);
              }
            }
          }

          if (Object.keys(restoredForm).length > 0) {
            setLevel2Form(prev => ({ ...prev, ...restoredForm }));
            setLevel2Previews(prev => ({ ...prev, ...restoredPreviews }));
          }
        }

        const savedLevel3 = localStorage.getItem('kyc_level3_files');
        if (savedLevel3) {
          const parsed = JSON.parse(savedLevel3);
          setLevel3Form(prev => ({
            ...prev,
            notes: parsed.notes || '',
            additionalDocuments: parsed.files?.map((fileData: any) =>
              base64ToFile(fileData.base64, fileData.name, fileData.type)
            ) || []
          }));
          setLevel3Previews(parsed.files?.map((fileData: any) =>
            base64ToFile(fileData.base64, fileData.name, fileData.type)
          ) || []);
        }
      } catch (error) {
        console.warn('Failed to load saved KYC files:', error);
      }
    };

    loadSavedFiles();
  }, []);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
      resetProfile({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKYC = async () => {
    try {
      const response = await api.get('/kyc');
      setKyc(response.data);
      // Pre-fill forms with existing data
      if (response.data.level1Data) {
        setLevel1Form(response.data.level1Data);
      }
      if (response.data.level2Data) {
        setLevel2Form({
          nationalCardFront: response.data.level2Data.nationalCardFront || null,
          nationalCardBack: response.data.level2Data.nationalCardBack || null,
          selfie: response.data.level2Data.selfie || null,
        });
        setLevel2Previews({
          nationalCardFront: response.data.level2Data.nationalCardFront || null,
          nationalCardBack: response.data.level2Data.nationalCardBack || null,
          selfie: response.data.level2Data.selfie || null,
        });
      }
      if (response.data.level3Data) {
        setLevel3Form({
          additionalDocuments: response.data.level3Data.additionalDocuments || [],
          notes: response.data.level3Data.notes || '',
        });
        setLevel3Previews(response.data.level3Data.additionalDocuments || []);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch KYC:', error);
      }
    }
  };

  const validateKycFile = (file: File, maxSize: number = 5 * 1024 * 1024): string | null => {
    // Check file size (default 5MB)
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only image files (JPG, PNG, GIF, WebP) are allowed';
    }

    return null;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'security', 'kyc', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    // Operators can only change password, no profile access
    if (user?.role === 'operator') {
      setActiveTab('security');
      setLoading(false);
      return;
    }

    fetchProfile();
    fetchKYC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, user, searchParams]);

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      setError('');
      setSuccess('');
      await api.patch('/users/profile', data);
      setSuccess(t('profile.updateSuccess'));
      await fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.updateFailed'));
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setError('');
      setSuccess('');
      
      // If 2FA is enabled and code is not provided, show error (not for operators)
      if (user?.role !== 'operator' && profile?.twoFactorEnabled && !data.twoFactorCode) {
        setRequires2FA(true);
        setError(t('profile.2faRequired'));
        return;
      }
      
      const payload: any = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      
      // Add 2FA code if provided
      if (data.twoFactorCode) {
        payload.twoFactorCode = data.twoFactorCode;
      }
      
      await api.post('/users/change-password', payload);
      setSuccess(t('profile.passwordChanged'));
      resetPassword();
      setRequires2FA(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.response?.status === 400 && (err.response?.data?.message?.includes('2FA') || err.response?.data?.message?.includes('2fa'))) {
        setRequires2FA(true);
        setError(err.response?.data?.message || t('profile.2faRequired'));
      } else {
        setError(err.response?.data?.message || t('profile.passwordChangeFailed'));
      }
    }
  };

  const handleEnable2FA = async () => {
    try {
      router.push('/setup-2fa');
    } catch (error) {
      console.error('Failed to navigate to 2FA setup:', error);
    }
  };

  const handleKycLevel1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKyc(true);
    setKycErrors({});

    try {
      const response = await api.post('/kyc', {
        level1Data: level1Form,
      });
      setKyc(response.data);
      setSuccess('Level 1 KYC submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Clear saved files after successful submission
      localStorage.removeItem('kyc_level2_files');
      localStorage.removeItem('kyc_level3_files');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleKycLevel2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKyc(true);
    setKycErrors({});

    try {
      // Upload files first
      const uploadPromises = [];
      if (level2Form.nationalCardFront) {
        const formData = new FormData();
        formData.append('file', level2Form.nationalCardFront);
        uploadPromises.push(uploadApi.post('/upload/single', formData));
      }
      if (level2Form.nationalCardBack) {
        const formData = new FormData();
        formData.append('file', level2Form.nationalCardBack);
        uploadPromises.push(uploadApi.post('/upload/single', formData));
      }
      if (level2Form.selfie) {
        const formData = new FormData();
        formData.append('file', level2Form.selfie);
        uploadPromises.push(uploadApi.post('/upload/single', formData));
      }

      const uploadResults = await Promise.all(uploadPromises);
      const fileUrls = uploadResults.map(result => result.data.url);

      // Submit KYC with file URLs
      const response = await api.patch('/kyc', {
        level2Data: {
          nationalCardFront: fileUrls[0] || placeholderImageUrl,
          nationalCardBack: fileUrls[1] || placeholderImageUrl,
          selfie: fileUrls[2] || placeholderImageUrl,
        },
      });
      setKyc(response.data);
      setSuccess('Level 2 KYC submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Clear saved files after successful submission
      localStorage.removeItem('kyc_level2_files');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleKycLevel3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKyc(true);
    setKycErrors({});

    try {
      // Upload additional documents
      let documentUrls: string[] = [];
      if (level3Form.additionalDocuments.length > 0) {
        const formData = new FormData();
        level3Form.additionalDocuments.forEach(file => {
          formData.append('files', file);
        });
        const uploadResult = await uploadApi.post('/upload/multiple', formData);
        documentUrls = uploadResult.data.map((file: any) => file.url);
      }

      const response = await api.patch('/kyc', {
        level3Data: {
          additionalDocuments: documentUrls,
          notes: level3Form.notes,
        },
      });
      setKyc(response.data);
      setSuccess('Level 3 KYC submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Clear saved files after successful submission
      localStorage.removeItem('kyc_level3_files');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleLevel2FileChange = (field: 'nationalCardFront' | 'nationalCardBack' | 'selfie') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const error = validateKycFile(file);
      if (error) {
        setKycErrors({ ...kycErrors, [field]: error });
        return;
      }
      setKycErrors({ ...kycErrors, [field]: '' });
    }

    const newForm = { ...level2Form, [field]: file };
    const newPreviews = { ...level2Previews, [field]: file };

    setLevel2Form(newForm);
    setLevel2Previews(newPreviews);

    // Save to localStorage
    try {
      const savedFiles = JSON.parse(localStorage.getItem('kyc_level2_files') || '{}');

      if (file) {
        const base64 = await fileToBase64(file);
        savedFiles[field] = {
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64
        };
      } else {
        delete savedFiles[field];
      }

      localStorage.setItem('kyc_level2_files', JSON.stringify(savedFiles));
    } catch (error) {
      console.warn('Failed to save Level 2 file to localStorage:', error);
    }
  };

  const handleLevel3FileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    if (files.length > maxFiles) {
      setKycErrors({ ...kycErrors, additionalDocuments: `Maximum ${maxFiles} files allowed` });
      return;
    }

    // Validate each file
    for (const file of files) {
      const error = validateKycFile(file, maxSize);
      if (error) {
        setKycErrors({ ...kycErrors, additionalDocuments: error });
        return;
      }
    }

    setKycErrors({ ...kycErrors, additionalDocuments: '' });
    setLevel3Form({ ...level3Form, additionalDocuments: files });
    setLevel3Previews(files);

    // Save to localStorage
    try {
      const savedData = {
        files: await Promise.all(files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: await fileToBase64(file)
        }))),
        notes: level3Form.notes
      };

      localStorage.setItem('kyc_level3_files', JSON.stringify(savedData));
    } catch (error) {
      console.warn('Failed to save Level 3 files to localStorage:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && user?.role !== 'operator') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 dark:text-gray-400 text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  // Check if KYC needs attention
  const needsKycAttention = !kyc || kyc.status === 'pending' || kyc.status === 'rejected' ||
    (kyc.level === 'level1' && kyc.status === 'approved') ||
    (kyc.level === 'level2' && kyc.status === 'approved');

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('profile.title')}
      </h1>

      {/* KYC Notification Banner */}
      {user?.role !== 'operator' && needsKycAttention && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {t('profile.completeKycVerification')}
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                {!kyc
                  ? t('profile.kycBannerStart')
                  : kyc.status === 'pending'
                  ? t('profile.kycBannerPending')
                  : kyc.status === 'rejected'
                  ? `Your KYC was rejected. ${kyc.reviewNotes ? `Reason: ${kyc.reviewNotes}` : 'Please try again with correct information.'}`
                  : `Your KYC Level ${kyc.level.slice(-1)} is approved. Consider upgrading to Level ${parseInt(kyc.level.slice(-1)) + 1} for higher limits.`
                }
              </p>
              {(kyc?.status === 'approved' || !kyc) && (
                <button
                  onClick={() => setActiveTab('kyc')}
                  className="inline-flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {!kyc ? 'Start KYC' :
                     kyc.level === 'level1' ? 'Upgrade to Level 2' :
                     kyc.level === 'level2' ? 'Upgrade to Level 3' :
                     'Manage KYC'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Operators can only see security tab */}
      {user?.role === 'operator' ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.changePassword')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('profile.operatorPasswordChange')}
          </p>
        </div>
      ) : (
        <div className="flex space-x-4 space-x-reverse mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'profile'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.personalInfo')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'security'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.security')}
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'kyc'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.kyc')}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('profile.activity')}
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 bg-red-900/50 dark:bg-red-900/50 bg-red-50 border border-red-700 dark:border-red-700 border-red-300 text-red-200 dark:text-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-900/50 dark:bg-green-900/50 bg-green-50 border border-green-700 dark:border-green-700 border-green-300 text-green-200 dark:text-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Profile Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.personalInfo')}
          </h2>
          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.firstName')}
                </label>
                <input
                  {...registerProfile('firstName')}
                  type="text"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.firstName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.lastName')}
                </label>
                <input
                  {...registerProfile('lastName')}
                  type="text"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.lastName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.lastName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  {...registerProfile('phone')}
                  type="tel"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileErrors.phone && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {profileErrors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
              >
                {isSubmittingProfile ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab - Available for all, but operators only see this */}
      {(activeTab === 'security' || user?.role === 'operator') && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('profile.changePassword')}
            </h2>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.currentPassword')}
                </label>
                <input
                  {...registerPassword('currentPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.newPassword')}
                </label>
                <input
                  {...registerPassword('newPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.confirmPassword')}
                </label>
                <input
                  {...registerPassword('confirmPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              {/* 2FA Code - Show if 2FA is enabled or if error indicates 2FA is required (not for operators) */}
              {user?.role !== 'operator' && (profile?.twoFactorEnabled || requires2FA) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.twoFactorCode')} {profile?.twoFactorEnabled && <span className="text-red-600 dark:text-red-400">*</span>}
                  </label>
                  <input
                    {...registerPassword('twoFactorCode')}
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                    placeholder="000000"
                  />
                  {passwordErrors.twoFactorCode && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {passwordErrors.twoFactorCode.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('profile.2faCodeHint')}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
                >
                  {isSubmittingPassword ? t('common.loading') : t('profile.changePassword')}
                </button>
              </div>
            </form>
          </div>

          {/* 2FA - Not available for operators */}
          {user?.role !== 'operator' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {t('profile.twoFactor')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Status: {profile?.twoFactorEnabled ? (
                      <span className="text-green-600 dark:text-green-400">Enabled</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Disabled</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.twoFactorDesc')}
                  </p>
                </div>
                {!profile?.twoFactorEnabled ? (
                  <button
                    onClick={handleEnable2FA}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    Enable 2FA
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                    disabled
                  >
                    Disable 2FA
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login History - Not available for operators */}
          {user?.role !== 'operator' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('profile.loginHistory')}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.lastLogin')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.lastLoginIp')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.lastLoginIp || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{t('profile.accountCreated')}:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* KYC Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* KYC Status */}
          {kyc && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {t('profile.kycStatus')}
              </h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('profile.kycLevel')}: {kyc.level}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: <span className={kyc.status === 'approved' ? 'text-green-600 dark:text-green-400' : kyc.status === 'rejected' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {kyc.status}
                    </span>
                  </p>
                  {kyc.dailyWithdrawLimit && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Daily Withdraw Limit: ${kyc.dailyWithdrawLimit}
                    </p>
                  )}
                  {kyc.reviewNotes && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                      <strong>Review Notes:</strong> {kyc.reviewNotes}
                    </div>
                  )}
                </div>
                {kyc.status === 'approved' && (
                  <div className="text-green-600 dark:text-green-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {kyc.status === 'pending' && (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                  {t('profile.kycPending')}
                </p>
              )}
            </div>
          )}

          {/* KYC Form */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('profile.kyc')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('profile.kycBannerStart')}
            </p>

            {/* Level Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4">
                  {(() => {
                    // Determine which levels to show based on KYC status
                    let availableLevels: ('level1' | 'level2' | 'level3')[] = ['level1'];

                    if (!kyc) {
                      // No KYC: only show level 1
                      availableLevels = ['level1'];
                    } else if (kyc.level === 'level1' && kyc.status === 'approved') {
                      // Level 1 approved: show level 1 and 2
                      availableLevels = ['level1', 'level2'];
                    } else if (kyc.level === 'level2' && kyc.status === 'approved') {
                      // Level 2 approved: show level 1, 2 and 3
                      availableLevels = ['level1', 'level2', 'level3'];
                    } else if (kyc.level === 'level3' && kyc.status === 'approved') {
                      // Level 3 approved: show all levels
                      availableLevels = ['level1', 'level2', 'level3'];
                    } else if (kyc.level === 'level1' && kyc.status === 'pending') {
                      // Level 1 pending: only show level 1
                      availableLevels = ['level1'];
                    } else if (kyc.level === 'level2') {
                      // Level 2 submitted (pending or rejected): show level 1 and 2
                      availableLevels = ['level1', 'level2'];
                    } else if (kyc.level === 'level3') {
                      // Level 3 submitted (pending or rejected): show all levels
                      availableLevels = ['level1', 'level2', 'level3'];
                    }

                    return availableLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => setKycActiveLevel(level)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          kycActiveLevel === level
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Level {level.slice(-1)} - {
                          level === 'level1' ? t('profile.kycLevel1Title') :
                          level === 'level2' ? t('profile.kycLevel2Title') :
                          t('profile.kycLevel3Title')
                        }
                      </button>
                    ));
                  })()}
                </nav>
              </div>
            </div>

            {/* Level 1 Form */}
            {kycActiveLevel === 'level1' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Level 1: {t('profile.kycLevel1Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('profile.kycLevel1Desc')}
                </p>

                <form onSubmit={handleKycLevel1Submit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.firstName')}
                      </label>
                      <input
                        type="text"
                        value={level1Form.firstName}
                        onChange={(e) => setLevel1Form({ ...level1Form, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.lastName')}
                      </label>
                      <input
                        type="text"
                        value={level1Form.lastName}
                        onChange={(e) => setLevel1Form({ ...level1Form, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.dateOfBirth')}
                      </label>
                      <input
                        type="date"
                        value={level1Form.dateOfBirth}
                        onChange={(e) => setLevel1Form({ ...level1Form, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.nationality')}
                      </label>
                      <select
                        value={level1Form.nationality}
                        onChange={(e) => setLevel1Form({ ...level1Form, nationality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">{t('profile.selectNationality')}</option>
                        <option value="iran">{t('profile.country_iran')}</option>
                        <option value="usa">{t('profile.country_usa')}</option>
                        <option value="uk">{t('profile.country_uk')}</option>
                        <option value="canada">{t('profile.country_canada')}</option>
                        <option value="germany">{t('profile.country_germany')}</option>
                        <option value="france">{t('profile.country_france')}</option>
                        <option value="other">{t('profile.country_other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingKyc}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                    >
                      {submittingKyc ? t('common.submitting') : t('profile.submitLevel1')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Level 2 Form */}
            {kycActiveLevel === 'level2' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Level 2: {t('profile.kycLevel2Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('profile.kycLevel2Desc')}
                </p>

                {(() => {
                  const isLevel2Locked =
                    (kyc?.level === 'level2' && kyc.status === 'approved') ||
                    (kyc?.level === 'level3' && kyc.status === 'approved');

                  return (
                <form onSubmit={handleKycLevel2Submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* National Card Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.nationalCardFront')}
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLevel2FileChange('nationalCardFront')}
                  className="hidden"
                  id="nationalCardFront"
                />
                <label htmlFor="nationalCardFront" className="cursor-pointer">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>{t('profile.clickToUploadFront')}</p>
                  </div>
                </label>
              </div>
              {kycErrors.nationalCardFront && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{kycErrors.nationalCardFront}</p>
              )}
              {level2Previews.nationalCardFront && (
                <FilePreview
                  file={level2Previews.nationalCardFront}
                  onRemove={() => {
                    setLevel2Form({ ...level2Form, nationalCardFront: null });
                    setLevel2Previews({ ...level2Previews, nationalCardFront: null });
                    const saved = JSON.parse(localStorage.getItem('kyc_level2_files') || '{}');
                    delete saved.nationalCardFront;
                    localStorage.setItem('kyc_level2_files', JSON.stringify(saved));
                  }}
                  className="mt-2"
                />
              )}
            </div>

                    {/* National Card Back */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.nationalCardBack')}
                      </label>
                      <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center ${isLevel2Locked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={isLevel2Locked ? undefined : handleLevel2FileChange('nationalCardBack')}
                          className="hidden"
                          id="nationalCardBack"
                          disabled={isLevel2Locked}
                        />
                        <label htmlFor="nationalCardBack" className={`${isLevel2Locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="text-gray-500 dark:text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p>{t('profile.clickToUploadBack')}</p>
                          </div>
                        </label>
                      </div>
                      {kycErrors.nationalCardBack && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{kycErrors.nationalCardBack}</p>
                      )}
                      {level2Previews.nationalCardBack && (
                        <FilePreview
                          file={level2Previews.nationalCardBack}
                          onRemove={
                            isLevel2Locked
                              ? undefined
                              : () => {
                                  setLevel2Form({ ...level2Form, nationalCardBack: null });
                                  setLevel2Previews({ ...level2Previews, nationalCardBack: null });
                                  const saved = JSON.parse(localStorage.getItem('kyc_level2_files') || '{}');
                                  delete saved.nationalCardBack;
                                  localStorage.setItem('kyc_level2_files', JSON.stringify(saved));
                                }
                          }
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* Selfie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.selfie')}
                      </label>
                      <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center ${isLevel2Locked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={isLevel2Locked ? undefined : handleLevel2FileChange('selfie')}
                          className="hidden"
                          id="selfie"
                          disabled={isLevel2Locked}
                        />
                        <label htmlFor="selfie" className={`${isLevel2Locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="text-gray-500 dark:text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p>{t('profile.clickToUploadSelfie')}</p>
                          </div>
                        </label>
                      </div>
                      {kycErrors.selfie && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{kycErrors.selfie}</p>
                      )}
                      {level2Previews.selfie && (
                        <FilePreview
                          file={level2Previews.selfie}
                          onRemove={
                            isLevel2Locked
                              ? undefined
                              : () => {
                                  setLevel2Form({ ...level2Form, selfie: null });
                                  setLevel2Previews({ ...level2Previews, selfie: null });
                                  const saved = JSON.parse(localStorage.getItem('kyc_level2_files') || '{}');
                                  delete saved.selfie;
                                  localStorage.setItem('kyc_level2_files', JSON.stringify(saved));
                                }
                          }
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingKyc || isLevel2Locked}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                    >
                      {isLevel2Locked ? t('profile.level2Approved') : submittingKyc ? t('common.submitting') : t('profile.submitLevel2')}
                    </button>
                  </div>
                </form>
                  );
                })()}
              </div>
            )}

            {/* Level 3 Form */}
            {kycActiveLevel === 'level3' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Level 3: {t('profile.kycLevel3Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('profile.kycLevel3Desc')}
                </p>

                <form onSubmit={handleKycLevel3Submit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.additionalDocuments')}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={handleLevel3FileChange}
                        className="hidden"
                        id="additionalDocs"
                      />
                      <label htmlFor="additionalDocs" className="cursor-pointer">
                        <div className="text-gray-500 dark:text-gray-400">
                          <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p>{t('profile.clickToUploadAdditionalDocuments')}</p>
                          <p className="text-xs">{t('profile.max_5_files')}</p>
                        </div>
                      </label>
                    </div>
                    {kycErrors.additionalDocuments && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-2">{kycErrors.additionalDocuments}</p>
                    )}
                  </div>

                  {/* File Previews */}
                  {level3Previews.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Files ({level3Previews.length}/5)
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {level3Previews.map((file, index) => (
                          <FilePreview
                            key={index}
                            file={file}
                            onRemove={() => {
                              const newFiles = level3Previews.filter((_, i) => i !== index);
                              setLevel3Previews(newFiles);
                              setLevel3Form({ ...level3Form, additionalDocuments: newFiles });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.additionalNotes')}
                    </label>
                    <textarea
                      value={level3Form.notes}
                      onChange={(e) => setLevel3Form({ ...level3Form, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={t('profile.additionalNotesPlaceholder')}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingKyc}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                    >
                      {submittingKyc ? t('common.submitting') : t('profile.submitLevel3')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab - Not available for operators */}
      {user?.role !== 'operator' && activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('profile.recentActivity')}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                {t('profile.recentOrders')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View your order history on the{' '}
                <a href="/trading" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Trading page
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                {t('profile.walletTransactions')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View your wallet transactions on the{' '}
                <a href="/wallet" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Wallet page
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

