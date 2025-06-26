// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRulesEngine {
    function isCompliant(bytes32 userId, bytes32 productId) external view returns (bool);
    function evaluateRule(address ruleAddress, bytes32 userId) external view returns (bool);
} 