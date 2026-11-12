function formatItems(items) {
    return Array.isArray(items) ? items.join(', ') : String(items);
}

export default function Result({ result }) {
    if (!result) return null;

    let data;
    try {
        data = JSON.parse(result);
    } catch {
        return <p role="alert">The analysis results could not be displayed.</p>;
    }

    const transactions = Object.entries(data.transactions ?? {});
    const itemNames = transactions.length > 0 ? Object.keys(transactions[0][1]) : [];
    const frequentItemsets = Object.entries(data.frequent_itemsets ?? {}).flatMap(
        ([round, itemsets]) => itemsets.map(items => ({ round, items }))
    );
    const rules = data.association_rules ?? [];

    return (
        <section className="results" aria-label="Analysis results">
            <h2>Results</h2>

            <div className="table-scroll" role="region" aria-label="Transactions table" tabIndex={0}>
            <table>
                <caption>Transactions</caption>
                <thead>
                    <tr>
                        <th scope="col">Instance</th>
                        {itemNames.map(item => <th scope="col" key={item}>{item}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(([number, items]) => (
                        <tr key={number}>
                            <th scope="row">{number}</th>
                            {itemNames.map(item => <td key={item}>{items[item]}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <div className="table-scroll" role="region" aria-label="Frequent itemsets table" tabIndex={0}>
            <table>
                <caption>Frequent itemsets</caption>
                <thead>
                    <tr><th scope="col">Round</th><th scope="col">Items</th></tr>
                </thead>
                <tbody>
                    {frequentItemsets.length > 0 ? frequentItemsets.map(({ round, items }, index) => (
                        <tr key={`${round}-${index}`}>
                            <td>{round}</td>
                            <td>{formatItems(items)}</td>
                        </tr>
                    )) : <tr><td colSpan={2}>No frequent itemsets found.</td></tr>}
                </tbody>
            </table>
            </div>

            <div className="table-scroll" role="region" aria-label="Association rules table" tabIndex={0}>
            <table>
                <caption>Association rules</caption>
                <thead>
                    <tr>
                        <th scope="col">If</th>
                        <th scope="col">Then</th>
                        <th scope="col">Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.length > 0 ? rules.map((rule, index) => (
                        <tr key={index}>
                            <td>{formatItems(rule.antecedent)}</td>
                            <td>{formatItems(rule.consequent)}</td>
                            <td>{(rule.confidence * 100).toFixed(1)}%</td>
                        </tr>
                    )) : <tr><td colSpan={3}>No association rules found.</td></tr>}
                </tbody>
            </table>
            </div>
        </section>
    );
}
