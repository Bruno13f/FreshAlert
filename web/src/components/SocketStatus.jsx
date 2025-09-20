import React, { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import "./SocketStatus.css";

const SocketStatus = () => {
  const { connected, error, joinLinha, leaveLinha, ping, emit, on } =
    useSocket();
  const [currentLinha, setCurrentLinha] = useState("");
  const [joinedLinha, setJoinedLinha] = useState(null);
  const [atividades, setAtividades] = useState([]);

  // Listen for atividade events
  React.useEffect(() => {
    on("atividade:new", (atividade) => {
      setAtividades((prev) => [atividade, ...prev.slice(0, 4)]); // Keep last 5
    });

    on("atividade:created", (atividade) => {
      setAtividades((prev) => [atividade, ...prev.slice(0, 4)]); // Keep last 5
    });
  }, [on]);

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
      emit("atividade:create", {
        linha_id: joinedLinha,
        is_fresh: Math.random() > 0.5,
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
                🧪 Create Test Atividade
              </button>
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
                        atividade.is_fresh ? "fresh" : "not-fresh"
                      }`}>
                      {atividade.is_fresh ? "🟢 Fresh" : "🔴 Not Fresh"}
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
