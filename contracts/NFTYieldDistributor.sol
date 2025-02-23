// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTYieldDistributor is Ownable, Pausable {
    IERC20 public rewardToken;
    IERC721 public nftContract;
    
    uint256 public yieldRate; // tokens per second
    uint256 public lastUpdateTime;
    
    mapping(uint256 => uint256) public nftMultipliers; // NFT ID => multiplier
    mapping(uint256 => uint256) public lastClaimTime; // NFT ID => last claim timestamp
    mapping(uint256 => uint256) public bonusBalance; // NFT ID => bonus tokens
    
    event YieldRateUpdated(uint256 newRate);
    event MultiplierUpdated(uint256 indexed tokenId, uint256 multiplier);
    event BonusAdded(uint256 indexed tokenId, uint256 amount);
    event Claimed(uint256 indexed tokenId, uint256 amount);
    
    constructor(address _rewardToken, address _nftContract, uint256 _initialRate) {
        rewardToken = IERC20(_rewardToken);
        nftContract = IERC721(_nftContract);
        yieldRate = _initialRate;
        lastUpdateTime = block.timestamp;
    }
    
    function setYieldRate(uint256 _newRate) external onlyOwner {
        yieldRate = _newRate;
        emit YieldRateUpdated(_newRate);
    }
    
    function setNFTMultiplier(uint256 _tokenId, uint256 _multiplier) external onlyOwner {
        nftMultipliers[_tokenId] = _multiplier;
        emit MultiplierUpdated(_tokenId, _multiplier);
    }
    
    function addBonus(uint256 _tokenId, uint256 _amount) external onlyOwner {
        bonusBalance[_tokenId] += _amount;
        emit BonusAdded(_tokenId, _amount);
    }
    
    function calculatePendingYield(uint256 _tokenId) public view returns (uint256) {
        uint256 timePassed = block.timestamp - lastClaimTime[_tokenId];
        return (timePassed * yieldRate * nftMultipliers[_tokenId]) / 1e18;
    }
    
    function claim(uint256 _tokenId) external whenNotPaused {
        require(msg.sender == nftContract.ownerOf(_tokenId), "Not NFT owner");
        
        uint256 pending = calculatePendingYield(_tokenId);
        uint256 bonus = bonusBalance[_tokenId];
        uint256 total = pending + bonus;
        
        require(total > 0, "Nothing to claim");
        require(rewardToken.balanceOf(address(this)) >= total, "Insufficient rewards");
        
        lastClaimTime[_tokenId] = block.timestamp;
        bonusBalance[_tokenId] = 0;
        
        rewardToken.transfer(msg.sender, total);
        emit Claimed(_tokenId, total);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
