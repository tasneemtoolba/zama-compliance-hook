import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useChain } from "@/hooks/wallet/useChain";
import { keccak256, toHex } from "viem";

// UserRegistry ABI - only the functions we need
const USER_REGISTRY_ABI = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "wallet",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "encryptedProfileBitMap",
                "type": "bytes32"
            }
        ],
        "name": "addUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "encryptedProfileBitMap",
                "type": "bytes32"
            }
        ],
        "name": "addNewProfileData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
            }
        ],
        "name": "getEncryptedFHEHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// Actual deployed contract address on Sepolia
const USER_REGISTRY_ADDRESS = "0xEa0f187da0565766D04E72dFEbf00297B6151b8f" as `0x${string}`;

export const useUserRegistry = () => {
    const { address } = useWallet();
    const { chain } = useChain();
    const [isLoading, setIsLoading] = useState(false);
    const [userExists, setUserExists] = useState<boolean | null>(null);
    const [userId, setUserId] = useState<`0x${string}` | null>(null);

    // Contract write functions
    const {
        data: hash,
        isPending,
        isError,
        error,
        isSuccess,
        writeContract,
        reset,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    // Note: The deployed contract doesn't have getUserIdByWallet function
    // We'll need to handle user existence differently
    // For now, we'll assume users need to be added and track locally

    // Get user's encrypted profile data (if we have a userId)
    const { data: encryptedProfileData, isLoading: isLoadingProfile } = useReadContract({
        address: USER_REGISTRY_ADDRESS,
        abi: USER_REGISTRY_ABI,
        functionName: "getEncryptedFHEHash",
        args: userId ? [userId] : undefined,
        query: {
            enabled: !!userId,
        },
    });

    // Generate a unique userId based on wallet address and timestamp
    const generateUserId = (walletAddress: string): `0x${string}` => {
        const timestamp = Date.now().toString();
        const combined = walletAddress + timestamp;
        return keccak256(toHex(combined)) as `0x${string}`;
    };

    // Create encrypted profile bitmap from country code
    const createEncryptedProfileBitmap = (countryCode: string): `0x${string}` => {
        // For now, we'll create a simple hash of the country code
        // In a real implementation, this would be FHE-encrypted
        return keccak256(toHex(countryCode)) as `0x${string}`;
    };

    // Add new user
    const addUser = async (countryCode: string) => {
        if (!address) {
            toast.error("Wallet not connected");
            return;
        }

        setIsLoading(true);
        try {
            const newUserId = generateUserId(address);
            const encryptedProfileBitmap = createEncryptedProfileBitmap(countryCode);

            writeContract({
                address: USER_REGISTRY_ADDRESS,
                abi: USER_REGISTRY_ABI,
                functionName: "addUser",
                args: [newUserId, address as `0x${string}`, encryptedProfileBitmap],
                account: address as `0x${string}`,
                chain,
            });

            // Set the userId locally after successful transaction
            setUserId(newUserId);
            setUserExists(true);

            toast.info("Adding user to registry...");
        } catch (error) {
            console.error("Error adding user:", error);
            toast.error("Failed to add user to registry");
        } finally {
            setIsLoading(false);
        }
    };

    // Update existing user's profile data
    const updateUserProfile = async (countryCode: string) => {
        if (!address || !userId) {
            toast.error("User not found in registry");
            return;
        }

        setIsLoading(true);
        try {
            const encryptedProfileBitmap = createEncryptedProfileBitmap(countryCode);

            writeContract({
                address: USER_REGISTRY_ADDRESS,
                abi: USER_REGISTRY_ABI,
                functionName: "addNewProfileData",
                args: [userId, encryptedProfileBitmap],
                account: address as `0x${string}`,
                chain,
            });

            toast.info("Updating user profile...");
        } catch (error) {
            console.error("Error updating user profile:", error);
            toast.error("Failed to update user profile");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle transaction success
    useEffect(() => {
        if (isConfirmed) {
            toast.success("Transaction confirmed successfully!");
            reset();
        }
    }, [isConfirmed, reset]);

    // Handle transaction errors
    useEffect(() => {
        if (isError && error) {
            toast.error(`Transaction failed: ${error.message}`);
            reset();
        }
    }, [isError, error, reset]);

    // Check if user exists in localStorage (as a fallback since contract doesn't have getUserIdByWallet)
    useEffect(() => {
        if (address) {
            const storedUserId = localStorage.getItem(`userRegistry_${address}`);
            if (storedUserId) {
                setUserId(storedUserId as `0x${string}`);
                setUserExists(true);
            } else {
                setUserExists(false);
            }
        }
    }, [address]);

    // Store userId in localStorage when it's set
    useEffect(() => {
        if (address && userId) {
            localStorage.setItem(`userRegistry_${address}`, userId);
        }
    }, [address, userId]);

    return {
        // State
        isLoading: isLoading || isPending || isConfirming,
        isCheckingUser: false, // Since we don't have getUserIdByWallet
        isLoadingProfile,
        isSuccess,
        isConfirmed,
        hash,

        // Data
        userId,
        encryptedProfileData,
        userExists,
        userCheckError: null,

        // Functions
        addUser,
        updateUserProfile,
        reset,
    };
}; 