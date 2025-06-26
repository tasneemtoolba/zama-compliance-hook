// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {Currency, CurrencyLibrary} from "v4-core/types/Currency.sol";
import {SwapParams, ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {PoolModifyLiquidityTest} from "v4-core/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";

import {ComplianceHook} from "../contracts/ComplianceHook.sol";
import {FHEVerifier} from "../contracts/FHEVerifier.sol";
import {UserRegistry} from "../contracts/UserRegistry.sol";

contract TestToken is ERC20 {
    address public owner;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        owner = msg.sender;
        _mint(msg.sender, 10000000 ether);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "TestToken: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(
            newOwner != address(0),
            "TestToken: new owner is the zero address"
        );
        owner = newOwner;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract DeployComplianceHook is Script, Deployers {
    // Addresses for Sepolia Base
    address constant POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant CREATE2_DEPLOYER =
        address(0x4e59b44847b379578588920cA78FbF26c0B4956C);
    address constant YEHIA = 0x17156c0cf9701b09114CB3619D9f3fD937caA3A8;
    address constant TASNEEEM = 0x02B085fAB53e19aA6Ba2Ba98da93db598976f95D;

    // Router addresses for Sepolia Base
    address constant UNIVERSAL_ROUTER =
        0x492E6456D9528771018DeB9E87ef7750EF184104;
    address constant POSITION_MANAGER =
        0x4B2C77d209D3405F41a037Ec6c77F7F5b8e2ca80;
    address constant STATE_VIEW = 0x571291b572ed32ce6751a2Cb2486EbEe8DEfB9B4;
    address constant QUOTER = 0x4A6513c898fe1B2d0E78d3b0e0A4a151589B1cBa;
    address constant POOL_SWAP_TEST =
        0x8B5bcC363ddE2614281aD875bad385E0A785D3B9;
    address constant POOL_MODIFY_LIQUIDITY_TEST =
        0x37429cD17Cb1454C34E7F50b09725202Fd533039;
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function setUp() public {
        // Set up the manager and router addresses for Deployers
    }

    function run() public {
        vm.startBroadcast();

        // Deploy FHE Verifier
        FHEVerifier fheVerifier = new FHEVerifier();
        console.log("FHE Verifier deployed at:", address(fheVerifier));

        // Deploy User Registry
        UserRegistry userRegistry = new UserRegistry();
        console.log("User Registry deployed at:", address(userRegistry));

        // Deploy two test tokens
        TestToken token0 = new TestToken("Compliance Token A", "CTA");
        TestToken token1 = new TestToken("Compliance Token B", "CTB");

        // Mint tokens to specified addresses before transferring ownership
        token0.mint(YEHIA, 1000 ether);
        token0.mint(TASNEEEM, 1000 ether);
        token0.mint(address(this), 1000 ether);
        token0.mint(address(1), 1000 ether);

        token1.mint(YEHIA, 1000 ether);
        token1.mint(TASNEEEM, 1000 ether);
        token1.mint(address(this), 1000 ether);
        token1.mint(address(1), 1000 ether);

        // Ensure token0 address is less than token1 for Uniswap ordering
        (address token0Addr, address token1Addr) = address(token0) <
            address(token1)
            ? (address(token0), address(token1))
            : (address(token1), address(token0));

        console.log("Token A deployed at:", address(token0));
        console.log("Token B deployed at:", address(token1));
        console.log("Token owner set to:", YEHIA);

        // Set flags for the hook functions we want
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);

        // Mine a salt that will produce a hook address with the correct flags
        bytes memory creationCode = type(ComplianceHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            POOL_MANAGER,
            address(fheVerifier),
            address(userRegistry)
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("Computed Hook Address:", hookAddress);

        // Cast to the hook type
        ComplianceHook hook = new ComplianceHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            fheVerifier,
            userRegistry
        );
        console.log("Deployed Hook Address:", address(hook));

        // Set up the manager and routers with the correct addresses
        manager = IPoolManager(POOL_MANAGER);
        modifyLiquidityRouter = PoolModifyLiquidityTest(
            POOL_MODIFY_LIQUIDITY_TEST
        );
        swapRouter = PoolSwapTest(POOL_SWAP_TEST);

        // Create and initialize pool
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(token0Addr),
            currency1: Currency.wrap(token1Addr),
            fee: 0x800000, // swapFee
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        // Approve tokens
        token0.approve(address(POOL_MANAGER), type(uint256).max);
        token1.approve(address(POOL_MANAGER), type(uint256).max);
        token0.approve(address(modifyLiquidityRouter), type(uint256).max);
        token1.approve(address(modifyLiquidityRouter), type(uint256).max);

        // Log pool ID
        console.log("Pool ID Below");
        console.logBytes32(PoolId.unwrap(PoolIdLibrary.toId(pool)));

        // Initialize pool and add liquidity
        IPoolManager(POOL_MANAGER).initialize(
            pool,
            4411237397794263893240602165248
        );

        // Create empty hookData
        bytes memory hookData = new bytes(0);

        modifyLiquidityRouter.modifyLiquidity(
            pool,
            ModifyLiquidityParams({
                tickLower: -6000,
                tickUpper: 6000,
                liquidityDelta: 0.0007 ether,
                salt: bytes32(0)
            }),
            hookData
        );

        // Set a sample rule for the pool (you can customize this)
        bytes32 sampleRuleId = keccak256(
            abi.encodePacked("SAMPLE_COMPLIANCE_RULE")
        );
        hook.setPoolRuleByKey(pool, sampleRuleId);
        console.log("Sample rule set for pool:", sampleRuleId);

        // Transfer token ownership
        token0.transferOwnership(YEHIA);
        token1.transferOwnership(YEHIA);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("FHE Verifier:", address(fheVerifier));
        console.log("User Registry:", address(userRegistry));
        console.log("Compliance Hook:", address(hook));
        console.log("Token A:", address(token0));
        console.log("Token B:", address(token1));
        console.log("Pool ID:", PoolId.unwrap(PoolIdLibrary.toId(pool)));
        console.log("Sample Rule ID:", sampleRuleId);
        console.log("========================\n");
    }
}
