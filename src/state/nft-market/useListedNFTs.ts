import { gql, useQuery } from "@apollo/client";
import { CONTRACT_ADDRESS } from "./config";
import useSigner from "state/signer";
import { GetOwnedListedNFTs, GetOwnedListedNFTsVariables, } from "./__generated__/GetOwnedListedNFTs";
import { getRawNFTs } from "./helper";
import { GetListedNFTs,GetListedNFTsVariables } from "./__generated__/GetListedNFTs";

const useListedNFTs = () => {
  const { address } = useSigner();

  const { data } = useQuery<GetListedNFTs, GetListedNFTsVariables>(
    GET_LISTED_NFT, {
    variables: {
      current_address: address ?? ""
    }, skip: !address
  }
  )
  const listedNFTs = data?.nfts.map(getRawNFTs)

  return { listedNFTs }
}

const GET_LISTED_NFT = gql`
query GetListedNFTs($current_address:String!){
  nfts(where:{to: "${CONTRACT_ADDRESS}",from_not:$current_address}) {
    id
    from
    to
    tokenURI
    price
  }
}
`
export default useListedNFTs