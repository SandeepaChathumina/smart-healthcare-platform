const PageLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-600">Loading...</p>
      </div>
    </div>
  );
};

export default PageLoader;