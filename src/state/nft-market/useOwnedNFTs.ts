import { gql, useQuery } from "@apollo/client";
import useSigner from "state/signer";
import { GetOwnedNFTs, GetOwnedNFTsVariables} from "./__generated__/GetOwnedNFTs";
import { getRawNFTs } from "./helper";

const useOwnedNFTs = ()=>{
  const {address} = useSigner();

  const {data} = useQuery<GetOwnedNFTs,GetOwnedNFTsVariables>(
    GET_OWNED_NFT,{
      variables:{
        owner:address ?? ""
      }, skip: !address
    }
  )
  const ownedNFTs = data?.nfts.map(getRawNFTs)

  return {ownedNFTs}
}

const GET_OWNED_NFT = gql`
query GetOwnedNFTs($owner:String!){
  nfts(where:{to:$owner}) {
    id
    from
    to
    tokenURI
    price
  }
}
`
export default useOwnedNFTs