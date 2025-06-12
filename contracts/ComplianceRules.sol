// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceRules
 * @dev Contract for managing compliance rules and their evaluation
 */
contract ComplianceRules is Ownable {
    // Struct to store a compliance rule
    struct Rule {
        string ruleId;
        string description;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Mapping to store rules
    mapping(string => Rule) public rules;
    string[] public ruleIds;

    // Events
    event RuleCreated(string indexed ruleId, string description);
    event RuleUpdated(string indexed ruleId, string description);
    event RuleDeactivated(string indexed ruleId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new compliance rule
     * @param ruleId Unique identifier for the rule
     * @param description Description of the rule
     */
    function createRule(string calldata ruleId, string calldata description)
        external
        onlyOwner
    {
        require(bytes(ruleId).length > 0, "Empty rule ID");
        require(bytes(description).length > 0, "Empty description");
        require(!rules[ruleId].isActive, "Rule already exists");

        rules[ruleId] = Rule({
            ruleId: ruleId,
            description: description,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        ruleIds.push(ruleId);
        emit RuleCreated(ruleId, description);
    }

    /**
     * @dev Update an existing compliance rule
     * @param ruleId Unique identifier for the rule
     * @param description New description of the rule
     */
    function updateRule(string calldata ruleId, string calldata description)
        external
        onlyOwner
    {
        require(bytes(ruleId).length > 0, "Empty rule ID");
        require(bytes(description).length > 0, "Empty description");
        require(rules[ruleId].isActive, "Rule does not exist");

        rules[ruleId].description = description;
        rules[ruleId].updatedAt = block.timestamp;

        emit RuleUpdated(ruleId, description);
    }

    /**
     * @dev Deactivate a compliance rule
     * @param ruleId Unique identifier for the rule
     */
    function deactivateRule(string calldata ruleId) external onlyOwner {
        require(bytes(ruleId).length > 0, "Empty rule ID");
        require(rules[ruleId].isActive, "Rule is not active");

        rules[ruleId].isActive = false;
        rules[ruleId].updatedAt = block.timestamp;

        emit RuleDeactivated(ruleId);
    }

    /**
     * @dev Get all active rule IDs
     * @return Array of active rule IDs
     */
    function getActiveRuleIds() external view returns (string[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < ruleIds.length; i++) {
            if (rules[ruleIds[i]].isActive) {
                activeCount++;
            }
        }

        string[] memory activeRules = new string[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < ruleIds.length; i++) {
            if (rules[ruleIds[i]].isActive) {
                activeRules[currentIndex] = ruleIds[i];
                currentIndex++;
            }
        }

        return activeRules;
    }

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
        )
    {
        require(bytes(ruleId).length > 0, "Empty rule ID");
        require(rules[ruleId].createdAt != 0, "Rule does not exist");

        Rule memory rule = rules[ruleId];
        return (rule.description, rule.isActive, rule.createdAt, rule.updatedAt);
    }
} 