# Ariya Web App – Add zkLogin as Alternative Wallet Connection

This guide updates the Ariya web app to support **zkLogin authentication** as an **alternative** to the existing wallet connection.  
We will **not remove** the current wallet connection yet—zkLogin will be an **optional feature** until fully verified.

---

## 1. Install Required Packages
Make sure the Sui SDK is installed (if not already):

```bash
npm install @mysten/sui @mysten/wallet-kit
```

---

## 2. Setup zkLogin Utilities
Create a new file: `src/lib/zklogin.ts`

```ts
import { generateNonce, generateRandomness, jwtToAddress, jwtToZkLoginSignature } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export async function zkLoginFlow(jwt: string, salt: string) {
  // 1. Generate ephemeral keypair
  const ephemeralKeyPair = new Ed25519Keypair();

  // 2. Generate randomness and nonce for the OAuth flow
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), randomness);

  // 3. Derive user Sui address from JWT
  const userAddress = jwtToAddress(jwt, salt);

  // 4. Generate zkLogin signature
  const zkLoginSignature = await jwtToZkLoginSignature(jwt, ephemeralKeyPair);

  return { userAddress, zkLoginSignature, ephemeralKeyPair, nonce };
}
```

This utility handles the zkLogin steps.

---

## 3. Add zkLogin Button to Wallet UI
Locate the current wallet connect UI (likely in `src/components/WalletConnect.tsx` or similar).  
Add a **new button** for zkLogin:

```tsx
import React, { useState } from "react";
import { zkLoginFlow } from "../lib/zklogin";

export default function WalletOptions() {
  const [zkUser, setZkUser] = useState<string | null>(null);

  const handleZkLogin = async () => {
    try {
      // Example: replace with your OAuth provider integration (Google, Twitch, etc.)
      const jwt = await fetch("/api/oauth/google").then(res => res.json()).then(d => d.jwt);

      const { userAddress } = await zkLoginFlow(jwt, "your-app-salt");
      setZkUser(userAddress);

      console.log("zkLogin user address:", userAddress);
    } catch (err) {
      console.error("zkLogin error:", err);
    }
  };

  return (
    <div className="wallet-options">
      {/* Existing wallet connect */}
      <button onClick={() => {/* existing wallet connect */}}>
        Connect Wallet
      </button>

      {/* zkLogin alternative */}
      <button onClick={handleZkLogin}>
        zkLogin (Google/Twitch/etc.)
      </button>

      {zkUser && <p>Connected zkLogin Address: {zkUser}</p>}
    </div>
  );
}
```

---

## 4. Add Backend Proof Service (Optional)
zkLogin requires a proof service to validate JWTs and issue zk proofs.  
For testing, you can use Sui’s community endpoints or host your own.  

In `api/oauth/[provider].ts` (Next.js API route), implement the OAuth login flow to return a JWT.

---

## 5. Sponsored Transactions (Recommended)
Since zkLogin users often won’t have SUI for gas, set up a **sponsored transaction flow**:

```ts
import { TransactionBlock } from "@mysten/sui/transactions";

export async function sendSponsoredTxn(zkSignature: any, tx: TransactionBlock) {
  // Send tx + zkSignature to a backend relayer/gas station
  const res = await fetch("/api/sponsor-tx", {
    method: "POST",
    body: JSON.stringify({ zkSignature, tx }),
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
}
```

Backend will sign and pay gas.

---

## 6. Test zkLogin
1. Run the app: `npm run dev`  
2. Click the **zkLogin button**  
3. Complete OAuth login (Google/Twitch/etc.)  
4. Check console → you should see a **zkLogin Sui address**  

---

## 7. Next Steps
- ✅ Verify zkLogin transactions work with sponsored gas  
- ✅ Map zkLogin address to user profiles if needed  
- 🚀 Once stable, **remove legacy wallet connect** and make zkLogin the default  

---

## Notes
- `salt` should be **unique per app** and stored securely.  
- Ephemeral keys expire after a few epochs → refresh regularly.  
- For production: host your own zkLogin proof server.  
