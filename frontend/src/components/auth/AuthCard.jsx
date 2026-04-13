const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Smart Healthcare Platform
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>

      <div className="mt-8">{children}</div>
    </div>
  );
};

export default AuthCard;