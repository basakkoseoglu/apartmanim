import { useMemo, useState, type FormEvent } from "react";
import { Layout } from "../components/layout/Layout";
import { Modal } from "../components/ui/Modal";
import { useBuilding } from "../context/BuildingContext";

type PageTab = "residents" | "units";
type OccupancyFilter = "all" | "occupied" | "vacant";

export function ResidentsPage() {
  const { floors, units, residents, addResident, removeResident } =
    useBuilding();

  const [activeTab, setActiveTab] = useState<PageTab>("residents");
  const [search, setSearch] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [occupancyFilter, setOccupancyFilter] =
    useState<OccupancyFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [formError, setFormError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const occupiedUnits = units.filter((unit) => unit.residentId !== null).length;

  const vacantUnits = units.length - occupiedUnits;

  const availableUnits = useMemo(
    () => units.filter((unit) => unit.residentId === null),
    [units],
  );

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const matchesSearch =
        resident.fullName.toLowerCase().includes(search.toLowerCase()) ||
        resident.email.toLowerCase().includes(search.toLowerCase());

      const matchesFloor =
        selectedFloor === "all" || resident.floorNo === Number(selectedFloor);

      return matchesSearch && matchesFloor;
    });
  }, [residents, search, selectedFloor]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesFloor =
        selectedFloor === "all" || unit.floorNo === Number(selectedFloor);

      const matchesOccupancy =
        occupancyFilter === "all" ||
        (occupancyFilter === "occupied" && unit.residentId !== null) ||
        (occupancyFilter === "vacant" && unit.residentId === null);

      const resident = residents.find((item) => item.id === unit.residentId);

      const matchesSearch =
        !search ||
        `daire ${unit.unitNo}`.includes(search.toLowerCase()) ||
        `kat ${unit.floorNo}`.includes(search.toLowerCase()) ||
        (resident?.fullName.toLowerCase().includes(search.toLowerCase()) ??
          false);

      return matchesFloor && matchesOccupancy && matchesSearch;
    });
  }, [units, residents, selectedFloor, occupancyFilter, search]);

  const openAddModal = () => {
    setFullName("");
    setEmail("");
    setSelectedUnitId("");
    setFormError("");
    setIsModalOpen(true);
    setTemporaryPassword("");
  };

  const handleAddResident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUnitId) {
      setFormError("Lütfen bir daire seç.");
      return;
    }

    if (temporaryPassword.length < 6) {
      setFormError("Geçici şifre en az 6 karakter olmalıdır.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const error = await addResident(
        fullName,
        email,
        Number(selectedUnitId),
        temporaryPassword,
      );

      if (error) {
        setFormError(error);
        return;
      }

      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setSelectedUnitId("");
      setTemporaryPassword("");
      setFormError("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveResident = async (residentId: number) => {
    const confirmed = window.confirm(
      "Bu sakini dairesinden ayırmak istediğine emin misin? Sakin hesabı silinmeyecek.",
    );

    if (!confirmed) return;

    const error = await removeResident(residentId);

    if (error) {
      window.alert(error);
    }
  };

  const getResidentName = (residentId: number | null) => {
    if (residentId === null) return null;

    return (
      residents.find((resident) => resident.id === residentId)?.fullName ?? null
    );
  };

  return (
    <Layout
      title="Sakin ve Daire Yönetimi"
      subtitle="Apartmandaki sakinleri ve dairelerin doluluk durumunu yönet."
    >
      <div className="grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon primary">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{floors.length}</div>
            <div className="stat-label">Kat Sayısı</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accent">🚪</div>
          <div className="stat-info">
            <div className="stat-value">{units.length}</div>
            <div className="stat-label">Toplam Daire</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">👥</div>
          <div className="stat-info">
            <div className="stat-value">{occupiedUnits}</div>
            <div className="stat-label">Dolu Daire</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">🔑</div>
          <div className="stat-info">
            <div className="stat-value">{vacantUnits}</div>
            <div className="stat-label">Boş Daire</div>
          </div>
        </div>
      </div>

      <div className="resident-floor-summary mb-8">
        <h3>Katlara Göre Daire Durumu</h3>

        {floors.length === 0 ? (
          <p>Henüz kat eklenmemiş.</p>
        ) : (
          <div className="resident-floor-grid">
            {floors.map((floorNo) => {
              const floorUnits = units.filter(
                (unit) => unit.floorNo === floorNo,
              );

              const floorOccupied = floorUnits.filter(
                (unit) => unit.residentId !== null,
              ).length;

              const percentage =
                floorUnits.length > 0
                  ? (floorOccupied / floorUnits.length) * 100
                  : 0;

              return (
                <div className="resident-floor-card" key={floorNo}>
                  <div className="resident-floor-heading">
                    <strong>{floorNo}. Kat</strong>
                    <span>
                      {floorOccupied}/{floorUnits.length} daire dolu
                    </span>
                  </div>

                  <div className="resident-floor-progress">
                    <div
                      className="resident-floor-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <small>{floorUnits.length - floorOccupied} boş daire</small>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="resident-list-header">
        <div>
          <h3>Yönetim</h3>
          <p className="resident-section-description">
            Sakinleri görüntüle veya dairelerin doluluk durumunu incele.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          + Sakin Ekle
        </button>
      </div>

      <div className="resident-tabs">
        <button
          className={`resident-tab ${
            activeTab === "residents" ? "active" : ""
          }`}
          onClick={() => setActiveTab("residents")}
        >
          Sakinler ({residents.length})
        </button>

        <button
          className={`resident-tab ${activeTab === "units" ? "active" : ""}`}
          onClick={() => setActiveTab("units")}
        >
          Daireler ({units.length})
        </button>
      </div>

      <div className="resident-filters">
        <input
          type="text"
          className="form-input"
          placeholder={
            activeTab === "residents"
              ? "Sakin adı veya e-posta ara..."
              : "Daire veya sakin ara..."
          }
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="form-input"
          value={selectedFloor}
          onChange={(event) => setSelectedFloor(event.target.value)}
        >
          <option value="all">Tüm Katlar</option>
          {floors.map((floorNo) => (
            <option key={floorNo} value={floorNo}>
              {floorNo}. Kat
            </option>
          ))}
        </select>

        {activeTab === "units" && (
          <select
            className="form-input"
            value={occupancyFilter}
            onChange={(event) =>
              setOccupancyFilter(event.target.value as OccupancyFilter)
            }
          >
            <option value="all">Tüm Daireler</option>
            <option value="occupied">Dolu Daireler</option>
            <option value="vacant">Boş Daireler</option>
          </select>
        )}
      </div>

      {activeTab === "residents" ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Kat</th>
                <th>Daire</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filteredResidents.map((resident) => (
                <tr key={resident.id}>
                  <td>{resident.fullName}</td>
                  <td>{resident.email}</td>
                  <td>
                    {resident.unitId ? `${resident.floorNo}. Kat` : "Atanmadı"}
                  </td>
                  <td>
                    {resident.unitId
                      ? `${resident.unitNo} numaralı daire`
                      : "Atanmadı"}
                  </td>
                  <td>
                    <span className="status-badge status-success">Aktif</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveResident(resident.id)}
                    >
                      Sakini Sil
                    </button>
                  </td>
                </tr>
              ))}

              {filteredResidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Aramana uygun sakin bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kat</th>
                <th>Daire No</th>
                <th>Sakin</th>
                <th>Doluluk</th>
              </tr>
            </thead>

            <tbody>
              {filteredUnits.map((unit) => {
                const residentName = getResidentName(unit.residentId);
                const isOccupied = unit.residentId !== null;

                return (
                  <tr key={unit.id}>
                    <td>{unit.floorNo}. Kat</td>
                    <td>{unit.unitNo}</td>
                    <td>{residentName ?? "—"}</td>
                    <td>
                      <span
                        className={
                          isOccupied
                            ? "status-badge status-success"
                            : "resident-status-vacant"
                        }
                      >
                        {isOccupied ? "Dolu" : "Boş"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Filtrelere uygun daire bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title="Yeni Sakin Ekle"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              İptal
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="add-resident-form"
              disabled={isSubmitting || availableUnits.length === 0}
            >
              {isSubmitting ? "Ekleniyor..." : "Sakini Ekle"}
            </button>
          </>
        }
      >
        <form id="add-resident-form" onSubmit={handleAddResident}>
          <div className="form-group">
            <label htmlFor="resident-name">Ad Soyad</label>
            <input
              id="resident-name"
              className="form-input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Örn. Ahmet Yılmaz"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="resident-email">E-posta</label>
            <input
              id="resident-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="resident-password">Geçici Şifre</label>
            <input
              id="resident-password"
              type="password"
              className="form-input"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              placeholder="En az 6 karakter"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <small>
              Sakin, ilk girişinde bu şifreyi kullanacak ve ardından şifresini
              değiştirecek.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="resident-unit">Daire Seç</label>
            <select
              id="resident-unit"
              className="form-input"
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              required
            >
              <option value="">Boş bir daire seç</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.floorNo}. Kat - {unit.unitNo} numaralı daire
                </option>
              ))}
            </select>

            {availableUnits.length === 0 && (
              <small>Şu anda atanabilecek boş daire bulunmuyor.</small>
            )}
          </div>

          {formError && <p className="form-error">{formError}</p>}
        </form>
      </Modal>
    </Layout>
  );
}
