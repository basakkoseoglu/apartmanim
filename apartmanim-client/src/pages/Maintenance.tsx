import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/layout/Layout';
import { MaintenanceBadge, PriorityBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { mockMaintenanceRequests } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import type { MaintenanceRequest, MaintenanceForm, MaintenanceStatus } from '../types';

export function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Sakin yalnızca kendi taleplerini + genel listeyi görür
  const initialRequests = isAdmin
    ? mockMaintenanceRequests
    : mockMaintenanceRequests.filter(
        (r) => r.requesterId === user?.id || r.status !== 'completed'
      );

  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<MaintenanceRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus>('open');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceForm>();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const onAddSubmit = (data: MaintenanceForm) => {
    const newReq: MaintenanceRequest = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      location: data.location,
      priority: data.priority,
      status: 'open',
      requesterId: user?.id ?? 0,
      requesterName: user?.name ?? '',
      createdAt: new Date().toISOString(),
      apartmentId: 1,
    };
    setRequests((prev) => [newReq, ...prev]);
    setIsAddOpen(false);
    reset();
  };

  const openStatusModal = (req: MaintenanceRequest) => {
    setStatusModal(req);
    setSelectedStatus(req.status);
  };

  const applyStatus = () => {
    if (!statusModal) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === statusModal.id
          ? { ...r, status: selectedStatus, updatedAt: new Date().toISOString() }
          : r
      )
    );
    setStatusModal(null);
  };

  return (
    <Layout title="Arıza ve Bakım" subtitle="Sorun bildirimleri ve talep yönetimi">
      <div className="page-header">
        <div>
          <h1>Arıza ve Bakım</h1>
          <p>{filtered.length} talep</p>
        </div>
        <button className="btn btn-primary" onClick={() => { reset(); setIsAddOpen(true); }}>
          + Yeni Talep Oluştur
        </button>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-6" style={{ marginBottom: 'var(--space-6)' }}>
        {(['all', 'open', 'in_progress', 'completed'] as const).map((s) => {
          const labels: Record<typeof s, string> = {
            all: 'Tümü', open: 'Açık', in_progress: 'İnceleniyor', completed: 'Tamamlandı',
          };
          return (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStatus(s)}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* Talep Kartları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.length === 0 && (
          <div className="card">
            <div className="card-body table-empty">
              <div className="empty-icon">🔧</div>
              <p>Bu kategoride talep bulunmuyor.</p>
            </div>
          </div>
        )}

        {filtered.map((req) => (
          <div key={req.id} className="card">
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <h4>{req.title}</h4>
                  <MaintenanceBadge status={req.status} />
                  <PriorityBadge priority={req.priority} />
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  👤 {req.requesterName} &nbsp;·&nbsp; 📍 {req.location} &nbsp;·&nbsp; 📅 {formatDate(req.createdAt)}
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
              <p style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>{req.description}</p>
              {req.updatedAt && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)', marginTop: 'var(--space-3)' }}>
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
        onClose={() => { setIsAddOpen(false); reset(); }}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setIsAddOpen(false); reset(); }}>
              İptal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit(onAddSubmit)}>
              Gönder
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Başlık</label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Sorunun kısa açıklaması"
              {...register('title', { required: 'Başlık gereklidir.' })}
            />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Konum</label>
            <input
              className={`form-input ${errors.location ? 'error' : ''}`}
              placeholder="Örn: 3. Kat - Daire 7 önü"
              {...register('location', { required: 'Konum gereklidir.' })}
            />
            {errors.location && <span className="form-error">{errors.location.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Öncelik</label>
            <select className="form-select" {...register('priority')}>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Açıklama</label>
            <textarea
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Sorunu detaylı açıklayın..."
              rows={4}
              {...register('description', { required: 'Açıklama gereklidir.' })}
            />
            {errors.description && <span className="form-error">{errors.description.message}</span>}
          </div>
        </div>
      </Modal>

      {/* Durum Güncelleme Modalı (admin) */}
      <Modal
        isOpen={statusModal !== null}
        title={`Durum Güncelle — ${statusModal?.title}`}
        onClose={() => setStatusModal(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setStatusModal(null)}>
              İptal
            </button>
            <button className="btn btn-primary" onClick={applyStatus}>
              Kaydet
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Yeni Durum</label>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as MaintenanceStatus)}
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
