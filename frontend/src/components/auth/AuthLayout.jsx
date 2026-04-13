import AuthSidePanel from '../components/auth/AuthSidePanel';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-2">
        <AuthSidePanel />
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;