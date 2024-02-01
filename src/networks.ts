import { defineChain } from "viem";
export const RAAS_NETWORKS: any = {
  zKatana: {
    config: defineChain({
      id: 1261120,
      network: "zkatana",
      name: "Astar ZKatana Testnet",
      nativeCurrency: {
        name: "zKatana Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        public: {
          http: ["https://rpc.zkatana.gelato.digital"],
        },
        default: {
          http: ["https://rpc.zkatana.gelato.digital"],
        },
      },
      blockExplorers: {
        default: {
          name: "Block Scout",
          url: "https://zkatana.blockscout.com/",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 31317,
        },
      },
      testnet: true,
    }),
    privyId: "clozhep2500gal50f4c2j9gan",
    zeroDevId: "ZERODEV ID",
    simpleCounter: "0xEEeBe2F778AA186e88dCf2FEb8f8231565769C27",
  },
  unreal: {
    config: defineChain({
      id: 18231,
      network: "unreal",
      name: "Tangible Unreal",
      nativeCurrency: {
        name: "unreal Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        public: {
          http: ["https://rpc.unreal.gelato.digital"],
        },
        default: {
          http: ["https://rpc.unreal.gelato.digital"],
        },
      },
      blockExplorers: {
        default: {
          name: "Block Scout",
          url: "https://unreal.blockscout.com/",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 1320,
        },
      },
      testnet: true,
    }),
    simpleCounter: "0xEEeBe2F778AA186e88dCf2FEb8f8231565769C27",
  },
  opTestnet: {
    config: defineChain({
      id: 42069,
      network: "Op Testnet",
      name: "OP Testnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        public: {
          http: ["https://rpc.op-testnet.gelato.digital"],
        },
        default: {
          http: ["https://rpc.op-testnet.gelato.digital"],
        },
      },
      blockExplorers: {
        default: {
          name: "Block Scout",
          url: "https://blockscout.op-testnet.gelato.digital",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 1810305,
        },
      },
      testnet: true,
    }),

    simpleCounter: "0xA47789e8C1caC47Bd891e33C97cB3C6722037282",
  },
  liskSepolia: {
    config: defineChain({
      id: 4202,
      network: "liskSepolia",
      name: "Lisk Sepolia",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        public: {
          http: ["https://rpc.sepolia-api.lisk.com"],
        },
        default: {
          http: ["https://rpc.sepolia-api.lisk.com"],
        },
      },
      blockExplorers: {
        default: {
          name: "Block Scout",
          url: "https://sepolia-blockscout.lisk.com",
        },
      },
      contracts: {
        multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 1320,
        },
      },
      testnet: true,
    }),
    simpleCounter: "0xEEeBe2F778AA186e88dCf2FEb8f8231565769C27",
  },
};
