
# 🔁 Full PoC Cycle — Zama Compliance Hook with Real User Data

This proof-of-concept demonstrates a full compliance lifecycle for privacy-preserving, onchain RWA (Real World Asset) trading and USD redemption using Zama’s **Fully Homomorphic Encryption (FHE)** and `fhEVM`.

It merges architecture from Part 2 with real-world compliance attributes and integrates learnings from the **FHEordle game**, where efficient encrypted state checks were done using bitmasks and `TFHE` operations.

---

## 👤 1. User Onboarding – Off-chain KYC to On-chain FHE Hash

### Example Investor Attributes

| Attribute         | Value                    | Bit Index         |
|------------------|--------------------------|-------------------|
| Nationality      | Egypt (index 62)         | Bit 62            |
| KYC Verified     | Yes                      | Bit 256           |
| Sanctions        | Cleared                  | Bit 257           |
| Tax Category     | Type 3 (`0b0011`)        | Bits 258–261      |
| License Type     | Type 4 (`0b0100`)        | Bits 262–269      |

---

### 🧱 Step 1.1: Build Plain Bitmap

```solidity
uint256 userBitmap = 
    (1 << 4)  |        // Nationality: Egypt
    (1 << 9)  |        // KYC: Verified
    (1 << 10) |        // Sanctions: Cleared
    (1 << 12) |        // Tax Category: 3
    (1 << 14) ;        // License Type: 4
```

---

### 🔐 Step 1.2: Encrypt using Zama FHE

```solidity
euint256 encryptedBitmap = TFHE.asEuint256(userBitmap); // Simple onchain use

// Or: Encrypt off-chain (securely) and upload ciphertext
bytes32 encryptedCiphertext = FHE.encryptToBytes(userBitmap);
```

---

### 📥 Step 1.3: Store Encrypted Profile Onchain

```solidity
UserRegistry.addUser(userId, userWallet, encryptedCiphertext);
```

---

## 🏛 2. Rule Creation & Registration

Rules represent compliance logic (e.g. must be Egyptian, verified KYC, etc.)

### Step 2.1: Rule Bitmap (Identical Structure to User Bitmap)

```solidity
uint256 ruleBitmap = 
    (1 << 4)  |        // Nationality: Egypt
    (1 << 9)  |        // KYC: Verified
    (1 << 10) |        // Sanctions: Cleared
    (1 << 12) |        // Tax Category: 3
    (1 << 14) ;        // License Type: 4
```

---

### Step 2.2: Rule Condition Array

```solidity
uint256[] conditionsArray = [
    1 << 4,   // Bits 0–7: Nationality
    1 << 1,   // Bit 8   : KYC
    1 << 2,   // Bit 9   : Sanctions
    1 << 4,   // Bits 11 : Tax
    1 << 8    // Bits 13 : License
];
```

---

### Step 2.3: Register Rule & Assign to Product

```solidity
IRule rule = new Rule(ruleBitmap, conditionsArray);
IProduct(productAddress).addRule(address(rule));
```

---

## ✅ 3. FHE Compliance Check — `isCompliant()`

### Step 3.1: Call Path

```solidity
bool ok = RulesEngine.isCompliant(userId, productAddress);
```

### Step 3.2: Contract Logic

```solidity
function isCompliant(bytes32 userId, address product) public view override returns (bool) {
    bytes32 encryptedUserHash = registry.getEncryptedFHEHash(userId);
    address[] memory rules = IProduct(product).getRuleAddresses();

    for (uint i = 0; i < rules.length; i++) {
        IRule rule = IRule(rules[i]);
        if (!verifier.verifyUserAgainstRule(
            encryptedUserHash,
            rule.getRuleBitmap()
        )) {
            return false;
        }
    }
    return true;
}
```

---

## 🧠 4. FHE-Based Verifier Logic (Optimized with One Expression)

Instead of traversing condition arrays, we simplify the logic with:

```rust
// Full compliance expression (user must have all rule-required bits set)
fn verify_user_against_rule(
    encrypted_user_bitmap: Encrypted<u256>,
    rule_bitmap: u256
) -> ebool {
    let enc_rule_bitmap = TFHE::encrypt_u256(rule_bitmap);
    let masked_user = TFHE::and(encrypted_user_bitmap, enc_rule_bitmap);
    TFHE::eq(masked_user, enc_rule_bitmap)
}
```

This returns true if:
> `(userBitmap & ruleBitmap) == ruleBitmap` (bitwise match)

---

## 🔁 5. RWA Trading / Redemption

### 🔄 Swap Flow (USDC → RWA Token)

1. Investor triggers Uniswap swap
2. Pre-swap hook → `isCompliant(...)`
3. If valid → swap executes

### 💸 Redemption Flow (RWA Token → USDC)

1. Investor sends burn+redeem request
2. Verifier runs `isCompliant(...)`
3. If OK:
   - Burn RWA token
   - Mint USDC via Circle (atomic swap)

---

## ✨ Inspired by FHEordle – Optimizing FHE Checks

Like **FHEordle**, this architecture:

- Encodes rules via bit masks
- Uses `TFHE.shl`, `TFHE.or`, `TFHE.and`, and `TFHE.eq` for efficient comparisons
- Avoids loop overhead in Solidity by using **bitwise logic** for condition evaluation

---

## ✅ End Result

| Feature                  | Description                                         |
|--------------------------|-----------------------------------------------------|
| 🧑‍💼 User Data           | Nationality, KYC, Sanctions, Tax, License           |
| 🧠 Rules                 | Bitmapped & modular per product                     |
| 🔐 FHE Eval              | Off-chain using Zama verifier                       |
| 📦 Onchain Result        | `true`/`false` from `isCompliant()`                 |
| 🔄 Trade/Redemption Path | Fully automated, privacy-preserving & instant       |
