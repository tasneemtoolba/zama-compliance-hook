// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComplianceHook
 * @dev Interface for the ComplianceHook contract
 */
interface IComplianceHook {
    /**
     * @dev Request a compliance check for a transaction
     * @param transactionId Unique identifier for the transaction
     * @param encryptedData Encrypted data for compliance check
     */
    function requestComplianceCheck(bytes32 transactionId, bytes calldata encryptedData) external;

    /**
     * @dev Get the compliance result for a transaction
     * @param transactionId Unique identifier for the transaction
     * @return isCompliant Whether the transaction is compliant
     * @return reason Reason for the compliance decision
     * @return timestamp When the result was recorded
     */
    function getComplianceResult(bytes32 transactionId)
        external
        view
        returns (bool isCompliant, string memory reason, uint256 timestamp);
} 