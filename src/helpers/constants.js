exports.constants = {
    admin: {
        name: "admin",
        email: "admin@admin.com",
    },
    confirmEmails: {
        from: "no-reply@test-app.com",
    },
};

exports.hexes = {
    ZERO_HASH:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
    LARGE_VALUE:
        "0x8000000000000000000000000000000000000000000000000000000000000000",
};

exports.getlogs = {
    CHUNK_SIZE_HARD_CAP: 4000,
    TARGET_LOGS_PER_CHUNK: 500,
};

exports.config56 = {
    TOKENS: {
        LZ: "0x3B78458981eB7260d1f781cb8be2CaAC7027DbE2",
    },
    dppAddress: "0xd9CAc3D964327e47399aebd8e1e6dCC4c251DaAE",
    dspAddress: "0x0fb9815938Ad069Bf90E14FE6C596c514BEDe767",
    dvmAddress: "0x790B4A80Fb1094589A3c0eFC8740aA9b0C1733fB",
    factories: [
        "0x9a7b42f2cC543ab1bcFEB2b9F8b9cB8CC0F38E5F",
        "0x45F19b5aBA58D83CF09923b7C861Be19bDe752A1",
    ],
};

exports.config42161 = {
    TOKENS: {
        LZ: "0x3B78458981eB7260d1f781cb8be2CaAC7027DbE2",
    },
    dppAddress: "0xa6Cf3d163358aF376ec5e8B7Cc5e102a05FdE63D",
    dspAddress: "0xC8fE2440744dcd733246a4dB14093664DEFD5A53",
    dvmAddress: "0xDa4c4411c55B0785e501332354A036c04833B72b",
    factories: [
        "0xb929e83EDFC042D7c0BBEfBe99adBb7FDaBe27D5",
        "0xd553810a1AF6E27043c19cF5d67f3Cf4178D83fB",
    ],
};

exports.config10 = {
    TOKENS: {
        LZ: "0x3B78458981eB7260d1f781cb8be2CaAC7027DbE2",
    },
    dppAddress: "0xDb9C53F2cED34875685B607c97A61a65DA2F30a8",
    dspAddress: "0x1f83858cD6d0ae7a08aB1FD977C06DABEcE6d711",
    dvmAddress: "0x2B800DC6270726F7E2266cE8cD5A3F8436fe0B40",
    factories: [
        "0xe5Da6e7762de4fA52816B22F57077e2D440eC262",
        '0x91d983791EAa1C6d9cDdBa155ccf0c7daAe62b8f',
    ],
};

exports.getDodo = {
    dppIface: [
        "event NewDPP(address baseToken,address quoteToken,address creator,address dpp)",
    ],

    dspIface: [
        "event NewDSP(address baseToken,address quoteToken,address creator,address dsp)",
    ],

    dvmIface: [
        "event NewDVM(address baseToken,address quoteToken,address creator,address dvm)",
    ],
    swappedIface: [
        "event Swapped(address indexed sender,address indexed srcToken,address indexed dstToken,address dstReceiver,uint256 amount,uint256 spentAmount,uint256 returnAmount,uint256 minReturnAmount,address referral)",
    ],
    dppTopic:
        "0x8494fe594cd5087021d4b11758a2bbc7be28a430e94f2b268d668e5991ed3b8a",
    dspTopic:
        "0xbc1083a2c1c5ef31e13fb436953d22b47880cf7db279c2c5666b16083afd6b9d",
    dvmTopic:
        "0xaf5c5f12a80fc937520df6fcaed66262a4cc775e0f3fceaf7a7cfe476d9a751d",
}

