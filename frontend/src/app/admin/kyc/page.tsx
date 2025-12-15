'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';

interface KycRecord {
  id: string;
  userId: string;
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
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

function AdminKycPageContent() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();
  const [loading, setLoading] = useState(true);
  const [kycRecords, setKycRecords] = useState<KycRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '';
  const resolveUrl = (url?: string | null, userId?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const clean = url.startsWith('/') ? url.substring(1) : url;
    const prefix = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;

    // If already contains user folder, just prefix backend base if missing
    if (clean.startsWith('uploads/user-')) {
      return `${prefix}/${clean}`;
    }

    // If generic uploads path or bare filename, add user folder if available
    const filename = clean.replace(/^uploads\//, '');
    if (userId) {
      return `${prefix}/uploads/user-${userId}/${filename}`;
    }

    // Fallback to generic uploads
    return `${prefix}/uploads/${filename}`;
  };

  useEffect(() => {
    fetchKycRecords();
  }, [selectedStatus]);

  const fetchKycRecords = async () => {
    try {
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const response = await api.get('/kyc/all', { params: { status } });
      setKycRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setSubmitting(true);
    try {
      await api.post(`/kyc/${userId}/approve`, {
        notes: reviewNotes || 'KYC approved successfully',
      });
      setSelectedRecord(null);
      setReviewNotes('');
      fetchKycRecords();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!reviewNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/kyc/${userId}/reject`, {
        notes: reviewNotes,
      });
      setSelectedRecord(null);
      setReviewNotes('');
      fetchKycRecords();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('admin.kyc.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('admin.kyc.title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('admin.kyc.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t(`admin.kyc.filters.${status}`)} ({kycRecords.filter(r => status === 'all' || r.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* KYC Records Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.level')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.withdrawLimit')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.submitted')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.kyc.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {kycRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.user.firstName} {record.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {record.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {record.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : record.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${record.dailyWithdrawLimit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {record.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Review
                        </button>
                      </div>
                    )}
                    {record.status !== 'pending' && (
                      <span className="text-gray-400">{t('common.reviewed')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {kycRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('admin.kyc.noRecords')}</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('admin.kyc.modal.title')} - {selectedRecord.user.firstName} {selectedRecord.user.lastName}
            </h2>

            {/* User Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('profile.personalInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('auth.email')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.kyc.table.level')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.level}</p>
                </div>
              </div>
            </div>

            {/* Level 1 Data */}
            {selectedRecord.level1Data && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.kyc.modal.level1')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.firstName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.level1Data.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.lastName')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.level1Data.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.dateOfBirth')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.level1Data.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.nationality')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.level1Data.nationality}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Level 2 Data */}
            {selectedRecord.level2Data && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.kyc.modal.level2')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedRecord.level2Data?.nationalCardFront && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('profile.nationalCardFront')}</p>
                      <img
                        src={resolveUrl(selectedRecord.level2Data.nationalCardFront, selectedRecord.user.id)}
                        alt="National Card Front"
                        className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        onClick={() => setPreviewImage(selectedRecord.level2Data!.nationalCardFront!)}
                      />
                    </div>
                  )}
                  {selectedRecord.level2Data?.nationalCardBack && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('profile.nationalCardBack')}</p>
                      <img
                        src={resolveUrl(selectedRecord.level2Data.nationalCardBack, selectedRecord.user.id)}
                        alt="National Card Back"
                        className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        onClick={() => setPreviewImage(selectedRecord.level2Data!.nationalCardBack!)}
                      />
                    </div>
                  )}
                  {selectedRecord.level2Data?.selfie && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('profile.selfie')}</p>
                      <img
                        src={resolveUrl(selectedRecord.level2Data.selfie, selectedRecord.user.id)}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        onClick={() => setPreviewImage(selectedRecord.level2Data!.selfie!)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Level 3 Data */}
            {selectedRecord.level3Data && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.kyc.modal.level3')}</h3>
                {selectedRecord.level3Data.additionalDocuments && selectedRecord.level3Data.additionalDocuments.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('profile.additionalDocuments')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedRecord.level3Data.additionalDocuments.map((doc, index) => (
                        <div key={index}>
                          <img
                            src={resolveUrl(doc, selectedRecord.user.id)}
                            alt={`Document ${index + 1}`}
                            className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            onClick={() => setPreviewImage(doc)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRecord.level3Data.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('profile.additionalNotes')}</p>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                      {selectedRecord.level3Data.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Review Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.kyc.modal.reviewNotes')} *
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={t('admin.kyc.modal.reviewNotesPlaceholder')}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={submitting}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleReject(selectedRecord.userId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                disabled={submitting || !reviewNotes.trim()}
              >
                {submitting ? t('admin.kyc.modal.rejecting') : t('admin.kyc.modal.reject')}
              </button>
              <button
                onClick={() => handleApprove(selectedRecord.userId)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                disabled={submitting}
              >
                {submitting ? t('admin.kyc.modal.approving') : t('admin.kyc.modal.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Image Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
              <div className="relative max-w-5xl w-full max-h-[90vh] bg-transparent">
                <button
                  className="absolute -top-10 right-0 text-white hover:text-gray-200"
                  onClick={() => setPreviewImage(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveUrl(previewImage, selectedRecord?.user.id)}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg shadow-2xl bg-black"
                />
              </div>
            </div>
          )}
    </div>
  );
}

export default function AdminKycPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminKycPageContent />
    </AuthGuard>
  );
}
