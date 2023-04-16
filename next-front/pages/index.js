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
      auctions: [],
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
        await this.fillAuctions();
      }
    );

    this.checkAuctions = setInterval(() => {
      //console.log(this.state.auctions);
      this.fillAuctions();
    }, 1000);
  }

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
      networkError: "Please connect to localhost:8545 or BNBT",
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
    const biddersInfo = await this._auction.getWinnersAndOtherParticipants(
      index
    );
    console.log(biddersInfo.winners);
    var newAuctions = this.state.auctions;
    const newAuction = newAuctions.find((auction) => auction.id === index);
    if (newAuction != undefined) {
      newAuction.minBid = ethers.utils.formatEther(auctionInfo.minBid);
      newAuction.ended = auctionInfo.ended;
      newAuction.winners = biddersInfo.winners;
      newAuction.otherParticipants = biddersInfo.otherParticipants;
    } else {
      newAuctions = [
        ...this.state.auctions.slice(0, index),
        {
          id: index,
          item: auctionInfo.item,
          ticketsSupply: auctionInfo.ticketsSupply.toNumber(),
          minBid: 0,
          ticket: auctionInfo.ticket,
          revenueAddress: auctionInfo.revenueAddress,
          winners: biddersInfo.winners,
          otherParticipants: biddersInfo.otherParticipants,
          startAt: auctionInfo.startAt.toNumber(),
          endsAt: auctionInfo.endsAt.toNumber(),
          ended: auctionInfo.ended,
        },
        ...this.state.auctions.slice(index),
      ];
    }
    this.setState({
      auctions: newAuctions,
    });
  };

  fillAuctions = async () => {
    for (let i = 0; i < this.state.auctionsLength; i++) {
      await this.getAuctionById(i);
    }
  };

  bid = async (index) => {
    try {
      const tx = await this._auction.bid(index, {
        value: ethers.utils.parseUnits(
          document.getElementById("bid_" + index).value,
          "ether"
        ),
      });

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
      await this.fillAuctions();
    }
  };

  endAuction = async (index) => {
    try {
      const tx = await this._auction.endAuction(index);

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
      await this.fillAuctions();
    }
  };

  createAuction = async () => {
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
      await this.getAuctionsLength();
      await this.fillAuctions();
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
            Your balance: {ethers.utils.formatEther(this.state.balance)} BNB
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
            <div className="formWrapper">
              <ul>
                <li className="formLine">
                  <label for="item"> Наименование лота</label>
                  <input type="text" id="_item" />
                </li>
                <li className="formLine">
                  <label for="_ticketsSupply"> Количество лотов</label>
                  <input type="text" id="_ticketsSupply" />
                </li>
                <li className="formLine">
                  <label for="_minBid"> Минимальная ставка(BNB)</label>
                  <input type="text" id="_minBid" />
                </li>
                <li className="formLine">
                  <label for="_revenueAddress"> Адрес дохода</label>
                  <input type="text" id="_revenueAddress" />
                </li>
                <li className="formLine">
                  <label for="_duration"> Длительность аукциона</label>
                  <input type="text" id="_duration" />
                </li>
                <li className="formLine">
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
              <p>Мы уже провели: {this.state.auctionsLength}</p>
            )}
          </div>
          <div>
            <b>ТЕКУЩИЕ АУКЦИОНЫ:</b>
            <button onClick={this.fillAuctions}>Обновить аукционы</button>
            {this.state.auctions.map((auction) =>
              auction.ended ? (
                false
              ) : (
                <>
                  <li key={auction.id}>
                    {" "}
                    <b>Аукцион -</b> {auction.id}
                    <ul>
                      <li>
                        <b>Лот: </b> {auction.item}
                      </li>
                      <li>
                        <b>Кол-во лотов: </b>
                        {auction.ticketsSupply}
                      </li>
                      <li>
                        <b>Текущая минимальная ставка: </b>
                        {auction.minBid} BNB
                        <button onClick={() => this.bid(auction.id)}>
                          {" "}
                          Поставить свою ставку
                        </button>
                        <input type="text" id={"bid_" + auction.id} />
                      </li>
                      <li>
                        <b>Контракт лота: </b>{" "}
                        <a
                          href={
                            "https://testnet.bscscan.com/address/" +
                            auction.ticket
                          }
                        >
                          {auction.ticket}
                        </a>
                      </li>
                      <li>
                        <b>Адрес дохода: </b>{" "}
                        <a
                          href={
                            "https://testnet.bscscan.com/address/" +
                            auction.revenueAddress
                          }
                        >
                          {auction.revenueAddress}
                        </a>
                      </li>
                      <li>
                        <b>Аукцион начали: </b>
                        {new Date(auction.startAt * 1000).toLocaleString()}
                      </li>
                      <li>
                        <b>Аукцион закончится не раньше: </b>
                        {new Date(auction.endsAt * 1000).toLocaleString()}
                        <button onClick={() => this.endAuction(auction.id)}>
                          {" "}
                          Закончить аукцион
                        </button>
                      </li>
                      <li>
                        <b>Претенденты на победу:</b>

                        {auction.winners.map((winner, i) => (
                          <>
                            <p>
                              {i}-{winner[0]}-
                              {ethers.utils.formatEther(winner.bid)}BNB
                            </p>
                          </>
                        ))}
                      </li>
                      <li>
                        <b>Остальные участники:</b>

                        {auction.otherParticipants.map((participant, i) => (
                          <>
                            <p>
                              {i}-{participant[0]}-
                              {ethers.utils.formatEther(participant.bid)}BNB
                            </p>
                          </>
                        ))}
                      </li>
                    </ul>
                    <br />
                  </li>
                </>
              )
            )}
          </div>
          <br />
          <br />
          <div>
            <b>ПРОШЕДШИЕ АУКЦИОНЫ:</b>
            {this.state.auctions.map((auction) =>
              !auction.ended ? (
                false
              ) : (
                <>
                  <li key={auction.id}>
                    {" "}
                    <b>Аукцион -</b> {auction.id}
                    <ul>
                      <li>
                        <b>Лот: </b> {auction.item}
                      </li>
                      <li>
                        <b>Кол-во лотов: </b>
                        {auction.ticketsSupply}
                      </li>
                      <li>
                        <b>Минимальная ставка за которую получили лот: </b>
                        {auction.minBid} BNB
                      </li>
                      <li>
                        <b>Контракт лота: </b>{" "}
                        <a
                          href={
                            "https://testnet.bscscan.com/address/" +
                            auction.ticket
                          }
                        >
                          {auction.ticket}
                        </a>
                      </li>
                      <li>
                        <b>Адрес дохода: </b>{" "}
                        <a
                          href={
                            "https://testnet.bscscan.com/address/" +
                            auction.revenueAddress
                          }
                        >
                          {auction.revenueAddress}
                        </a>
                      </li>
                      <li>
                        <b>Аукцион начали: </b>
                        {new Date(auction.startAt * 1000).toLocaleString()}
                      </li>
                      <li>
                        <b>Аукцион закончился не раньше: </b>
                        {new Date(auction.endsAt * 1000).toLocaleString()}
                      </li>
                      <li>
                        <b>Победители:</b>

                        {auction.winners.map((winner, i) => (
                          <>
                            <p>
                              {i}-{winner[0]}-
                              {ethers.utils.formatEther(winner.bid)}BNB
                            </p>
                          </>
                        ))}
                      </li>
                      <li>
                        <b>Остальные участники:</b>

                        {auction.otherParticipants.map((participant, i) => (
                          <>
                            <p>
                              {i}-{participant[0]}-
                              {ethers.utils.formatEther(participant.bid)}BNB
                            </p>
                          </>
                        ))}
                      </li>
                    </ul>
                    <br />
                  </li>
                </>
              )
            )}
          </div>
        </div>
      </>
    );
  }
}
