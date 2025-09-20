import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import AssistantPage from "./pages/AssistantPage";
import ScanPage from "./pages/ScanPage";
import Navbar from "./components/navbar";
import * as tf from "@tensorflow/tfjs";
import { Toaster } from 'react-hot-toast';

import "@tensorflow/tfjs-backend-wasm";
import "@tensorflow/tfjs-backend-webgl";

function App() {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Choose backend: wasm or webgl
        await tf.setBackend("wasm");
        await tf.ready();

        // Load TensorFlow.js model from public/model/
        const loadedModel = await tf.loadGraphModel("/model/model.json");
        setModel(loadedModel);
        window.history.pushState({}, "", "/assistant");
        console.log("✅ TensorFlow.js model loaded!");
      } catch (error) {
        console.error("❌ Error loading TensorFlow.js model:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background font-roboto-flex overflow-x-hidden relative">
      <Toaster />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/assistant" element={<AssistantPage />} />
            {model && <Route path="/scan" element={<ScanPage model={model} />} />}
          </Routes>
          <Navbar disabled={loading} />
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
