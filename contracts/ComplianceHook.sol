// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolId} from "v4-core/types/PoolId.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {StateLibrary} from "v4-core/libraries/StateLibrary.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {IFHEVerifier} from "./interfaces/IFHEVerifier.sol";
import {IUserRegistry} from "./interfaces/IUserRegistry.sol";

contract ComplianceHook is BaseHook {
    using StateLibrary for IPoolManager;

    // FHE Verifier and User Registry contracts
    IFHEVerifier public immutable fheVerifier;
    IUserRegistry public immutable userRegistry;

    // Mapping to store rule configurations for each pool
    mapping(PoolId => bytes32) public poolRules;

    // Events
    event ComplianceCheckPassed(address indexed user, PoolId indexed poolId);
    event ComplianceCheckFailed(
        address indexed user,
        PoolId indexed poolId,
        string reason
    );
    event PoolRuleSet(PoolId indexed poolId, bytes32 ruleId);

    // Errors
    error ComplianceCheckFailed();
    error UserNotRegistered();
    error RuleNotConfigured();
    error Unauthorized();

    // Constructor
    constructor(
        IPoolManager _manager,
        IFHEVerifier _fheVerifier,
        IUserRegistry _userRegistry
    ) BaseHook(_manager) {
        fheVerifier = _fheVerifier;
        userRegistry = _userRegistry;
    }

    // BaseHook Functions
    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                afterAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true, // We want to check before swap
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        // Skip compliance check if the swap is from this contract
        if (sender == address(this)) {
            return (this.beforeSwap.selector, 0);
        }

        // Get the rule ID for this pool
        bytes32 ruleId = poolRules[key.toId()];
        if (ruleId == bytes32(0)) {
            revert RuleNotConfigured();
        }

        // Get the user's ID from the registry
        bytes32 userId;
        try userRegistry.getUserIdByWallet(sender) {
            userId = userRegistry.getUserIdByWallet(sender);
        } catch {
            revert UserNotRegistered();
        }

        // Get the user's encrypted profile data
        bytes32 encryptedUserHash = userRegistry.getEncryptedFHEHash(userId);

        // Perform FHE compliance check
        bool isCompliant = fheVerifier.verifyUserAgainstRule(
            encryptedUserHash,
            uint256(ruleId), // Using ruleId as the bitmap
            new uint256[](0) // Empty conditions array for now
        );

        if (!isCompliant) {
            emit ComplianceCheckFailed(
                sender,
                key.toId(),
                "User failed compliance verification"
            );
            revert ComplianceCheckFailed();
        }

        emit ComplianceCheckPassed(sender, key.toId());
        return (this.beforeSwap.selector, 0);
    }

    // Admin Functions
    function setPoolRule(PoolId poolId, bytes32 ruleId) external {
        // Only allow the hook owner to set rules
        // This could be extended to allow pool creators or other authorized parties
        if (msg.sender != owner()) {
            revert Unauthorized();
        }

        poolRules[poolId] = ruleId;
        emit PoolRuleSet(poolId, ruleId);
    }

    function setPoolRuleByKey(PoolKey calldata key, bytes32 ruleId) external {
        setPoolRule(key.toId(), ruleId);
    }

    // View Functions
    function getPoolRule(PoolId poolId) external view returns (bytes32) {
        return poolRules[poolId];
    }

    function getPoolRuleByKey(
        PoolKey calldata key
    ) external view returns (bytes32) {
        return poolRules[key.toId()];
    }

    function checkUserCompliance(
        address user,
        PoolId poolId
    ) external view returns (bool) {
        bytes32 ruleId = poolRules[poolId];
        if (ruleId == bytes32(0)) {
            return false;
        }

        try userRegistry.getUserIdByWallet(user) returns (bytes32 userId) {
            bytes32 encryptedUserHash = userRegistry.getEncryptedFHEHash(
                userId
            );
            return
                fheVerifier.verifyUserAgainstRule(
                    encryptedUserHash,
                    uint256(ruleId),
                    new uint256[](0)
                );
        } catch {
            return false;
        }
    }

    function checkUserComplianceByKey(
        address user,
        PoolKey calldata key
    ) external view returns (bool) {
        return checkUserCompliance(user, key.toId());
    }
}
