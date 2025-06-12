// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFHEVerifier {
    function verifyUserAgainstRule(
        bytes32 encryptedUserHash,
        uint256 ruleBitmap,
        uint256[] calldata conditionsArray
    ) external view returns (bool);
} 