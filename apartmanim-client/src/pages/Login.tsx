import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import type { LoginForm } from "../types";
import { useEffect } from "react";

export function LoginPage() {
  useEffect(() => {
  console.log("LoginPage MOUNT");
  return () => console.log("LoginPage UNMOUNT");
}, []);
  const { login, completePasswordChange } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setServerError("");
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      console.log(
    'LoginPage mustChangePassword:',
    result.mustChangePassword
  );
      if (result.mustChangePassword) {
        setTemporaryPassword(data.password);
        setShowPasswordModal(true);
        console.log('Şifre modalı açılmak üzere');
        return;
      }

      navigate("/dashboard");
    } else {
      setServerError(result.error ?? "Giriş başarısız.");
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    if (newPassword === temporaryPassword) {
      setPasswordError("Yeni şifreniz geçici şifrenizden farklı olmalıdır.");
      return;
    }

    const token = localStorage.getItem("apartmanim_token");

    if (!token) {
      setPasswordError("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(
        "http://localhost:5285/api/Auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: temporaryPassword,
            newPassword,
            confirmPassword,
          }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
        token?: string;
      };

      if (!response.ok) {
        setPasswordError(result.message ?? "Şifre değiştirilemedi.");
        return;
      }

      if (!result.token) {
        setPasswordError("Yeni oturum anahtarı alınamadı. Tekrar giriş yapın.");
        return;
      }

      setShowPasswordModal(false);
      completePasswordChange(result.token);
      navigate("/dashboard");
    } catch {
      setPasswordError("Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>
            Apart<span>manım</span>
          </h1>
          <p>Dijital Apartman Yönetim Sistemi</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          {/* E-posta */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              E-posta Adresi
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              className={`form-input ${errors.email ? "error" : ""}`}
              {...register("email", {
                required: "E-posta adresi gereklidir.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Geçerli bir e-posta adresi girin.",
                },
              })}
            />
            {errors.email && (
              <span className="form-error">{errors.email.message}</span>
            )}
          </div>

          {/* Şifre */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`form-input ${errors.password ? "error" : ""}`}
              {...register("password", {
                required: "Şifre gereklidir.",
                minLength: {
                  value: 6,
                  message: "Şifre en az 6 karakter olmalıdır.",
                },
              })}
            />
            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          {/* Sunucu hatası */}
          {serverError && (
            <div
              style={{
                background: "var(--color-error-bg)",
                color: "var(--color-error-text)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
                border: "1px solid var(--color-error)",
              }}
            >
              {serverError}
            </div>
          )}

          {/* Giriş Butonu */}
          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" />
                Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      </div>

      {showPasswordModal && (
        <>
    {console.log('Modal render ediliyor')}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--color-surface, white)",
              color: "var(--color-text, #222)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <h2 id="change-password-title">Şifreni Değiştir</h2>

            <p>
              Güvenliğiniz için ilk girişinizde şifrenizi değiştirmeniz
              gerekiyor.
            </p>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  Yeni Şifre
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={isChangingPassword}
                  placeholder="En az 8 karakter"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Yeni Şifre Tekrarı
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={isChangingPassword}
                  placeholder="Yeni şifreni tekrar gir"
                />
              </div>

              {passwordError && (
                <div
                  role="alert"
                  style={{
                    color: "var(--color-error-text, #b91c1c)",
                    marginBottom: "16px",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword
                  ? "Şifre değiştiriliyor..."
                  : "Şifremi Değiştir"}
              </button>
            </form>
          </div>
        </div>
         </>
      )}
    </div>
  )
}
