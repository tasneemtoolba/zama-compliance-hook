import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/wallet/useWallet";
import Image from "next/image";

const WalletNotConnected = () => {
  const { isConnected, openConnectModal } = useWallet();

  const handleConnect = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex flex-col items-center justify-center mt-12 p-12 bg-muted max-w-md mx-auto"
    >
      {/* <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" /> */}
      <Image
        src="/assets/wallet.png"
        alt="Wallet"
        width={48}
        height={48}
        className="h-12 w-12 text-muted-foreground mb-4"
      />
      <h2 className="text-xl font-medium mb-2">Connect Your Wallet</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect your wallet to access your digital passport and swap confidential assets with Zama fhEVM.
      </p>
      <Button size="lg" className="mt-2" onClick={handleConnect}>
        Connect Wallet
      </Button>
    </motion.div>
  );
};

export default WalletNotConnected;
