// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRule {
    function getRuleBitmap() external view returns (uint256);
    function getConditionsArray() external view returns (uint256[] memory);
    function evaluateCondition(uint256 conditionIndex, uint256 userBitmap) external view returns (bool);
} 