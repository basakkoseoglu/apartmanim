import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FloorInput {
  floorNo: number;
  unitCount: number;
}

interface UnitOption {
  id: number;
  floorNo: number;
  unitNo: number;
  residentName: string | null;
}

const API_URL = "http://localhost:5285/api/Apartments";

export function ApartmentSetupPage() {
  const navigate = useNavigate();
  const { refreshSetupStatus } = useAuth();
  const [apartmentName, setApartmentName] = useState("");
  const [apartmentAddress, setApartmentAddress] = useState("");
  const [apartmentCreated, setApartmentCreated] = useState(false);
  const [floors, setFloors] = useState<FloorInput[]>([
    { floorNo: 1, unitCount: 4 },
    { floorNo: 2, unitCount: 4 },
    { floorNo: 3, unitCount: 4 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planCreated, setPlanCreated] = useState(false);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const updateFloor = (
    index: number,
    field: keyof FloorInput,
    value: number,
  ) => {
    setFloors((current) =>
      current.map((floor, i) =>
        i === index ? { ...floor, [field]: value } : floor,
      ),
    );
  };

  const addFloor = () => {
    setFloors((current) => [
      ...current,
      {
        floorNo: Math.max(0, ...current.map((floor) => floor.floorNo)) + 1,
        unitCount: 4,
      },
    ]);
  };

  const removeFloor = (index: number) => {
    setFloors((current) => current.filter((_, i) => i !== index));
  };

  const totalUnits = floors.reduce(
    (total, floor) => total + floor.unitCount,
    0,
  );

  const handleCreateApartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("apartmanim_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: apartmentName,
          address: apartmentAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Apartman oluşturulamadı.");
        return;
      }

      // Apartman oluşturuldu. Güncel ApartmentId içeren token'ı al.
      const refreshResponse = await fetch(
        "http://localhost:5285/api/Auth/refresh-token",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        setError(
          "Apartman oluşturuldu ancak oturum yenilenemedi. Çıkış yapıp tekrar giriş yapmalısın.",
        );
        return;
      }

      localStorage.setItem("apartmanim_token", refreshData.token);
      setApartmentCreated(true);
    } catch {
      setError("Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      floors.length === 0 ||
      floors.some(
        (floor) =>
          !Number.isInteger(floor.floorNo) ||
          floor.floorNo <= 0 ||
          !Number.isInteger(floor.unitCount) ||
          floor.unitCount <= 0 ||
          floor.unitCount > 200,
      )
    ) {
      setError("Kat ve daire sayıları geçerli olmalıdır.");
      return;
    }

    if (new Set(floors.map((floor) => floor.floorNo)).size !== floors.length) {
      setError("Kat numaraları birbirinden farklı olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("apartmanim_token");

      const response = await fetch(`${API_URL}/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          floors: floors.map((floor) => ({
            floorNo: floor.floorNo,
            unitCount: floor.unitCount,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Apartman kurulumu tamamlanamadı.");
        return;
      }

      // Oluşturulan daireleri API'den getir.
      const unitsResponse = await fetch("http://localhost:5285/api/units", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const unitsData = await unitsResponse.json();

      if (!unitsResponse.ok) {
        setError("Daireler oluşturuldu ancak daire listesi alınamadı.");
        return;
      }

      setUnits(unitsData);
      setPlanCreated(true);
    } catch {
      setError("Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedUnitId) {
      setError("Lütfen kendin için bir daire seç.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("apartmanim_token");

      const response = await fetch(
        `http://localhost:5285/api/units/${selectedUnitId}/assign-admin`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Daire ataması yapılamadı.");
        return;
      }

      await refreshSetupStatus();
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="setup-page">
      <section className="setup-container">
        <header className="setup-brand">
          <div className="setup-brand-mark">A</div>
          <div>
            <h1>Apartmanım</h1>
            <p>Dijital apartman yönetimi</p>
          </div>
        </header>

        <div className="setup-progress">
          <div
            className={`setup-step ${!apartmentCreated ? "active" : "completed"}`}
          >
            <span>{apartmentCreated ? "✓" : "1"}</span>
            <div>
              <strong>Apartman bilgileri</strong>
              <small>Ad ve adres</small>
            </div>
          </div>

          <div
            className={`setup-step ${
              apartmentCreated && !planCreated
                ? "active"
                : planCreated
                  ? "completed"
                  : ""
            }`}
          >
            <span>{planCreated ? "✓" : "2"}</span>
            <div>
              <strong>Kat ve daireler</strong>
              <small>Daire planı</small>
            </div>
          </div>

          <div className={`setup-step ${planCreated ? "active" : ""}`}>
            <span>3</span>
            <div>
              <strong>Yönetici dairesi</strong>
              <small>Kendi dairenizi seçin</small>
            </div>
          </div>
        </div>

        <section className="card setup-card">
          <div className="setup-card-heading">
            <span className="setup-eyebrow">İLK KURULUM</span>

            <h2>
              {!apartmentCreated
                ? "Apartmanını tanımla"
                : !planCreated
                  ? "Apartman planını oluştur"
                  : "Yönetici dairesini seç"}
            </h2>

            <p>
              {!apartmentCreated
                ? "Apartman bilgilerini girerek dijital yönetim alanını oluşturmaya başla."
                : !planCreated
                  ? "Katları ve her kattaki daire sayısını belirle. Daireler otomatik oluşturulacaktır."
                  : "Yöneticisi olduğun apartmandaki kendi daire numaranı seç."}
            </p>
          </div>

          {!apartmentCreated ? (
            <form className="setup-form" onSubmit={handleCreateApartment}>
              <div className="form-group">
                <label className="form-label" htmlFor="apartmentName">
                  Apartman adı
                </label>
                <input
                  id="apartmentName"
                  className="form-input"
                  type="text"
                  placeholder="Örn. Güneş Apartmanı"
                  value={apartmentName}
                  onChange={(event) => setApartmentName(event.target.value)}
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apartmentAddress">
                  Açık adres
                </label>
                <textarea
                  id="apartmentAddress"
                  className="form-textarea setup-address"
                  placeholder="Mahalle, cadde, sokak ve bina numarası"
                  value={apartmentAddress}
                  onChange={(event) => setApartmentAddress(event.target.value)}
                  minLength={5}
                  maxLength={300}
                  rows={3}
                  required
                />
                <span className="setup-hint">
                  Apartmanınızın adresini eksiksiz girin.
                </span>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg setup-submit"
                disabled={loading}
              >
                {loading ? "Apartman oluşturuluyor..." : "Devam Et"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          ) : !planCreated ? (
            <form className="setup-form" onSubmit={handleSubmit}>
              <div className="setup-floor-list">
                {floors.map((floor, index) => (
                  <div className="setup-floor-row" key={index}>
                    <div className="setup-floor-number">
                      <span>Kat</span>
                      <strong>{index + 1}</strong>
                    </div>

                    <div className="form-group setup-floor-field">
                      <label className="form-label" htmlFor={`floor-${index}`}>
                        Kat numarası
                      </label>
                      <input
                        id={`floor-${index}`}
                        className="form-input"
                        type="number"
                        min="1"
                        value={floor.floorNo}
                        onChange={(event) =>
                          updateFloor(
                            index,
                            "floorNo",
                            Number(event.target.value),
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-group setup-floor-field">
                      <label className="form-label" htmlFor={`units-${index}`}>
                        Daire sayısı
                      </label>
                      <input
                        id={`units-${index}`}
                        className="form-input"
                        type="number"
                        min="1"
                        max="200"
                        value={floor.unitCount}
                        onChange={(event) =>
                          updateFloor(
                            index,
                            "unitCount",
                            Number(event.target.value),
                          )
                        }
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost setup-remove"
                      onClick={() => removeFloor(index)}
                      aria-label={`${floor.floorNo}. katı kaldır`}
                      title="Katı kaldır"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline setup-add-floor"
                onClick={addFloor}
                disabled={floors.length >= 100}
              >
                <span>+</span> Kat Ekle
              </button>

              <div className="setup-total">
                <div>
                  <span>Toplam kat</span>
                  <strong>{floors.length}</strong>
                </div>
                <div>
                  <span>Toplam daire</span>
                  <strong>{totalUnits}</strong>
                </div>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg setup-submit"
                disabled={loading}
              >
                {loading ? "Kurulum yapılıyor..." : "Kurulumu Tamamla"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          ) : (
            <form className="setup-form" onSubmit={handleAssignAdmin}>
              <div className="form-group">
                <label className="form-label" htmlFor="adminUnit">
                  Daire numaranız
                </label>

                <select
                  id="adminUnit"
                  className="form-input"
                  value={selectedUnitId}
                  onChange={(event) => setSelectedUnitId(event.target.value)}
                  required
                >
                  <option value="">Daire seçin</option>

                  {units.map((unit) => (
                    <option
                      key={unit.id}
                      value={unit.id}
                      disabled={!!unit.residentName}
                    >
                      {unit.floorNo}. Kat - {unit.unitNo} No'lu Daire
                      {unit.residentName ? " (Dolu)" : ""}
                    </option>
                  ))}
                </select>

                <span className="setup-hint">
                  Seçtiğiniz daire yönetici hesabınızla ilişkilendirilecektir.
                </span>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg setup-submit"
                disabled={loading || !selectedUnitId}
              >
                {loading ? "Atama yapılıyor..." : "Kurulumu Tamamla"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}
        </section>

        <p className="setup-footer">
          Apartmanım <span>·</span> Apartman yönetimini kolaylaştırır
        </p>
      </section>
    </main>
  );
}
