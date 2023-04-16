// SPDX-License-Identifier: MIT
// указываем версию Solidity, которую мы будем использовать
pragma solidity ^0.8.0;

import "./Ticket.sol";

// создаем контракт
contract VipAuctionEngine {
    // адрес владельца контракта (адрес кошелька, на который будут поступать средства от продажи билетов)
    address public owner;
    uint constant DURATION = 1 days; // 1 день стандартное время аукциона
    uint constant MIN_BID = 10 ** 15; // 0.001 BNB
    uint constant COMMISSION = 10; // 10% за организацию аукциона

    // структура для хранения информации об участнике аукциона
    struct Bidder {
        address bidderAddress;
        uint256 bid;
        uint timestamp;
    }

    struct Auction {
        string item; // Наименование лота
        uint ticketsSupply; // Количество лотов
        uint minBid; // Минимальная ставка
        address ticket; // Адрес контракта нфт лота
        address revenueAddress; // Адрес дохода - куда идут с редства с продажи лотов (-10% комиссия)
        Bidder[] winners; // Массив для хранения победителей аукциона
        Bidder[] otherParticipants; // Массив для хранения участников аукциона
        uint startAt; // Время начала аукциона
        uint endsAt; // Время оканчания аукциона
        bool ended; // Окончился ли аукцион
    }

    Auction[] public auctions;
    event BidAdded(
        uint indexed index,
        address bidderAddress,
        uint bid,
        Bidder[] winners,
        Bidder[] otherParticipants
    );
    event AuctionCreated(
        uint indexed index,
        string itemName,
        uint minBid,
        uint duration
    );

    // событие для уведомления об окончании аукциона и распределении билетов
    event AuctionEnded(
        uint indexed index,
        uint endPrice,
        Bidder[] winners,
        Bidder[] otherParticipants
    );

    // конструктор контракта
    constructor() {
        owner = msg.sender;
    }

    modifier onlyDuringAuction(uint index) {
        require(
            block.timestamp < auctions[index].endsAt && !auctions[index].ended,
            "Auction is not currently open or finished"
        );
        _;
    }

    modifier onlyAfterAuction(uint index) {
        require(
            block.timestamp >= auctions[index].endsAt && !auctions[index].ended,
            "Auction is still open or ended"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // функция для начала аукциона
    function createAuction(
        string calldata _item,
        uint _ticketsSupply,
        uint _minBid,
        address _revenueAddress,
        uint _duration
    ) external onlyOwner {
        uint ticketsSupply = _ticketsSupply == 0 ? 3 : _ticketsSupply;
        uint minBid = _minBid == 0 ? MIN_BID : _minBid;
        address revenueAddress = _revenueAddress == address(0)
            ? owner
            : _revenueAddress;
        uint duration = _duration == 0 ? DURATION : _duration;
        require(minBid >= MIN_BID, "Min bid for auction creation is 0.001 BNB");

        Auction storage auction = auctions.push();
        auction.item = _item;
        auction.ticketsSupply = ticketsSupply;
        auction.minBid = minBid;
        Ticket ticketContract = new Ticket(_item, ticketsSupply);
        auction.ticket = address(ticketContract);
        auction.revenueAddress = revenueAddress;
        auction.startAt = block.timestamp; // now
        auction.endsAt = block.timestamp + duration;

        emit AuctionCreated(auctions.length - 1, _item, minBid, duration);
    }

    // функция для участия в аукционе
    function bid(uint index) external payable onlyDuringAuction(index) {
        require(msg.value >= auctions[index].minBid, "Bid amount is too low");

        uint winnersLength = auctions[index].ticketsSupply;
        //Пока есть свободные места добавлять участников не поднимая ставку
        if (auctions[index].winners.length < winnersLength) {
            auctions[index].winners.push(
                Bidder(payable(msg.sender), msg.value, block.timestamp)
            );
            //Когда занято последнее место изминить минимальную ставку
            if (auctions[index].winners.length == winnersLength) {
                setMinBidForAuction(index);
            }
        } else {
            // Иначе найти минимальную и позднюю ставку и заменить текущей
            Bidder memory lowestBidder = Bidder(
                payable(address(0)),
                2 ** 256 - 1,
                0
            );
            uint lowestBidId = 0;
            for (uint i = 0; i < winnersLength; i++) {
                uint iBid = auctions[index].winners[i].bid;
                uint iTimestamp = auctions[index].winners[i].timestamp;
                if (
                    iBid < lowestBidder.bid ||
                    (iBid <= lowestBidder.bid &&
                        iTimestamp > lowestBidder.timestamp)
                ) {
                    lowestBidder = Bidder(
                        auctions[index].winners[i].bidderAddress,
                        iBid,
                        iTimestamp
                    );
                    lowestBidId = i;
                }
            }
            auctions[index].winners[lowestBidId] = Bidder(
                payable(msg.sender),
                msg.value,
                block.timestamp
            );
            auctions[index].otherParticipants.push(lowestBidder);
            setMinBidForAuction(index);
        }
        emit BidAdded(
            index,
            msg.sender,
            msg.value,
            auctions[index].winners,
            auctions[index].otherParticipants
        );
    }

    // функция для окончания аукциона и распределения билетов
    function endAuction(uint index) public onlyAfterAuction(index) {
        //require(auctions[index].winners.length < auctions[index].ticketsSupply, "Not all winners have been identified");

        // отправляем билеты на адрес победителей и их ставки владельцу контракта
        // здесь можно использовать NFT-стандарт (например, ERC-721), чтобы создать уникальные билеты
        uint auctionBids;
        for (uint i = 0; i < auctions[index].winners.length; i++) {
            Ticket(auctions[index].ticket).safeMint(
                auctions[index].winners[i].bidderAddress
            );
            auctionBids += auctions[index].winners[i].bid;
        }
        payable(auctions[index].revenueAddress).transfer(
            (auctionBids * (100 - COMMISSION)) / 100
        );
        payable(owner).transfer((auctionBids * COMMISSION) / 100);

        // возвращаем средства остальным участникам аукциона
        for (uint i = 0; i < auctions[index].otherParticipants.length; i++) {
            payable(auctions[index].otherParticipants[i].bidderAddress)
                .transfer(auctions[index].otherParticipants[i].bid);
        }

        auctions[index].ended = true;
        emit AuctionEnded(
            index,
            auctions[index].minBid,
            auctions[index].winners,
            auctions[index].otherParticipants
        );
    }

    // Функции для вывода информации об аукционах
    function getAuctionsLength() public view returns (uint) {
        return auctions.length;
    }

    function getWinnersAndOtherParticipants(
        uint index
    )
        public
        view
        returns (Bidder[] memory winners, Bidder[] memory otherParticipants)
    {
        uint winnersLength = auctions[index].winners.length;
        uint otherParticipantsLength = auctions[index].otherParticipants.length;
        winners = new Bidder[](winnersLength);
        otherParticipants = new Bidder[](otherParticipantsLength);
        for (uint i = 0; i < winnersLength; i++) {
            winners[i] = auctions[index].winners[i];
        }
        for (uint i = 0; i < otherParticipantsLength; i++) {
            otherParticipants[i] = auctions[index].otherParticipants[i];
        }
        return (winners, otherParticipants);
    }

    // Функция для нахождения текущей минимальной ставки и прибавления 1 finney
    function setMinBidForAuction(uint index) private {
        uint256 minimumBid = 2 ** 256 - 1;
        for (uint i = 0; i < auctions[index].winners.length; i++) {
            uint iBid = auctions[index].winners[i].bid;
            if (iBid < minimumBid) {
                minimumBid = iBid;
            }
        }
        auctions[index].minBid = minimumBid + 10 ** 15;
    }
}
