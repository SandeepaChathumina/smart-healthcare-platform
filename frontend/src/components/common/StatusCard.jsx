const StatusCard = ({ title, description, children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="mb-6">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Smart Healthcare Platform
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
};

export default StatusCard;