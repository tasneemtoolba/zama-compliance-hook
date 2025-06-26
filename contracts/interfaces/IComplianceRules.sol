// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComplianceRules
 * @dev Interface for managing compliance rules
 */
interface IComplianceRules {
    /**
     * @dev Create a new compliance rule
     * @param ruleId Unique identifier for the rule
     * @param description Description of the rule
     */
    function createRule(string calldata ruleId, string calldata description) external;

    /**
     * @dev Update an existing compliance rule
     * @param ruleId Unique identifier for the rule
     * @param description New description of the rule
     */
    function updateRule(string calldata ruleId, string calldata description) external;

    /**
     * @dev Deactivate a compliance rule
     * @param ruleId Unique identifier for the rule
     */
    function deactivateRule(string calldata ruleId) external;

    /**
     * @dev Get all active rule IDs
     * @return Array of active rule IDs
     */
    function getActiveRuleIds() external view returns (string[] memory);

    /**
     * @dev Get rule details
     * @param ruleId Unique identifier for the rule
     * @return description Rule description
     * @return isActive Whether the rule is active
     * @return createdAt When the rule was created
     * @return updatedAt When the rule was last updated
     */
    function getRuleDetails(string calldata ruleId)
        external
        view
        returns (
            string memory description,
            bool isActive,
            uint256 createdAt,
            uint256 updatedAt
        );
} 