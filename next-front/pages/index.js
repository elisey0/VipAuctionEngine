import React, { Component } from "react";
import { ethers } from "ethers";

import { ConnectWallet } from "../components/ConnectWallet";
import { WaitingForTransactionMessage } from "../components/WaitingForTransactionMessage";
import { TransactionErrorMessage } from "../components/TransactionErrorMessage";

import auctionAddress from "../contracts/VipAuctionEngine-contract-address.json";
import auctionArtifact from "../contracts/VipAuctionEngine.json";

const HARDHAT_NETWORK_ID = "1337";
const BSCT_NETWORK_ID = "97";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export default class extends Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAccount: null,
      txBeingSent: null,
      networkError: null,
      transactionError: null,
      balance: null,
      auctionsLength: 0,
      auctions: [
        {
          id: 0,
          item: "",
          ticketsSupply: 0,
          minBid: 0,
          ticket: "",
          revenueAddress: "",
          startAt: "",
          endsAt: "",
          ended: false,
        },
      ],
    };

    this.state = this.initialState;
  }

  _connectWallet = async () => {
    if (window.ethereum === undefined) {
      this.setState({
        networkError: "Please install Metamask!",
      });
      return;
    }

    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    window.ethereum.on("chainChanged", ([networkId]) => {
      this._resetState();
    });
  };

  async _initialize(selectedAddress) {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._auction = new ethers.Contract(
      auctionAddress.VipAuctionEngine,
      auctionArtifact.abi,
      this._provider.getSigner(0)
    );

    this.setState(
      {
        selectedAccount: selectedAddress,
      },
      async () => {
        await this.updateBalance();
        await this.getAuctionsLength();
      }
    );

    // // this.startingPrice = await this._auction.startingPrice();
    // // this.startAt = await this._auction.startAt();
    // // this.discountRate = await this._auction.discountRate();
    // this.auctionInfo = await this._auction.auctions(index);

    // this.checkAuctions = setInterval((index) => {
    //   console.log(auctionInfo);

    //   this.setState((state) => {
    //     auctions[index] = [
    //       {
    //         item: "",
    //         ticketsSupply: 0,
    //         minBid: 0,
    //         ticket: "",
    //         revenueAddress: "",
    //         startAt: "",
    //         endAt: "",
    //         ended: false,
    //       },
    //     ];
    //   });
    // }, 10000);
  }
  // const startBlockNumber = await this._provider.getBlockNumber()
  // this._auction.on('Bought', (...args) => {
  //   const event = args[args.length - 1]
  //   if(event.blockNumber <= startBlockNumber) return

  //   args[0], args[1]
  // })

  async updateBalance() {
    const newBalance = (
      await this._provider.getBalance(this.state.selectedAccount)
    ).toString();

    this.setState({
      balance: newBalance,
    });
  }

  _resetState() {
    this.setState(this.initialState);
  }

  _checkNetwork() {
    if (
      window.ethereum.networkVersion === HARDHAT_NETWORK_ID ||
      window.ethereum.networkVersion === BSCT_NETWORK_ID
    ) {
      return true;
    }

    this.setState({
      networkError: "Please connect to localhost:8545",
    });

    return false;
  }

  _dismissNetworkError = () => {
    this.setState({
      networkError: null,
    });
  };

  _dismissTransactionError = () => {
    this.setState({
      transactionError: null,
    });
  };

  getAuctionsLength = async () => {
    const auctionsLength = await this._auction.getAuctionsLength();

    this.setState({
      auctionsLength: auctionsLength.toNumber(),
    });

    return auctionsLength.toNumber();
  };

  getAuctionById = async (index) => {
    const auctionInfo = await this._auction.auctions(index);

    this.setState({
      auctions: [
        {
          id: index,
          item: auctionInfo.item,
          ticketsSupply: auctionInfo.ticketsSupply.toNumber(),
          minBid: ethers.utils.formatEther(auctionInfo.minBid.toNumber()),
          ticket: auctionInfo.ticket,
          revenueAddress: auctionInfo.revenueAddress,
          startAt: auctionInfo.startAt.toNumber(),
          endsAt: auctionInfo.endsAt.toNumber(),
          ended: auctionInfo.ended,
        },
      ],
    });
  };

  fillAuctions = async () => {
    var ul = document.createElement("ul");

    document.getElementById("auctionsList").appendChild(ul);
    for (let i = 0; i < this.state.auctionsLength; i++) {
      console.log(this.state.auctionsLength);
      await this.getAuctionById(i);
      var li = document.createElement("li");
      ul.appendChild(li);
      console.log(this.state.auctions[i].item);
      li.innerHTML = li.innerHTML + state.auctions[i].item;
    }
  };

  createAuction = async () => {
    //console.log((ethers.utils.parseEther(this.state.currentPrice + 1)).toString())
    console.log(document.getElementById("_item").value);
    try {
      const tx = await this._auction.createAuction(
        document.getElementById("_item").value,
        document.getElementById("_ticketsSupply").value,
        ethers.utils.parseUnits(
          document.getElementById("_minBid").value,
          "ether"
        ),
        document.getElementById("_revenueAddress").value,
        document.getElementById("_duration").value
      );

      this.setState({
        txBeingSent: tx.hash,
      });

      await tx.wait();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);

      this.setState({
        transactionError: error,
      });
    } finally {
      this.setState({
        txBeingSent: null,
      });
      await this.updateBalance();
      //await this.updateStopped();
    }
  };

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  render() {
    if (!this.state.selectedAccount) {
      return (
        <ConnectWallet
          connectWallet={this._connectWallet}
          networkError={this.state.networkError}
          dismiss={this._dismissNetworkError}
        />
      );
    }

    return (
      <>
        <script src="../components/script.js"></script>
        {this.state.txBeingSent && (
          <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
        )}

        {this.state.transactionError && (
          <TransactionErrorMessage
            message={this._getRpcErrorMessage(this.state.transactionError)}
            dismiss={this._dismissTransactionError}
          />
        )}
        {this.state.balance && (
          <p>
            Your balance: {ethers.utils.formatEther(this.state.balance)} ETH
          </p>
        )}
        <div>
          <h3>ДОБРО ПОЖАЛОВАТЬ НА НАШУ ПЛАТФОРМУ VIP АУКЦИОНОВ</h3>
          <p className="mainText">
            <b>Правила аукциона:</b> подавайте ставки до истечения времени. По
            завершению аукциона, определяются победители(по количеству лотов) -
            участники подавшие наибольшие ставки. Ранжирование - от наивысшей
            ставки к наименьшей. Победители получают NFT-билеты.
          </p>
          <br />
          <div>
            <b>АДМИН ПАНЕЛЬ:</b>
            <br />
            <div class="formWrapper">
              <ul>
                <li class="formLine">
                  <label for="item"> Наименование лота</label>
                  <input type="text" id="_item" />
                </li>
                <li class="formLine">
                  <label for="_ticketsSupply"> Количество лотов</label>
                  <input type="text" id="_ticketsSupply" />
                </li>
                <li class="formLine">
                  <label for="_minBid"> Минимальная ставка(BNB)</label>
                  <input type="text" id="_minBid" />
                </li>
                <li class="formLine">
                  <label for="_revenueAddress"> Адрес дохода</label>
                  <input type="text" id="_revenueAddress" />
                </li>
                <li class="formLine">
                  <label for="_duration"> Длительность аукциона</label>
                  <input type="text" id="_duration" />
                </li>
                <li class="formLine">
                  <button onClick={this.createAuction}>
                    Создать и начать аукцион
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <div>
            <button onClick={this.getAuctionsLength}>
              Обновить количество аукционов
            </button>
            {this.state.auctionsLength && (
              <p>Уже провели: {this.state.auctionsLength}</p>
            )}
          </div>
          <div>
            <b>ТЕКУЩИЕ АУКЦИОНЫ:</b>
            <button onClick={this.fillAuctions}>Обновить аукционы</button>
            <div id="auctionsList"></div>
          </div>
          <br />
          <br />
          <div>
            <b>ПРОШЕДШИЕ АУКЦИОНЫ:</b>
          </div>
        </div>
      </>
    );
  }
}
