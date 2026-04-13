import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);

      const response = await login(formData);
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

      setErrors({ form: apiMessage });
      toast.error(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        subtitle="Login to securely access your dashboard and account."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <TextInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={errors.password}
            disabled={submitting}
          />

          <div className="flex items-center justify-end">
            <Link
              to={APP_ROUTES.FORGOT_PASSWORD}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
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
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

export default LoginPage;