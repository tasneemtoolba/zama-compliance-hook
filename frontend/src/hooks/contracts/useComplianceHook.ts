import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useChain } from "@/hooks/wallet/useChain";
import { keccak256, toHex } from "viem";

// ComplianceHook ABI - only the functions we need
const COMPLIANCE_HOOK_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "poolId",
                "type": "bytes32"
            }
        ],
        "name": "checkUserCompliance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "currency0",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "currency1",
                        "type": "address"
                    },
                    {
                        "internalType": "uint24",
                        "name": "fee",
                        "type": "uint24"
                    },
                    {
                        "internalType": "int24",
                        "name": "tickSpacing",
                        "type": "int24"
                    },
                    {
                        "internalType": "contract IHooks",
                        "name": "hooks",
                        "type": "address"
                    }
                ],
                "internalType": "struct PoolKey",
                "name": "key",
                "type": "tuple"
            }
        ],
        "name": "checkUserComplianceByKey",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "poolId",
                "type": "bytes32"
            }
        ],
        "name": "getPoolRule",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "currency0",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "currency1",
                        "type": "address"
                    },
                    {
                        "internalType": "uint24",
                        "name": "fee",
                        "type": "uint24"
                    },
                    {
                        "internalType": "int24",
                        "name": "tickSpacing",
                        "type": "int24"
                    },
                    {
                        "internalType": "contract IHooks",
                        "name": "hooks",
                        "type": "address"
                    }
                ],
                "internalType": "struct PoolKey",
                "name": "key",
                "type": "tuple"
            }
        ],
        "name": "getPoolRuleByKey",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "poolId",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "ruleId",
                "type": "bytes32"
            }
        ],
        "name": "setPoolRule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "currency0",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "currency1",
                        "type": "address"
                    },
                    {
                        "internalType": "uint24",
                        "name": "fee",
                        "type": "uint24"
                    },
                    {
                        "internalType": "int24",
                        "name": "tickSpacing",
                        "type": "int24"
                    },
                    {
                        "internalType": "contract IHooks",
                        "name": "hooks",
                        "type": "address"
                    }
                ],
                "internalType": "struct PoolKey",
                "name": "key",
                "type": "tuple"
            },
            {
                "internalType": "bytes32",
                "name": "ruleId",
                "type": "bytes32"
            }
        ],
        "name": "setPoolRuleByKey",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// Mock contract address - replace with actual deployed address
const COMPLIANCE_HOOK_ADDRESS = "0x1234567890123456789012345678901234567890" as `0x${string}`;

export const useComplianceHook = () => {
    const { address } = useWallet();
    const { chain } = useChain();
    const [isLoading, setIsLoading] = useState(false);

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

    // Check user compliance for a specific pool
    const checkUserCompliance = async (poolId: `0x${string}`) => {
        if (!address || !COMPLIANCE_HOOK_ADDRESS) {
            return false;
        }

        try {
            const result = await useReadContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "checkUserCompliance",
                args: [address as `0x${string}`, poolId as `0x${string}`],
            });

            return result.data as boolean;
        } catch (error) {
            console.error("Error checking user compliance:", error);
            return false;
        }
    };

    // Check user compliance by pool key
    const checkUserComplianceByKey = async (poolKey: any) => {
        if (!address || !COMPLIANCE_HOOK_ADDRESS) {
            return false;
        }

        try {
            const result = await useReadContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "checkUserComplianceByKey",
                args: [address as `0x${string}`, poolKey],
            });

            return result.data as boolean;
        } catch (error) {
            console.error("Error checking user compliance by key:", error);
            return false;
        }
    };

    // Get pool rule
    const getPoolRule = async (poolId: `0x${string}`) => {
        if (!COMPLIANCE_HOOK_ADDRESS) {
            return null;
        }

        try {
            const result = await useReadContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "getPoolRule",
                args: [poolId],
            });

            return result.data as `0x${string}`;
        } catch (error) {
            console.error("Error getting pool rule:", error);
            return null;
        }
    };

    // Get pool rule by key
    const getPoolRuleByKey = async (poolKey: any) => {
        if (!COMPLIANCE_HOOK_ADDRESS) {
            return null;
        }

        try {
            const result = await useReadContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "getPoolRuleByKey",
                args: [poolKey],
            });

            return result.data as `0x${string}`;
        } catch (error) {
            console.error("Error getting pool rule by key:", error);
            return null;
        }
    };

    // Set pool rule (admin function)
    const setPoolRule = async (poolId: `0x${string}`, ruleId: `0x${string}`) => {
        if (!address || !COMPLIANCE_HOOK_ADDRESS) {
            toast.error("Contract address not configured");
            return;
        }

        setIsLoading(true);
        try {
            writeContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "setPoolRule",
                args: [poolId, ruleId],
                account: address as `0x${string}`,
                chain,
            });

            toast.info("Setting pool rule...");
        } catch (error) {
            console.error("Error setting pool rule:", error);
            toast.error("Failed to set pool rule");
        } finally {
            setIsLoading(false);
        }
    };

    // Set pool rule by key (admin function)
    const setPoolRuleByKey = async (poolKey: any, ruleId: `0x${string}`) => {
        if (!address || !COMPLIANCE_HOOK_ADDRESS) {
            toast.error("Contract address not configured");
            return;
        }

        setIsLoading(true);
        try {
            writeContract({
                address: COMPLIANCE_HOOK_ADDRESS,
                abi: COMPLIANCE_HOOK_ABI,
                functionName: "setPoolRuleByKey",
                args: [poolKey, ruleId],
                account: address as `0x${string}`,
                chain,
            });

            toast.info("Setting pool rule...");
        } catch (error) {
            console.error("Error setting pool rule by key:", error);
            toast.error("Failed to set pool rule");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle transaction success
    useEffect(() => {
        if (isConfirmed) {
            toast.success("Pool rule set successfully!");
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

    return {
        // State
        isLoading: isLoading || isPending || isConfirming,
        isSuccess,
        isConfirmed,
        hash,

        // Functions
        checkUserCompliance,
        checkUserComplianceByKey,
        getPoolRule,
        getPoolRuleByKey,
        setPoolRule,
        setPoolRuleByKey,
        reset,
    };
}; 