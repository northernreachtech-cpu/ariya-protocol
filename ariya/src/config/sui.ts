import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId:
          "0x2a3a140e945cfe5fa14c8946ff6ec574b49880334aa2de388a4d8c0931351c59",
        ratingRegistryId:
          "0x0dc2cedac538916499ef61abfe2ecf2224e6c5d0cda517df4059906408c228cb",
        documentFlowRegistryId:
          "0x6d13a7e3f217136ed9c12bdb1d1d6639cc0ad9f68c4e7d947b5a702e90298f47",
        airdropRegistryId:
          "0x74f1ef8e7555db64107597db89185292f1b2f1deadaea51ec3bfc765fe11f737",
        profileRegistryId:
          "0x88e4b7a18b3cb8a93fa1423a65a955ad4ed871859461ae1bc9065eaa169e1589",
        nftRegistryId:
          "0x9c8264b24139b27cabbd3bede69a69d5503b0f3d98846bb4718b0f193e7340b9",
        subscriptionRegistryId:
          "0xa4a46cf3c35009d39ae036ab88ed898e7b2f8a95725caa1138b3dd76e1e80f61",
        attendanceRegistryId:
          "0xb2a46ff2b042888226d87b69cb1fb9b63d120261e185bef87647a90120dc74d6",
        communityRegistryId:
          "0xb8ae6ac0c7d441feec28eddb93b7b32838c435ab1d98a3cf162ea7ed06c5153d",
        escrowRegistryId:
          "0xbcfd6a480ac25d4120fb5bf466012724d8a2302b51a5dc1c3ef8c2939f03679e",
        platformTreasuryId:
          "0xcec6fdc2c6d3268742cb7039b8171ab541cbaaa0ac8d7d9d27becbe65f0ebc7e",
        eventRegistryId:
          "0xebb7813107be985f810778a6418eae100f0b23fe5e8f4cddcc080a2e7e88b142",
        registrationRegistryId:
          "0xf2f82d29890ab1aa1b638e66dbc7b32db4739540c65775f541bc2c6f3df516ed",
        subscriptionConfigId:
          "0xfd35beabbfea7aa2e0c30133c8432723d7f386aaf3f42a25a9db29dd00a3fd3f",
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId:
          "0x2a3a140e945cfe5fa14c8946ff6ec574b49880334aa2de388a4d8c0931351c59",
        ratingRegistryId:
          "0x0dc2cedac538916499ef61abfe2ecf2224e6c5d0cda517df4059906408c228cb",
        documentFlowRegistryId:
          "0x6d13a7e3f217136ed9c12bdb1d1d6639cc0ad9f68c4e7d947b5a702e90298f47",
        airdropRegistryId:
          "0x74f1ef8e7555db64107597db89185292f1b2f1deadaea51ec3bfc765fe11f737",
        profileRegistryId:
          "0x88e4b7a18b3cb8a93fa1423a65a955ad4ed871859461ae1bc9065eaa169e1589",
        nftRegistryId:
          "0x9c8264b24139b27cabbd3bede69a69d5503b0f3d98846bb4718b0f193e7340b9",
        subscriptionRegistryId:
          "0xa4a46cf3c35009d39ae036ab88ed898e7b2f8a95725caa1138b3dd76e1e80f61",
        attendanceRegistryId:
          "0xb2a46ff2b042888226d87b69cb1fb9b63d120261e185bef87647a90120dc74d6",
        communityRegistryId:
          "0xb8ae6ac0c7d441feec28eddb93b7b32838c435ab1d98a3cf162ea7ed06c5153d",
        escrowRegistryId:
          "0xbcfd6a480ac25d4120fb5bf466012724d8a2302b51a5dc1c3ef8c2939f03679e",
        platformTreasuryId:
          "0xcec6fdc2c6d3268742cb7039b8171ab541cbaaa0ac8d7d9d27becbe65f0ebc7e",
        eventRegistryId:
          "0xebb7813107be985f810778a6418eae100f0b23fe5e8f4cddcc080a2e7e88b142",
        registrationRegistryId:
          "0xf2f82d29890ab1aa1b638e66dbc7b32db4739540c65775f541bc2c6f3df516ed",
        subscriptionConfigId:
          "0xfd35beabbfea7aa2e0c30133c8432723d7f386aaf3f42a25a9db29dd00a3fd3f",
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId:
          "0xc246d2f2732d67deaa10adfb1f71461e5c61dd1046e65e55318bf977abeb5fdd",
        upgradeCapId:
          "0xf3044bb30004274680ebe09fc3dee5fcb68b0e49be15d52226d7ac4d21b8f07e",
        registrationRegistryId:
          "0x28df5da5996a4779c1296e0ea78e02b1d449db750166ca02e5878f6eefecce31",
        subscriptionConfigId:
          "0x2c180ef05f325ad3a9fc350afaa2e6c7b1473a6d45ccbdadcc0cb57f7d5ff532",
        airdropRegistryId:
          "0x31e6b047292883f9e330f7c2b057e95955a2ebcf492386de7fc49a1ccf0929da",
        nftRegistryId:
          "0x34f81b8c2c5a6a1d0377ecaf83c139d05c74aa2a5cf8ff60d94f9c395c07eb41",
        escrowRegistryId:
          "0x41abc37bed82676994a90c84153ca2b72af932fbd6a0039e1f57edd796a9daf5",
        profileRegistryId:
          "0x441ad7c277005bc110a12640e08a89a50a234fc440b5140ee931ab157c3c757a",
        ratingRegistryId:
          "0x634ab62c23fdf64dee6906897aca8614daf6b8e9ea86d25d72d0d281d01bfcd2",
        communityRegistryId:
          "0x7114d87b0e1e098ee6c5c350b1061a233aaa21994b75c3b802083f6143afbabe",
        eventRegistryId:
          "0x8c0ab8601101fb60957a816b9f4570d69c2c803991f6d6c649b42ffea55d071a",
        documentFlowRegistryId:
          "0x909afb5e4a3e6940cc23777093911d6164c81b685a1c2b79d82f89a4e7e8d81b",
        attendanceRegistryId:
          "0x92c563674511a1097d4305697d61c7bd4960af7e4976bf8b93f2fe954e6a3b8e",
        subscriptionRegistryId:
          "0xb70f602146e0a3126264be86f6d74d79c8888b5d6aabcd87d35d17f40fbea8ec",
        platformTreasuryId:
          "0xc14246424fb9cdf52d6c8d56e7cb3951ba659aa09ab75f6c531b716747118313",
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
