import AuthModal from "../components/auth/AuthModal";

import PageLayout from "../components/layout/PageLayout";
import Sidebar from "../components/layout/Sidebar";
import MapView from "../components/map/MapView";

import LocationOverview from "../components/location/LocationOverview";
import InsightsSection from "../components/location/InsightsSection";

import useLocationOverview from "../hooks/useLocationOverview";

export default function MainApp() {
  useLocationOverview();

  return (
    <>
      <PageLayout
        sidebar={
          <Sidebar>
            <LocationOverview />
          </Sidebar>
        }
        main={<MapView />}
      />

      <InsightsSection />
      <AuthModal />
    </>
  );
}
