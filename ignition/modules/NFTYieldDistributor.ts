import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTYieldDistributorModule = buildModule("NFTYieldDistributorModule", (m) => {
    const rewardToken = m.getParameter("rewardToken");
    const nftContract = m.getParameter("nftContract");
    const initialRate = m.getParameter("initialRate", "1000000000000000000"); // 1 token per second

    const distributor = m.contract("NFTYieldDistributor", [
        rewardToken,
        nftContract,
        initialRate
    ]);

    return { distributor };
});

export default NFTYieldDistributorModule;
