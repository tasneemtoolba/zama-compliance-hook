import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Unlock, Loader2, ArrowDownUp, Coins } from "lucide-react";
import { type BaseError } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useSigner } from "@/hooks/wallet/useSigner";
import { useFhevm } from "@/providers/FhevmProvider";
import { useTokenBalance } from "@/hooks/transfer/useTokenBalance";
import { useDigitalAssetSwap } from "@/hooks/transfer/useDigitalAssetSwap";

interface SwapFormErrorProps {
    message: string;
}

const SwapFormError = ({ message }: SwapFormErrorProps) => (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
    </div>
);

interface SwapSuccessMessageProps {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    hash?: string;
    isConfirmed: boolean;
    isConfirming: boolean;
    onReset: () => void;
}

const SwapSuccessMessage = ({
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    hash,
    isConfirmed,
    isConfirming,
    onReset,
}: SwapSuccessMessageProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-10 text-center space-y-4"
        >
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Coins className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium">
                {isConfirming ? "Processing Swap" : "Swap Successful"}
            </h3>
            <p className="text-muted-foreground">
                {isConfirming
                    ? "Transaction is being confirmed..."
                    : `Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`}
            </p>
            {hash && (
                <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                >
                    View transaction
                </a>
            )}
            <Button variant="outline" onClick={onReset} className="mt-4">
                Make Another Swap
            </Button>
        </motion.div>
    );
};

export const DigitalAssetSwapForm = () => {
    const { address, isSepoliaChain } = useWallet();
    const { signer } = useSigner();
    const { instanceStatus } = useFhevm();

    const [fromToken, setFromToken] = useState("DGOLD");
    const [toToken, setToToken] = useState("USDT");
    const [fromAmount, setFromAmount] = useState("");
    const [formError, setFormError] = useState<string>("");

    const {
        swap,
        fromAmount: swapFromAmount,
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
    } = useDigitalAssetSwap();

    // Get balance for the from token using the same method as ZCH
    const fromTokenBalance = useTokenBalance({
        address,
        tokenAddress: TOKEN_ADDRESSES[fromToken as keyof typeof TOKEN_ADDRESSES],
        enabled: !!address,
        isConfidential: true, // All tokens use confidential balance fetching
    });

    const handleSwap = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAmount || Number(fromAmount) <= 0) {
            setFormError("Please enter a valid amount");
            return;
        }

        if (!isSepoliaChain) {
            setFormError("Please switch to Sepolia network");
            return;
        }

        if (fromToken === toToken) {
            setFormError("Cannot swap the same token");
            return;
        }

        try {
            setFormError("");
            await swap(
                fromToken as keyof typeof TOKEN_ADDRESSES,
                toToken as keyof typeof TOKEN_ADDRESSES,
                fromAmount
            );
        } catch (error) {
            console.error("Swap error:", error);
            setFormError("Swap failed. Please try again.");
        }
    };

    const handleDecrypt = async () => {
        if (!signer) {
            console.error("Signer not initialized - please connect your wallet");
            return;
        }
        try {
            await fromTokenBalance.decrypt();
        } catch (error) {
            console.error("Failed to decrypt balance:", error);
        }
    };

    const handleReset = (clearSwap?: () => void) => {
        setFromAmount("");
        if (clearSwap) {
            clearSwap();
        }
    };

    const handleTokenSwitch = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setFromAmount("");
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-1">
                {/* Balance Display */}
                <Card>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-mono text-xl">
                                    {fromTokenBalance.balance
                                        ? fromTokenBalance.balance.toString()
                                        : "•••••"}{" "}
                                    {TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].symbol}
                                </div>
                                <div className="pt-1 font-mono text-gray-600 dark:text-gray-400 text-xs max-w-56">
                                    Last updated: {fromTokenBalance.lastUpdated}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleDecrypt}
                                disabled={
                                    fromTokenBalance.isDecrypting || instanceStatus !== "ready"
                                }
                            >
                                {fromTokenBalance.isDecrypting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Decrypting...
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Decrypt
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Swap Form */}
                <Card>
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <SwapSuccessMessage
                                    fromToken={TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].symbol}
                                    toToken={TOKEN_INFO[toToken as keyof typeof TOKEN_INFO].symbol}
                                    fromAmount={fromAmount}
                                    toAmount={toAmount}
                                    hash={hash}
                                    isConfirmed={isConfirmed}
                                    isConfirming={isConfirming}
                                    onReset={() => handleReset(resetSwap)}
                                />
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleSwap}
                                    className="space-y-6"
                                >
                                    {/* Form error */}
                                    {formError && <SwapFormError message={formError} />}

                                    {/* Transfer error */}
                                    {isError && error && (
                                        <SwapFormError
                                            message={
                                                (error as BaseError).shortMessage || "Swap failed"
                                            }
                                        />
                                    )}

                                    {/* From Token */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">
                                            From
                                        </label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={fromToken}
                                                onChange={(e) => setFromToken(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                {Object.keys(TOKEN_INFO).map((token) => (
                                                    <option key={token} value={token}>
                                                        {TOKEN_INFO[token as keyof typeof TOKEN_INFO].name} ({TOKEN_INFO[token as keyof typeof TOKEN_INFO].symbol})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Swap Direction Button */}
                                    <div className="flex justify-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleTokenSwitch}
                                            className="rounded-full p-2"
                                        >
                                            <ArrowDownUp className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* To Token */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">
                                            To
                                        </label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={toToken}
                                                onChange={(e) => setToToken(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                {Object.keys(TOKEN_INFO).map((token) => (
                                                    <option key={token} value={token}>
                                                        {TOKEN_INFO[token as keyof typeof TOKEN_INFO].name} ({TOKEN_INFO[token as keyof typeof TOKEN_INFO].symbol})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="0.0"
                                                value={fromAmount}
                                                onChange={(e) => setFromAmount(e.target.value)}
                                                disabled={isPending}
                                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-16"
                                                step="any"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-muted-foreground">
                                                    {TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].symbol}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exchange Rate Display */}
                                    {fromAmount && toAmount && (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground">
                                                Exchange Rate: 1 {TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].symbol} = {(TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].price / TOKEN_INFO[toToken as keyof typeof TOKEN_INFO].price).toFixed(6)} {TOKEN_INFO[toToken as keyof typeof TOKEN_INFO].symbol}
                                            </div>
                                            <div className="text-sm font-medium mt-1">
                                                You will receive: {toAmount} {TOKEN_INFO[toToken as keyof typeof TOKEN_INFO].symbol}
                                            </div>
                                        </div>
                                    )}

                                    {/* Swap Button */}
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            type="submit"
                                            disabled={
                                                isPending ||
                                                isEncrypting ||
                                                !fromAmount ||
                                                Number(fromAmount) <= 0 ||
                                                fromToken === toToken
                                            }
                                            className="group px-8"
                                        >
                                            {isEncrypting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Encrypting Transaction...
                                                </>
                                            ) : isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Confirming Swap...
                                                </>
                                            ) : (
                                                <>
                                                    Swap {TOKEN_INFO[fromToken as keyof typeof TOKEN_INFO].symbol} for {TOKEN_INFO[toToken as keyof typeof TOKEN_INFO].symbol}
                                                    <ArrowDownUp className="ml-2 h-4 w-4 transition-transform group-hover:rotate-180" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}; 