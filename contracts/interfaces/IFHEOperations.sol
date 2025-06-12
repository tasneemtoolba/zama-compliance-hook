// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFHEOperations
 * @dev Interface for FHE-specific operations
 */
interface IFHEOperations {
    /**
     * @dev Request an FHE operation
     * @param operationId Unique identifier for the operation
     * @param encryptedInput Encrypted input data
     */
    function requestFHEOperation(bytes32 operationId, bytes calldata encryptedInput) external;

    /**
     * @dev Get the result of an FHE operation
     * @param operationId Unique identifier for the operation
     * @return encryptedResult Encrypted result of the operation
     * @return timestamp When the result was recorded
     * @return isValid Whether the operation was valid
     */
    function getFHEOperationResult(bytes32 operationId)
        external
        view
        returns (bytes memory encryptedResult, uint256 timestamp, bool isValid);
} 