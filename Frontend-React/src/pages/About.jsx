export default function About() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6 animate-fadeIn">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900">
            About <span className="text-emerald-600">AreaLens</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            AreaLens helps people understand the real-world livability of any
            location using maps, data, and intelligent insights — before making
            important life decisions.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="px-6 py-3 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              Data-driven • Location-aware • Decision-focused
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center">
            Why AreaLens Exists
          </h2>
          <p className="text-slate-700 max-w-4xl mx-auto text-center leading-relaxed">
            Choosing where to live, study, or invest is one of the most
            impactful decisions in a person’s life. Yet most decisions today are
            made with incomplete, biased, or fragmented information. AreaLens
            exists to remove guesswork and replace assumptions with clarity.
          </p>
        </div>
      </section>

      {/* Problem + Solution */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4 hover:shadow-xl transition">
            <h2 className="text-2xl font-semibold text-red-600">The Problem</h2>
            <p className="text-slate-600 leading-relaxed">
              When choosing a place to live, people rely on scattered
              information such as broker opinions, random online reviews, or
              incomplete listings. Important factors like safety, transport,
              healthcare, and environment are rarely evaluated together.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This leads to poor decisions, hidden trade-offs, and long-term
              dissatisfaction.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4 hover:shadow-xl transition">
            <h2 className="text-2xl font-semibold text-emerald-600">
              Our Solution
            </h2>
            <p className="text-slate-600 leading-relaxed">
              AreaLens unifies geospatial data, public datasets, and intelligent
              analysis into one interactive map-based experience.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Users receive structured insights, ratings, and explanations — not
              raw data dumps.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-10">
          <h2 className="text-3xl font-bold text-center text-slate-900">
            How AreaLens Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Select Location",
                desc: "Interact with the map to select a point or area of interest.",
              },
              {
                step: "2",
                title: "Choose Radius",
                desc: "Define analysis range using a configurable radius.",
              },
              {
                step: "3",
                title: "Analyze Data",
                desc: "Backend evaluates livability factors using datasets.",
              },
              {
                step: "4",
                title: "Get Insights",
                desc: "Clear ratings and explanations support decisions.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 text-center shadow hover:shadow-lg transition"
              >
                <div className="text-emerald-600 text-4xl font-extrabold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-slate-800">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-12">
          <h2 className="text-3xl font-bold text-center text-slate-900">
            Technology Stack
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Frontend",
                items: ["React", "Tailwind CSS", "Map-based UI"],
              },
              {
                title: "Backend & Data",
                items: ["Node.js", "FastAPI", "Render"],
              },
              {
                title: "Data+ML",
                items: ["Overpass API", "Logistic Regression", "Sikit-learn"],
              },
            ].map((stack) => (
              <div
                key={stack.title}
                className="bg-slate-50 rounded-2xl p-6 shadow hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                  {stack.title}
                </h3>
                <ul className="space-y-2 text-slate-600">
                  {stack.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-600 max-w-3xl mx-auto leading-relaxed">
            The stack is chosen to prioritize scalability, performance, and
            developer velocity while keeping the user experience fast and
            intuitive.
          </p>
        </div>
      </section>

      {/* Creators Section */}
      <section id="creators" className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-14">
          <h2 className="text-3xl font-bold text-center text-slate-900">
            Meet the Creators
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Mayank */}
            <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-2xl font-semibold text-slate-800">
                Mayank Sangwan
              </h3>
              <p className="text-sm font-medium text-indigo-600">
                Frontend Development
              </p>
              <p className="text-slate-600 leading-relaxed">
                Worked on building the user interface and layout of AreaLens,
                focusing on clean design, responsiveness, and ease of use.
                Contributed to structuring components and presenting system
                features and results in a clear and accessible manner for end
                users.
              </p>
              <div className="pt-3 text-sm text-slate-500 space-y-1">
                <p>Email: mayanksangwan0803@gmail.com</p>
                <p>Contact: +91-8950499466</p>
              </div>
            </div>

            {/* Avin */}
            <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-2xl font-semibold text-slate-800">
                Avin Chaudhary
              </h3>
              <p className="text-sm font-medium text-indigo-600">
                Backend and Machine Learning
              </p>
              <p className="text-slate-600 leading-relaxed">
                Worked on the backend architecture and machine learning aspects
                of AreaLens, including API design, authentication flows, and
                data processing logic. Focused on building reliable services and
                intelligent analysis to convert raw data into meaningful
                insights.
              </p>
              <div className="pt-3 text-sm text-slate-500 space-y-1">
                <p>Email: avinchaudhary1007@gmail.com</p>
                <p>Contact: +91-8398800099</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-600 max-w-3xl mx-auto leading-relaxed">
            AreaLens is built as a modern, scalable web application focused on
            clarity, usability, and real-world decision making.
          </p>
        </div>
      </section>
    </div>
  );
}
