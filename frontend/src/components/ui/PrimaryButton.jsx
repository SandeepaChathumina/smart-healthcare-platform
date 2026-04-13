const PrimaryButton = ({ children, type = 'button', onClick, disabled = false, fullWidth = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;