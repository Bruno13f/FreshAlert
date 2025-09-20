import React, { useState } from "react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chatbot-root">
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="chatbot-panel"
      >
        {isOpen ? "Fechar" : "Chat"}
      </button>
      <div
        id="chatbot-panel"
        className={`chatbot-panel ${isOpen ? "visible" : "hidden"}`}
        role="dialog"
        aria-label="Chatbot"
      >
        <div className="chatbot-header">
          <div className="chatbot-title">FreshAlert Assistant</div>
          <button
            className="chatbot-close"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="chatbot-messages">
          <div className="message bot">Olá! Em que posso ajudar?</div>
        </div>
        <form className="chatbot-input" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Escreve a tua mensagem..." />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
