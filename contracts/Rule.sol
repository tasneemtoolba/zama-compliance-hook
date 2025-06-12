// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRule.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Rule
 * @dev Contract for managing compliance rules using bitmaps
 */
contract Rule is IRule, Ownable {
    uint256 private immutable _ruleBitmap;
    uint256[] private _conditionsArray;

    /**
     * @dev Constructor to initialize the rule with its bitmap and conditions
     * @param ruleBitmap The bitmap representing the rule's conditions
     * @param conditionsArray Array defining how to traverse the bitmap
     */
    constructor(uint256 ruleBitmap, uint256[] memory conditionsArray) Ownable(msg.sender) {
        require(conditionsArray.length > 0, "Empty conditions array");
        _ruleBitmap = ruleBitmap;
        _conditionsArray = conditionsArray;
    }

    /**
     * @dev Get the rule's bitmap
     * @return uint256 The rule's bitmap
     */
    function getRuleBitmap() external view override returns (uint256) {
        return _ruleBitmap;
    }

    /**
     * @dev Get the conditions array for traversing the bitmap
     * @return uint256[] Array defining how to traverse the bitmap
     */
    function getConditionsArray() external view override returns (uint256[] memory) {
        return _conditionsArray;
    }

    /**
     * @dev Evaluate a specific condition against a user's bitmap
     * @param conditionIndex Index of the condition to evaluate
     * @param userBitmap User's compliance bitmap
     * @return bool True if the condition is satisfied
     */
    function evaluateCondition(uint256 conditionIndex, uint256 userBitmap) 
        external 
        view 
        override 
        returns (bool) 
    {
        require(conditionIndex < _conditionsArray.length, "Invalid condition index");
        
        uint256 conditionMask = _conditionsArray[conditionIndex];
        uint256 ruleBits = _ruleBitmap & conditionMask;
        uint256 userBits = userBitmap & conditionMask;
        
        return ruleBits == userBits;
    }
} 