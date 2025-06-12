// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IUserRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserRegistry
 * @dev Contract for managing user profiles and their FHE-encrypted compliance data
 */
contract UserRegistry is IUserRegistry, Ownable {
    // Struct to store user profile data
    struct UserProfile {
        address[] wallets;
        bytes32 encryptedProfileBitMap;
        bool exists;
    }

    // Mapping from userId to UserProfile
    mapping(bytes32 => UserProfile) private _users;

    // Mapping from wallet address to userId for quick lookups
    mapping(address => bytes32) private _walletToUserId;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add a new user with their initial wallet and encrypted profile data
     * @param userId Unique identifier for the user
     * @param wallet User's wallet address
     * @param encryptedProfileBitMap FHE-encrypted compliance profile bitmap
     */
    function addUser(
        bytes32 userId,
        address wallet,
        bytes32 encryptedProfileBitMap
    ) external override onlyOwner {
        require(userId != bytes32(0), "Invalid user ID");
        require(wallet != address(0), "Invalid wallet address");
        require(!_users[userId].exists, "User already exists");
        require(_walletToUserId[wallet] == bytes32(0), "Wallet already registered");

        address[] memory wallets = new address[](1);
        wallets[0] = wallet;

        _users[userId] = UserProfile({
            wallets: wallets,
            encryptedProfileBitMap: encryptedProfileBitMap,
            exists: true
        });

        _walletToUserId[wallet] = userId;
    }

    /**
     * @dev Add a new wallet address for an existing user
     * @param userId Unique identifier for the user
     * @param wallet New wallet address to add
     */
    function addNewWallet(bytes32 userId, address wallet) external override onlyOwner {
        require(_users[userId].exists, "User does not exist");
        require(wallet != address(0), "Invalid wallet address");
        require(_walletToUserId[wallet] == bytes32(0), "Wallet already registered");

        _users[userId].wallets.push(wallet);
        _walletToUserId[wallet] = userId;
    }

    /**
     * @dev Update a user's encrypted profile data
     * @param userId Unique identifier for the user
     * @param encryptedProfileBitMap New FHE-encrypted compliance profile bitmap
     */
    function addNewProfileData(bytes32 userId, bytes32 encryptedProfileBitMap) external override onlyOwner {
        require(_users[userId].exists, "User does not exist");
        _users[userId].encryptedProfileBitMap = encryptedProfileBitMap;
    }

    /**
     * @dev Get a user's FHE-encrypted compliance profile hash
     * @param userId Unique identifier for the user
     * @return bytes32 The FHE-encrypted compliance profile hash
     */
    function getEncryptedFHEHash(bytes32 userId) external view override returns (bytes32) {
        require(_users[userId].exists, "User does not exist");
        return _users[userId].encryptedProfileBitMap;
    }

    /**
     * @dev Get all wallet addresses associated with a user
     * @param userId Unique identifier for the user
     * @return address[] Array of wallet addresses
     */
    function getUserWallets(bytes32 userId) external view returns (address[] memory) {
        require(_users[userId].exists, "User does not exist");
        return _users[userId].wallets;
    }

    /**
     * @dev Get the userId associated with a wallet address
     * @param wallet Wallet address to look up
     * @return bytes32 The associated userId
     */
    function getUserIdByWallet(address wallet) external view returns (bytes32) {
        bytes32 userId = _walletToUserId[wallet];
        require(userId != bytes32(0), "Wallet not registered");
        return userId;
    }
} 