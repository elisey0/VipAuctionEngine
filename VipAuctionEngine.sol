// SPDX-License-Identifier: MIT
// указываем версию Solidity, которую мы будем использовать
pragma solidity ^0.8.0;

// создаем контракт
contract VipAuctionEngine {
    // адрес владельца контракта (адрес кошелька, на который будут поступать средства от продажи билетов)
    address public owner;
    uint constant DURATION = 120; // 1 секунд стандартное время аукциона
    uint constant MIN_BID = 10**15; // 0.001 BNB

   // структура для хранения информации об участнике аукциона
    struct Bidder {
        address payable bidderAddress;
        uint256 bid;
        uint timestamp;
    }

    struct Auction {
        string item; // Наименование билета
        uint ticketsAmount; // Количество билетов
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
    event AuctionEnded(uint indexed index, uint endPrice, Bidder[] winners, Bidder[] otherParticipants);

    // конструктор контракта
    constructor() {
        owner = msg.sender;
    }


    modifier onlyDuringAuction(uint index) {
        require(!auctions[index].ended,
        "Auction is not currently open or finished");
        _;
    }

    modifier onlyAfterAuction(uint index) {
        require(block.timestamp >= auctions[index].endsAt,
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

    // событие для уведомления об окончании аукциона и распределении билетов
    event AuctionEnded(address winner, uint256 amount, uint256 tickets);

    // функция для начала аукциона
    function createAuction(uint _minBid, uint _duration, string memory _item, uint _ticketsAmount) external {
        uint minBid = _minBid == 0 ? MIN_BID : _minBid;
        uint duration = _duration == 0 ? DURATION : _duration;
        uint ticketsAmount = _ticketsAmount == 0 ? 3 : _ticketsAmount;
        require(minBid >= MIN_BID, "Min bid minimum is 0.0001 BNB");
        

        Auction storage auction = auctions.push();
        auction.item = _item;
        auction.ticketsAmount = ticketsAmount;
        auction.minBid = minBid;
        auction.startAt = block.timestamp; // now
        auction.endsAt = block.timestamp + duration;

        emit AuctionCreated(auctions.length - 1, _item, minBid, duration);
    }

    // функция для участия в аукционе
    function bid(uint index) public payable onlyDuringAuction(index) { 
        //require(_ticketsToBuy <= auctions[index].amount, "Don't try to buy more tickets that allowed");
        require(msg.value >= auctions[index].minBid, "Bid amount is too low");

        uint winnersLength = auctions[index].ticketsAmount;
        if (auctions[index].winners.length < winnersLength) {
            auctions[index].winners.push(Bidder(payable(msg.sender), msg.value, block.timestamp));
            if (auctions[index].winners.length == winnersLength) {
                setMinBidForAuction(index);
            }
        } else {
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
        //require(auctions[index].winners.length < auctions[index].ticketsAmount, "Not all winners have been identified");



        // отправляем билеты на адрес участника
        // здесь можно использовать NFT-стандарт (например, ERC-721), чтобы создать уникальные билеты


        // Возвращаем средства остальным участникам аукциона
        for (uint i = 0; i < auctions[index].otherParticipants.length; i++) {
            auctions[index].otherParticipants[i].bidderAddress.transfer(
                auctions[index].otherParticipants[i].bid
            );
        }

        auctions[index].ended = true;
        emit AuctionEnded(index, auctions[index].minBid, auctions[index].winners, auctions[index].otherParticipants);
    }

    // Устанавливаем минимальную ставку
    function setMinBidForAuction(uint index) private {
        uint minimumBid = 2**256-1;
        for (uint i = 0; i < auctions[index].ticketsAmount; i++){
            uint iBid = auctions[index].winners[i].bid;
            if (iBid < minimumBid){
                minimumBid = iBid;
            }
        }
        auctions[index].minBid = minimumBid + 10**15;
    }

}