import AuthSidePanel from '../components/auth/AuthSidePanel';

const AuthLayout = ({ children, topLeftAction = null }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {topLeftAction ? <div className="mb-6">{topLeftAction}</div> : null}

        <div className="grid min-h-[calc(100vh-6rem)] items-stretch gap-8 lg:grid-cols-2 ">
          <AuthSidePanel />
          <div className="flex items-center justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;