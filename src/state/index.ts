import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, ethers } from "ethers";
import { CreationValues } from "modules/CreationPage/CreationForm";
import useSigner from "state/signer";
import NFT_MARKET from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json"
import useOwnedListedNFTs from "./nft-market/useOwnedListedNFTs";
import useOwnedNFTs from "./nft-market/useOwnedNFTs"
import { CONTRACT_ADDRESS } from "./nft-market/config";
import useListedNFTs from "./nft-market/useListedNFTs";
import { NFT } from "./nft-market/interfaces";

const useNFTMarket = ()=>{
  const {signer} = useSigner()
  const nftMarket = new Contract(CONTRACT_ADDRESS,NFT_MARKET.abi,signer) 
  const ownedNFTs = useOwnedNFTs()
  const ownedListedNFTs = useOwnedListedNFTs()
  const listedNFTs = useListedNFTs() 

  const createNFT = async(values:CreationValues)=>{
    try {
      const data = new FormData() 
      data.append('name',values.name)
      data.append('description',values.description)
      data.append('image',values.image!)

      const response = await fetch("/api/nft-storage",{
        method:"POST",
        body:data,
      })

      if(response.status == 201){
        const json = await response.json()
        // console.log('name',typeof(values.name))
        console.log("tokenUri:",json.uri)
        console.log("address:",CONTRACT_ADDRESS)
        // call function on sc
        const transaction:TransactionResponse = await nftMarket.createNFT(json.uri)
        await transaction.wait()
      }
    } catch (e) {
      console.log(e)
    }
  }

  const listNFT =async (tokenId:string,price:BigNumber) => {
    try {
      const transaction:TransactionResponse = await nftMarket.listingNFT(tokenId,price)
      await transaction.wait()
    } catch (e) {
      console.log(e)
    }
  }
  const cancelListing =async (tokenId:string) => {
    try {
      const transaction:TransactionResponse = await nftMarket.cancelListing(tokenId)
      await transaction.wait()
    } catch (e) {
      console.log(e)
    }
  }
  const buyNFT =async (nft:NFT) => {
    try {
      const transaction:TransactionResponse = await nftMarket.buyNFT(nft.id,{value:ethers.utils.parseEther(nft.price)})
      await transaction.wait()
    } catch (e) {
      console.log(e)
    }
  }
  
  return {createNFT,listNFT,cancelListing,buyNFT,...ownedNFTs,...ownedListedNFTs,...listedNFTs}
} 

export default useNFTMarket