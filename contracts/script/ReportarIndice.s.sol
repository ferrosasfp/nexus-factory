// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PolizaParametrica.sol";

/// @notice Simula al oráculo de Field Shift: publica el índice de humedad de la temporada.
/// Solo Fuji y wallet de pruebas.
/// Uso: CONTRATO=0x... INDICE=380 npm run contracts:reportar:fuji
/// INDICE es la humedad del suelo x 1000 (380 = 0.380). Opcionales: ZONA (0) y HASH (bytes32).
contract ReportarIndice is Script {
    function run() external {
        uint256 oraculoPrivateKey = vm.envUint("PRIVATE_KEY");
        address contrato = vm.envAddress("CONTRATO");
        uint256 zona = vm.envOr("ZONA", uint256(0));
        uint256 indice = vm.envUint("INDICE");
        require(indice <= type(uint16).max, "INDICE fuera de rango (uint16)");
        bytes32 hashDatos = vm.envOr("HASH", bytes32(0));

        PolizaParametrica poliza = PolizaParametrica(payable(contrato));

        vm.startBroadcast(oraculoPrivateKey);
        // casting to 'uint16' is safe because of the require above
        // forge-lint: disable-next-line(unsafe-typecast)
        poliza.reportarIndice(zona, uint16(indice), hashDatos);
        vm.stopBroadcast();

        (, uint16 umbral, , , , bool disparada, , , ) = poliza.zonas(zona);
        console.log("Indice reportado:", indice);
        console.log("Umbral:", uint256(umbral));
        console.log(disparada ? "La poliza PAGA." : "La poliza no paga.");
    }
}
