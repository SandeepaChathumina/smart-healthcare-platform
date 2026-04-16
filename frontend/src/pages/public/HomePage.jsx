import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  ClipboardCheck,
  HeartPulse,
  MailCheck,
  LayoutDashboard,
  ArrowRight,
  Phone,
  MapPin,
  Clock3,
  Bot,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { APP_ROUTES } from '../../constants/routes.js';
import healthcareTeamImage from '../../assets/successful-medical-team.jpg';

const AI_FEATURE_BASE_URL = import.meta.env.VITE_AI_FEATURE_BASE_URL;

const stats = [
  { label: 'Verified Access Flow', value: '100%' },
  { label: 'Role-Based Dashboards', value: '3' },
  { label: 'Core Auth Modules', value: '8+' },
  { label: 'Secure Account Actions', value: '24/7' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    description:
      'Professional login, protected routes, and role-based access for admins, doctors, and patients.',
  },
  {
    icon: MailCheck,
    title: 'Email Verification',
    description:
      'Users can verify accounts with OTP-based email verification whenever they are ready.',
  },
  {
    icon: ClipboardCheck,
    title: 'Doctor Approval Workflow',
    description:
      'Doctor accounts follow a verified review and admin approval process before full platform access.',
  },
  {
    icon: LayoutDashboard,
    title: 'Professional Dashboards',
    description:
      'Each role gets a dedicated dashboard experience with relevant actions and profile management.',
  },
  {
    icon: HeartPulse,
    title: 'Account Recovery',
    description:
      'Forgot password and reset password flows are included for a reliable user experience.',
  },
  {
    icon: Users,
    title: 'Admin User Management',
    description:
      'Admins can review doctors, view all users, filter by role, and manage core platform access.',
  },
];

const roles = [
  {
    icon: ShieldCheck,
    title: 'Admin',
    description:
      'Manage users, review pending doctors, monitor role-based access, and control system workflows.',
  },
  {
    icon: Stethoscope,
    title: 'Doctor',
    description:
      'Register with professional details, verify account, wait for admin approval, and access doctor tools.',
  },
  {
    icon: UserRound,
    title: 'Patient',
    description:
      'Create an account, verify email, manage profile details, and access patient-side dashboard features.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create Account',
    description:
      'Users register as patient, doctor, or admin with the required information for their role.',
  },
  {
    step: '02',
    title: 'Verify Email',
    description:
      'A verification OTP is sent to email so users can securely activate their accounts.',
  },
  {
    step: '03',
    title: 'Role Review',
    description:
      'Doctors go through an additional admin approval workflow before receiving full access.',
  },
  {
    step: '04',
    title: 'Access Dashboard',
    description:
      'After authentication and verification, users enter their role-based professional dashboard.',
  },
];

const footerLinks = {
  platform: ['Secure Login', 'Email Verification', 'Role Management', 'Dashboards'],
  roles: ['Admin Access', 'Doctor Access', 'Patient Access', 'Profile Management'],
  support: ['Account Recovery', 'Verification Help', 'User Guidance', 'System Access'],
};

