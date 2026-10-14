import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/layout/Layout';
import { Modal } from '../components/ui/Modal';
import { mockAnnouncements } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import type { Announcement, AnnouncementForm } from '../types';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AnnouncementForm>();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  // Yeni duyuru ekle / düzenle
  const openAdd = () => { setEditTarget(null); reset(); setIsModalOpen(true); };
  const openEdit = (ann: Announcement) => {
    setEditTarget(ann);
    setValue('title', ann.title);
    setValue('content', ann.content);
    setIsModalOpen(true);
  };

  const onSubmit = (data: AnnouncementForm) => {
    if (editTarget) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editTarget.id
            ? { ...a, title: data.title, content: data.content, updatedAt: new Date().toISOString() }
            : a
        )
      );
    } else {
      const newAnn: Announcement = {
        id: Date.now(),
        title: data.title,
        content: data.content,
        authorName: user?.name ?? 'Yönetici',
        createdAt: new Date().toISOString(),
        apartmentId: 1,
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
    }
    setIsModalOpen(false);
    reset();
  };

  const handleDelete = (id: number) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <Layout title="Duyurular" subtitle="Apartman duyurularını görüntüleyin ve yönetin">
      <div className="page-header">
        <div>
          <h1>Duyurular</h1>
          <p>Toplam {announcements.length} duyuru</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Yeni Duyuru
          </button>
        )}
      </div>

      {/* Duyuru Listesi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {announcements.length === 0 && (
          <div className="card">
            <div className="card-body table-empty">
              <div className="empty-icon">📢</div>
              <p>Henüz duyuru yok.</p>
            </div>
          </div>
        )}

        {announcements.map((ann) => (
          <div key={ann.id} className="card">
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: 'var(--space-1)' }}>{ann.title}</h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  👤 {ann.authorName} &nbsp;·&nbsp; 📅 {formatDate(ann.createdAt)}
                  {ann.updatedAt && ` · (güncellendi: ${formatDate(ann.updatedAt)})`}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openEdit(ann)}
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteConfirm(ann.id)}
                  >
                    🗑 Sil
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              <p style={{ lineHeight: 1.7, color: 'var(--color-text)' }}>{ann.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ekle / Düzenle Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editTarget ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}
        onClose={() => { setIsModalOpen(false); reset(); }}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setIsModalOpen(false); reset(); }}>
              İptal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>
              {editTarget ? 'Güncelle' : 'Ekle'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Başlık</label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Duyuru başlığı"
              {...register('title', { required: 'Başlık gereklidir.' })}
            />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">İçerik</label>
            <textarea
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Duyuru içeriği..."
              rows={5}
              {...register('content', { required: 'İçerik gereklidir.' })}
            />
            {errors.content && <span className="form-error">{errors.content.message}</span>}
          </div>
        </div>
      </Modal>

      {/* Silme Onayı Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        title="Duyuruyu Sil"
        onClose={() => setDeleteConfirm(null)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>
              İptal
            </button>
            <button className="btn btn-danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Evet, Sil
            </button>
          </>
        }
      >
        <p>Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
      </Modal>
    </Layout>
  );
}
