// SPDX-License-Identifier: MIT
// указываем версию Solidity, которую мы будем использовать
pragma solidity ^0.8.0;

import "./Ticket.sol";

// создаем контракт
contract VipAuctionEngine {
    // адрес владельца контракта (адрес кошелька, на который будут поступать средства от продажи билетов)
    address public owner;
    //uint constant DURATION = 1 days; // 1 день стандартное время аукциона
    uint constant DURATION = 5 minutes; // 5 минут стандартное время аукциона
    //uint constant DURATION = 1; // 1 секунда для тестов стандартное время аукциона
    uint constant MIN_BID = 10**15; // 0.001 BNB

   // структура для хранения информации об участнике аукциона
    struct Bidder {
        address bidderAddress;
        uint256 bid;
        uint timestamp;
    }

    struct Auction {
        string item; // Наименование билета
        uint ticketsSupply; // Количество билетов
        Ticket ticket; // Контракт нфт билетов
        uint minBid; // Минимальная ставка
        Bidder[] winners;// массив для хранения победителей аукциона
        Bidder[] otherParticipants;// массив для хранения участников аукциона
        uint startAt; // Время начала аукциона
        uint endsAt; // Время оканчания аукциона
        bool ended; // Окончился ли аукцион
    }

    Auction[] public auctions;
    event BidAdded(uint indexed index, address bidderAddress, uint bid, Bidder[] winners, Bidder[] otherParticipants);
    event AuctionCreated(uint indexed index, string itemName, uint minBid, uint duration);
    
    // событие для уведомления об окончании аукциона и распределении билетов
    event AuctionEnded(uint indexed index, uint endPrice, Bidder[] winners, Bidder[] otherParticipants);

    // конструктор контракта
    constructor() {
        owner = msg.sender;
    }


    modifier onlyDuringAuction(uint index) {
        require(
        block.timestamp < auctions[index].endsAt && //для тестов это убраю
        !auctions[index].ended,
        "Auction is not currently open or finished");
        _;
    }

    modifier onlyAfterAuction(uint index) {
        require(block.timestamp >= auctions[index].endsAt &&
        !auctions[index].ended,
        "Auction is still open");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        // Underscore is a special character only used inside
        // a function modifier and it tells Solidity to
        // execute the rest of the code.
        _;
    }
    // функция для начала аукциона
    function createAuction(uint _minBid, uint _duration, string calldata _item, uint _ticketsSupply) external  onlyOwner {
        uint minBid = _minBid == 0 ? MIN_BID : _minBid;
        uint duration = _duration == 0 ? DURATION : _duration;
        uint ticketsSupply = _ticketsSupply == 0 ? 3 : _ticketsSupply;
        require(minBid >= MIN_BID, "Min bid for auction creation is 0.001 BNB");
        
        Auction storage auction = auctions.push();
        auction.item = _item;
        auction.ticketsSupply = ticketsSupply;
        auction.ticket = new Ticket(_item, ticketsSupply);
        auction.minBid = minBid;
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
            auctions[index].winners.push(Bidder(payable(msg.sender), msg.value, block.timestamp));
            //Когда занято последнее место изминить минимальную ставку 
            if (auctions[index].winners.length == winnersLength) {
                setMinBidForAuction(index);
            }
        } else {
            // Иначе найти минимальную и позднюю ставку и заменить текущей
            Bidder memory lowestBidder = Bidder(payable(address(0)), 2**256-1, 0);
            uint lowestBidId = 0;
            for (uint i = 0; i < winnersLength ; i++) {
                uint iBid = auctions[index].winners[i].bid;
                uint iTimestamp = auctions[index].winners[i].timestamp;
                if (iBid < lowestBidder.bid || (iBid <= lowestBidder.bid && iTimestamp > lowestBidder.timestamp)) {
                    lowestBidder = Bidder(auctions[index].winners[i].bidderAddress, iBid, iTimestamp);
                    lowestBidId = i;
                }    
            }
            auctions[index].winners[lowestBidId] = Bidder(payable(msg.sender), msg.value, block.timestamp);
            auctions[index].otherParticipants.push(lowestBidder);
            setMinBidForAuction(index);
        }
        emit BidAdded(index, msg.sender, msg.value, auctions[index].winners, auctions[index].otherParticipants);
    }

    // функция для окончания аукциона и распределения билетов
    function endAuction(uint index) public onlyAfterAuction(index) {
        //require(auctions[index].winners.length < auctions[index].ticketsSupply, "Not all winners have been identified");

        // отправляем билеты на адрес победителей и их ставки владельцу контракта
        // здесь можно использовать NFT-стандарт (например, ERC-721), чтобы создать уникальные билеты
        for (uint i = 0; i < auctions[index].winners.length; i++) {
            auctions[index].ticket.safeMint(auctions[index].winners[i].bidderAddress);
            payable(owner).transfer(
                auctions[index].winners[i].bid
            );
        }

        // возвращаем средства остальным участникам аукциона
        for (uint i = 0; i < auctions[index].otherParticipants.length; i++) {
            payable(auctions[index].otherParticipants[i].bidderAddress).transfer(
                auctions[index].otherParticipants[i].bid
            );
        }

        auctions[index].ended = true;
        emit AuctionEnded(index, auctions[index].minBid, auctions[index].winners, auctions[index].otherParticipants);
    }

    // Функция для нахождения текущей минимальной ставки и прибавления 1 finney
    function setMinBidForAuction(uint index) private {
        uint256 minimumBid = 2**256-1;
        for (uint i = 0; i < auctions[index].winners.length; i++){
            uint iBid = auctions[index].winners[i].bid;
            if (iBid < minimumBid){
                minimumBid = iBid;
            }
        }
        auctions[index].minBid = minimumBid + 10**15;
    }

}