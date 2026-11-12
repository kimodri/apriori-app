import { useState } from 'react';
import Result from './Result.jsx';

export default function FileForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLoading(true);
        setError('');
        setResult('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/upload-data`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Upload failed. Check the file and thresholds.');
            }

            setResult(JSON.stringify(data, null, 2));
        } catch (uploadError) {
            setError(uploadError.message || 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <form className="entry-form" onSubmit={handleSubmit} aria-busy={loading}>
                <div className="field">
                    <label htmlFor="file">CSV file</label>
                    <input type="file" id="file" name="file" accept=".csv" required />
                </div>
                <div className="threshold-grid">
                    <div className="field">
                        <label htmlFor="min_support">Minimum support (0–1)</label>
                        <input type="number" id="min_support" name="min_support" step="0.01" min="0" max="1" required />
                        <small>How often an itemset must appear.</small>
                    </div>
                    <div className="field">
                        <label htmlFor="min_confidence">Minimum confidence (0–1)</label>
                        <input type="number" id="min_confidence" name="min_confidence" step="0.01" min="0" max="1" required />
                        <small>How often a rule must hold.</small>
                    </div>
                </div>
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze CSV'}</button>
            </form>
            {loading && <p className="status-message" role="status">Analyzing your CSV file...</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
            <Result result={result} />
        </>
    );
}
