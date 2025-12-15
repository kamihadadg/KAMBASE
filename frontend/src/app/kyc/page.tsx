'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import api, { uploadApi } from '@/lib/api';

interface KycData {
  id: string;
  level: 'level1' | 'level2' | 'level3';
  status: 'pending' | 'approved' | 'rejected';
  level1Data?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
  };
  level2Data?: {
    nationalCardFront?: string;
    nationalCardBack?: string;
    selfie?: string;
  };
  level3Data?: {
    additionalDocuments?: string[];
    notes?: string;
  };
  dailyWithdrawLimit: number;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function KycPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [activeLevel, setActiveLevel] = useState<'level1' | 'level2' | 'level3'>('level1');

  // Form states for different levels
  const [level1Form, setLevel1Form] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
  });

  const [level2Form, setLevel2Form] = useState({
    nationalCardFront: null as File | null,
    nationalCardBack: null as File | null,
    selfie: null as File | null,
  });

  const [level3Form, setLevel3Form] = useState({
    additionalDocuments: [] as File[],
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'operator') {
      router.push('/dashboard');
      return;
    }

    fetchKycData();
  }, [isAuthenticated, user, router]);

  const fetchKycData = async () => {
    try {
      const response = await api.get('/kyc');
      setKycData(response.data);
      // Pre-fill forms with existing data
      if (response.data.level1Data) {
        setLevel1Form(response.data.level1Data);
      }
      if (response.data.level2Data) {
        // Handle existing file URLs
      }
    } catch (error: any) {
      // KYC not found, that's okay for new users
      if (error.response?.status !== 404) {
        console.error('Failed to fetch KYC:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLevel1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/kyc', {
        level1Data: level1Form,
      });
      setKycData(response.data);
      alert('Level 1 KYC submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLevel2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
          nationalCardFront: fileUrls[0] || '/uploads/placeholder.jpg',
          nationalCardBack: fileUrls[1] || '/uploads/placeholder.jpg',
          selfie: fileUrls[2] || '/uploads/placeholder.jpg',
        },
      });
      setKycData(response.data);
      alert('Level 2 KYC submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLevel3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
      setKycData(response.data);
      alert('Level 3 KYC submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading KYC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          KYC Verification
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Complete your identity verification to unlock higher withdrawal limits
        </p>
      </div>

      {/* Current Status */}
      {kycData && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                {kycData.level}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className={`text-lg font-medium capitalize ${
                kycData.status === 'approved'
                  ? 'text-green-600 dark:text-green-400'
                  : kycData.status === 'rejected'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {kycData.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Withdraw Limit</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                ${kycData.dailyWithdrawLimit}
              </p>
            </div>
          </div>

          {kycData.reviewNotes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Review Notes:</strong> {kycData.reviewNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Level Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {['level1', 'level2', 'level3'].map((level) => (
              <button
                key={level}
                onClick={() => setActiveLevel(level as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeLevel === level
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={
                  level === 'level2' && (!kycData || kycData.level !== 'level1' || kycData.status !== 'approved') ||
                  level === 'level3' && (!kycData || kycData.level !== 'level2' || kycData.status !== 'approved')
                }
              >
                Level {level.slice(-1)} - {
                  level === 'level1' ? 'Basic Info' :
                  level === 'level2' ? 'Document Upload' :
                  'Advanced Verification'
                }
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Level 1 Form */}
      {activeLevel === 'level1' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Level 1: Basic Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please provide your basic personal information to start the KYC process.
          </p>

          <form onSubmit={handleLevel1Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
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
                  Last Name
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
                  Date of Birth
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
                  Nationality
                </label>
                <select
                  value={level1Form.nationality}
                  onChange={(e) => setLevel1Form({ ...level1Form, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Nationality</option>
                  <option value="iran">Iran</option>
                  <option value="usa">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="canada">Canada</option>
                  <option value="germany">Germany</option>
                  <option value="france">France</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Level 1'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Level 2 Form */}
      {activeLevel === 'level2' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Level 2: Document Upload
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please upload clear photos of your national ID card and a selfie for identity verification.
          </p>

          <form onSubmit={handleLevel2Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  National Card Front
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLevel2Form({ ...level2Form, nationalCardFront: e.target.files?.[0] || null })}
                    className="hidden"
                    id="nationalCardFront"
                  />
                  <label htmlFor="nationalCardFront" className="cursor-pointer">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p>Click to upload front</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  National Card Back
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLevel2Form({ ...level2Form, nationalCardBack: e.target.files?.[0] || null })}
                    className="hidden"
                    id="nationalCardBack"
                  />
                  <label htmlFor="nationalCardBack" className="cursor-pointer">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p>Click to upload back</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selfie
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLevel2Form({ ...level2Form, selfie: e.target.files?.[0] || null })}
                    className="hidden"
                    id="selfie"
                  />
                  <label htmlFor="selfie" className="cursor-pointer">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p>Click to upload selfie</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Level 2'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Level 3 Form */}
      {activeLevel === 'level3' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Level 3: Advanced Verification
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            For maximum withdrawal limits, please provide additional documentation.
          </p>

          <form onSubmit={handleLevel3Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => setLevel3Form({
                    ...level3Form,
                    additionalDocuments: Array.from(e.target.files || [])
                  })}
                  className="hidden"
                  id="additionalDocs"
                />
                <label htmlFor="additionalDocs" className="cursor-pointer">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Click to upload additional documents</p>
                    <p className="text-xs">PDF, DOC, DOCX, JPG, PNG (Max 5 files)</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={level3Form.notes}
                onChange={(e) => setLevel3Form({ ...level3Form, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Any additional information you'd like to provide..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Level 3'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
