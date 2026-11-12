const marketTransactionsCsv = `Onion,Potato,Burger,,
Potato,Burger,Milk,,
Milk,Beer,,,
Onion,Potato,Milk,,
Onion,Potato,Burger,Beer,
Onion,Potato,Burger,Milk,Beer`;

export default function Sampledata() {
    return (
        <details className="sample-data">
            <summary>View sample CSV format</summary>
            <p>Each row is one market transaction. Items are separated by commas; empty cells are left blank.</p>
            <pre><code>{marketTransactionsCsv}</code></pre>
        </details>
    );
}
