const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-white to-slate-50/50 p-8 shadow-xl border border-slate-200/50 backdrop-blur">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-1.5 text-xs font-bold text-blue-700 border border-blue-100/50">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          Smart Healthcare Platform
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>

      <div className="mt-8">{children}</div>
    </div>
  );
};

export default AuthCard;