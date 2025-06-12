// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IProduct.sol";
import "./interfaces/IRule.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Product
 * @dev Contract for managing products and their associated compliance rules
 */
contract Product is IProduct, Ownable {
    // Array of rule addresses associated with this product
    address[] private _ruleAddresses;
    
    // Mapping to track if a rule is already added
    mapping(address => bool) private _ruleExists;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Get all rule addresses associated with this product
     * @return address[] Array of rule contract addresses
     */
    function getRuleAddresses() external view override returns (address[] memory) {
        return _ruleAddresses;
    }

    /**
     * @dev Add a new rule to the product
     * @param ruleAddress Address of the rule contract to add
     */
    function addRule(address ruleAddress) external override onlyOwner {
        require(ruleAddress != address(0), "Invalid rule address");
        require(!_ruleExists[ruleAddress], "Rule already exists");
        
        // Verify the address is a valid rule contract
        try IRule(ruleAddress).getRuleBitmap() returns (uint256) {
            _ruleAddresses.push(ruleAddress);
            _ruleExists[ruleAddress] = true;
        } catch {
            revert("Invalid rule contract");
        }
    }

    /**
     * @dev Remove a rule from the product
     * @param ruleAddress Address of the rule contract to remove
     */
    function removeRule(address ruleAddress) external override onlyOwner {
        require(_ruleExists[ruleAddress], "Rule does not exist");
        
        // Find and remove the rule
        for (uint i = 0; i < _ruleAddresses.length; i++) {
            if (_ruleAddresses[i] == ruleAddress) {
                // Move the last element to the current position
                _ruleAddresses[i] = _ruleAddresses[_ruleAddresses.length - 1];
                // Remove the last element
                _ruleAddresses.pop();
                // Update the mapping
                _ruleExists[ruleAddress] = false;
                break;
            }
        }
    }
} 