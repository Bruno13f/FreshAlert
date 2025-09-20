import './App.css';
import Chatbot from './components/Chatbot';
import ThreeStage from './components/ThreeStage';

function App() {
  return (
    <div className="App hero">
      <div className="hero-content">
        <div className="branding">
          <h1>FreshAlert</h1>
          <p>Deteção inteligente e visual de frescura alimentar</p>
        </div>
        <div className="stage-wrap">
          <ThreeStage />
        </div>
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
