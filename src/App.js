import './App.css';
import ImageUploader from './components/ImageUploader';

function App() {
  return (
    <div className="App">
      <div className='task-container'>
        <header className='task-header'>
          <img src="./logo-white.png" alt=" logo-dragonflyAI" className='logo-main' />
          <h1>DragonflyAI task</h1>
        </header>

        <ImageUploader />
      </div>
    </div>
  );
}

export default App;
