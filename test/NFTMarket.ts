// import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("NFTMarket",()=>{
  let nftMarket:Contract;
  let signers:SignerWithAddress[];

  before(async () => {
    // Deploy NFTMarket contract
    const NFTMarket = await ethers.getContractFactory("NFTMarket");
    nftMarket = await NFTMarket.deploy();
    await nftMarket.deployed();
    signers = await ethers.getSigners(); // get owner of the smartcontract
  });
  
  const createNFT = async (tokenURI:string)=>{
    const transaction = await nftMarket.createNFT(tokenURI);
    const receipt = await transaction.wait();

    // check if new created nft uri same like the uri that sent to nft function
    const tokenId =  receipt.events[0].args.tokenId; //get token id
    return tokenId;
  }

  const createAndListingNFT =  async(price:number)=>{
    const tokenId = await createNFT("some token uri");
    const transaction = await nftMarket.listingNFT(tokenId,price);
    await transaction.wait(); //wait untill the listing nft done
    return tokenId;
  }

  describe("createNFT",()=>{
    it("should create NFT with correct owner and tokenURI",async()=>{
      // call createNFT function 
      const tokenURI = "https://some-token.uri/";
      const transaction = await nftMarket.createNFT(tokenURI);
      const receipt = await transaction.wait();
      const tokenId= receipt.events[0].args.tokenId; 
      const mintedToken =  await nftMarket.tokenURI(tokenId); // get tokenURI of spesicic tokenId 
      expect (mintedToken).to.equal(tokenURI);

      //check the owner address  of nwely created nft same as signer address
      const ownerAddress = await nftMarket.ownerOf(tokenId); //get addrest of NFT creator
      const signerAddress = await signers[0].getAddress(); 
      expect(signerAddress).to.equal(ownerAddress);

      //check nft transfer event has correct args
      const args = await receipt.events[1].args;
      expect(args.tokenId).to.equal(tokenId);
      expect(args.from).to.equal(ethers.constants.AddressZero);
      expect(args.to).to.equal(ownerAddress);
      expect(args.tokenURI).to.equal(tokenURI);
      expect(args.price).to.equal(0);
    });
  });

  describe("listingNFT",()=>{
    const tokenURI = "https://some-token1.uri/";
    it("should revert if price is 0",async()=>{
      const tokenId = await createNFT(tokenURI);
      const transaction = nftMarket.listingNFT(tokenId,0); 
      await expect(transaction).to.revertedWith("NFTMarket: NFT Price must be greatter than 0");
    });

    it("should revert if not the owner",async()=>{
      const tokenId = await createNFT(tokenURI);
      const transaction = nftMarket.connect(signers[1]).listingNFT(tokenId,12);
      await expect(transaction).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
    });
    
    it("should list the token if all requirement are meet",async()=>{
      const price=8;
      const tokenId = await createNFT(tokenURI);
      const transaction = await nftMarket.listingNFT(tokenId,price);
      const reciept = await transaction.wait();
      // if list success the owner of nft should transfer from the owner into the contract address
      const ownerAddress = await nftMarket.ownerOf(tokenId);
      expect(ownerAddress).to.equal(nftMarket.address);

      // if the nftTranser args is correct
      const args = reciept.events[2].args;
      expect(args.tokenId).to.equal(tokenId);
      expect(args.from).to.equal(signers[0].address);
      expect(args.to).to.equal(nftMarket.address);
      expect(args.tokenURI).to.equal("");
      expect(args.price).to.equal(price);
      // console.log(args);
    });
  });

  describe("buyNft",() =>{
    it("should revert when nft not listed",async()=>{
      const transaction = nftMarket.buyNFT(9999);
      await expect(transaction).to.be.revertedWith("NFTMarket: NFT not listed");
    });

    it("should revert when buy price not same with nft price",async()=>{
      const tokenId = await createAndListingNFT(123);  
      const transaction = nftMarket.buyNFT(tokenId,{value:124});
      await expect(transaction).to.be.revertedWith("NFTMarket: incorrect NFT Price ");
    });

    it("should success buy nft if all requirement true",async()=>{
      // seller signer[0]
      // buyer signer[1]

      const price = 123;
      const sellerProfit = Math.floor((price*95)/100);
      // console.log(sellerProfit);
      const contractProfit = price - sellerProfit;
      const initialContractBalance = await nftMarket.provider.getBalance(nftMarket.address)
      // console.log(initialContractBalance);

      const tokenId = await createAndListingNFT(price);
      await new Promise((r)=>setTimeout(r,100));
      const oldSellerBalance =  await signers[0].getBalance();

      const transaction = await nftMarket.connect(signers[1]).buyNFT(tokenId,{value:price}); 
      const reciept = await transaction.wait();
      await new Promise((r)=>setTimeout(r,100));
      const newSellerBalance = await signers[0].getBalance();

      // it succecfull if
      // the seller got 95% of the price
      const sellerDiff = newSellerBalance.sub(oldSellerBalance);
      expect(sellerDiff).to.equal(sellerProfit);

      // the contract got 5% of the price
      const newContractBalnance = await nftMarket.provider.getBalance(nftMarket.address);
      const contractDiff = newContractBalnance.sub(initialContractBalance);  
      expect(contractDiff).to.equal(contractProfit);

      // the ownership transfered to the buyer address
      const ownerAddress = await nftMarket.ownerOf(tokenId);
      expect(ownerAddress).to.equal(signers[1].address);

      // the NFTTransfer args is correct
      const args = reciept.events[2].args;
      expect(args.tokenId).to.equal(tokenId);
      expect(args.from).to.equal(nftMarket.address);
      expect(args.to).to.equal(signers[1].address);
      expect(args.tokenURI).to.equal("");
      expect(args.price).to.equal(0);

    });

    describe("cancelListing",()=>{
      it("should revert if NFT is not listed",async()=>{
        const transaction = nftMarket.cancelListing(1111);
        await expect(transaction).to.be.revertedWith("NFTMarket: NFT not listed");
      });

      it("should revert if the canceller address is not the owner of nft",async () => {
        const tokenId = await createAndListingNFT(1);
        const transaction = nftMarket.connect(signers[1]).cancelListing(tokenId); 
        await expect(transaction).to.be.revertedWith("NFTMarket: you are not the owner");
      });

      it("should tranfer ownership to seller if NFTTransfer arg are correct", async ()=>{
        const tokenId = await createAndListingNFT(1);
        const transaction = await nftMarket.cancelListing(tokenId);
        const reciept = await transaction.wait();

        // check the ownership
        const ownerAddress = await nftMarket.ownerOf(tokenId);
        expect(ownerAddress).to.equal(signers[0].address);

        // check NFTTransfer arg are correct
        const args = reciept.events[2].args;
        expect(args.tokenId).to.equal(tokenId);
        expect(args.from).to.equal(nftMarket.address);
        expect(args.to).to.equal(signers[0].address);
        expect(args.tokenURI).to.equal("");
        expect(args.price).to.equal(0);


      });

      describe("withdraw",()=>{
        it("should revert if the withdrawal user address is not the owner of smartcontract",async()=>{
          const transaction = nftMarket.connect(signers[1]).withdraw();
          await expect(transaction).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should withdraw if balance of contract is not 0",async()=>{
          const contractBalance = await nftMarket.provider.getBalance(nftMarket.address);
          const initialOwnerBalance = await signers[0].getBalance();
          const transaction = await nftMarket.withdraw();

          const signer = await transaction.wait();
          await new Promise((r)=>setTimeout(r,100));
          const newOwnerBalance = await signers[0].getBalance(); 

          const gasFee = signer.gasUsed.mul(signer.effectiveGasPrice);

          const transfered = newOwnerBalance.add(gasFee).sub(initialOwnerBalance);

          expect(transfered).to.equal(contractBalance);

        });

        it("should reverted if balance of contract is 0", async()=>{
          const balance = await nftMarket.provider.getBalance(nftMarket.address);
          console.log(balance);

          const transaction = nftMarket.withdraw();
          await expect(transaction).to.be.revertedWith("NFTMarket: the balance is 0");
        });
      });
    });

  });
});