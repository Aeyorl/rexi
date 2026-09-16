import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { fetchChainIndex } from '../services/api';
import {
  approveRewards,
  claimRewards,
  distributeRewards,
  readHolderRewards,
  readRewardAssetState
} from '../services/rexiChain';
import { REXI_REWARD_ASSET, explorerTxUrl } from '../services/deployments';
import './Rewards.css';

const DISTRIBUTION_AMOUNT = 1000;

export default function Rewards() {
  const { connected, openModal, walletAddress, shortAddress } = useWallet();

  const [index, setIndex] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedToken, setSelectedToken] = useState(null);

  const [holderRewards, setHolderRewards] = useState(null);
  const [rewardAssetState, setRewardAssetState] = useState(null);
  const [readsError, setReadsError] = useState('');

  const [action, setAction] = useState(null); // 'approving' | 'distributing' | 'claiming'
  const [message, setMessage] = useState('');
  const [lastTx, setLastTx] = useState(null);

  const launches = index?.data ?? [];
  const selected = launches.find(l => l.token === selectedToken) || launches[0] || null;
  const selectedAddress = selected?.token ?? null;
  const stats = index?.stats ?? null;

  // Index the launchpad events. All state updates happen after an await.
  useEffect(() => {
    let active = true;
    async function load() {
      const data = await fetchChainIndex();
      if (!active) return;
      if (data) {
        setIndex(data);
        setLoadError('');
      } else {
        setLoadError('Robinhood Chain index unavailable. The RPC may be rate limiting — retry shortly.');
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [refreshKey]);

  // Read this wallet's position for the selected launch.
  useEffect(() => {
    if (!connected || !walletAddress || !selectedAddress) return;
    let active = true;
    async function loadWallet() {
      try {
        const [rewards, assetState] = await Promise.all([
          readHolderRewards(selectedAddress, walletAddress),
          readRewardAssetState(walletAddress, selected?.rewardAsset || REXI_REWARD_ASSET)
        ]);
        if (!active) return;
        setHolderRewards(rewards);
        setRewardAssetState(assetState);
        setReadsError('');
      } catch (err) {
        if (!active) return;
        setReadsError(err.shortMessage || err.message || 'Could not read on-chain reward state.');
      }
    }
    loadWallet();
    return () => { active = false; };
  }, [connected, walletAddress, selectedAddress, selected?.rewardAsset, refreshKey]);

  const runAction = async (kind, fn, successMessage) => {
    setAction(kind);
    setMessage('');
    setLastTx(null);
    try {
      const result = await fn();
      setLastTx(result?.hash ?? null);
      setMessage(successMessage);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setMessage(err.shortMessage || err.message || 'Transaction failed.');
    } finally {
      setAction(null);
    }
  };

  const rewardSymbol = selected?.rewardAssetSymbol || 'reward';

  const handleApprove = () => runAction(
    'approving',
    () => approveRewards(DISTRIBUTION_AMOUNT, selected?.rewardAsset || REXI_REWARD_ASSET),
    `Approved the launchpad to spend ${DISTRIBUTION_AMOUNT} ${rewardSymbol}.`
  );

  const handleDistribute = () => runAction(
    'distributing',
    () => distributeRewards(selectedAddress, DISTRIBUTION_AMOUNT, selected?.rewardAsset || REXI_REWARD_ASSET),
    `Distributed ${DISTRIBUTION_AMOUNT} ${rewardSymbol} across ${selected?.symbol} holders.`
  );

  const handleClaim = () => runAction(
    'claiming',
    () => claimRewards(selectedAddress),
    `Claimed accrued ${rewardSymbol} rewards.`
  );

  const walletRewards = connected ? holderRewards : null;
  const walletAsset = connected ? rewardAssetState : null;
  const busy = action !== null;

  return (
    <div className="rewards">
      <div className="rewards-header">
        <h1 className="page-title">Rewards</h1>
        <p className="page-desc">
          Every coin launched here pays its holders. Fee inflows land in the launchpad, the holders' share
          accrues pro-rata against the launch token, and each holder claims it in the reward asset the
          launcher chose. Everything below is read straight from Robinhood Chain Testnet.
        </p>
      </div>

      {/* Live index panel */}
      <div className="user-rewards-card animate-in">
        <div className="user-rewards-active">
          <div className="user-rewards-left">
            <div className="user-pill-tag">
              <span className="active-dot" /> Robinhood Chain Testnet · launchpad{' '}
              <a className="tx-link" href={index?.launchpadUrl || '#'} target="_blank" rel="noreferrer">
                {index?.launchpad ? `${index.launchpad.slice(0, 6)}…${index.launchpad.slice(-4)}` : 'unavailable'}
              </a>
            </div>
            <div className="live-summary">
              {loading
                ? 'Indexing launchpad events…'
                : `${stats?.launchCount ?? 0} launches · ${stats?.distributions ?? 0} distributions · ${stats?.holderPayouts ?? 0} holder payouts`}
            </div>
            {loadError && <div className="status-line error">{loadError}</div>}
          </div>
          <button className="btn-ghost-refresh" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh on-chain data'}
          </button>
        </div>
      </div>

      {/* Launch selector */}
      {launches.length > 0 && (
        <div className="rewards-section">
          <div className="section-header">
            <h2>Launches</h2>
            <span className="section-sub">Newest first · click to select</span>
          </div>
          <div className="launch-list">
            {launches.map(launch => (
              <button
                key={launch.token}
                className={`launch-row ${selectedAddress === launch.token ? 'active' : ''}`}
                onClick={() => setSelectedToken(launch.token)}
              >
                <span className="launch-avatar">{(launch.symbol || '??').slice(0, 2).toUpperCase()}</span>
                <span className="launch-info">
                  <span className="launch-symbol">
                    ${launch.symbol || 'unknown'} <span className="launch-badge">{launch.active ? 'live' : 'closed'}</span>
                  </span>
                  <span className="launch-meta">
                    {launch.name || 'Unnamed'} · {launch.supplyFormatted ?? '0'} supply · paid{' '}
                    {launch.distributionCount} time{launch.distributionCount === 1 ? '' : 's'} · pays{' '}
                    {launch.rewardAssetSymbol || 'reward'}
                  </span>
                </span>
                <span className="launch-right">
                  <span className="launch-total">{launch.distributed || '0'} {launch.rewardAssetSymbol || ''}</span>
                  <span className="launch-meta">{launch.claimCount} claim{launch.claimCount === 1 ? '' : 's'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Selected launch + wallet position */}
      <div className="user-rewards-card animate-in">
        {!selected ? (
          <div className="user-rewards-prompt">
            <div className="prompt-info">
              <span className="prompt-title">
                {loading ? 'Loading launches from Robinhood Chain…' : 'No launches found on this launchpad'}
              </span>
              <span className="prompt-desc">
                Launch a token first, then fund it with a reward asset to start paying holders.
              </span>
            </div>
          </div>
        ) : !connected ? (
          <div className="user-rewards-prompt">
            <div className="prompt-info">
              <span className="prompt-title">
                Claim ${selected.symbol} rewards in {selected.rewardAssetSymbol || rewardSymbol}
              </span>
              <span className="prompt-desc">
                Connect a wallet on Robinhood Chain Testnet to read your holding, your accrued rewards, and to claim.
              </span>
            </div>
            <button className="btn-connect-banner" onClick={openModal}>Connect Wallet</button>
          </div>
        ) : (
          <div className="user-rewards-active">
            <div className="user-rewards-left">
              <div className="user-pill-tag">
                <span className="active-dot" /> Connected as <code>{shortAddress || walletAddress}</code>
              </div>
              <div className="user-claimable-amount">
                {walletRewards ? `${Number(walletRewards.pendingFormatted).toFixed(6)} ${rewardSymbol}` : '—'}
                <span className="claimable-sub">claimable now from ${selected.symbol}</span>
              </div>
              <div className="claimable-sub">
                Holding {walletRewards ? Number(walletRewards.heldFormatted).toLocaleString('en-US') : '—'} ${selected.symbol}
                {' · accrued '}
                {walletRewards ? Number(walletRewards.accruedFormatted).toFixed(6) : '—'} {rewardSymbol}
                {' · balance '}
                {walletAsset ? Number(walletAsset.balanceFormatted).toLocaleString('en-US') : '—'} {rewardSymbol}
                {' · allowance '}
                {walletAsset ? Number(walletAsset.allowanceFormatted).toLocaleString('en-US') : '—'}
              </div>
              <div className="status-line">
                <a className="tx-link" href={selected.tokenUrl} target="_blank" rel="noreferrer">{selected.token}</a>
                {` · pays ${selected.rewardAssetSymbol} · ${selected.distributionCount} distribution(s) · ${selected.claimed} ${selected.rewardAssetSymbol} claimed to date`}
              </div>
              {readsError && <div className="status-line error">{readsError}</div>}
              {message && <div className="status-line">{message}</div>}
              {lastTx && (
                <div className="status-line">
                  <a className="tx-link" href={explorerTxUrl(lastTx)} target="_blank" rel="noreferrer">
                    View {lastTx.slice(0, 10)}… on the explorer
                  </a>
                </div>
              )}
            </div>
            <div className="user-rewards-right card-actions">
              <button
                className="btn-claim-rewards"
                disabled={busy || !walletRewards?.claimable}
                onClick={handleClaim}
              >
                {action === 'claiming' ? 'Claiming…' : `Claim ${rewardSymbol}`}
              </button>
              <button className="btn-outline" disabled={busy} onClick={handleApprove}>
                {action === 'approving' ? 'Approving…' : `Approve ${DISTRIBUTION_AMOUNT} ${rewardSymbol}`}
              </button>
              <button className="btn-outline" disabled={busy} onClick={handleDistribute}>
                {action === 'distributing' ? 'Distributing…' : `Distribute ${DISTRIBUTION_AMOUNT} ${rewardSymbol}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid — on-chain totals */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">DISTRIBUTIONS</div>
          <div className="stat-card-val">{stats?.distributions ?? 0}</div>
          <div className="stat-card-sub">RewardsDistributed events on the launchpad</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">HOLDER PAYOUTS</div>
          <div className="stat-card-val">{stats?.holderPayouts ?? 0}</div>
          <div className="stat-card-sub">RewardClaimed events, one per wallet per claim</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">PAYING TOKENS</div>
          <div className="stat-card-val">{stats?.payingTokens ?? 0}</div>
          <div className="stat-card-sub">Launches that have distributed at least once</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">DISTRIBUTED</div>
          <div className="stat-card-val">
            {(stats?.distributedByAsset ?? []).length > 0
              ? stats.distributedByAsset.map(a => `${Number(a.total).toLocaleString('en-US')} ${a.symbol}`).join(' · ')
              : '0'}
          </div>
          <div className="stat-card-sub">Sum of every distribution, per reward asset</div>
        </div>
      </div>

      {/* Top Distributions */}
      <div className="rewards-section">
        <div className="section-header">
          <h2>Top distributions</h2>
          <span className="section-sub">Ranked by total paid to holders</span>
        </div>
        <div className="top-dist-list">
          {(index?.topLaunches ?? []).length === 0 && (
            <div className="empty-row">{loading ? 'Indexing…' : 'No distributions yet.'}</div>
          )}
          {(index?.topLaunches ?? []).map((launch, i) => (
            <div key={launch.token} className="top-dist-row" onClick={() => setSelectedToken(launch.token)}>
              <div className="dist-rank">{i + 1}</div>
              <div className="dist-avatar">{(launch.symbol || '??').slice(0, 2).toUpperCase()}</div>
              <div className="dist-info">
                <span className="dist-name">{launch.name || launch.symbol}</span>
                <span className="dist-meta">
                  ${launch.symbol} · pays {launch.rewardAssetSymbol} · {launch.distributionCount} paid ·{' '}
                  {launch.claimCount} claimed
                </span>
              </div>
              <div className="dist-right">
                <div className="dist-total">{launch.distributed} {launch.rewardAssetSymbol}</div>
                <div className="dist-mcap">{launch.holderShare} to holders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Distributions */}
      <div className="rewards-section">
        <div className="section-header">
          <h2>Recent distributions</h2>
          <span className="section-sub">Live from Robinhood Chain Testnet, newest first</span>
        </div>
        <div className="recent-dist-list">
          {(index?.recentDistributions ?? []).length === 0 && (
            <div className="empty-row">{loading ? 'Indexing…' : 'Nothing distributed yet.'}</div>
          )}
          {(index?.recentDistributions ?? []).map((item) => (
            <a
              key={`${item.txHash}-${item.blockNumber}`}
              className="recent-dist-row"
              href={item.txUrl}
              target="_blank"
              rel="noreferrer"
            >
              <div className="recent-dist-avatar">{(item.symbol || '??').slice(0, 2).toUpperCase()}</div>
              <div className="recent-dist-info">
                <span className="recent-dist-symbol">${item.symbol || 'unknown'}</span>
                <span className="recent-dist-meta">{item.name || 'Unnamed'} · {item.ago || 'recently'}</span>
              </div>
              <div className="recent-dist-right">
                <span className="recent-dist-amount">{item.amount} {item.rewardAssetSymbol}</span>
                <span className="recent-dist-token">{item.holderAmount} to holders</span>
              </div>
              <span className="dist-arrow">›</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
