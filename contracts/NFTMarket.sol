// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct NFTListing{
  uint256 price;
  address seller;
}
contract NFTMarket is ERC721URIStorage,Ownable{
  using SafeMath for uint256;

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  mapping(uint256=>NFTListing) private _listings;

  constructor() ERC721("testing","testingNFT"){} 


  // if tokenURI is not empty => new nft was created
  // if price is not 0 => nft was listed
  // if price is not 0 && tokenURI is not empty => nft was transfered (either bought or canceled)
  event NFTTransfer(uint256 tokenId,address from,address to,string tokenURI,uint256 price);

  function createNFT(string calldata tokenURI) public {
    _tokenIds.increment();
    uint256 _currentIds = _tokenIds.current();
    _safeMint(msg.sender, _currentIds);
    _setTokenURI(_currentIds, tokenURI);
    emit NFTTransfer(_currentIds,address(0), msg.sender, tokenURI, 0);
  }

  //listing NFT
  function listingNFT(uint256 tokenId,uint256 price ) public {
    require(price>0,"NFTMarket: NFT Price must be greatter than 0"); //check the price
    // approve(address(this), tokenId); //approve the contract to be abble transfer the ownership of token
    transferFrom(msg.sender, address(this), tokenId); //transfer the ownership from owner to contract
    _listings[tokenId]=NFTListing(price,msg.sender);
    emit NFTTransfer(tokenId,msg.sender,address(this),"", price);
  }

  //buy NFT
  function buyNFT(uint256 tokenId) public payable{
    NFTListing memory listing = _listings[tokenId]; //get the list item on the listing

    // check 2 condition
    require(listing.price > 0, "NFTMarket: NFT not listed");  // the tokenId is availabel or listed
    require(msg.value == listing.price, "NFTMarket: incorrect NFT Price "); // the price sender same as nft price listed
    ERC721(address(this)).transferFrom(address(this), msg.sender, tokenId); // address this will be the address of the contract by default, so using ERC721 in front of transfer will change the address by the owner of the nft either the contract or some user address
    clearList(tokenId);

    //send 95% of bought price to seller and keep 5% at contract
    payable(listing.seller).transfer(listing.price.mul(95).div(100));
    emit NFTTransfer(tokenId,address(this),msg.sender,"", 0);
  }

  //cancel listingNFT
  function cancelListing(uint256 tokenId) public {
    NFTListing memory listing = _listings[tokenId]; //get the list item on the listing
    //check 2 conditions
    require(listing.price > 0, "NFTMarket: NFT not listed"); //the token that want to cancel is listed
    require(msg.sender == listing.seller,"NFTMarket: you are not the owner"); //the request address is the owner of the token
    ERC721(address(this)).transferFrom(address(this),msg.sender , tokenId); // transfer the nft from contract to owner address
    clearList(tokenId);
    emit NFTTransfer(tokenId,address(this),msg.sender,"", 0);
  }

  //function to withdraw from contract to our wallet
  function withdraw()public onlyOwner{
    uint256 balance = address(this).balance;
    require(balance>0,"NFTMarket: the balance is 0");
    payable(owner()).transfer(balance);
  }

  //clear the list after cancel listing
  function clearList(uint256 tokenId) private{
    _listings[tokenId].price = 0;
    _listings[tokenId].seller = address(0);
  }
  
}