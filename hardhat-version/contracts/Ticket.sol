//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Ticket is ERC721Enumerable, Ownable {
    using Strings for uint256;
    uint256 public MAX_SUPPLY;
    uint current_tokneId;

    constructor(
        string memory _item,
        uint _ticketsSupply
    ) ERC721(_item, "TCKT") {
        MAX_SUPPLY = _ticketsSupply;
    }

    //function safeMint(address to, string calldata uri) public { //пока без картинки
    function safeMint(address _to) public onlyOwner {
        require(current_tokneId < MAX_SUPPLY, "Max supply reached");
        _safeMint(_to, current_tokneId);
        //_setTokenURI(current_tokneId, uri);

        current_tokneId++;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function _burn(uint _tokneId) internal override(ERC721) {
        super._burn(_tokneId);
    }

    function tokenURI(
        uint _tokneId
    ) public view override(ERC721) returns (string memory) {
        return super.tokenURI(_tokneId);
    }
}
