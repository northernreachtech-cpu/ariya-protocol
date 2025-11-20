# 💾 Integrating Walrus Decentralized Storage into a React Application

Walrus is a decentralized data management and storage protocol built on the Sui blockchain. This guide details how to integrate the Walrus TypeScript SDK into a React application, typically used for building Sui dApps.

---

## 1. ⚙️ Prerequisites and Dependencies

Walrus requires the core Sui SDK and is often used alongside the Sui dApp Kit for seamless wallet integration in React.

### Installation

Install the necessary packages using NPM or Yarn:

```bash
npm install @mysten/walrus @mysten/sui @mysten/dapp-kit @tanstack/react-query
# or
yarn add @mysten/walrus @mysten/sui @mysten/dapp-kit @tanstack/react-query
2. 🔌 Client ConfigurationYou must initialize the standard SuiJsonRpcClient and extend it with the Walrus SDK to access Walrus-specific methods.Walrus Client SetupCreate an instance of the client, specifying the network (e.g., 'testnet') as required by Walrus.TypeScriptimport { SuiJsonRpcClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';

/**
 * Initializes the Walrus-extended Sui client.
 */
const walrusClient = new SuiJsonRpcClient({
  // Use a reliable fullnode URL for the desired network
  url: getFullnodeUrl('testnet'), 
  network: 'testnet', // Crucial for Walrus initialization
})
// Extend the client to include the .walrus methods
.$extend(walrus());

// Export this client for use in React components/hooks
export { walrusClient };
3. ✍️ Storing Data (Write Flow)Storing data involves two steps: preparing the file data into a WalrusFile object and then executing the multi-step writeFilesFlow using a connected user's Signer (wallet).Data PreparationThe WalrusFile.from() utility handles encoding your data (string, blob, etc.).TypeScriptimport { WalrusFile } from '@mysten/walrus';

// Create a file object from raw string data
const settingsData = { 
    theme: 'dark', 
    notifications: true 
};

const fileToStore = WalrusFile.from({ 
  contents: JSON.stringify(settingsData), 
  identifier: 'user-settings.json', // An optional name/identifier
});
Execution Flow in ReactUse the useSigner hook from @mysten/dapp-kit to obtain the necessary signing authority for the on-chain transactions.TypeScriptimport { useSigner } from '@mysten/dapp-kit';
import { walrusClient } from './walrusClient'; // Import your client

function DataUploader({ fileToStore }) {
  const signer = useSigner(); // Current connected wallet signer

  const handleUpload = async () => {
    if (!signer) return alert("Wallet not connected.");

    try {
      // 1. Create the flow object
      const flow = walrusClient.walrus.writeFilesFlow({
        signer, 
        files: [fileToStore],
        epochs: 10, // Number of epochs (storage duration) to pay for
      });

      console.log("Starting Walrus write flow...");
      
      // 2. Execute necessary transaction steps
      await flow.encode();       // Prepare transactions
      await flow.register();     // On-chain registration of blob
      await flow.upload();       // Off-chain data upload to Walrus nodes
      await flow.certify();      // On-chain certification of data availability

      const storedFiles = flow.listFiles();
      console.log("✅ Data Stored. Blob ID:", storedFiles[0].blobId);

    } catch (error) {
      console.error("❌ Walrus upload failed:", error);
    }
  };

  // ... Render button to call handleUpload
}
4. 📚 Retrieving Data (Read)To read data, you only need the initialized Walrus client and the unique Blob ID of the file you wish to retrieve.Reading the FileThe getFiles method returns an array of WalrusFile objects, which include the decoded data.TypeScriptimport { walrusClient } from './walrusClient';
import { WalrusFile } from '@mysten/walrus';

/**
 * Fetches and decodes data from Walrus using a Blob ID.
 * @param blobId The unique ID of the stored data blob.
 * @returns The decoded file content (as text).
 */
async function retrieveWalrusData(blobId: string): Promise<string | null> {
    try {
        const files: WalrusFile[] = await walrusClient.walrus.getFiles({ 
            ids: [blobId],
        });

        if (files.length === 0) {
            console.warn("Blob not found for ID:", blobId);
            return null;
        }

        // Decode the data (which is a Uint8Array) into a readable string
        const fileContent = new TextDecoder().decode(files[0].data);
        return fileContent;
        
    } catch (error) {
        console.error("Failed to retrieve data from Walrus:", error);
        return null;
    }
}
💡 SummaryOperationWalrus MethodDependenciesNotesSetupwalrus() extension@mysten/sui, @mysten/walrusMust use getFullnodeUrl() and specify the network.Writewalrus.writeFilesFlow()useSigner (@mysten/dapp-kit)Requires a connected wallet (signer) for transaction fees (gas).Readwalrus.getFiles()walrusClientRetrieve data using the blobId returned from the write flow.