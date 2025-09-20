import React, { useRef, useCallback } from "react";
import "./App.css";
import Chatbot from "./components/Chatbot";
import ThreeStage from "./components/ThreeStage";
import SocketStatus from "./components/SocketStatus";

function App() {
  const threeStageRef = useRef(null);

  const handleNewAtividade = useCallback((atividade) => {
    console.log("📦 New atividade received:", atividade);

    if (!threeStageRef.current) {
      console.warn("⚠️ ThreeStage ref not available");
      return;
    }

    // Check if ThreeStage is currently awaiting a choice
    if (threeStageRef.current.isAwaitingChoice()) {
      console.log(
        `🤖 Auto-processing item based on is_fresh: ${atividade.is_fresh}`
      );

      if (atividade.is_fresh === true) {
        // Accept the current item
        threeStageRef.current.acceptCurrentItem();
        console.log("✅ Item accepted - is fresh");
      } else if (atividade.is_fresh === false) {
        // Reject the current item
        threeStageRef.current.rejectCurrentItem();
        console.log("❌ Item rejected - not fresh");
      } else {
        // If is_fresh is null/undefined, you could handle it differently
        console.log("⚠️ Atividade has no freshness data, no action taken");
      }
    } else {
      console.log("ℹ️ No item currently awaiting approval");
    }
  }, []);

  const handleItemPaused = useCallback((item) => {
    console.log("⏸️ Item paused for approval:", item);
    // You could add additional logic here when an item is paused
    // For example, highlight something in the UI, play a sound, etc.
  }, []);

  const handleItemProcessed = useCallback((action, item) => {
    console.log(`✅ Item ${action}:`, item);
    // You could add logic here to track processed items
    // For example, update counters, log to analytics, etc.
  }, []);
  return (
    <div className="App hero">
      <div className="hero-content">
        <div className="branding">
          <h1>FreshAlert</h1>
          <p>Deteção inteligente e visual de frescura alimentar</p>
        </div>
        <div className="stage-wrap">
          <ThreeStage
            ref={threeStageRef}
            scale={3}
            frameScale={1}
            pauseOnCenter
            pauseSeconds={2}
            centerThreshold={0.05}
            imageScale={1.5}
            speed={1}
            direction={1}
            showFrame
            visibleCount={8}
            onItemPaused={handleItemPaused}
            onItemProcessed={handleItemProcessed}
          />
        </div>
        <SocketStatus onNewAtividade={handleNewAtividade} />
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
