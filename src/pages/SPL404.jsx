import './SPL404.css';

const SPL_TOKENS = [
  { id: 1, name: 'OTC Desk', symbol: 'DESK', supply: '5,000', minted: '2,245', floor: '$142.50', volume: '$48.2K' },
  { id: 2, name: 'ChainBot', symbol: 'CBOT', supply: '10,000', minted: '7,820', floor: '$38.90', volume: '$21.5K' },
  { id: 3, name: 'SolStars', symbol: 'STAR', supply: '3,000', minted: '1,400', floor: '$89.20', volume: '$12.8K' },
  { id: 4, name: 'DeFi Dogs', symbol: 'DDOG', supply: '8,000', minted: '5,310', floor: '$22.10', volume: '$9.1K' },
];

export default function SPL404() {
  return (
    <div className="spl-page">
      <div className="spl-header">
        <h1 className="page-title">SPL-404</h1>
        <p className="spl-desc">
          SPL-404 is a hybrid token standard on Solana — tokens that are simultaneously fungible and non-fungible. Holders can swap between the NFT and fungible token form seamlessly.
        </p>
      </div>

      <div className="spl-table-card">
        <div className="spl-table-header">
          <span>Collection</span>
          <span>Supply</span>
          <span>Minted</span>
          <span>Floor</span>
          <span>Volume</span>
        </div>
        {SPL_TOKENS.map(token => (
          <div key={token.id} className="spl-row">
            <div className="spl-name-cell">
              <div className="spl-avatar">{token.symbol.slice(0, 2)}</div>
              <div>
                <div className="spl-token-name">{token.name}</div>
                <div className="spl-token-symbol">${token.symbol}</div>
              </div>
            </div>
            <div className="spl-cell">{token.supply}</div>
            <div className="spl-cell">
              {token.minted}
              <div className="spl-progress-bar">
                <div
                  className="spl-progress-fill"
                  style={{ width: `${(parseInt(token.minted.replace(/,/g,'')) / parseInt(token.supply.replace(/,/g,''))) * 100}%` }}
                />
              </div>
            </div>
            <div className="spl-cell">{token.floor}</div>
            <div className="spl-cell accent">{token.volume}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
