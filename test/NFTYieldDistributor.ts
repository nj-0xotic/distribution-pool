import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("NFTYieldDistributor", function () {
    let distributor: any;
    let rewardToken: any;
    let nftContract: any;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy mock contracts
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        rewardToken = await MockERC20.deploy();

        const MockNFT = await ethers.getContractFactory("MockNFT");
        nftContract = await MockNFT.deploy();

        // Deploy distributor
        const NFTYieldDistributor = await ethers.getContractFactory("NFTYieldDistributor");
        distributor = await NFTYieldDistributor.deploy(
            rewardToken.target,
            nftContract.target,
            ethers.parseEther("1") // 1 token per second
        );

        // Setup
        await rewardToken.mint(distributor.target, ethers.parseEther("1000000"));
        await nftContract.safeMint(user.address, 1);
    });

    describe("Admin functions", function () {
        it("Should set yield rate", async function () {
            await distributor.setYieldRate(ethers.parseEther("2"));
            expect(await distributor.yieldRate()).to.equal(ethers.parseEther("2"));
        });

        it("Should set NFT multiplier", async function () {
            await distributor.setNFTMultiplier(1, ethers.parseEther("2"));
            expect(await distributor.nftMultipliers(1)).to.equal(ethers.parseEther("2"));
        });

        it("Should add bonus", async function () {
            await distributor.addBonus(1, ethers.parseEther("100"));
            expect(await distributor.bonusBalance(1)).to.equal(ethers.parseEther("100"));
        });
    });

    describe("Claiming", function () {
        beforeEach(async function () {
            await distributor.setNFTMultiplier(1, ethers.parseEther("1"));
        });

        it("Should calculate correct pending yield", async function () {
            await time.increase(100);
            const pending = await distributor.calculatePendingYield(1);
            expect(pending).to.equal(ethers.parseEther("100"));
        });

        it("Should claim yield and bonus", async function () {
            await distributor.addBonus(1, ethers.parseEther("50"));
            await time.increase(100);

            await distributor.connect(user).claim(1);

            expect(await rewardToken.balanceOf(user.address))
                .to.equal(ethers.parseEther("150")); // 100 yield + 50 bonus
        });
    });

    describe("Pause functionality", function () {
        it("Should pause and unpause claiming", async function () {
            await distributor.pause();
            await expect(distributor.connect(user).claim(1)).to.be.reverted;

            await distributor.unpause();
            await expect(distributor.connect(user).claim(1)).not.to.be.reverted;
        });
    });
});
