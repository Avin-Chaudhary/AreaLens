export default function SectionCard({ title, children }) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}
