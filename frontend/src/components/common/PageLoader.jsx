const PageLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="rounded-xl bg-white/60 backdrop-blur px-8 py-6 shadow-lg border border-slate-200/50">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
            <div className="absolute inset-1 bg-white rounded-full"></div>
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading</p>
        </div>
        <p className="text-xs text-slate-500 text-center">Please wait...</p>
      </div>
    </div>
  );
};

export default PageLoader;