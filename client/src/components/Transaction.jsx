import { useState } from 'react';
import Result from './Result.jsx';

function Item({ number, onAdd, onRemove }) {
    const [value, setValue] = useState('');

    return (
        <div className="item-row">
            <label className="item-field">
                <span>Item {number}</span>
                <input
                    type="text"
                    name="item"
                    value={value}
                    onChange={event => setValue(event.target.value)}
                    placeholder="Item name"
                    required
                />
            </label>
            <button className="icon-button" type="button" onClick={onAdd} aria-label="Add item">+</button>
            <button className="icon-button" type="button" onClick={onRemove} aria-label={`Remove item ${number}`}>
                ×
            </button>
        </div>
    );
}

function TransactionRow({ number, onRemove }) {
    const [itemIds, setItemIds] = useState('1');
    const [nextItemId, setNextItemId] = useState(2);
    const visibleItemIds = itemIds ? itemIds.split(' ') : [];

    function addItem() {
        setItemIds(current => `${current} ${nextItemId}`.trim());
        setNextItemId(id => id + 1);
    }

    function removeItem(id) {
        setItemIds(current => current.split(' ').filter(itemId => itemId !== id).join(' '));
    }

    return (
        <fieldset className="instance">
            <legend>Instance {number}</legend>
            <input type="hidden" name="instance" value={number} />
            <button className="text-button" type="button" onClick={onRemove}>
                Remove instance
            </button>
            {visibleItemIds.map((id, index) => (
                <Item
                    key={id}
                    number={index + 1}
                    onAdd={addItem}
                    onRemove={() => removeItem(id)}
                />
            ))}
            {visibleItemIds.length === 0 && (
                <button className="secondary-button" type="button" onClick={addItem}>Add item</button>
            )}
        </fieldset>
    );
}

export default function Transaction() {
    const [instanceIds, setInstanceIds] = useState('1');
    const [nextInstanceId, setNextInstanceId] = useState(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState('');
    const visibleInstanceIds = instanceIds ? instanceIds.split(' ') : [];

    function addInstance() {
        setInstanceIds(current => `${current} ${nextInstanceId}`.trim());
        setNextInstanceId(id => id + 1);
    }

    function removeInstance(id) {
        setInstanceIds(current => current.split(' ').filter(instanceId => instanceId !== id).join(' '));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const transactions = {};
        let currentItems = null;

        for (const [name, value] of formData.entries()) {
            if (name === 'instance') {
                currentItems = [];
                transactions[Object.keys(transactions).length + 1] = currentItems;
            } else if (name === 'item' && currentItems) {
                currentItems.push(value.trim());
            }
        }

        if (
            Object.keys(transactions).length === 0 ||
            Object.values(transactions).some(items => items.length === 0 || items.some(item => !item))
        ) {
            setError('Add at least one nonblank item to every instance.');
            setResult('');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const response = await fetch('${import.meta.env.VITE_API_URL}/parse-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactions,
                    min_support: Number(formData.get('min_support')),
                    min_confidence: Number(formData.get('min_confidence')),
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Analysis failed. Check the items and thresholds.');
            }

            setResult(JSON.stringify(data, null, 2));
        } catch (submitError) {
            setError(submitError.message || 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="panel">
            <h2>Transaction Data</h2>
            <p>Add each item in its own input, then add another instance for a new transaction.</p>
            <form className="entry-form" onSubmit={handleSubmit} aria-busy={loading}>
                {visibleInstanceIds.map((id, index) => (
                    <TransactionRow
                        key={id}
                        number={index + 1}
                        onRemove={() => removeInstance(id)}
                    />
                ))}
                <button
                    className="secondary-button"
                    type="button"
                    onClick={addInstance}
                >
                    Add instance
                </button>
                <div className="threshold-grid">
                    <div className="field">
                        <label htmlFor="manual-min-support">Minimum support (0–1)</label>
                        <input type="number" id="manual-min-support" name="min_support" step="0.01" min="0" max="1" required />
                        <small>How often an itemset must appear.</small>
                    </div>
                    <div className="field">
                        <label htmlFor="manual-min-confidence">Minimum confidence (0–1)</label>
                        <input type="number" id="manual-min-confidence" name="min_confidence" step="0.01" min="0" max="1" required />
                        <small>How often a rule must hold.</small>
                    </div>
                </div>
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze transactions'}</button>
            </form>
            {loading && <p className="status-message" role="status">Analyzing your transactions...</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
            <Result result={result} />
        </section>
    );
}
