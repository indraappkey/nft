import NFTCard from "components/NFTCard";
import useNFTMarket from "state";

const OwnedPage = () => {
  const {ownedNFTs,ownedListedNFTs} = useNFTMarket();
  console.log("owned NFT: ", ownedNFTs)
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-wrap">
        {ownedNFTs?.map(nft => <NFTCard nft={nft} className="mr-5 mb-5" key={nft.id}/>)}
      </div>
      {ownedListedNFTs && ownedListedNFTs.length > 0 &&
        <>
          <div className="relative my-2 h-[1px] w-full flex-shrink-0 bg-black">
            <div className="absolute right-1/2 bottom-1/2 translate-x-1/2 translate-y-1/2 transform bg-white px-2">
              LISTED
            </div>
          </div>
          <div className="flex flex-wrap">
            {ownedListedNFTs?.map(nft => <NFTCard nft={nft} className="mr-5 mb-5" key={nft.id}/>)}
          </div>
        </>
      }
      
    </div>
  );
};

export default OwnedPage;
