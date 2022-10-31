import { ethers } from "ethers";
import {GetOwnedNFTs_nfts} from "./__generated__/GetOwnedNFTs"
import { NFT } from "./interfaces";

export const getRawNFTs = (raw:GetOwnedNFTs_nfts):NFT => {
  return {
    id:raw.id,
    owner: raw.price == "0" ? raw.to : raw.from,
    price: raw.price == "0"? "0": ethers.utils.formatEther(raw.price),
    tokenURI: raw.tokenURI
  }
}