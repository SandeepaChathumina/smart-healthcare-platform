function Navbar() {
  return (
    <div className="bg-slate-900 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">HealthCare System</h1>
      <div className="space-x-4">
        <button className="hover:text-cyan-400">Login</button>
        <button className="hover:text-cyan-400">Register</button>
      </div>
    </div>
  );
}

export default Navbar;