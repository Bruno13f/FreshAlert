import React, { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import "./SocketStatus.css";

const SocketStatus = ({ onNewAtividade }) => {
  const { connected, error, joinLinha, leaveLinha, ping, emit, on } =
    useSocket();
  const [currentLinha, setCurrentLinha] = useState("");
  const [joinedLinha, setJoinedLinha] = useState(null);
  const [atividades, setAtividades] = useState([]);

  // Listen for atividade events
  React.useEffect(() => {
    const handleNewAtividade = (atividade) => {
      console.log("🆕 New atividade received via socket:", atividade);
      setAtividades((prev) => [atividade, ...prev.slice(0, 4)]); // Keep last 5

      // Pass to parent component for ThreeStage integration
      if (onNewAtividade) {
        onNewAtividade(atividade);
      }
    };

    const handleAtividadeCreated = (atividade) => {
      console.log("✅ Atividade created in linha:", atividade);
      setAtividades((prev) => [atividade, ...prev.slice(0, 4)]); // Keep last 5

      // Pass to parent component for ThreeStage integration
      if (onNewAtividade) {
        onNewAtividade(atividade);
      }
    };

    on("atividade:new", handleNewAtividade);
    on("atividade:created", handleAtividadeCreated);

    // Cleanup function to remove listeners
    return () => {
      // Note: You might need to implement an 'off' method in your socket service
      // for proper cleanup, but for now this ensures fresh listeners
    };
  }, [on, onNewAtividade]);

  const handleJoinLinha = () => {
    if (currentLinha && !isNaN(parseInt(currentLinha))) {
      joinLinha(parseInt(currentLinha));
      setJoinedLinha(parseInt(currentLinha));
    }
  };

  const handleLeaveLinha = () => {
    if (joinedLinha) {
      leaveLinha(joinedLinha);
      setJoinedLinha(null);
    }
  };

  const handlePing = () => {
    ping();
  };

  const createTestAtividade = () => {
    if (joinedLinha) {
      const isFresh = Math.random() > 0.5;
      console.log(`🧪 Creating test atividade with is_fresh: ${isFresh}`);

      emit("atividade:create", {
        linha_id: joinedLinha,
        is_fresh: isFresh,
      });
    }
  };

  const createFreshAtividade = () => {
    if (joinedLinha) {
      console.log("🟢 Creating FRESH test atividade");
      emit("atividade:create", {
        linha_id: joinedLinha,
        is_fresh: true,
      });
    }
  };

  const createSpoiledAtividade = () => {
    if (joinedLinha) {
      console.log("🔴 Creating SPOILED test atividade");
      emit("atividade:create", {
        linha_id: joinedLinha,
        is_fresh: false,
      });
    }
  };

  return (
    <div className="socket-status">
      <div className="socket-header">
        <h3>🔌 Socket.IO Status</h3>
        <div
          className={`status-indicator ${
            connected ? "connected" : "disconnected"
          }`}>
          {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </div>

      {error && <div className="error-message">❌ Error: {error}</div>}

      {connected && (
        <div className="socket-controls">
          <div className="control-group">
            <button onClick={handlePing} className="ping-btn">
              🏓 Ping Server
            </button>
          </div>

          <div className="control-group">
            <div className="linha-controls">
              <input
                type="number"
                placeholder="Linha ID"
                value={currentLinha}
                onChange={(e) => setCurrentLinha(e.target.value)}
                className="linha-input"
              />
              <button
                onClick={handleJoinLinha}
                disabled={!currentLinha || joinedLinha}
                className="join-btn">
                📡 Join Linha
              </button>
              {joinedLinha && (
                <button onClick={handleLeaveLinha} className="leave-btn">
                  👋 Leave Linha {joinedLinha}
                </button>
              )}
            </div>
          </div>

          {joinedLinha && (
            <div className="control-group">
              <button onClick={createTestAtividade} className="test-btn">
                🧪 Create Random Test
              </button>
              <div className="test-buttons">
                <button
                  onClick={createFreshAtividade}
                  className="test-btn fresh">
                  🟢 Test Fresh
                </button>
                <button
                  onClick={createSpoiledAtividade}
                  className="test-btn spoiled">
                  🔴 Test Spoiled
                </button>
              </div>
            </div>
          )}

          {atividades.length > 0 && (
            <div className="recent-atividades">
              <h4>📋 Recent Atividades</h4>
              <div className="atividades-list">
                {atividades.map((atividade, index) => (
                  <div key={index} className="atividade-item">
                    <span className="atividade-id">ID: {atividade.id}</span>
                    <span className="atividade-linha">
                      Linha: {atividade.linha_id}
                    </span>
                    <span
                      className={`atividade-fresh ${
                        atividade.is_fresh === true
                          ? "fresh"
                          : atividade.is_fresh === false
                          ? "not-fresh"
                          : "unknown"
                      }`}>
                      {atividade.is_fresh === true
                        ? "🟢 Fresh"
                        : atividade.is_fresh === false
                        ? "🔴 Not Fresh"
                        : "❓ Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocketStatus;
