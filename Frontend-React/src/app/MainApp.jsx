import AuthModal from "../components/auth/AuthModal";

import PageLayout from "../components/layout/PageLayout";
import Sidebar from "../components/layout/Sidebar";
import MapView from "../components/map/MapView";

import LocationOverview from "../components/location/LocationOverview";
import InsightsSection from "../components/location/InsightsSection";
import AreaChatbot from "../components/location/AreaChatbot";

import useLocationOverview from "../hooks/useLocationOverview";
import { useLocationStore } from "../features/location/location.store";

export default function MainApp() {
  useLocationOverview();

  const sessionId = useLocationStore((state) => state.sessionId);

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

      {sessionId && <AreaChatbot sessionId={sessionId} />}

      <AuthModal />
    </>
  );
}
