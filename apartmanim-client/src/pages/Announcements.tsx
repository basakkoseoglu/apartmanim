
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/layout/Layout';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcementsApi';

import type { Announcement, AnnouncementForm } from '../types';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AnnouncementForm>();

  // Duyuruları API üzerinden yükle
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError('');

        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Duyurular yüklenemedi.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnnouncements();
  }, []);

  // Tarihi Türkçe formatta göster
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  // Yeni duyuru ekleme modalını aç
  const openAdd = () => {
    setEditTarget(null);
    reset();
    setIsModalOpen(true);
  };

  // Düzenleme modalını mevcut verilerle aç
  const openEdit = (ann: Announcement) => {
    setEditTarget(ann);
    setValue('title', ann.title);
    setValue('content', ann.content);
    setIsModalOpen(true);
  };

  // Duyuru ekle veya güncelle
  const onSubmit = async (data: AnnouncementForm) => {
    try {
      if (editTarget) {
        const updatedAnnouncement = await updateAnnouncement(
          editTarget.id,
          data
        );

        setAnnouncements((prev) =>
          prev.map((ann) =>
            ann.id === updatedAnnouncement.id
              ? updatedAnnouncement
              : ann
          )
        );
      } else {
        const newAnnouncement = await createAnnouncement(data);

        setAnnouncements((prev) => [
          newAnnouncement,
          ...prev,
        ]);
      }

      setIsModalOpen(false);
      setEditTarget(null);
      reset();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Duyuru kaydedilemedi.'
      );
    }
  };

  // Duyuru sil
  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement(id);

      setAnnouncements((prev) =>
        prev.filter((ann) => ann.id !== id)
      );

      setDeleteConfirm(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Duyuru silinemedi.'
      );
    }
  };

  // Ekleme veya düzenleme modalını kapat
  const closeAnnouncementModal = () => {
    setIsModalOpen(false);
    setEditTarget(null);
    reset();
  };

  return (
    <Layout
      title="Duyurular"
      subtitle="Apartman duyurularını görüntüleyin ve yönetin"
    >
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

      {/* Duyuru listesi */}
      {isLoading && <p>Duyurular yükleniyor...</p>}

      {!isLoading && error && (
        <div className="card">
          <div className="card-body">
            <p className="form-error">{error}</p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {!isLoading && !error && announcements.length === 0 && (
          <div className="card">
            <div className="card-body table-empty">
              <div className="empty-icon">📢</div>
              <p>Henüz duyuru yok.</p>
            </div>
          </div>
        )}

        {!isLoading &&
          !error &&
          announcements.map((ann) => (
            <div key={ann.id} className="card">
              <div className="card-header">
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 'var(--space-1)' }}>
                    {ann.title}
                  </h4>

                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    👤 {ann.authorName} &nbsp;·&nbsp; 📅{' '}
                    {formatDate(ann.createdAt)}
                    {ann.updatedAt &&
                      ` · (güncellendi: ${formatDate(ann.updatedAt)})`}
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
                <p
                  style={{
                    lineHeight: 1.7,
                    color: 'var(--color-text)',
                  }}
                >
                  {ann.content}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Duyuru ekleme ve düzenleme modalı */}
      <Modal
        isOpen={isModalOpen}
        title={editTarget ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}
        onClose={closeAnnouncementModal}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={closeAnnouncementModal}
            >
              İptal
            </button>

            <button
              className="btn btn-primary"
              onClick={handleSubmit(onSubmit)}
            >
              {editTarget ? 'Güncelle' : 'Ekle'}
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
              placeholder="Duyuru başlığı"
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
            <label className="form-label">İçerik</label>

            <textarea
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Duyuru içeriği..."
              rows={5}
              {...register('content', {
                required: 'İçerik gereklidir.',
              })}
            />

            {errors.content && (
              <span className="form-error">
                {errors.content.message}
              </span>
            )}
          </div>
        </div>
      </Modal>

      {/* Duyuru silme onay modalı */}
      <Modal
        isOpen={deleteConfirm !== null}
        title="Duyuruyu Sil"
        onClose={() => setDeleteConfirm(null)}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setDeleteConfirm(null)}
            >
              İptal
            </button>

            <button
              className="btn btn-danger"
              onClick={() => {
                if (deleteConfirm !== null) {
                  void handleDelete(deleteConfirm);
                }
              }}
            >
              Evet, Sil
            </button>
          </>
        }
      >
        <p>
          Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem
          geri alınamaz.
        </p>
      </Modal>
    </Layout>
  );
}
