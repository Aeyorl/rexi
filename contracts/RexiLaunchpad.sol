// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal token surface the launchpad needs from a reward asset.
interface IERC20Like {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Minimal ERC-20 used for Rexi testnet launches.
contract RexiToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    address public transferHook;
    /// @dev Only the deployer may wire the transfer hook, so a third party
    ///      cannot point a token's accounting at a contract of their choosing.
    address public immutable deployer;

    constructor(string memory name_, string memory symbol_, address recipient, uint256 supply) {
        name = name_;
        symbol = symbol_;
        totalSupply = supply;
        deployer = msg.sender;
        balanceOf[recipient] = supply;
        emit Transfer(address(0), recipient, supply);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function setTransferHook(address hook) external {
        if (msg.sender != deployer) revert NotHookDeployer();
        if (transferHook != address(0)) revert HookAlreadySet();
        transferHook = hook;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 permitted = allowance[from][msg.sender];
        if (permitted < amount) revert InsufficientAllowance();
        if (permitted != type(uint256).max) allowance[from][msg.sender] = permitted - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (transferHook != address(0)) {
            ITransferHook(transferHook).beforeTokenTransfer(address(this), from, to, amount);
        }
        if (balanceOf[from] < amount) revert InsufficientBalance();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    error InsufficientBalance();
    error InsufficientAllowance();
    error HookAlreadySet();
    error NotHookDeployer();
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
}

/// @notice Launch tokens report the transferred amount so reward accounting can
///         carry each side's unclaimed rewards through the balance change.
interface ITransferHook {
    function beforeTokenTransfer(address token, address from, address to, uint256 amount) external;
}

/// @notice Testnet launchpad: reward-token deposits are claimable pro-rata by launch-token holders.
contract RexiLaunchpad is ITransferHook {
    uint256 public constant BPS = 10_000;
    uint256 public constant HOLDER_SHARE = 6_750;
    uint256 public constant ACC_SCALE = 1e24;
    address public immutable protocolTreasury;
    address public immutable desksTreasury;
    address public immutable buybackTreasury;
    bool private locked;

    struct Launch {
        address token;
        address rewardAsset;
        uint256 accRewardPerToken;
        uint256 rewardBalance;
        bool active;
    }

    mapping(address => Launch) public launches;
    mapping(address => mapping(address => uint256)) public rewardDebt;

    modifier nonReentrant() {
        if (locked) revert ReentrantCall();
        locked = true;
        _;
        locked = false;
    }

    constructor(address protocol_, address desks_, address buyback_) {
        if (protocol_ == address(0) || desks_ == address(0) || buyback_ == address(0)) revert ZeroAddress();
        protocolTreasury = protocol_;
        desksTreasury = desks_;
        buybackTreasury = buyback_;
    }

    function createLaunch(string calldata name, string calldata symbol, address rewardAsset, uint256 supply)
        external
        returns (address token)
    {
        if (rewardAsset == address(0)) revert ZeroAddress();
        // A zero supply would make every distribute divide by zero.
        if (supply == 0) revert ZeroSupply();
        token = address(new RexiToken(name, symbol, msg.sender, supply));
        launches[token] = Launch(token, rewardAsset, 0, 0, true);
        RexiToken(token).setTransferHook(address(this));
        emit LaunchCreated(token, rewardAsset, msg.sender, supply);
    }

    function distribute(address token, uint256 amount) external nonReentrant {
        Launch storage launch = launches[token];
        if (!launch.active || amount == 0) revert InvalidLaunch();
        // Measure what actually arrived instead of trusting `amount`, so a
        // fee-on-transfer or otherwise non-standard asset cannot inflate the
        // holder bucket beyond the contract's real balance.
        uint256 balanceBefore = IERC20Like(launch.rewardAsset).balanceOf(address(this));
        _pull(launch.rewardAsset, msg.sender, amount);
        uint256 received = IERC20Like(launch.rewardAsset).balanceOf(address(this)) - balanceBefore;
        uint256 holderAmount = received * HOLDER_SHARE / BPS;
        launch.rewardBalance += holderAmount;
        launch.accRewardPerToken += holderAmount * ACC_SCALE / RexiToken(token).totalSupply();
        _pay(launch.rewardAsset, protocolTreasury, received * 500 / BPS);
        _pay(launch.rewardAsset, desksTreasury, received * 1_000 / BPS);
        _pay(launch.rewardAsset, buybackTreasury, received * 1_000 / BPS);
        emit RewardsDistributed(token, received, holderAmount);
    }

    function claim(address token) external nonReentrant {
        Launch storage launch = launches[token];
        uint256 balance = RexiToken(token).balanceOf(msg.sender);
        uint256 accrued = balance * launch.accRewardPerToken / ACC_SCALE;
        uint256 debt = rewardDebt[token][msg.sender];
        if (accrued <= debt) revert NothingToClaim();
        rewardDebt[token][msg.sender] = accrued;
        uint256 amount = accrued - debt;
        launch.rewardBalance -= amount;
        _pay(launch.rewardAsset, msg.sender, amount);
        emit RewardClaimed(token, msg.sender, amount);
    }

    /// @notice Rewards already earned stay with their owner across balance
    ///         changes: each side's debt is re-based so that
    ///         `accrued(after) - debt(after)` equals their pending before the
    ///         transfer. Only the accrual attributable to the transferred
    ///         tokens changes hands, so transfers can no longer burn pending
    ///         rewards that a holder has already earned.
    function beforeTokenTransfer(address token, address from, address to, uint256 amount) external override {
        if (msg.sender != token || from == address(0) || to == address(0) || from == to) return;
        Launch storage launch = launches[token];
        uint256 acc = launch.accRewardPerToken;
        if (acc == 0) return;
        _carryPending(token, from, acc, amount, false);
        _carryPending(token, to, acc, amount, true);
    }

    function _carryPending(address token, address holder, uint256 acc, uint256 amount, bool incoming) internal {
        uint256 balance = RexiToken(token).balanceOf(holder);
        uint256 accrued = balance * acc / ACC_SCALE;
        uint256 debt = rewardDebt[token][holder];
        uint256 pending = accrued > debt ? accrued - debt : 0;
        uint256 balanceAfter = incoming ? balance + amount : (balance > amount ? balance - amount : 0);
        uint256 accruedAfter = balanceAfter * acc / ACC_SCALE;
        rewardDebt[token][holder] = accruedAfter > pending ? accruedAfter - pending : 0;
    }

    function _pull(address asset, address from, uint256 amount) internal {
        (bool ok, bytes memory data) = asset.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _pay(address asset, address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, bytes memory data) = asset.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    error InvalidLaunch();
    error NothingToClaim();
    error TransferFailed();
    error ZeroAddress();
    error ZeroSupply();
    error ReentrantCall();
    event LaunchCreated(address indexed token, address indexed rewardAsset, address indexed creator, uint256 supply);
    event RewardsDistributed(address indexed token, uint256 amount, uint256 holderAmount);
    event RewardClaimed(address indexed token, address indexed holder, uint256 amount);
}

/// @notice Testnet-only reward asset. Do not use on mainnet.
contract RexiTestStockToken is RexiToken {
    constructor() RexiToken('Rexi Test Apple Stock Token', 'rAAPL', msg.sender, 0) {}

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}