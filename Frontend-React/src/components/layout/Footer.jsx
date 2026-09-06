import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/auth.store";

export default function Footer() {
  const openAuth = useAuthStore((s) => s.openAuthModal);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const iconClass =
    "w-5 h-5 text-slate-400 hover:text-white transition transform hover:-translate-y-0.5";

  return (
    <>
      {/* Gradient Divider */}
      <div className="w-full h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-80" />

      <footer id="footer" className="bg-slate-900 text-slate-300 text-sm">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-5 gap-12">

          {/* ================= BRAND ================= */}
          <div className="space-y-6">
            <div
              onClick={scrollTop}
              className="text-2xl font-extrabold text-white cursor-pointer"
            >
              AreaLens
            </div>

            {/* REAL SOCIAL ICONS */}
            <div className="flex gap-5">
              {/* Instagram */}
              <button onClick={scrollTop} aria-label="Instagram">
                <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="17" cy="7" r="1.2" fill="currentColor" />
                </svg>
              </button>

              {/* Twitter / X */}
              <button onClick={scrollTop} aria-label="Twitter">
                <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 5.9c-.7.3-1.4.5-2.1.6a3.7 3.7 0 0 0 1.6-2 7.3 7.3 0 0 1-2.3.9A3.6 3.6 0 0 0 12 8.1a10.2 10.2 0 0 1-7.4-3.8 3.6 3.6 0 0 0 1.1 4.9c-.6 0-1.2-.2-1.7-.4v.1a3.6 3.6 0 0 0 2.9 3.5c-.5.1-1 .1-1.5 0a3.6 3.6 0 0 0 3.4 2.5A7.3 7.3 0 0 1 2 18.6a10.3 10.3 0 0 0 5.6 1.6c6.7 0 10.4-5.5 10.4-10.3v-.5c.7-.5 1.3-1.1 1.8-1.8Z" />
                </svg>
              </button>

              {/* Facebook */}
              <button onClick={scrollTop} aria-label="Facebook">
                <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 9H16V6h-2.5c-2.1 0-3.5 1.3-3.5 3.7V12H8v3h2v6h3v-6h2.5l.5-3H13V9.8c0-.6.3-.8.5-.8Z" />
                </svg>
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Location intelligence that helps you decide with clarity —
              not assumptions.
            </p>

            <p className="text-slate-500">
              © {new Date().getFullYear()} AreaLens
            </p>
          </div>

          {/* ================= CONTACT ================= */}
          <div>
            <p className="font-semibold text-white mb-4">Contact us</p>
            <p className="text-slate-400 mb-4">India</p>
            <a
              href="mailto:arealens.app@gmail.com"
              className="hover:text-white transition"
            >
              arealens.app@gmail.com
            </a>
          </div>

          {/* ================= ACCOUNT ================= */}
          <div>
            <p className="font-semibold text-white mb-4">Account</p>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => {
                    scrollTop();
                    openAuth("signup");
                  }}
                  className="hover:text-white transition"
                >
                  Create account
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    scrollTop();
                    openAuth("signin");
                  }}
                  className="hover:text-white transition"
                >
                  Sign in
                </button>
              </li>
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  iOS app
                </button>
              </li>
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  Android app
                </button>
              </li>
            </ul>
          </div>

          {/* ================= COMPANY ================= */}
          <div>
            <p className="font-semibold text-white mb-4">Company</p>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  onClick={scrollTop}
                  className="hover:text-white transition"
                >
                  About AreaLens
                </Link>
              </li>
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  Careers
                </button>
              </li>
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  For businesses
                </button>
              </li>
            </ul>
          </div>

          {/* ================= RESOURCES ================= */}
          <div>
            <p className="font-semibold text-white mb-4">Resources</p>
            <ul className="space-y-3">
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  Help center
                </button>
              </li>
              <li>
                <button onClick={scrollTop} className="hover:text-white transition">
                  Privacy & terms
                </button>
              </li>
            </ul>
          </div>

        </div>
      </footer>
    </>
  );
}
