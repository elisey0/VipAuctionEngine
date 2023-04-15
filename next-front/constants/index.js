export const CONTRACT_ADDRESS = "0x23EDcc4847943c84E56246d31CEB37B750111002";

export const abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "itemName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minBid",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256",
      },
    ],
    name: "AuctionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endPrice",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "winners",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "otherParticipants",
        type: "tuple[]",
      },
    ],
    name: "AuctionEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "bidderAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bid",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "winners",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "otherParticipants",
        type: "tuple[]",
      },
    ],
    name: "BidAdded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "auctions",
    outputs: [
      {
        internalType: "string",
        name: "item",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "ticketsSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minBid",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "ticket",
        type: "address",
      },
      {
        internalType: "address",
        name: "revenueAdress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "startAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endsAt",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "ended",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "bid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_item",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_ticketsSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minBid",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_revenueAdress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256",
      },
    ],
    name: "createAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "endAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAuctionLength",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getWinnersAndOtherParticipants",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "winners",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "bidderAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bid",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct VipAuctionEngine.Bidder[]",
        name: "otherParticipants",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
