import { generateNonce, generateRandomness, jwtToAddress} from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Use any for User type to avoid Firebase import issues
type User = any;

// App-specific salt for zkLogin (should be unique per app)
// Convert string to BigInt using a hash-like approach
const ZKLOGIN_SALT = BigInt("0x" + Array.from("ariya-protocol-zklogin-salt-v1").map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));

export interface ZkLoginResult {
  userAddress: string;
  zkLoginSignature: any;
  ephemeralKeyPair: Ed25519Keypair;
  nonce: string;
  user: User;
}

export async function zkLoginFlow(): Promise<ZkLoginResult> {
  try {
    // 1. Sign in with Google via Firebase
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // 2. Get the ID token (JWT)
    const jwt = await user.getIdToken();
    
    // 3. Generate ephemeral keypair
    const ephemeralKeyPair = new Ed25519Keypair();

    // 4. Generate randomness and nonce for the OAuth flow
    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), Number(randomness), 0n);

    // 5. Derive user Sui address from JWT
    const userAddress = jwtToAddress(jwt, ZKLOGIN_SALT);

    // 6. For now, return a placeholder signature (will be implemented later)
    const zkLoginSignature = { jwt, ephemeralKeyPair };

    return { 
      userAddress, 
      zkLoginSignature, 
      ephemeralKeyPair, 
      nonce,
      user 
    };
  } catch (error) {
    console.error("zkLogin flow error:", error);
    throw error;
  }
}

export async function signOutZkLogin(): Promise<void> {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("zkLogin sign out error:", error);
    throw error;
  }
}

export function getCurrentZkUser(): User | null {
  return auth.currentUser;
}

export function onZkAuthStateChanged(callback: (user: User | null) => void): () => void {
  return auth.onAuthStateChanged(callback);
}
