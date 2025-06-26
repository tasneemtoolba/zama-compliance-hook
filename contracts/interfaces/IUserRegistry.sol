// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUserRegistry {
    function addUser(bytes32 userId, address wallet, bytes32 encryptedProfileBitMap) external;
    function addNewWallet(bytes32 userId, address wallet) external;
    function addNewProfileData(bytes32 userId, bytes32 encryptedProfileBitMap) external;
    function getEncryptedFHEHash(bytes32 userId) external view returns (bytes32);
} 