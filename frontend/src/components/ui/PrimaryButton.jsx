const PrimaryButton = ({ children, type = 'button', onClick, disabled = false, fullWidth = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition duration-200 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;