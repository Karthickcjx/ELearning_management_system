export function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  icon
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block font-semibold text-slate-700 mb-1"
      >
        {label}
      </label>

      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-500">{icon}</span>}

        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="flex-1 block w-full px-3 py-3 border border-slate-300 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-gray-900 placeholder-gray-300"
        />
      </div>
    </div>
  );
}
