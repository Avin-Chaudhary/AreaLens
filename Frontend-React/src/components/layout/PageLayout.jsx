export default function PageLayout({ sidebar, main }) {
  return (
    <div className="min-h-[500px] bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-4 lg:px-6 pt-6 pb-10">

        {/* Sidebar */}
        <div className="w-full lg:w-[360px] shrink-0">
          {sidebar}
        </div>

        {/* Main (Map + Insights) */}
        <div className="flex-1 min-h-[300px] lg:min-h-[520px]">
          {main}
        </div>

      </div>
    </div>
  );
}
