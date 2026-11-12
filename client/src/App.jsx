import { useState } from 'react';
import FileForm from './components/Fileform.jsx';
import Greet from './components/Greet.jsx';
import Sampledata from './components/Sampledata.jsx';
import Transaction from './components/Transaction.jsx';

function App() {
  const [inputMode, setInputMode] = useState('file');

  return (
    <div className="app-shell">
      <header className="page-header">
        <Greet />
      </header>
      <main className="page-main">
        <div className="input-mode" role="group" aria-label="Choose how to enter transactions">
          <button type="button" aria-pressed={inputMode === 'file'} onClick={() => setInputMode('file')}>
            Upload a CSV file
          </button>
          <button type="button" aria-pressed={inputMode === 'manual'} onClick={() => setInputMode('manual')}>
            Type transactions
          </button>
        </div>
        {inputMode === 'file' ? (
          <>
            <section className="panel">
              <h2>Upload a CSV file</h2>
              <FileForm />
            </section>
            <Sampledata />
          </>
        ) : <Transaction />}
      </main>
    </div>
  );
}

export default App;
