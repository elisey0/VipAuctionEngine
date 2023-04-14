//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../library/ERC721.sol";
import "../library/ERC721Enumerable.sol";
import "../library/ERC721URIStorage.sol";

contract Ticket is ERC721, ERC721Enumerable, ERC721URIStorage {
    address public owner;
    uint256 public MAX_SUPPLY;
    uint currentTokenId;

    constructor(string memory _item, uint ticketsSupply) ERC721(_item, "TCKT") {
        MAX_SUPPLY = ticketsSupply;
        owner = msg.sender;
    }

    //function safeMint(address to, string calldata uri) public { //пока без картинки
    function safeMint(address to) public {
        require(owner == msg.sender, "not an owner!");
        require(currentTokenId < MAX_SUPPLY, "Max supply reached");
        _safeMint(to, currentTokenId);
        //_setTokenURI(currentTokenId, uri);

        currentTokenId++;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal pure override returns(string memory) {
        return "ipfs://";
    }

    function _burn(uint tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint tokenId) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}