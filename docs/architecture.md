# 🔐 Zama Compliance Hook – Part 2  

### Architecture, Bitmapped Conditions, and FHE-Hashed Eligibility for RWA Trading and USD Redemption on Uniswap v4

In [Part 1](https://medium.com/coinmonks/trading-real-world-assets-on-uniswap-with-homomorphic-encryption-51c67dd9d318), we introduced a vision: enabling decentralized trading of real-world assets (RWAs) like gold, stocks, and real estate — directly on Uniswap — with regulatory compliance and privacy by design.

This second part dives into the technical framework that makes it possible — **not only to buy RWAs** securely, but also to **redeem them for USD** instantly and compliantly.

This second part dives into the technical implementation using:

- 🧩 Modular smart contract architecture  
- 🧠 Rule/condition encoding using bitmaps  
- 🔐 Fully Homomorphic Encryption (FHE) by Zama  
- 🔏 On-chain storage of **FHE-hashed user data only**  
- 🧪 A working example with pseudocode for Stock X  

---

## 👥 User Roles

### Compliance Expert
- Creates and publishes regulatory rules per jurisdiction
- Defines rule-specific bitmaps and their corresponding condition arrays
- Assigns rules to tokenized assets (Products)

### Investor (User)
- Completes off-chain KYC/AML with a licensed verifier
- Verifier encrypts and hashes the compliance profile using **Zama FHE**
- **Only the FHE-encrypted hash** is stored on-chain in the User Registry
- The investor can exit his investment position by swapping his RWA tokens with Circle 

---

## 💡 Why USD Redemption Matters

One major limitation of traditional RWA platforms is slow, manual fiat redemptions — often taking days or even weeks.

**This architecture introduces a breakthrough:**

> 🧾 **Privacy-first compliance checks + instant USD redemption**

### ✅ How it works:

- User submits a redemption request (RWA → USD)
- FHE Verifier runs a **Zama-powered compliance check**
- If compliant, the system executes an **atomic swap**:
  - Burn RWA tokens
  - Mint USDC on the user's wallet (via Circle or equivalent)

### 🚀 Benefits:

- No wait times  
- No centralized delays  
- Full privacy for users  
- Compliance enforced without exposing data  
- Fully on-chain settlement path

---

## 🔁 System Architecture


```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  User Registry│────▶│  Rules Engine │◀─── │    Product    │
└───────┬───────┘     └───────────────┘     └───────┬───────┘
        │                     ▲                     │
        │                     │                     │
        │             ┌───────┴───────┐             │
        └────────────▶│     Rules     │◀────────────┘
                      └───────────────┘
                              ▲
                              │
                      ┌───────┴───────┐
                      │   Conditions  │
                      └───────────────┘
```

---

## 🧠 Architecture Highlights

- **Rules** define compliance via bitmaps (age, jurisdiction, AML, etc.)
- **Products** list the rules required for eligibility
- **Users** upload FHE-hashed compliance proofs
- **Hooks** can enforce these rules before allowing trades or redemptions
- **Circle/Fiat Bridge** performs atomic issuance of USDC after compliance pass

---

## 🧠 Example: Bitmap Encoding (For Illustration Only)

### Rule Bitmap Structure
Each rule's bitmap is organized into specific ranges of bits, each representing different compliance attributes. Here's an example structure:

| Bits       | Condition Description                      |
|------------|---------------------------------------------|
| 0–255      | Nationality (256 possible countries)        |
| 256        | KYC Status (1 = verified)                   |
| 257        | Sanction Check (1 = cleared)                |
| 258-261    | Tax Requirements (4 types)                  |
| 262-269    | License Type (8 types)                      |

### Condition Array
The condition array defines how to traverse through the rule's bitmap:

```solidity
// Conditions Array - defines how to traverse the bitmap
conditionsArray[0] = 2^8  // Check nationality bits (0-255)
conditionsArray[1] = 2^1  // Check KYC status (bit 256)
conditionsArray[2] = 2^1  // Check sanction status (bit 257)
conditionsArray[3] = 2^2  // Check tax requirements (bits 258-261)
conditionsArray[4] = 2^3  // Check license type (bits 262-269)
```

### Traversal Flow
1. Start with `conditionsArray[0]` - check nationality bits to identify investor's country
2. Move to `conditionsArray[1]` - verify KYC status
3. Move to `conditionsArray[2]` - check sanction status
4. Move to `conditionsArray[3]` - verify tax compliance
5. Finally check `conditionsArray[4]` - verify license type

This structure provides:
- **Rule-specific**: Each rule maintains its own bitmap with relevant compliance data
- **Efficient traversal**: Direct bit manipulation for fast lookups within the rule's bitmap
- **Flexible logic**: Tree structure allows complex conditional flows per rule

---

## 🔐 Compliance with FHE Hashing

- Users never store raw compliance data on-chain.
- Instead, off-chain verifiers hash encrypted bitmaps using Zama FHE.
- Only the encrypted hash is uploaded to the blockchain.
- Eligibility checks are done by comparing user hashes with rule bitmaps — all encrypted.

---

## 💾 Solidity Interfaces

### `IRule.sol`

```solidity
interface IRule {
    function getRuleBitmap() external view returns (uint256);
    function getConditionsArray() external view returns (uint256[] memory);
    function evaluateCondition(uint256 conditionIndex, uint256 userBitmap) external view returns (bool);
}
```

### `IProduct.sol`

```solidity
interface IProduct {
    function getRuleAddresses() external view returns (address[] memory);
    function addRule(address ruleAddress) external;
    function removeRule(address ruleAddress) external;
}
```

### `IRulesEngine.sol`

```solidity
interface IRulesEngine {
    function isCompliant(bytes32 userId, bytes32 productId) external view returns (bool);
    function evaluateRule(address ruleAddress, bytes32 userId) external view returns (bool);
}
```

### `IFHEVerifier.sol`

```solidity
interface IFHEVerifier {
    function verifyUserAgainstRule(
        bytes32 calldata encryptedUserHash,
        uint256 ruleBitmap,
        uint256[] calldata conditionsArray
    ) external view returns (bool);
}
```

### `IUserRegistry.sol`

```solidity
interface IUserRegistry {
    function addUser(bytes32 userId, address wallet, bytes32 encryptedProfileBitMap) external;
    function addNewWallet(bytes32 userId, address wallet) external;
    function addNewProfileData(bytes32 userId, bytes32 encryptedProfileBitMap) external;
    function getEncryptedFHEHash(bytes32 userId) external view returns (bytes32);
}
```
---

## 🛠 RulesEngine Contract Example

```solidity
contract RulesEngine is IRulesEngine {
    IUserRegistry public registry;
    IFHEVerifier public verifier;

    constructor(address _registry, address _verifier) {
        registry = IUserRegistry(_registry);
        verifier = IFHEVerifier(_verifier);
    }

    function isCompliant(bytes32 userId, bytes32 productId) public view override returns (bool) {
        address[] memory ruleAddresses = IProduct(productId).getRuleAddresses();
        
        for (uint i = 0; i < ruleAddresses.length; i++) {
            if (!evaluateRule(ruleAddresses[i], userId)) {
                return false;
            }
        }
        return true;
    }

    function evaluateRule(address ruleAddress, bytes32 userId) public view override returns (bool) {
        IRule rule = IRule(ruleAddress);
        bytes32 encryptedUserHash = registry.getEncryptedFHEHash(userId);
        
        return verifier.verifyUserAgainstRule(
            encryptedUserHash,
            rule.getRuleBitmap(),
            rule.getConditionsArray()
        );
    }
}
```

---

## 🧪 Zama Verifier Pseudocode

```solidity
fn verify_user_against_rules(encrypted_hash: EncryptedBits, rules: Vec<PlainBits>) -> EncryptedBool {
    let mut rule_passes = vec![];

    for rule in rules {
        let passes = fhe_check_conditions(encrypted_hash, rule);
        rule_passes.push(passes);
    }

    // Return true only if all rules pass
    fhe_and_all(rule_passes)
}
```


---

## 🔁 Flow: RWA Trade and Redemption

### Trade Flow (e.g., USDC → Stock X):

1. User initiates swap on Uniswap v4
2. Hook queries `RulesEngine` to check compliance
3. `RulesEngine` sends encrypted hash + rules to off-chain FHE verifier
4. If verified → swap proceeds

### Redemption Flow (Stock X → USDC):

1. User initiates redemption request
2. Off-chain verifier checks user eligibility via FHE
3. If approved:
   - RWA tokens are **burned**
   - USDC is **minted atomically** to the user's wallet via Circle

This atomic process ensures that privacy and compliance are enforced **without delay or manual review**.

---

## ✅ Key Benefits

| Feature            | Description                                                                |
|-------------------|----------------------------------------------------------------------------|
| 🔐 Privacy         | Users never expose raw compliance data                                     |
| ⚖ Regulatory       | Jurisdiction-specific rules enforced before trade or redemption           |
| ⏱ Instant USD Exit | RWA tokens are redeemed directly into USDC without delays                 |
| 🧠 Modular Logic    | Rules are composable and product-specific                                 |
| 🔁 Hooks Compatible | Fully integrates with Uniswap v4 Hook pre-swap logic                      |

---

## 🔜 Coming in Part 3...

We'll implement:

- The Hook logic inside Uniswap v4  
- Hardhat-based testing with simulated verifiers  
- USD redemption module  
- Frontend flow for redemption + real-world wallet UX

---

## 🤝 Join the Conversation

If you're building in:

- RWA tokenization  
- DeFi compliance tooling  
- Privacy-preserving infrastructure  
- Fiat bridges or stablecoin protocols  

We'd love to collaborate and exchange ideas. Let's build compliant, user-first DeFi — together.

---