const AuthSidePanel = () => {
  return (
    <div className="hidden rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 p-10 text-white shadow-xl lg:flex lg:min-h-[700px] lg:flex-col lg:justify-between">
      <div>
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
          Secure Access
        </span>

        <h2 className="mt-6 text-4xl font-bold leading-tight">
          Professional authentication for modern healthcare teams
        </h2>

        <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
          Role-based access, email verification, doctor approval workflows, and secure
          account management in one clean platform.
        </p>
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-sm text-blue-50">
        Add auth illustration / healthcare image here
      </div>
    </div>
  );
};

export default AuthSidePanel;