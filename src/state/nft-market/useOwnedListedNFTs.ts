import { gql, useQuery } from "@apollo/client";
import { CONTRACT_ADDRESS } from "./config";
import useSigner from "state/signer";
import { GetOwnedListedNFTs, GetOwnedListedNFTsVariables, } from "./__generated__/GetOwnedListedNFTs";
import { getRawNFTs } from "./helper";

const useOwnedListedNFTs = () => {
  const { address } = useSigner();

  const { data } = useQuery<GetOwnedListedNFTs, GetOwnedListedNFTsVariables>(
    GET_OWNED_LISTED_NFT, {
    variables: {
      owner: address ?? ""
    }, skip: !address
  }
  )
  const ownedListedNFTs = data?.nfts.map(getRawNFTs)

  return { ownedListedNFTs }
}

const GET_OWNED_LISTED_NFT = gql`
query GetOwnedListedNFTs($owner:String!){
  nfts(where:{from:$owner,to: "${CONTRACT_ADDRESS}",}) {
    id
    from
    to
    tokenURI
    price
  }
}
`
export default useOwnedListedNFTs