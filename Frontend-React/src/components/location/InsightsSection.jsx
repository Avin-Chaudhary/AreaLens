import { useEffect, useRef } from "react";
import { useLocationStore } from "../../features/location/location.store";
import { useAuthStore } from "../../features/auth/auth.store";

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < value
              ? "text-blue-500 text-lg"
              : "text-slate-300 text-lg"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function InsightsSection() {
  const {
    overview,
    loading,
    error,
    selectedCoords,
    selectedRadius,
  } = useLocationStore();

  const { isAuthenticated } = useAuthStore();

  const sectionRef = useRef(null);

  /* 👉 Auto-scroll once insights are ready */
  useEffect(() => {
    if (
      overview &&
      !loading &&
      isAuthenticated &&
      selectedCoords &&
      selectedRadius &&
      sectionRef.current
    ) {
      sectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [overview, loading, isAuthenticated, selectedCoords, selectedRadius]);

  /**
   * 🔒 HARD GUARD
   * Prevent stale insights after logout / refresh
   */
  if (
    !isAuthenticated ||
    !selectedCoords ||
    !selectedRadius
  ) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-12 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!overview || error) return null;

  const { ratings, description } = overview;

  return (
    <div
      ref={sectionRef}
      className="
        max-w-6xl mx-auto
        px-6
        pt-6
        pb-14
        animate-fadeIn
      "
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-10">
        Area Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {Object.keys(ratings).map((key) => (
          <div
            key={key}
            className="
              bg-white rounded-3xl p-7
              border border-slate-200
              shadow-sm hover:shadow-xl hover:-translate-y-1
              transition
            "
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold capitalize mb-1">
                  {key}
                </h3>
                <StarRating value={ratings[key]} />
              </div>
              <span className="text-blue-600 font-bold">
                {ratings[key]}/5
              </span>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              {description[key]}
            </p>
          </div>
        ))}
      </div>

      {description.news && (
        <div
          className="
            bg-white rounded-3xl p-7
            border border-slate-200
            shadow-sm
            animate-scaleIn
          "
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            📰 Local News & Sentiment
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {description.news}
          </p>
        </div>
      )}
    </div>
  );
}
