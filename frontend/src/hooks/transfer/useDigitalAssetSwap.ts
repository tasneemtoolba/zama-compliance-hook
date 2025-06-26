import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toHexString } from "@/lib/helper";
import { toast } from "sonner";
import { useChain } from "@/hooks/wallet/useChain";
import { useWallet } from "@/hooks/wallet/useWallet";
import { parseUnits } from "viem";
import { useEncrypt } from "@/hooks/fhevm/useEncrypt";
import {
    NEXT_PUBLIC_CONF_TOKEN_ADDRESS,
    NEXT_PUBLIC_USDT_TOKEN_ADDRESS,
} from "@/config/env";

// Token addresses - using actual contract addresses
const TOKEN_ADDRESSES = {
    DGOLD: NEXT_PUBLIC_CONF_TOKEN_ADDRESS, // ZCH contract
    USDT: NEXT_PUBLIC_USDT_TOKEN_ADDRESS, // USDT contract
    SILVER: "0x1111111111111111111111111111111111111111" as `0x${string}`, // Mock for now
    PLATINUM: "0x2222222222222222222222222222222222222222" as `0x${string}`, // Mock for now
};

const TOKEN_INFO = {
    DGOLD: { symbol: "DGOLD", name: "Digital Gold", decimals: 6, price: 2000 },
    USDT: { symbol: "USDT", name: "Tether USD", decimals: 6, price: 1 },
    SILVER: { symbol: "DSILVER", name: "Digital Silver", decimals: 6, price: 25 },
    PLATINUM: { symbol: "DPLAT", name: "Digital Platinum", decimals: 6, price: 1000 },
};

export const useDigitalAssetSwap = () => {
    const { address } = useWallet();
    const { chain } = useChain();
    const [fromToken, setFromToken] = useState<keyof typeof TOKEN_ADDRESSES>("DGOLD");
    const [toToken, setToToken] = useState<keyof typeof TOKEN_ADDRESSES>("USDT");
    const [fromAmount, setFromAmount] = useState<string>("");
    const [toAmount, setToAmount] = useState<string>("");
    const [contractAddress, setContractAddress] = useState<`0x${string}` | null>(null);

    const { encryptAmount, isEncrypting, encryptedAmount, resetEncrypt } = useEncrypt();

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

    // Calculate the amount of tokens to receive based on price ratio
    const calculateToAmount = (amount: string, from: keyof typeof TOKEN_ADDRESSES, to: keyof typeof TOKEN_ADDRESSES) => {
        if (!amount || isNaN(Number(amount))) return "";
        const fromPrice = TOKEN_INFO[from].price;
        const toPrice = TOKEN_INFO[to].price;
        const ratio = fromPrice / toPrice;
        return (Number(amount) * ratio).toFixed(6);
    };

    // Update toAmount when fromAmount or tokens change
    useEffect(() => {
        const calculatedAmount = calculateToAmount(fromAmount, fromToken, toToken);
        setToAmount(calculatedAmount);
    }, [fromAmount, fromToken, toToken]);

    function swap(
        fromTokenKey: keyof typeof TOKEN_ADDRESSES,
        toTokenKey: keyof typeof TOKEN_ADDRESSES,
        amount: string,
    ) {
        if (!amount || !address) return;

        const fromTokenAddress = TOKEN_ADDRESSES[fromTokenKey];
        const fromTokenDecimals = TOKEN_INFO[fromTokenKey].decimals;

        // Convert the amount to the correct decimal representation
        const parsedAmount = parseUnits(amount, fromTokenDecimals);

        setFromToken(fromTokenKey);
        setToToken(toTokenKey);
        setFromAmount(amount);
        setContractAddress(fromTokenAddress);

        // Encrypt the amount for confidential transfer
        encryptAmount(fromTokenAddress, address as `0x${string}`, parsedAmount);
    }

    function resetSwap() {
        reset();
        setFromAmount("");
        setToAmount("");
        setContractAddress(null);
        resetEncrypt();
        toast.dismiss();
    }

    useEffect(() => {
        if (!encryptedAmount || !contractAddress) return;

        try {
            // In a real implementation, this would call a swap contract
            // For now, we'll simulate the swap using a confidential transfer to self
            writeContract({
                address: contractAddress,
                abi: [
                    {
                        name: "transfer",
                        type: "function",
                        stateMutability: "nonpayable",
                        inputs: [
                            { name: "to", type: "address" },
                            { name: "handle", type: "bytes32" },
                            { name: "proof", type: "bytes" },
                        ],
                        outputs: [{ name: "", type: "bool" }],
                    },
                ],
                functionName: "transfer",
                args: [
                    address as `0x${string}`, // Self-transfer for demo
                    toHexString(encryptedAmount.handles[0]) as `0x${string}`,
                    toHexString(encryptedAmount.inputProof) as `0x${string}`,
                ],
                account: address as `0x${string}`,
                chain,
            });

            toast.info("Digital Asset Swap Initiated", {
                description: `Swapping ${fromAmount} ${TOKEN_INFO[fromToken].symbol} for ${toAmount} ${TOKEN_INFO[toToken].symbol}`,
            });

            resetEncrypt();
        } catch (error) {
            console.error("Swap failed:", error);
            toast.error("Swap failed. Please try again.");
        }
    }, [
        encryptedAmount,
        contractAddress,
        writeContract,
        address,
        chain,
        resetEncrypt,
        fromAmount,
        toAmount,
        fromToken,
        toToken,
    ]);

    return {
        swap,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        isEncrypting,
        isConfirming,
        isConfirmed,
        hash,
        isPending,
        isError,
        error,
        isSuccess,
        resetSwap,
        TOKEN_INFO,
        TOKEN_ADDRESSES,
    };
}; 