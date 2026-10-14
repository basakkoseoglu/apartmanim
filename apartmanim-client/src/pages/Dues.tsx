import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { DueBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { mockDues } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import type { Due, DueStatus } from '../types';

export function DuesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Sakin sadece kendi kaydını görür
  const initialDues = isAdmin
    ? mockDues
    : mockDues.filter((d) => d.unitId === user?.unitId);

  const [dues, setDues] = useState<Due[]>(initialDues);
  const [statusModal, setStatusModal] = useState<Due | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DueStatus>('pending');

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

  const openStatusModal = (due: Due) => {
    setStatusModal(due);
    setSelectedStatus(due.status);
  };

  const applyStatus = () => {
    if (!statusModal) return;
    setDues((prev) =>
      prev.map((d) =>
        d.id === statusModal.id
          ? {
              ...d,
              status: selectedStatus,
              paidDate: selectedStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
            }
          : d
      )
    );
    setStatusModal(null);
  };

  // Özet sayıları
  const total   = dues.length;
  const paid    = dues.filter((d) => d.status === 'paid').length;
  const pending = dues.filter((d) => d.status === 'pending').length;
  const overdue = dues.filter((d) => d.status === 'overdue').length;

  return (
    <Layout title="Aidatlar" subtitle="Daire aidat kayıtları ve ödeme durumları">
      <div className="page-header">
        <div>
          <h1>Aidatlar</h1>
          <p>Ekim 2024 dönemi</p>
        </div>
      </div>

      {/* Özet */}
      {isAdmin && (
        <div className="grid-4 mb-8">
          <div className="stat-card">
            <div className="stat-icon primary">🏢</div>
            <div className="stat-info">
              <div className="stat-value">{total}</div>
              <div className="stat-label">Toplam Daire</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">✅</div>
            <div className="stat-info">
              <div className="stat-value">{paid}</div>
              <div className="stat-label">Ödendi</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{pending}</div>
              <div className="stat-label">Bekliyor</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon error">⚠️</div>
            <div className="stat-info">
              <div className="stat-value">{overdue}</div>
              <div className="stat-label">Gecikti</div>
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💰 Aidat Listesi</span>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {dues.length} kayıt
          </span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Daire</th>
                <th>Sakin Adı</th>
                <th>Tutar</th>
                <th>Son Ödeme</th>
                <th>Ödeme Tarihi</th>
                <th>Durum</th>
                {isAdmin && <th>İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {dues.map((due) => (
                <tr key={due.id}>
                  <td style={{ fontWeight: 600 }}>{due.unitNumber}</td>
                  <td>{due.residentName}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatAmount(due.amount)}
                  </td>
                  <td>{formatDate(due.dueDate)}</td>
                  <td>
                    {due.paidDate ? formatDate(due.paidDate) : (
                      <span style={{ color: 'var(--color-text-light)' }}>—</span>
                    )}
                  </td>
                  <td><DueBadge status={due.status} /></td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openStatusModal(due)}
                      >
                        Güncelle
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Durum Güncelleme Modalı */}
      <Modal
        isOpen={statusModal !== null}
        title={`Durum Güncelle — ${statusModal?.unitNumber}`}
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
            onChange={(e) => setSelectedStatus(e.target.value as DueStatus)}
          >
            <option value="pending">⏳ Bekliyor</option>
            <option value="paid">✅ Ödendi</option>
            <option value="overdue">⚠️ Gecikti</option>
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
