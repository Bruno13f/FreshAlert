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
          <ThreeStage scale={3} frameScale={1} pauseOnCenter pauseSeconds={2} centerThreshold={0.05} imageScale={1.5} speed={1} direction={1} showFrame visibleCount={8} />
        </div>
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
