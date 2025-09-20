import './App.css';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: '0' }}>
        <h1>FreshAlert Chat</h1>
      </header>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <Chatbot />
        </div>
      </div>
    </div>
  );
}

export default App;
