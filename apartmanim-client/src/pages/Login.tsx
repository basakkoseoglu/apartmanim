import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import type { LoginForm } from '../types';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setServerError('');
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error ?? 'Giriş başarısız.');
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
              className={`form-input ${errors.email ? 'error' : ''}`}
              {...register('email', {
                required: 'E-posta adresi gereklidir.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Geçerli bir e-posta adresi girin.',
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
              className={`form-input ${errors.password ? 'error' : ''}`}
              {...register('password', {
                required: 'Şifre gereklidir.',
                minLength: {
                  value: 6,
                  message: 'Şifre en az 6 karakter olmalıdır.',
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
                background: 'var(--color-error-bg)',
                color: 'var(--color-error-text)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                border: '1px solid var(--color-error)',
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
              'Giriş Yap'
            )}
          </button>
        </form>

        {/* Yardım metni */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-6)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          Demo — Yönetici: <strong>admin@apartmanim.com</strong><br />
          Sakin: <strong>fatma@apartmanim.com</strong> &nbsp;|&nbsp; Şifre: <strong>123456</strong>
        </p>
      </div>
    </div>
  );
}