const HomePage = () => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const [aiForm, setAiForm] = useState({
    symptoms: '',
    age: '',
    gender: '',
    medicalHistory: '',
  });

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      mirror: false,
    });
  }, []);

  const openAiModal = () => {
    setIsAiModalOpen(true);
  };

  const closeAiModal = () => {
    setIsAiModalOpen(false);
    setIsSubmittingAi(false);
    setAiError('');
    setAiResult(null);
    setAiForm({
      symptoms: '',
      age: '',
      gender: '',
      medicalHistory: '',
    });
  };

  const handleAiInputChange = (e) => {
    const { name, value } = e.target;
    setAiForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    setAiError('');
    setAiResult(null);

    if (!aiForm.symptoms.trim()) {
      setAiError('Please enter at least one symptom.');
      return;
    }

    if (!aiForm.age || Number(aiForm.age) <= 0) {
      setAiError('Please enter a valid age.');
      return;
    }

    if (!aiForm.gender.trim()) {
      setAiError('Please select a gender.');
      return;
    }

    if (!AI_FEATURE_BASE_URL) {
      setAiError('AI feature base URL is not configured.');
      return;
    }

    try {
      setIsSubmittingAi(true);

      const payload = {
        symptoms: aiForm.symptoms
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        age: Number(aiForm.age),
        gender: aiForm.gender,
        medicalHistory: aiForm.medicalHistory.trim() || 'No major medical history provided',
      };

      const response = await fetch(`${AI_FEATURE_BASE_URL}/api/symptoms/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAiError(data.message || 'Unable to get symptom analysis right now.');
        return;
      }

      setAiResult(data.data);
    } catch (error) {
      setAiError('Unable to connect to the AI symptom checker service.');
    } finally {
      setIsSubmittingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div data-aos="fade-down" data-aos-duration="700">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100/50 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-1.5 text-xs font-bold text-blue-700">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              Smart Healthcare Platform
            </span>
          </div>

          <nav
            data-aos="fade-down"
            data-aos-delay="100"
            className="hidden items-center gap-8 md:flex"
          >
            <a href="#features" className="text-sm font-medium text-slate-600 transition duration-200 hover:text-blue-600">
              Features
            </a>
            <a href="#roles" className="text-sm font-medium text-slate-600 transition duration-200 hover:text-blue-600">
              Roles
            </a>
            <a href="#workflow" className="text-sm font-medium text-slate-600 transition duration-200 hover:text-blue-600">
              Workflow
            </a>
            <a href="#footer" className="text-sm font-medium text-slate-600 transition duration-200 hover:text-blue-600">
              Contact
            </a>
          </nav>

          <div
            data-aos="fade-down"
            data-aos-delay="200"
            className="flex items-center gap-3"
          >
            <Link
              to={APP_ROUTES.LOGIN}
              className="rounded-lg border border-slate-300/50 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-slate-400 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to={APP_ROUTES.REGISTER}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-400 blur-3xl"></div>
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 py-10 lg:grid-cols-2 lg:px-8 lg:py-12">
          <div data-aos="fade-right" data-aos-duration="900">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/50 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-1.5 text-xs font-bold text-cyan-700">
              <div className="h-2 w-2 rounded-full bg-cyan-600"></div>
              Modern Healthcare Access Management
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Professional{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                healthcare platform
              </span>{' '}
              for everyone
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              A professional healthcare authentication and user management system with
              secure login, email verification, doctor approval workflows, password
              recovery, role-based dashboards, and structured admin management tools.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={APP_ROUTES.LOGIN}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
              >
                Access Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                to={APP_ROUTES.REGISTER}
                className="rounded-lg border border-slate-300/50 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-slate-400 hover:bg-slate-50"
              >
                Register New Account
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  data-aos-duration="700"
                >
                  <div className="rounded-2xl border border-slate-200/50 bg-white/60 p-4 shadow-md backdrop-blur transition duration-200 hover:border-blue-200/50 hover:shadow-lg">
                    <p className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            data-aos="fade-left"
            data-aos-delay="150"
            data-aos-duration="900"
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent blur-2xl"></div>

            <div className="relative rounded-[2.5rem] border border-white/80 bg-white/60 p-4 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-[1.5rem] bg-white">
                <img
                  src={healthcareTeamImage}
                  alt="Healthcare professionals team"
                  className="h-[320px] w-full rounded-[1.5rem] object-cover lg:h-[420px]"
                />
              </div>
            </div>

            <div
              data-aos="zoom-in"
              data-aos-delay="350"
              data-aos-duration="700"
              className="absolute -bottom-4 -left-4 z-10 hidden lg:block sm:-bottom-6 sm:-left-6"
            >
              <div className="rounded-2xl border border-slate-200/50 bg-white/95 p-4 shadow-xl backdrop-blur transition duration-200 hover:shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Secure Role Access</p>
                    <p className="text-xs text-slate-500">Admin • Doctor • Patient</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-aos="zoom-in"
              data-aos-delay="450"
              data-aos-duration="700"
              className="absolute -right-4 top-6 z-10 hidden lg:block sm:-right-6 sm:top-8"
            >
              <div className="rounded-2xl border border-slate-200/50 bg-white/95 p-4 shadow-xl backdrop-blur transition duration-200 hover:shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-2">
                    <MailCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email Verification</p>
                    <p className="text-xs text-slate-500">OTP-based</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center" data-aos="fade-up" data-aos-duration="800">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100/50 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
            Core Features
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Everything needed for a{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              professional system
            </span>
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Built to support structured authentication, user verification, approval flows,
            and role-specific system access in a professional healthcare environment.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                data-aos-duration="700"
              >
                <div className="group rounded-2xl border border-slate-200/50 bg-white/60 p-8 shadow-md backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200/50 hover:shadow-xl">
                  <div className="inline-flex rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 transition duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center" data-aos="fade-up" data-aos-duration="800">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100/50 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
            Platform Roles
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Designed for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              every user
            </span>
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Each user role receives structured access, relevant permissions, and its own
            dashboard experience tailored to their needs.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = role.icon;

            return (
              <div
                key={role.title}
                data-aos="fade-up"
                data-aos-delay={index * 120}
                data-aos-duration="700"
              >
                <div className="group rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 p-8 shadow-md transition duration-300 hover:-translate-y-1 hover:border-blue-200/50 hover:shadow-xl">
                  <div className="inline-flex rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 transition duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-slate-900">{role.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{role.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div data-aos="fade-right" data-aos-duration="800">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
              <div className="h-2 w-2 rounded-full bg-slate-600"></div>
              System Workflow
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Clear and secure
              </span>{' '}
              onboarding flow
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              From registration to dashboard access, the platform follows a structured
              authentication and approval process for a reliable healthcare system experience.
            </p>
          </div>

          <div className="space-y-5">
            {steps.map((item, index) => (
              <div
                key={item.step}
                data-aos="fade-left"
                data-aos-delay={index * 120}
                data-aos-duration="700"
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 h-8 w-1 bg-gradient-to-b from-blue-300 to-transparent"></div>
                )}
                <div className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 shadow-md backdrop-blur transition duration-300 hover:border-blue-200/50 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg">
                      {item.step}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div data-aos="zoom-in" data-aos-duration="850">
            <div className="grid gap-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-blue-500/10 p-10 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-14">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-blue-100">
                  <div className="h-2 w-2 rounded-full bg-blue-300"></div>
                  Start Using the Platform
                </span>
                <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  Secure healthcare access starts here
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
                  Register an account, verify your email, and access the right healthcare
                  dashboard based on your role. Professional healthcare management awaits.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 lg:justify-end">
                <Link
                  to={APP_ROUTES.LOGIN}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
                >
                  Login Now
                </Link>
                <Link
                  to={APP_ROUTES.REGISTER}
                  className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition duration-200 hover:border-white/50 hover:bg-white/20"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="border-t border-slate-200/50 bg-gradient-to-b from-white to-slate-50/50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div
            data-aos="fade-up"
            data-aos-duration="800"
            className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100/50 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-1.5 text-xs font-bold text-blue-700">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                Smart Healthcare Platform
              </span>

              <p className="mt-6 max-w-md text-sm leading-7 text-slate-600">
                A professional healthcare authentication and access management system with
                secure role-based workflows for admins, doctors, and patients.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-600">
                <div className="flex items-center gap-3 transition duration-200 hover:text-blue-600">
                  <Phone className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span>+94 71 234 5678</span>
                </div>
                <div className="flex items-center gap-3 transition duration-200 hover:text-blue-600">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span>Colombo, Sri Lanka</span>
                </div>
                <div className="flex items-center gap-3 transition duration-200 hover:text-blue-600">
                  <Clock3 className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span>Mon - Fri | 8.00 AM - 6.00 PM</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Platform
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {footerLinks.platform.map((item) => (
                  <li key={item} className="cursor-pointer transition duration-200 hover:text-blue-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Roles
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {footerLinks.roles.map((item) => (
                  <li key={item} className="cursor-pointer transition duration-200 hover:text-blue-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Support
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {footerLinks.support.map((item) => (
                  <li key={item} className="cursor-pointer transition duration-200 hover:text-blue-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Smart Healthcare Platform. All rights reserved.</p>
            <p>Designed for secure and professional healthcare system access.</p>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={openAiModal}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition duration-300 hover:scale-105 hover:shadow-blue-200"
      >
        <Bot className="h-5 w-5" />
        AI Symptom Checker
      </button>

      {isAiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Symptom Checker</h2>
                <p className="text-sm text-slate-500">
                  Enter symptoms and basic details to get a quick analysis.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAiModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAiSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={aiForm.symptoms}
                    onChange={handleAiInputChange}
                    rows={4}
                    placeholder="Example: fever, cough, sore throat, headache"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={aiForm.age}
                      onChange={handleAiInputChange}
                      placeholder="Enter age"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={aiForm.gender}
                      onChange={handleAiInputChange}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={aiForm.medicalHistory}
                    onChange={handleAiInputChange}
                    rows={3}
                    placeholder="Example: no major chronic illness"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingAi}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-blue-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmittingAi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Symptoms'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeAiModal}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </form>

              {aiError && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Service Error</p>
                      <p className="mt-1 text-sm text-red-600">{aiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {aiResult && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-700">
                      Symptom analysis generated successfully
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Possible Condition
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {aiResult.possibleCondition}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Recommended Specialty
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {aiResult.recommendedSpecialty}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Urgency Level
                      </p>
                      <p className="mt-2 text-sm font-bold text-blue-700">
                        {aiResult.urgencyLevel}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(aiResult.selfCareAdvice) && aiResult.selfCareAdvice.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-bold text-slate-900">Self Care Advice</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {aiResult.selfCareAdvice.map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(aiResult.warningSigns) && aiResult.warningSigns.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <h3 className="text-sm font-bold text-amber-800">Warning Signs</h3>
                      <ul className="mt-3 space-y-2 text-sm text-amber-700">
                        {aiResult.warningSigns.map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-500"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;