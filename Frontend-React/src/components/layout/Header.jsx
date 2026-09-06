import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../features/auth/auth.store";
import { useLocationStore } from "../../features/location/location.store";
import UpdatePasswordModal from "../auth/UpdatePasswordModal";
import DeleteAccountModal from "../auth/DeleteAccountModal";
import { logout as logoutApi } from "../../services/auth.api";

export default function Header() {
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const clearLocation = useLocationStore((s) => s.clearAll);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const logout = async () => {
    setOpen(false);

    try {
      // ✅ destroy backend session cookie
      await logoutApi();
    } catch {
      // ignore network / backend errors
    }

    // ✅ clear all frontend state
    clearLocation();
    clearUser();

    navigate("/");
  };

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navItem =
    "relative text-sm font-medium text-white cursor-pointer " +
    "after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 " +
    "after:bg-white after:transition-all after:duration-300 hover:after:w-full";

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link
            to="/"
            className="text-4xl font-extrabold text-white tracking-tight"
          >
            AreaLens
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-12">
            <Link to="/#how-it-works" className={navItem}>
              How it works
            </Link>

            <Link to="/#insights" className={navItem}>
              Insights
            </Link>

            <button
              className={navItem}
              onClick={() => scrollTo("footer")}
            >
              Contact
            </button>

            <Link to="/about" className={navItem}>
              About Us
            </Link>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {!isAuthenticated && (
              <Link
                to="/app"
                className="
                  hidden md:inline-block
                  px-6 py-2.5
                  rounded-full
                  bg-white text-blue-600
                  text-sm font-semibold
                  hover:bg-blue-50
                  transition
                "
              >
                Try Now!
              </Link>
            )}

            {isAuthenticated && user && (
              <button
                onClick={() => setOpen(true)}
                className="
                  hidden md:flex items-center gap-2
                  px-5 py-2.5
                  rounded-full
                  bg-blue-500 text-white
                  hover:bg-blue-400
                  transition
                "
              >
                <span>{user.username}</span>
                <span className="text-xs">▾</span>
              </button>
            )}

            {/* MOBILE HAMBURGER */}
            <button
              className="md:hidden flex flex-col gap-1"
              onClick={() => setMobileOpen((p) => !p)}
            >
              <span className="w-6 h-[2px] bg-white" />
              <span className="w-6 h-[2px] bg-white" />
              <span className="w-6 h-[2px] bg-white" />
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="md:hidden bg-blue-600 border-t border-blue-500 animate-fadeIn">
            <div className="px-6 py-6 space-y-6 text-center">

              <button onClick={() => scrollTo("how-it-works")} className="block w-full text-white text-lg">
                How it works
              </button>

              <button onClick={() => scrollTo("insights")} className="block w-full text-white text-lg">
                Insights
              </button>

              <button onClick={() => scrollTo("footer")} className="block w-full text-white text-lg">
                Contact
              </button>

              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-white text-lg"
              >
                About Us
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="
                    inline-block mt-4
                    px-8 py-3
                    rounded-full
                    bg-white text-blue-600
                    font-semibold
                  "
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ACCOUNT DROPDOWN */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)}>
            <div
              className="absolute right-6 top-20 w-56 bg-white text-slate-700 rounded-xl shadow-xl border"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full px-4 py-3 text-left hover:bg-slate-100"
                onClick={() => {
                  setShowUpdate(true);
                  setOpen(false);
                }}
              >
                Update Password
              </button>

              <button
                className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-50"
                onClick={() => {
                  setShowDelete(true);
                  setOpen(false);
                }}
              >
                Delete Account
              </button>

              <div className="h-px bg-slate-200 my-1" />

              <button
                className="w-full px-4 py-3 text-left hover:bg-slate-100"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* MODALS */}
      {showUpdate && <UpdatePasswordModal onClose={() => setShowUpdate(false)} />}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </>
  );
}
