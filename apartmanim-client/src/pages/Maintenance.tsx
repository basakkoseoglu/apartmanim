
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/layout/Layout';
import { MaintenanceBadge, PriorityBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import {
  getAllMaintenanceRequests,
  getMyMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequestStatus,
} from '../api/maintenanceApi';
import type {
  MaintenanceRequest,
  MaintenanceForm,
  MaintenanceStatus,
} from '../types';

export function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [statusModal, setStatusModal] =
    useState<MaintenanceRequest | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<MaintenanceStatus>('open');
  const [filterStatus, setFilterStatus] =
    useState<MaintenanceStatus | 'all'>('all');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceForm>({
    defaultValues: {
      priority: 'medium',
    },
  });

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRequests() {
      setIsLoading(true);
      setError('');

      try {
        const data = isAdmin
          ? await getAllMaintenanceRequests()
          : await getMyMaintenanceRequests();

        if (!cancelled) {
          setRequests(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Arıza talepleri yüklenemedi.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const filtered =
    filterStatus === 'all'
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const onAddSubmit = async (data: MaintenanceForm) => {
    setIsSaving(true);
    setError('');

    try {
      const newRequest = await createMaintenanceRequest(data);

      setRequests((prev) => [newRequest, ...prev]);
      setIsAddOpen(false);
      reset({ priority: 'medium' });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Talep oluşturulamadı.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusModal = (req: MaintenanceRequest) => {
    setStatusModal(req);
    setSelectedStatus(req.status);
    setError('');
  };

  const applyStatus = async () => {
    if (!statusModal || isSaving) return;

    setIsSaving(true);
    setError('');

    try {
      await updateMaintenanceRequestStatus(
        statusModal.id,
        selectedStatus,
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === statusModal.id
            ? {
                ...r,
                status: selectedStatus,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      setStatusModal(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Talep durumu güncellenemedi.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout
      title="Arıza ve Bakım"
      subtitle="Sorun bildirimleri ve talep yönetimi"
    >
      <div className="page-header">
        <div>
          <h1>Arıza ve Bakım</h1>
          <p>{filtered.length} talep</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setError('');
            reset({ priority: 'medium' });
            setIsAddOpen(true);
          }}
        >
          + Yeni Talep Oluştur
        </button>
      </div>

      {error && (
        <div
          className="card"
          role="alert"
          style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-4)',
            color: 'var(--color-danger, #dc2626)',
          }}
        >
          {error}
        </div>
      )}

      {/* Filtre */}
      <div
        className="flex gap-2 mb-6"
        style={{ marginBottom: 'var(--space-6)' }}
      >
        {(['all', 'open', 'in_progress', 'completed'] as const).map(
          (s) => {
            const labels: Record<typeof s, string> = {
              all: 'Tümü',
              open: 'Açık',
              in_progress: 'İnceleniyor',
              completed: 'Tamamlandı',
            };

            return (
              <button
                key={s}
                className={`btn btn-sm ${
                  filterStatus === s ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => setFilterStatus(s)}
              >
                {labels[s]}
              </button>
            );
          },
        )}
      </div>

      {/* Talep Kartları */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {isLoading && (
          <div className="card">
            <div className="card-body table-empty">
              <p>Arıza talepleri yükleniyor...</p>
            </div>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="card">
            <div className="card-body table-empty">
              <div className="empty-icon">🔧</div>
              <p>Bu kategoride talep bulunmuyor.</p>
            </div>
          </div>
        )}

        {!isLoading &&
          filtered.map((req) => (
            <div key={req.id} className="card">
              <div className="card-header">
                <div style={{ flex: 1 }}>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      marginBottom: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h4>{req.title}</h4>
                    <MaintenanceBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                  </div>

                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    👤 {req.requesterName} &nbsp;·&nbsp; 📍 {req.location}
                    &nbsp;·&nbsp; 📅 {formatDate(req.createdAt)}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openStatusModal(req)}
                  >
                    Durum Güncelle
                  </button>
                )}
              </div>

              <div className="card-body">
                <p
                  style={{
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                  }}
                >
                  {req.description}
                </p>

                {req.updatedAt && (
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-light)',
                      marginTop: 'var(--space-3)',
                    }}
                  >
                    Son güncelleme: {formatDate(req.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Yeni Talep Modalı */}
      <Modal
        isOpen={isAddOpen}
        title="Yeni Talep Oluştur"
        onClose={() => {
          if (isSaving) return;
          setIsAddOpen(false);
          reset({ priority: 'medium' });
        }}
        footer={
          <>
            <button
              className="btn btn-outline"
              disabled={isSaving}
              onClick={() => {
                setIsAddOpen(false);
                reset({ priority: 'medium' });
              }}
            >
              İptal
            </button>

            <button
              className="btn btn-primary"
              disabled={isSaving}
              onClick={handleSubmit(onAddSubmit)}
            >
              {isSaving ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div className="form-group">
            <label className="form-label">Başlık</label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Sorunun kısa açıklaması"
              {...register('title', {
                required: 'Başlık gereklidir.',
              })}
            />
            {errors.title && (
              <span className="form-error">
                {errors.title.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Konum</label>
            <input
              className={`form-input ${errors.location ? 'error' : ''}`}
              placeholder="Örn: 3. Kat - Daire 7 önü"
              {...register('location', {
                required: 'Konum gereklidir.',
              })}
            />
            {errors.location && (
              <span className="form-error">
                {errors.location.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Öncelik</label>
            <select
              className="form-select"
              {...register('priority', { required: true })}
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Açıklama</label>
            <textarea
              className={`form-textarea ${
                errors.description ? 'error' : ''
              }`}
              placeholder="Sorunu detaylı açıklayın..."
              rows={4}
              {...register('description', {
                required: 'Açıklama gereklidir.',
              })}
            />
            {errors.description && (
              <span className="form-error">
                {errors.description.message}
              </span>
            )}
          </div>
        </div>
      </Modal>

      {/* Durum Güncelleme Modalı (admin) */}
      <Modal
        isOpen={statusModal !== null}
        title={`Durum Güncelle — ${statusModal?.title}`}
        onClose={() => {
          if (!isSaving) setStatusModal(null);
        }}
        footer={
          <>
            <button
              className="btn btn-outline"
              disabled={isSaving}
              onClick={() => setStatusModal(null)}
            >
              İptal
            </button>

            <button
              className="btn btn-primary"
              disabled={isSaving}
              onClick={applyStatus}
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Yeni Durum</label>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as MaintenanceStatus)
            }
          >
            <option value="open">🔴 Açık</option>
            <option value="in_progress">🟡 İnceleniyor</option>
            <option value="completed">🟢 Tamamlandı</option>
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
