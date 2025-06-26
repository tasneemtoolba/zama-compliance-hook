"use client";

import { useState } from "react";
import { DigitalAssetSwapForm } from "@/components/transfers/DigitalAssetSwapForm";
import { UserProfile } from "@/components/profile/UserProfile";
import { useWallet } from "@/hooks/wallet/useWallet";
import PageTransition from "@/components/layout/PageTransition";
import { motion } from "framer-motion";
import WalletNotConnected from "@/components/wallet/WalletNotConnected";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, User } from "lucide-react";

function App() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("swap");

  return (
    <PageTransition>
      <div className="container mx-auto mt-10 px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 text-center"
        >
          <h1 className="font-medium text-4xl mb-4">On-Chain Passport Management with Zama fhEVM</h1>
          <p className="text-muted-foreground text-md">
            Securely manage your digital identity and swap confidential assets with fully homomorphic encryption.
          </p>
        </motion.div>

        {isConnected ? (
          <div className="mt-8 max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="swap" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Asset Swap
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Passport
                </TabsTrigger>
              </TabsList>

              <TabsContent value="swap" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DigitalAssetSwapForm />
                </motion.div>
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-md mx-auto"
                >
                  <UserProfile />
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <WalletNotConnected />
        )}
      </div>
    </PageTransition>
  );
}

export default App;
