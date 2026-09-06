import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import About from "../pages/About";
import MainApp from "./MainApp";
import AppLayout from "../components/layout/AppLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout Route */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/app" element={<MainApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
