export default function Sidebar({ children }) {
  return (
    <div className="mt-2 lg:mt-0">
      <div
        className="
          rounded-3xl
          bg-white
          shadow-[0_25px_60px_-20px_rgba(0,0,0,0.25)]
          p-6
        "
      >
        {children}
      </div>
    </div>
  );
}
