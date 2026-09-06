export default function Input({ label, type = "text", ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        {...props}
      />
    </div>
  );
}
