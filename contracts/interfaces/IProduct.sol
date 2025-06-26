// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProduct {
    function getRuleAddresses() external view returns (address[] memory);
    function addRule(address ruleAddress) external;
    function removeRule(address ruleAddress) external;
} 