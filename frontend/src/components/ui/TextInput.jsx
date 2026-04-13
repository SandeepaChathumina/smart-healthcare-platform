const TextInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
}) => {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 ${
          error
            ? 'border-red-300 ring-2 ring-red-100 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-300/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md'
        } ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : 'bg-white'}`}
      />

      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
};

export default TextInput;