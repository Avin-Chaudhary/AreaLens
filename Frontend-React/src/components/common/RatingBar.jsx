export default function RatingBar({ label, value, max = 10 }) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>

      <div className="h-2 bg-slate-200 rounded">
        <div
          className="h-2 bg-emerald-500 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
