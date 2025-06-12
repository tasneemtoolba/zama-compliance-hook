// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRulesEngine.sol";
import "./interfaces/IUserRegistry.sol";
import "./interfaces/IFHEVerifier.sol";
import "./interfaces/IProduct.sol";
import "./interfaces/IRule.sol";

/**
 * @title RulesEngine
 * @dev Main contract for evaluating compliance rules against user profiles
 */
contract RulesEngine is IRulesEngine {
    IUserRegistry public immutable registry;
    IFHEVerifier public immutable verifier;

    constructor(address _registry, address _verifier) {
        require(_registry != address(0), "Invalid registry address");
        require(_verifier != address(0), "Invalid verifier address");
        registry = IUserRegistry(_registry);
        verifier = IFHEVerifier(_verifier);
    }

    /**
     * @dev Check if a user is compliant with all rules of a product
     * @param userId Unique identifier of the user
     * @param productId Unique identifier of the product
     * @return bool True if user is compliant with all product rules
     */
    function isCompliant(bytes32 userId, bytes32 productId) public view override returns (bool) {
        IProduct product = IProduct(address(uint160(uint256(productId))));
        address[] memory ruleAddresses = product.getRuleAddresses();
        
        for (uint i = 0; i < ruleAddresses.length; i++) {
            if (!evaluateRule(ruleAddresses[i], userId)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Evaluate a specific rule against a user's profile
     * @param ruleAddress Address of the rule contract to evaluate
     * @param userId Unique identifier of the user
     * @return bool True if user passes the rule evaluation
     */
    function evaluateRule(address ruleAddress, bytes32 userId) public view override returns (bool) {
        IRule rule = IRule(ruleAddress);
        bytes32 encryptedUserHash = registry.getEncryptedFHEHash(userId);
        
        return verifier.verifyUserAgainstRule(
            encryptedUserHash,
            rule.getRuleBitmap(),
            rule.getConditionsArray()
        );
    }
} 