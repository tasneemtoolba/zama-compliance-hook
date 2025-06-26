import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useUserRegistry } from "@/hooks/contracts/useUserRegistry";
import { User, MapPin, Save, IdCard } from "lucide-react";
import { toast } from "sonner";

interface UserProfileData {
    country: string;
    address: string;
    lastUpdated: string;
}

const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "AU", name: "Australia" },
    { code: "BR", name: "Brazil" },
    { code: "IN", name: "India" },
    { code: "CN", name: "China" },
    { code: "SG", name: "Singapore" },
    { code: "NL", name: "Netherlands" },
    { code: "CH", name: "Switzerland" },
    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "DK", name: "Denmark" },
    { code: "FI", name: "Finland" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "PT", name: "Portugal" },
    { code: "IE", name: "Ireland" },
    { code: "BE", name: "Belgium" },
    { code: "AT", name: "Austria" },
    { code: "NZ", name: "New Zealand" },
    { code: "KR", name: "South Korea" },
    { code: "MX", name: "Mexico" },
    { code: "AR", name: "Argentina" },
    { code: "CL", name: "Chile" },
    { code: "CO", name: "Colombia" },
    { code: "PE", name: "Peru" },
    { code: "VE", name: "Venezuela" },
    { code: "UY", name: "Uruguay" },
    { code: "PY", name: "Paraguay" },
    { code: "BO", name: "Bolivia" },
    { code: "EC", name: "Ecuador" },
    { code: "GY", name: "Guyana" },
    { code: "SR", name: "Suriname" },
    { code: "FK", name: "Falkland Islands" },
    { code: "GF", name: "French Guiana" },
    { code: "ZA", name: "South Africa" },
    { code: "NG", name: "Nigeria" },
    { code: "EG", name: "Egypt" },
    { code: "KE", name: "Kenya" },
    { code: "GH", name: "Ghana" },
    { code: "ET", name: "Ethiopia" },
    { code: "TZ", name: "Tanzania" },
    { code: "UG", name: "Uganda" },
    { code: "DZ", name: "Algeria" },
    { code: "MA", name: "Morocco" },
    { code: "TN", name: "Tunisia" },
    { code: "LY", name: "Libya" },
    { code: "SD", name: "Sudan" },
    { code: "SS", name: "South Sudan" },
    { code: "CM", name: "Cameroon" },
    { code: "CI", name: "Ivory Coast" },
    { code: "SN", name: "Senegal" },
    { code: "ML", name: "Mali" },
    { code: "BF", name: "Burkina Faso" },
    { code: "NE", name: "Niger" },
    { code: "TD", name: "Chad" },
    { code: "CF", name: "Central African Republic" },
    { code: "CG", name: "Republic of the Congo" },
    { code: "CD", name: "Democratic Republic of the Congo" },
    { code: "AO", name: "Angola" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
    { code: "BW", name: "Botswana" },
    { code: "NA", name: "Namibia" },
    { code: "LS", name: "Lesotho" },
    { code: "SZ", name: "Eswatini" },
    { code: "MG", name: "Madagascar" },
    { code: "MU", name: "Mauritius" },
    { code: "SC", name: "Seychelles" },
    { code: "KM", name: "Comoros" },
    { code: "DJ", name: "Djibouti" },
    { code: "SO", name: "Somalia" },
    { code: "ER", name: "Eritrea" },
    { code: "RW", name: "Rwanda" },
    { code: "BI", name: "Burundi" },
    { code: "MW", name: "Malawi" },
    { code: "MZ", name: "Mozambique" },
];

export const UserProfile = () => {
    const { address, displayAddress } = useWallet();
    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);

    // UserRegistry contract integration
    const {
        isLoading: isContractLoading,
        isCheckingUser,
        userExists,
        userId,
        encryptedProfileData,
        addUser,
        updateUserProfile,
    } = useUserRegistry();

    // Load profile data from localStorage on component mount
    useEffect(() => {
        if (address) {
            const storedProfile = localStorage.getItem(`profile_${address}`);
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    setProfileData(parsedProfile);
                    setSelectedCountry(parsedProfile.country);
                } catch (error) {
                    console.error("Error parsing stored profile:", error);
                }
            }
        }
    }, [address]);

    const handleSaveProfile = async () => {
        if (!address || !selectedCountry) {
            toast.error("Please select a country");
            return;
        }

        setIsLoading(true);
        try {
            const newProfileData: UserProfileData = {
                country: selectedCountry,
                address: address,
                lastUpdated: new Date().toISOString(),
            };

            // Check if user exists in the registry
            if (userExists) {
                // Update existing user's profile data
                await updateUserProfile(selectedCountry);
                toast.info("Updating user profile in registry...");
            } else {
                // Add new user to registry
                await addUser(selectedCountry);
                toast.info("Adding new user to registry...");
            }

            // Save to localStorage as backup
            localStorage.setItem(`profile_${address}`, JSON.stringify(newProfileData));
            setProfileData(newProfileData);

            toast.success("Digital passport updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to update digital passport");
        } finally {
            setIsLoading(false);
        }
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country ? country.name : countryCode;
    };

    if (!address) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex flex-col items-center justify-center mt-12 p-12 bg-muted max-w-md mx-auto rounded-lg"
            >
                <IdCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-medium mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    Connect your wallet to access your digital passport and manage your on-chain identity.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IdCard className="h-5 w-5" />
                        Digital Passport
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Wallet Address Display */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Wallet Address</Label>
                        <Input
                            id="address"
                            value={displayAddress}
                            disabled
                            className="font-mono"
                        />
                    </div>

                    {/* Registry Status */}
                    <div className="space-y-2">
                        <Label>Registry Status</Label>
                        <div className="flex items-center gap-2 text-sm">
                            {userExists === null ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                                    Checking registry...
                                </div>
                            ) : userExists ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="h-2 w-2 bg-green-600 rounded-full" />
                                    Registered in UserRegistry
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-orange-600">
                                    <div className="h-2 w-2 bg-orange-600 rounded-full" />
                                    Not registered in UserRegistry
                                </div>
                            )}
                        </div>
                        {userId && (
                            <div className="text-xs text-muted-foreground font-mono">
                                User ID: {userId.slice(0, 10)}...{userId.slice(-8)}
                            </div>
                        )}
                    </div>

                    {/* Country Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="country">Citizenship</Label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your country of citizenship" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {country.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading || isContractLoading || !selectedCountry || userExists === null}
                        className="w-full"
                    >
                        {isLoading || isContractLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin border-2 border-background border-t-transparent mr-2" />
                                {userExists ? "Updating..." : "Registering..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {userExists ? "Update Digital Passport" : "Register Digital Passport"}
                            </>
                        )}
                    </Button>

                    {/* Profile Information Display */}
                    {profileData && (
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h3 className="font-medium mb-2">Passport Information</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>
                                    <span className="font-medium">Citizenship:</span> {getCountryName(profileData.country)}
                                </div>
                                <div>
                                    <span className="font-medium">Last Updated:</span> {new Date(profileData.lastUpdated).toLocaleString()}
                                </div>
                                {encryptedProfileData && (
                                    <div>
                                        <span className="font-medium">Encrypted Profile:</span> {encryptedProfileData.slice(0, 10)}...{encryptedProfileData.slice(-8)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}; 