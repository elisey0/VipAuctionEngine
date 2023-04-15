import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { Contract, providers, ethers } from "ethers";
import { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import { CONTRACT_ADDRESS, abi } from "@/constants";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [nfts, setNfts] = useState(0);
  const web3modalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3modalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 97) {
      window.alert("Please connect to the BNBchain Testnet");
    }
    if (needSigner) {
      const signer = await web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const safeMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(CONTRACT_ADDRESS, abi, signer);
      await nftContract.safeMint(signer.getAddress(), {
        value: ethers.utils.parseEther("0.001"),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getNFTs = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(CONTRACT_ADDRESS, abi, signer);
      const nftBalance = Number(
        await nftContract.balanceOf(await signer.getAddress())
      );

      setNfts(nftBalance);
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      return (
        <div>
          <h4>You can mint NFT</h4>
          <button className={styles.button} onClick={safeMint}>
            Mint
          </button>
        </div>
      );
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3modalRef.current = new Web3Modal({
        network: 97,
        providerOptions: {},
        disableInjectedProviders: false,
      });
      connectWallet();
      getNFTs();
    }
  }, [walletConnected]);
}
