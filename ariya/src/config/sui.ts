import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId:
          "0x778e9a104b068ea36639699d5c57fd96dd6ecdda6af84890c10f4a849a3747e0",
        escrowRegistryId:
          "0x296bd7b8cf9ca97e2a6ec87eabe6876fef2e9e024a74ec2af6f798f8a32a40a3",
        communityRegistryId:
          "0xc9f32470dd2cc3ff79431293a83d6e92372c6d2342b9e78b5c87930c2da66f92",
        registrationRegistryId:
          "0x0cb0564076bc9bccdbd0e2eeff5cb7c15bf347eba02f1dc93160814abd896f4d",
        eventRegistryId:
          "0x697a9349dd71d46b88219c0837b0e8ef52cc8c8624f96a5d52bc92a60dc0e1f5",
        airdropRegistryId:
          "0xfc4914e32a63351dfecab0200d350998463e3d135df9fca6d83c4f6ab313d86b",
        nftRegistryId:
          "0x78ccdb317e3f15e2f3ae7729289baaf4a3cb34803f4a759138b10cda9655beb9",
        attendanceRegistryId:
          "0x9be449d8ce1c042bf148c2cbc13180463d9073d4e285233adc6619141c5ae0f6",
        ratingRegistryId:
          "0x8aded148ec4a2211d37c5f0e0ab0df7e01da2613f2030a23120f750df815d8a8",
        profileRegistryId:
          "0x5b0a5b6e12a6eed5f4b263d75cde60ce4d6c52b9bfb08f8e5447073e37d2e813",
        subscriptionRegistryId:
          "0x34572e6aa5a2307bac983444b2eed384ad493443b7123aa20b533b23c8d3b817",
        subscriptionConfigId:
          "0x1bea255420d95601a9107d7cce9b2b62f456246c88343b9b450e9c5eb641475f",
        platformTreasuryId:
          "0x4e9e734b3e1866cb509c08f510d3577113a0f7f1747c4a89be9182f1ab624ea9",
        documentFlowRegistryId:
          "0x1ae6d8bc437d821bfc4b5d0ce8c303e290f3fdf74e1adf6f906690df8d2bcfee",
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId:
          "0x778e9a104b068ea36639699d5c57fd96dd6ecdda6af84890c10f4a849a3747e0",
        escrowRegistryId:
          "0x296bd7b8cf9ca97e2a6ec87eabe6876fef2e9e024a74ec2af6f798f8a32a40a3",
        communityRegistryId:
          "0xc9f32470dd2cc3ff79431293a83d6e92372c6d2342b9e78b5c87930c2da66f92",
        registrationRegistryId:
          "0x0cb0564076bc9bccdbd0e2eeff5cb7c15bf347eba02f1dc93160814abd896f4d",
        eventRegistryId:
          "0x697a9349dd71d46b88219c0837b0e8ef52cc8c8624f96a5d52bc92a60dc0e1f5",
        airdropRegistryId:
          "0xfc4914e32a63351dfecab0200d350998463e3d135df9fca6d83c4f6ab313d86b",
        nftRegistryId:
          "0x78ccdb317e3f15e2f3ae7729289baaf4a3cb34803f4a759138b10cda9655beb9",
        attendanceRegistryId:
          "0x9be449d8ce1c042bf148c2cbc13180463d9073d4e285233adc6619141c5ae0f6",
        ratingRegistryId:
          "0x8aded148ec4a2211d37c5f0e0ab0df7e01da2613f2030a23120f750df815d8a8",
        profileRegistryId:
          "0x5b0a5b6e12a6eed5f4b263d75cde60ce4d6c52b9bfb08f8e5447073e37d2e813",
        subscriptionRegistryId:
          "0x34572e6aa5a2307bac983444b2eed384ad493443b7123aa20b533b23c8d3b817",
        subscriptionConfigId:
          "0x1bea255420d95601a9107d7cce9b2b62f456246c88343b9b450e9c5eb641475f",
        platformTreasuryId:
          "0x4e9e734b3e1866cb509c08f510d3577113a0f7f1747c4a89be9182f1ab624ea9",
        documentFlowRegistryId:
          "0x1ae6d8bc437d821bfc4b5d0ce8c303e290f3fdf74e1adf6f906690df8d2bcfee",
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId:
          "0x778e9a104b068ea36639699d5c57fd96dd6ecdda6af84890c10f4a849a3747e0",
        escrowRegistryId:
          "0x296bd7b8cf9ca97e2a6ec87eabe6876fef2e9e024a74ec2af6f798f8a32a40a3",
        communityRegistryId:
          "0xc9f32470dd2cc3ff79431293a83d6e92372c6d2342b9e78b5c87930c2da66f92",
        registrationRegistryId:
          "0x0cb0564076bc9bccdbd0e2eeff5cb7c15bf347eba02f1dc93160814abd896f4d",
        eventRegistryId:
          "0x697a9349dd71d46b88219c0837b0e8ef52cc8c8624f96a5d52bc92a60dc0e1f5",
        airdropRegistryId:
          "0xfc4914e32a63351dfecab0200d350998463e3d135df9fca6d83c4f6ab313d86b",
        nftRegistryId:
          "0x697a9349dd71d46b88219c0837b0e8ef52cc8c8624f96a5d52bc92a60dc0e1f5",
        attendanceRegistryId:
          "0x9be449d8ce1c042bf148c2cbc13180463d9073d4e285233adc6619141c5ae0f6",
        ratingRegistryId:
          "0x8aded148ec4a2211d37c5f0e0ab0df7e01da2613f2030a23120f750df815d8a8",
        profileRegistryId:
          "0x5b0a5b6e12a6eed5f4b263d75cde60ce4d6c52b9bfb08f8e5447073e37d2e813",
        subscriptionRegistryId:
          "0x34572e6aa5a2307bac983444b2eed384ad493443b7123aa20b533b23c8d3b817",
        subscriptionConfigId:
          "0x1bea255420d95601a9107d7cce9b2b62f456246c88343b9b450e9c5eb641475f",
        platformTreasuryId:
          "0x4e9e734b3e1866cb509c08f510d3577113a0f7f1747c4a89be9182f1ab624ea9",
        documentFlowRegistryId:
          "0x1ae6d8bc437d821bfc4b5d0ce8c303e290f3fdf74e1adf6f906690df8d2bcfee",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };

// Create Sui client instance
export const suiClient = new SuiClient({
  url: networkConfig.testnet.url, // Default to testnet for development
});

// Constants
export const PASS_VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
