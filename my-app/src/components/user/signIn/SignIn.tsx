import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loginSuccess } from "../../../store/authSlice";
import { signIn } from "../Api-Requests/genericRequests";
import type UserModel from "../UserModel";
import type { RootState } from "../../../store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { LanguageSwitcher } from "../../common";

const SignIn: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await signIn("api/users", { email, password });
      type SignInResponse = { token: string; user: UserModel };
      const data = response.data as SignInResponse;
      dispatch(loginSuccess({ token: data.token, user: data.user }));
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("Sign in successful:", data.user);
    } catch {
      setError(t('auth.invalidCredentials', 'Invalid email or password'));
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/layout');
    }
  }, [user, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Language Switcher */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <LanguageSwitcher variant="signin" />
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: '#64b5f6',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <GraduationCap size={32} color="white" />
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {t('auth.signInTitle', 'Welcome Back')}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0'
          }}>
            {t('common.appTitle', 'Special Needs Progress Tracker')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              textAlign: isRTL ? 'right' : 'left',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              {t('auth.email', 'Email address')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email', 'Enter your email')}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#64b5f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(100, 181, 246, 0.1)';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#f9fafb';
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
              textAlign: isRTL ? 'right' : 'left',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              {t('auth.password', 'Password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password', 'Enter your password')}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: isRTL ? '16px' : '48px',
                  paddingLeft: isRTL ? '48px' : '16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#f9fafb',
                  boxSizing: 'border-box',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#64b5f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(100, 181, 246, 0.1)';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: isRTL ? 'auto' : '12px',
                  left: isRTL ? '12px' : 'auto',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#64b5f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#42a5f5';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#64b5f6';
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }}
          >
            {t('auth.signIn', 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
