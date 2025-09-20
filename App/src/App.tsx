import { Route, Routes, BrowserRouter } from "react-router-dom";
import AssistantPage from "./pages/AssistantPage";
import ScanPage from "./pages/ScanPage";
import Navbar from "./components/Navbar";
import wallpaper from "./assets/490d6d4576ebdbc3d8df6d7a6ea7346f.jpg"; // Import the wallpaper

function App() {

  return (
    <div
      className="min-h-screen w-full bg-muted-foreground font-roboto-flex overflow-x-hidden relative"
      style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }} // Set the wallpaper as background
    >
      {/* LoadingScreen stays always visible */}
      {/* <div
        className={`
          absolute inset-0 z-10
        `}
      >
        <LoadingScreen />
      </div> */}
      <BrowserRouter>
        <Routes>
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/scan" element={<ScanPage />} />
        </Routes>
        <Navbar />
      </BrowserRouter>
    </div>
  );
}

export default App
