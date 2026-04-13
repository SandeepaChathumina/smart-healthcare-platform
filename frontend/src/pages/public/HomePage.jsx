import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Smart Healthcare Platform
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Professional healthcare access for admins, doctors, and patients
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Secure authentication, email verification, doctor approval workflow, and
              role-based dashboards in one modern system.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={APP_ROUTES.LOGIN}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Login
              </Link>

              <Link
                to={APP_ROUTES.REGISTER}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Add hero image / healthcare illustration here
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;