import AddressAvatar from "./AddressAvatar";
import useSigner from "state/signer";

const ConnectButton = () => {
  const {address,loading,connectWallet}=useSigner();
  if (address) return <AddressAvatar address={address} />;
  return (
    <button
      className="flex h-10 w-36 items-center justify-center rounded-full bg-blue-500 px-4 font-semibold text-white"
      onClick={connectWallet}
      disabled={loading}
    >
      {loading ? "busy..." : "Connect wallet"}
    </button>
  );
};

export default ConnectButton;
