
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface Resident {
  id: number;
  fullName: string;
  email: string;
  unitId: number;
  floorNo: number;
  unitNo: number;
  status: 'active' | 'pending';
}

export interface UnitOption {
  id: number;
  floorNo: number;
  unitNo: number;
  residentId: number | null;
}

interface ApiResident {
  id: number;
  fullName: string;
  email: string;
  unit: {
    id: number;
    floorNo: number;
    unitNo: number;
  } | null;
}

interface ApiUnit {
  id: number;
  floorNo: number;
  unitNo: number;
  residentId: number | null;
  residentName: string | null;
}

interface BuildingContextType {
  floors: number[];
  units: UnitOption[];
  residents: Resident[];
  addFloor: (floorNo: number) => void;
  addUnits: (floorNo: number, count: number) => void;
  addResident: (
  fullName: string,
  email: string,
  unitId: number,
  temporaryPassword: string,
) => Promise<string | null>;
  removeResident: (residentId: number) => Promise<string | null>;
  
}

const API_URL = 'http://localhost:5285/api';

const BuildingContext = createContext<BuildingContextType | undefined>(
  undefined,
);

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [floors, setFloors] = useState<number[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    const loadBuildingData = async () => {
      const token = localStorage.getItem('apartmanim_token');

      if (!token) {
        console.error('Apartman verileri için giriş tokenı bulunamadı.');
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [unitsResponse, residentsResponse] = await Promise.all([
          fetch(`${API_URL}/units`, { headers }),
          fetch(`${API_URL}/Auth/residents`, { headers }),
        ]);

        if (!unitsResponse.ok || !residentsResponse.ok) {
          throw new Error(
            `API hatası. Daireler: ${unitsResponse.status}, Sakinler: ${residentsResponse.status}`,
          );
        }

        const apiUnits: ApiUnit[] = await unitsResponse.json();
        const apiResidents: ApiResident[] =
          await residentsResponse.json();

        const mappedUnits: UnitOption[] = apiUnits.map((unit) => ({
          id: unit.id,
          floorNo: unit.floorNo,
          unitNo: unit.unitNo,
          residentId: unit.residentId,
        }));

        const mappedResidents: Resident[] = apiResidents.map(
          (resident) => ({
            id: resident.id,
            fullName: resident.fullName,
            email: resident.email,
            unitId: resident.unit?.id ?? 0,
            floorNo: resident.unit?.floorNo ?? 0,
            unitNo: resident.unit?.unitNo ?? 0,
            status: resident.unit ? 'active' : 'pending',
          }),
        );

        setUnits(mappedUnits);
        setResidents(mappedResidents);
        setFloors(
          [...new Set(mappedUnits.map((unit) => unit.floorNo))].sort(
            (a, b) => a - b,
          ),
        );
      } catch (error) {
        console.error('Apartman verileri yüklenemedi:', error);
      }
    };

    void loadBuildingData();
  }, []);

  const addFloor = (floorNo: number) => {
    setFloors((current) =>
      current.includes(floorNo)
        ? current
        : [...current, floorNo].sort((a, b) => a - b),
    );
  };

  const addUnits = (floorNo: number, count: number) => {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Daire sayısı en az 1 olmalıdır.');
    }

    const existingNumbers = units
      .filter((unit) => unit.floorNo === floorNo)
      .map((unit) => unit.unitNo);

    const newNumbers: number[] = [];
    let candidate = 1;

    while (newNumbers.length < count) {
      if (
        !existingNumbers.includes(candidate) &&
        !newNumbers.includes(candidate)
      ) {
        newNumbers.push(candidate);
      }

      candidate++;
    }

    setFloors((current) =>
      current.includes(floorNo)
        ? current
        : [...current, floorNo].sort((a, b) => a - b),
    );

    setUnits((current) => {
      const firstId = Math.max(0, ...current.map((unit) => unit.id)) + 1;

      return [
        ...current,
        ...newNumbers.map((unitNo, index) => ({
          id: firstId + index,
          floorNo,
          unitNo,
          residentId: null,
        })),
      ];
    });
  };

  const addResident = async (
  fullName: string,
  email: string,
  unitId: number,
  temporaryPassword: string,
): Promise<string | null> => {
  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !temporaryPassword) {
    return 'Tüm alanları doldurmalısın.';
  }

  const selectedUnit = units.find((unit) => unit.id === unitId);

  if (!selectedUnit || selectedUnit.residentId !== null) {
    return 'Seçilen daire bulunamadı veya dolu.';
  }

  const token = localStorage.getItem('apartmanim_token');

  if (!token) {
    return 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yap.';
  }

  try {
    const response = await fetch(`${API_URL}/Auth/residents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: normalizedName,
        email: normalizedEmail,
        unitId,
        temporaryPassword,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let message = 'Sakin eklenemedi.';

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          message =
            errorData.message ??
            errorData.title ??
            errorData.detail ??
            message;
        } catch {
          message = responseText;
        }
      }

      return message;
    }

    // Kayıt başarılı: güncel verileri API'den tekrar al.
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [unitsResponse, residentsResponse] = await Promise.all([
      fetch(`${API_URL}/units`, { headers }),
      fetch(`${API_URL}/Auth/residents`, { headers }),
    ]);

    if (!unitsResponse.ok || !residentsResponse.ok) {
      return 'Sakin eklendi ancak liste yenilenemedi. Sayfayı yenileyebilirsin.';
    }

    const apiUnits: ApiUnit[] = await unitsResponse.json();
    const apiResidents: ApiResident[] = await residentsResponse.json();

    setUnits(
      apiUnits.map((unit) => ({
        id: unit.id,
        floorNo: unit.floorNo,
        unitNo: unit.unitNo,
        residentId: unit.residentId,
      })),
    );

    setResidents(
      apiResidents.map((resident) => ({
        id: resident.id,
        fullName: resident.fullName,
        email: resident.email,
        unitId: resident.unit?.id ?? 0,
        floorNo: resident.unit?.floorNo ?? 0,
        unitNo: resident.unit?.unitNo ?? 0,
        status: resident.unit ? 'active' : 'pending',
      })),
    );

    setFloors(
      [...new Set(apiUnits.map((unit) => unit.floorNo))].sort(
        (a, b) => a - b,
      ),
    );

    return null;
  } catch (error) {
    console.error('Sakin ekleme hatası:', error);
    return 'Sunucuya bağlanılamadı. Backend servisinin çalıştığını kontrol et.';
  }
};

  
const removeResident = async (
  residentId: number,
): Promise<string | null> => {
  const resident = residents.find(
    (item) => item.id === residentId,
  );

  if (!resident || !resident.unitId) {
    return 'Sakinin atanmış bir dairesi bulunamadı.';
  }

  try {
    const token = localStorage.getItem('apartmanim_token');

    const response = await fetch(
      `${API_URL}/units/${resident.unitId}/resident`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      return (
        data.message ||
        data.title ||
        'Sakin daireden ayrılamadı.'
      );
    }

    const [unitsResponse, residentsResponse] = await Promise.all([
      fetch(`${API_URL}/units`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${API_URL}/Auth/residents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    if (!unitsResponse.ok || !residentsResponse.ok) {
      return 'İşlem gerçekleşti ancak liste yenilenemedi. Sayfayı yenileyerek kontrol et.';
    }

    const apiUnits: ApiUnit[] = await unitsResponse.json();
    const apiResidents: ApiResident[] =
      await residentsResponse.json();

    setUnits(
      apiUnits.map((unit) => ({
        id: unit.id,
        floorNo: unit.floorNo,
        unitNo: unit.unitNo,
        residentId: unit.residentId,
      })),
    );

    setResidents(
      apiResidents.map((item) => ({
        id: item.id,
        fullName: item.fullName,
        email: item.email,
        unitId: item.unit?.id ?? 0,
        floorNo: item.unit?.floorNo ?? 0,
        unitNo: item.unit?.unitNo ?? 0,
        status: item.unit ? 'active' : 'pending',
      })),
    );

    return null;
  } catch (error) {
    console.error('Sakin daireden ayrılırken hata:', error);
    return 'Sunucuya bağlanılamadı.';
  }
};


  return (
    <BuildingContext.Provider
      value={{
        floors,
        units,
        residents,
        addFloor,
        addUnits,
        addResident,
        removeResident,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuilding() {
  const context = useContext(BuildingContext);

  if (!context) {
    throw new Error(
      'useBuilding, BuildingProvider içerisinde kullanılmalıdır.',
    );
  }

  return context;
}
