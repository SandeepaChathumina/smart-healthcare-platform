import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';

const AuthSidePanel = () => {
  return (
    <div className="hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-12 text-white shadow-2xl lg:flex lg:min-h-[700px] lg:flex-col lg:justify-between border border-blue-500/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative">
        <div className="mb-8 flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-50 border border-white/20 backdrop-blur">
            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
            Secure Access
          </span>

          <Link
            to={APP_ROUTES.HOME}
            className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 backdrop-blur px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/20 hover:border-white/50"
          >
            ← Back to Home
          </Link>
        </div>

        <h2 className="mt-8 text-4xl font-bold leading-tight">
          Professional authentication for modern healthcare teams
        </h2>

        <p className="mt-6 max-w-md text-base leading-7 text-blue-100/95">
          Role-based access, email verification, doctor approval workflows, and secure
          account management in one clean platform.
        </p>
      </div>

      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-6 text-sm text-blue-50 relative">
        <div className="flex items-center justify-center h-40 text-blue-200/60">
          Healthcare authentication system ✓
        </div>
      </div>
    </div>
  );
};

export default AuthSidePanel;