import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import TextInput from '../../components/ui/TextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import useAuth from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { getDefaultRouteByUser, getLoginBlockedMessage } from '../../utils/authRedirect';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
      form: '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const finishLogin = async (credentials) => {
    try {
      setSubmitting(true);
      setErrors({});

      const response = await login(credentials);
      const user = response?.user;

      const blockedMessage = getLoginBlockedMessage(user);

      if (blockedMessage) {
        toast(blockedMessage);
      } else {
        toast.success('Login successful');
      }

      const redirectTo =
        location.state?.from?.pathname && location.state.from.pathname !== APP_ROUTES.LOGIN
          ? location.state.from.pathname
          : getDefaultRouteByUser(user);

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || 'Login failed. Please check your credentials.';

      if (apiMessage.toLowerCase().includes('verify your email')) {
        toast.error(apiMessage);

        navigate(APP_ROUTES.VERIFY_ACCOUNT, {
          state: { email: credentials.email },
        });
        return;
      }

      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    const demoCredentials = { email, password };
    setFormData(demoCredentials);
    await finishLogin(demoCredentials);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await finishLogin(formData);
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        subtitle="Login to securely access your dashboard and account."
      >
        <form onSubmit={handleSubmit} className="space-y-5 ">
          <TextInput
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            error={errors.email}
            disabled={submitting}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={submitting}
                className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password ? (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Demo accounts</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('jwstudio12345@gmail.com', '12345678')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                disabled={submitting}
              >
                Patient Demo
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('it23800632@my.sliit.lk', '12345678')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                disabled={submitting}
              >
                Admin Demo
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('chat.pro.gang@gmail.com', '12345678')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                disabled={submitting}
              >
                Doctor Demo
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Link
              to={APP_ROUTES.VERIFY_ACCOUNT}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Need to verify account?
            </Link>

            <Link
              to={APP_ROUTES.FORGOT_PASSWORD}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          {errors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to={APP_ROUTES.REGISTER}
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Create account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default LoginPage;