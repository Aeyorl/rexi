// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 used for Rexi testnet launches.
contract RexiToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory name_, string memory symbol_, address recipient, uint256 supply) {
        name = name_;
        symbol = symbol_;
        totalSupply = supply;
        balanceOf[recipient] = supply;
        emit Transfer(address(0), recipient, supply);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
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
        if (balanceOf[from] < amount) revert InsufficientBalance();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    error InsufficientBalance();
    error InsufficientAllowance();
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
}

/// @notice Testnet launchpad: reward-token deposits are claimable pro-rata by launch-token holders.
contract RexiLaunchpad {
    uint256 public constant BPS = 10_000;
    uint256 public constant HOLDER_SHARE = 6_750;
    uint256 public constant ACC_SCALE = 1e24;
    address public immutable protocolTreasury;
    address public immutable desksTreasury;
    address public immutable buybackTreasury;

    struct Launch {
        address token;
        address rewardAsset;
        uint256 accRewardPerToken;
        uint256 rewardBalance;
        bool active;
    }

    mapping(address => Launch) public launches;
    mapping(address => mapping(address => uint256)) public rewardDebt;

    constructor(address protocol_, address desks_, address buyback_) {
        if (protocol_ == address(0) || desks_ == address(0) || buyback_ == address(0)) revert ZeroAddress();
        protocolTreasury = protocol_;
        desksTreasury = desks_;
        buybackTreasury = buyback_;
    }

    function createLaunch(string calldata name, string calldata symbol, address rewardAsset, uint256 supply)
        external returns (address token)
    {
        if (rewardAsset == address(0) || supply == 0) revert InvalidLaunch();
        token = address(new RexiToken(name, symbol, msg.sender, supply));
        launches[token] = Launch(token, rewardAsset, 0, 0, true);
        emit LaunchCreated(token, rewardAsset, msg.sender, supply);
    }

    function distribute(address token, uint256 amount) external {
        Launch storage launch = launches[token];
        if (!launch.active || amount == 0) revert InvalidLaunch();
        _pull(launch.rewardAsset, msg.sender, amount);
        uint256 holderAmount = amount * HOLDER_SHARE / BPS;
        launch.rewardBalance += holderAmount;
        launch.accRewardPerToken += holderAmount * ACC_SCALE / RexiToken(token).totalSupply();
        _pay(launch.rewardAsset, protocolTreasury, amount * 500 / BPS);
        _pay(launch.rewardAsset, desksTreasury, amount * 1_000 / BPS);
        _pay(launch.rewardAsset, buybackTreasury, amount * 1_000 / BPS);
        emit RewardsDistributed(token, amount, holderAmount);
    }

    function claim(address token) external {
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
    event LaunchCreated(address indexed token, address indexed rewardAsset, address indexed creator, uint256 supply);
    event RewardsDistributed(address indexed token, uint256 amount, uint256 holderAmount);
    event RewardClaimed(address indexed token, address indexed holder, uint256 amount);
}
