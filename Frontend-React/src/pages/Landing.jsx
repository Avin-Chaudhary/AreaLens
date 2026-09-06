import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import useReveal from "../hooks/useReveal";

import img1 from "../assets/1.jpeg";
import img2 from "../assets/2.png";
import img3 from "../assets/3.png";
import img4 from "../assets/4.png";
import img5 from "../assets/5.jpeg";
import img6 from "../assets/6.jpeg";
import img7 from "../assets/7.jpeg";
import img8 from "../assets/8.jpeg";

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();

  const heroRef = useReveal();
  const stepsRef = useReveal();
  const insightsRef = useReveal();
  const problemRef = useReveal();
  const ctaRef = useReveal();

  // smooth hash scroll
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <main>
      {/* ======================================================
         1. HERO SECTION
      ====================================================== */}
      <section className="bg-[#f0f7ff]">
        <div className="max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              Location Intelligence Platform
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900">
              Understand any area <br />
              <span className="text-blue-600">before you decide</span>
            </h1>

            <p className="mt-8 text-xl text-slate-700 max-w-xl">
              AreaLens helps you deeply understand how a place actually feels to
              live in — not just how it looks on a map.
            </p>

            <p className="mt-4 text-lg text-slate-600 max-w-xl">
              From transport and essentials to comfort and environment, AreaLens
              brings everything together in one clear view.
            </p>

            <div className="mt-10">
              <button
                onClick={() => navigate("/app")}
                className="hover-float px-12 py-5 rounded-full bg-blue-600 text-white text-lg font-semibold shadow-lg transition hover:bg-blue-700 hover:-translate-y-0.5"
              >
                Start exploring
              </button>
            </div>
          </div>

          <div ref={heroRef} className="reveal flex justify-center">
            <img
              src={img1}
              alt="AreaLens map insights"
              className="hover-float max-h-[520px] rounded-3xl shadow-[0_50px_120px_-35px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* ======================================================
         2. HOW IT WORKS
      ====================================================== */}
      <section id="how-it-works" className="bg-white py-32">
        <div
          ref={stepsRef}
          className="max-w-7xl mx-auto px-6 space-y-32 reveal"
        >
          <div className="text-center">
            <p className="text-blue-600 font-semibold uppercase tracking-wider mb-3">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Analyze any location in minutes
            </h2>
          </div>

          {/* STEP 1 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-7xl font-extrabold text-slate-200 mb-4">01</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Select a location
              </h3>
              <p className="text-lg text-slate-700">
                Simply click anywhere on the map. Whether you’re exploring a
                neighborhood, planning a move, or evaluating an investment,
                AreaLens starts exactly where your curiosity begins.
              </p>
            </div>

            <img
              src={img2}
              alt="Select location"
              className="hover-float rounded-3xl shadow-xl max-h-[420px]"
            />
          </div>

          {/* STEP 2 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <img
              src={img3}
              alt="Choose radius"
              className="hover-float rounded-3xl shadow-xl max-h-[420px]"
            />

            <div>
              <p className="text-7xl font-extrabold text-slate-200 mb-4">02</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Choose an analysis radius
              </h3>
              <p className="text-lg text-slate-700">
                Define how far the analysis should extend — 2 km for walking
                life, 5 km for daily routines, or 10 km for broader
                connectivity. Choose the radius that fits you.
              </p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-7xl font-extrabold text-slate-200 mb-4">03</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Understand the area
              </h3>
              <p className="text-lg text-slate-700">
                Instantly receive structured ratings, clear explanations, and
                meaningful insights based on real-world data — no guesswork.
                Powerful data driven insights on just a click.
              </p>
            </div>

            <img
              src={img4}
              alt="Area insights"
              className="hover-float rounded-3xl shadow-xl max-h-[420px]"
            />
          </div>
        </div>
      </section>

      {/* ======================================================
   3. INSIGHTS
====================================================== */}
      <section id="insights" className="bg-[#f0f7ff] py-32">
        <div ref={insightsRef} className="max-w-7xl mx-auto px-6 reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-24 text-center">
            Insights that shape real decisions
          </h2>

          <div className="space-y-32">
            {[
              {
                title: "Transport & Connectivity",
                desc: "Understand how easily you can move. From metro stations and bus stops to railway station and airports, AreaLens evaluates how connected the area truly is.",
                img: img5,
              },
              {
                title: "Essential Services",
                desc: "Know how close hospitals, banks, police stations, and emergency services are — because convenience and safety matter every day.",
                img: img6,
              },
              {
                title: "Comfort & Lifestyle",
                desc: "Discover restaurants, parks, gyms, cinemas, and shopping hubs that define everyday living comfort and quality of life.",
                img: img7,
              },
              {
                title: "Environment",
                desc: "Analyze air quality, temperature, humidity, and overall environmental conditions that impact long-term health and well-being.",
                img: img8,
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="grid md:grid-cols-2 gap-20 items-center"
              >
                {/* Image */}
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <img
                    src={item.img}
                    alt={item.title}
                    className="
                hover-float
                w-full max-w-md
                mx-auto
                rounded-3xl
                shadow-[0_30px_80px_-25px_rgba(0,0,0,0.35)]
              "
                  />
                </div>

                {/* Text */}
                <div className={index % 2 === 1 ? "md:order-1" : ""}>
                  <h3 className="text-3xl font-bold text-slate-900 mb-6">
                    {item.title}
                  </h3>
                  <p className="text-xl leading-relaxed text-slate-700">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
   4. PROBLEM & SOLUTION (SCROLL-REACTIVE DIVIDER)
====================================================== */}
      <section className="bg-white py-40 relative">
        <div
          ref={problemRef}
          className="max-w-5xl mx-auto px-6 space-y-32 reveal"
        >
          {/* -------- PROBLEM -------- */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="uppercase tracking-wider text-sm font-semibold text-red-500">
              The problem
            </span>

            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-8">
              Location decisions are made with
              <span className="text-red-600"> incomplete truth</span>
            </h3>

            <p className="text-xl text-slate-700 mb-6 leading-relaxed">
              Choosing where to live, work, or invest is one of the most
              impactful decisions people make — yet it’s often driven by
              surface-level information.
            </p>

            <p className="text-lg text-slate-700 mb-4 leading-relaxed">
              Listings highlight interiors, brokers sell narratives, and online
              reviews reflect isolated opinions rather than reality.
            </p>

            <p className="text-lg text-slate-700 leading-relaxed">
              Critical factors like safety, accessibility, essential services,
              environmental quality, and everyday convenience are scattered
              across platforms — or worse, completely invisible.
            </p>
          </div>

          {/* -------- SCROLL REACTIVE DIVIDER -------- */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Track */}
            <div className="relative w-full h-[3px] bg-slate-200 overflow-hidden rounded-full">
              {/* Progress fill */}
              <div
                className="
            h-full w-full
            origin-left
            scale-x-0
            bg-gradient-to-r
            from-red-500 via-purple-500 to-blue-600
            animate-dividerFill
          "
              />
            </div>

            {/* Caption */}
            <span className="text-sm font-medium tracking-wide text-slate-500">
              From confusion to clarity
            </span>
          </div>

          {/* -------- SOLUTION -------- */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="uppercase tracking-wider text-sm font-semibold text-blue-600">
              Our solution
            </span>

            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-8">
              AreaLens brings
              <span className="text-blue-600"> clarity to complexity</span>
            </h3>

            <p className="text-xl text-slate-700 mb-6 leading-relaxed">
              AreaLens consolidates real-world livability data into one
              structured, intuitive view — powered by geospatial analysis and
              intelligent insights.
            </p>

            <p className="text-lg text-slate-700 mb-4 leading-relaxed">
              Instead of guessing, users see how an area actually performs
              across transport, essentials, comfort, and environment — explained
              clearly, not buried in raw numbers.
            </p>

            <p className="text-lg text-slate-700 leading-relaxed">
              This empowers individuals, families, and businesses to move
              forward confidently — with decisions grounded in data, not
              assumptions.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
         5. FINAL CTA
      ====================================================== */}
      <section ref={ctaRef} className="bg-[#f0f7ff] py-32 text-center reveal">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
          Ready to explore locations with clarity?
        </h2>

        <p className="mt-8 text-lg text-slate-700 max-w-2xl mx-auto">
          Start using AreaLens today and experience a smarter, clearer way to
          evaluate locations — for living, working, or investing.
        </p>

        <button
          onClick={() => navigate("/app")}
          className="hover-float mt-12 px-14 py-5 rounded-full bg-blue-600 text-white text-xl font-semibold shadow-lg transition hover:bg-blue-700 hover:-translate-y-0.5"
        >
          Start exploring
        </button>
      </section>
    </main>
  );
}
