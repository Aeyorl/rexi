// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from 'forge-std/Test.sol';
import {RexiLaunchpad, RexiToken, RexiTestStockToken, ITransferHook} from '../contracts/RexiLaunchpad.sol';

/// Adversarial suite for the Rexi reward accounting.
/// Every test here encodes an invariant an attacker or accident could break.
contract RexiLaunchpadSecurityTest is Test {
    RexiLaunchpad launchpad;
    RexiTestStockToken reward;

    address PROTOCOL = makeAddr('protocol');
    address DESKS = makeAddr('desks');
    address BUYBACK = makeAddr('buyback');

    address alice = makeAddr('alice');
    address bob = makeAddr('bob');

    uint256 constant SUPPLY = 1_000_000e18;
    uint256 constant DIST = 1_000e18;

    function setUp() public {
        launchpad = new RexiLaunchpad(PROTOCOL, DESKS, BUYBACK);
        reward = new RexiTestStockToken();
        reward.mint(alice, 1_000_000e18);
    }

    function _launch(address creator) internal returns (address token) {
        vm.prank(creator);
        token = launchpad.createLaunch('Test', 'TST', address(reward), SUPPLY);
    }

    function _distribute(address token, address from, uint256 amount) internal {
        vm.startPrank(from);
        reward.approve(address(launchpad), amount);
        launchpad.distribute(token, amount);
        vm.stopPrank();
    }

    function _acc(address token) internal view returns (uint256) {
        (,, uint256 acc,,) = launchpad.launches(token);
        return acc;
    }

    function _rewardBalance(address token) internal view returns (uint256) {
        (,,, uint256 rb,) = launchpad.launches(token);
        return rb;
    }

    /// Claimable right now for a holder, mirroring claim()'s maths.
    function _pending(address token, address holder) internal view returns (uint256) {
        (,,, uint256 acc,) = launchpad.launches(token);
        uint256 accrued = RexiToken(token).balanceOf(holder) * acc / launchpad.ACC_SCALE();
        uint256 debt = launchpad.rewardDebt(token, holder);
        return accrued > debt ? accrued - debt : 0;
    }

    /// Pending must survive transfers within the accrual of the moved tokens.
    function _assertPendingPreserved(address token, address holder, uint256 expected, uint256 totalMoved)
        internal
        view
    {
        (,, uint256 acc,,) = launchpad.launches(token);
        uint256 tolerance = (totalMoved * acc / launchpad.ACC_SCALE()) + 2;
        assertApproxEqAbs(_pending(token, holder), expected, tolerance, 'pending drifted beyond moved accrual');
    }

    // ------------------------------------------------------------------
    // Happy path the accounting must keep intact
    // ------------------------------------------------------------------

    function test_createLaunch_mintsSupplyAndSetsHook() public {
        address token = _launch(alice);
        assertEq(RexiToken(token).balanceOf(alice), SUPPLY);
        assertEq(RexiToken(token).transferHook(), address(launchpad));
        assertEq(RexiToken(token).totalSupply(), SUPPLY);
        assertEq(RexiToken(token).name(), 'Test');
        assertEq(RexiToken(token).symbol(), 'TST');
    }

    function test_distribute_splitsExactly() public {
        address token = _launch(alice);
        _distribute(token, alice, DIST);
        (,, uint256 acc, uint256 rb,) = launchpad.launches(token);
        assertEq(rb, 675e18, 'holders bucket');
        assertEq(acc, 675e18, 'acc per token, single holder with full supply');
        assertEq(reward.balanceOf(PROTOCOL), 50e18, 'protocol 5%');
        assertEq(reward.balanceOf(DESKS), 100e18, 'desks 10%');
        assertEq(reward.balanceOf(BUYBACK), 100e18, 'buybacks 10%');
        assertEq(reward.balanceOf(address(launchpad)), 675e18 + 75e18, 'holders bucket + platform ops retained');
    }

    function test_claim_paysFullAccrual() public {
        address token = _launch(alice);
        _distribute(token, alice, DIST);
        vm.prank(alice);
        launchpad.claim(token);
        assertEq(reward.balanceOf(alice), 1_000_000e18 - DIST + 675e18);
        assertEq(_rewardBalance(token), 0);
    }

    function test_twoHolders_splitProRata() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);
        vm.prank(alice);
        launchpad.claim(token);
        vm.prank(bob);
        launchpad.claim(token);
        assertEq(reward.balanceOf(alice), 1_000_000e18 - DIST + 337.5e18);
        assertEq(reward.balanceOf(bob), 337.5e18);
        assertEq(_rewardBalance(token), 0);
    }

    function test_secondDistribute_accruesOnTop() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);
        _distribute(token, alice, DIST);
        assertEq(_pending(token, alice), 675e18);
        assertEq(_pending(token, bob), 675e18);
    }

    function test_claimTwice_secondReverts() public {
        address token = _launch(alice);
        _distribute(token, alice, DIST);
        vm.startPrank(alice);
        launchpad.claim(token);
        vm.expectRevert(RexiLaunchpad.NothingToClaim.selector);
        launchpad.claim(token);
        vm.stopPrank();
    }

    function test_distribute_unknownTokenReverts() public {
        vm.prank(alice);
        reward.approve(address(launchpad), DIST);
        vm.prank(alice);
        vm.expectRevert(RexiLaunchpad.InvalidLaunch.selector);
        launchpad.distribute(address(0xdead), DIST);
    }

    // ------------------------------------------------------------------
    // Finding R1 (high): transfers must not destroy unclaimed rewards.
    // On the pre-fix contract, settling both sides to their full accrued
    // amount makes _pending collapse for sender AND receiver.
    // ------------------------------------------------------------------

    function test_recipient_keepsPendingWhenReceiving() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);

        uint256 pendingBefore = _pending(token, bob);
        assertEq(pendingBefore, 337.5e18);

        vm.prank(alice);
        RexiToken(token).transfer(bob, 1);

        assertEq(_pending(token, bob), pendingBefore, 'receiving tokens must not burn pending rewards');
    }

    function test_sender_keepsPendingWhenSending() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);

        uint256 pendingBefore = _pending(token, alice);
        assertEq(pendingBefore, 337.5e18);

        vm.prank(alice);
        RexiToken(token).transfer(bob, 1);

        _assertPendingPreserved(token, alice, pendingBefore, 1);
    }

    function test_claimedHistoryDoesNotTransfer() public {
        // Regression for the original double-claim vector: alice claims the
        // full distribution, then hands half the supply to bob. The accrual
        // alice already claimed must not become claimable by bob.
        address token = _launch(alice);
        _distribute(token, alice, DIST);

        vm.prank(alice);
        launchpad.claim(token);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);

        assertEq(_pending(token, bob), 0, 'receiver must not inherit claimed accrual');
        vm.prank(bob);
        vm.expectRevert(RexiLaunchpad.NothingToClaim.selector);
        launchpad.claim(token);
    }

    function test_fullDumpAfterClaimIsClean() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);

        vm.startPrank(alice);
        launchpad.claim(token);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        vm.expectRevert(RexiLaunchpad.NothingToClaim.selector);
        launchpad.claim(token);
        vm.stopPrank();
    }

    function test_selfTransfer_keepsPending() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);

        uint256 pendingBefore = _pending(token, alice);
        vm.prank(alice);
        RexiToken(token).transfer(alice, 5e18);
        assertEq(_pending(token, alice), pendingBefore, 'self transfer must be a no-op for accounting');
    }

    function test_chainedTransfers_preserveEveryonePending() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 2);
        _distribute(token, alice, DIST);

        uint256 pAlice = _pending(token, alice);
        uint256 pBob = _pending(token, bob);

        vm.prank(alice);
        RexiToken(token).transfer(bob, 10e18);
        vm.prank(bob);
        RexiToken(token).transfer(alice, 10e18);
        vm.prank(bob);
        RexiToken(token).transfer(alice, 3e18);

        _assertPendingPreserved(token, alice, pAlice, 10e18);
        _assertPendingPreserved(token, bob, pBob, 13e18);
    }

    // ------------------------------------------------------------------
    // Finding R2: createLaunch(0) bricks a launch (division by zero on
    // distribute). It must be rejected up front.
    // ------------------------------------------------------------------

    function test_zeroSupply_rejected() public {
        vm.prank(alice);
        vm.expectRevert();
        launchpad.createLaunch('Zero', 'ZRO', address(reward), 0);
    }

    // ------------------------------------------------------------------
    // Finding R3: setTransferHook is unguarded, so anyone can hijack the
    // hook of any RexiToken that has not been wired up yet.
    // ------------------------------------------------------------------

    function test_hook_onlyDeployerCanSet() public {
        vm.prank(alice);
        RexiToken fresh = new RexiToken('Fresh', 'FRSH', alice, 1e18);
        vm.prank(bob);
        vm.expectRevert();
        fresh.setTransferHook(address(launchpad));
        vm.prank(alice);
        fresh.setTransferHook(address(launchpad));
        assertEq(fresh.transferHook(), address(launchpad));
        vm.prank(alice);
        vm.expectRevert(RexiToken.HookAlreadySet.selector);
        fresh.setTransferHook(address(1));
    }

    // ------------------------------------------------------------------
    // Finding R4: distribute trusts the nominal amount, so a reward asset
    // that under-delivers (fee on transfer) over-accounts the holder bucket
    // and can strand or steal the shared asset balance across launches.
    // ------------------------------------------------------------------

    function test_feeOnTransfer_assetIsMeasuredNotAssumed() public {
        FeeOnTransferToken fot = new FeeOnTransferToken();
        fot.mint(alice, 10_000e18);

        vm.prank(alice);
        address token = launchpad.createLaunch('FoT', 'FOT', address(fot), SUPPLY);

        vm.startPrank(alice);
        fot.approve(address(launchpad), DIST);
        launchpad.distribute(token, DIST);
        vm.stopPrank();

        // only 900 of the 1,000 actually arrived; the bucket must reflect reality
        (,, uint256 acc, uint256 rb,) = launchpad.launches(token);
        assertEq(rb, 607.5e18, 'holder bucket uses received amount');
        assertEq(acc, 607.5e18);
        // the mock also fees the launchpad's outbound payouts (90% delivered)
        assertEq(fot.balanceOf(PROTOCOL), 40.5e18, 'protocol 5% of received, after outbound fee');
        assertEq(fot.balanceOf(DESKS), 81e18, 'desks 10% of received, after outbound fee');
        assertEq(fot.balanceOf(BUYBACK), 81e18, 'buybacks 10% of received, after outbound fee');

        // what was pulled in minus what was paid out to treasuries (225 sent)
        assertEq(fot.balanceOf(address(launchpad)), 675e18);

        vm.prank(alice);
        launchpad.claim(token);
        // NOTE: a reward asset that fees outbound transfers burns part of every
        // payout (607.5 accounted, 546.75 delivered). Reward assets must be
        // standard ERC-20s — see SECURITY.md, limitation L2.
        assertEq(fot.balanceOf(alice), 10_000e18 - DIST + 546.75e18);
    }

    // ------------------------------------------------------------------
    // Finding R5: external calls to an arbitrary reward asset must not be
    // able to reenter claim/distribute and corrupt the buckets.
    // ------------------------------------------------------------------

    function test_reentrantRewardAsset_cannotCorruptAccounting() public {
        ReentrantRewardToken evil = new ReentrantRewardToken(address(launchpad));
        evil.mint(alice, 10_000e18);

        vm.prank(alice);
        address token = launchpad.createLaunch('Evil', 'EVIL', address(evil), SUPPLY);
        evil.setVictim(alice, token);

        vm.startPrank(alice);
        evil.approve(address(launchpad), DIST);
        launchpad.distribute(token, DIST); // evil reenters claim() from transferFrom
        vm.stopPrank();

        (,, uint256 acc, uint256 rb,) = launchpad.launches(token);
        assertEq(rb, 675e18, 'bucket unchanged by reentry');
        assertEq(acc, 675e18);
        assertGe(evil.balanceOf(address(launchpad)), rb, 'insolvent after reentry');
    }

    function test_solvency_bucketNeverExceedsContractBalance() public {
        address token = _launch(alice);
        vm.prank(alice);
        RexiToken(token).transfer(bob, SUPPLY / 3);

        _distribute(token, alice, 500e18);
        vm.prank(alice);
        RexiToken(token).transfer(bob, 1);
        _distribute(token, alice, 250e18);
        vm.prank(bob);
        RexiToken(token).transfer(alice, 2);
        _distribute(token, alice, 125e18);

        assertGe(reward.balanceOf(address(launchpad)), _rewardBalance(token), 'insolvent bucket');

        vm.prank(alice);
        launchpad.claim(token);
        vm.prank(bob);
        launchpad.claim(token);
        assertGe(reward.balanceOf(address(launchpad)), _rewardBalance(token));
    }
}

contract FeeOnTransferToken {
    string public name = 'Fee Token';
    string public symbol = 'FEE';
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _move(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < amount) revert();
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        return _move(from, to, amount);
    }

    function _move(address from, address to, uint256 amount) internal returns (bool) {
        uint256 delivered = (amount * 900) / 1000; // 10% fee on every transfer
        balanceOf[from] -= amount;
        balanceOf[to] += delivered;
        return true;
    }
}

contract ReentrantRewardToken {
    string public name = 'Evil';
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    address public launchpad;
    address public victim;
    address public launchToken;
    bool public attacking;

    constructor(address launchpad_) {
        launchpad = launchpad_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function setVictim(address victim_, address token) external {
        victim = victim_;
        launchToken = token;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < amount) revert();
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        if (!attacking && to == launchpad) {
            attacking = true;
            try RexiLaunchpad(launchpad).claim(launchToken) {} catch {}
            try RexiLaunchpad(launchpad).distribute(launchToken, 1) {} catch {}
            attacking = false;
        }
        return true;
    }
}