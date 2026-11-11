// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PolizaParametrica
/// @notice Seguro paramétrico de ejemplo para el workshop Field Shift.
/// Una aseguradora o cooperativa crea zonas y deposita fondos. Los productores
/// compran una póliza por zona. Un oráculo publica el índice satelital de la
/// temporada (humedad del suelo x 1000). Si el índice queda debajo del umbral,
/// cada asegurado reclama su cobertura. Sin formularios ni ajustadores.
/// @dev Contrato educativo para testnet (Fuji). No está auditado.
contract PolizaParametrica {
    struct Zona {
        string nombre;
        uint16 umbral;        // humedad del suelo x 1000 (ej. 450 = 0.450)
        uint256 cobertura;    // monto que recibe cada asegurado si se dispara
        uint256 primaBase;    // prima sin descuento
        bool reportada;
        bool disparada;
        uint16 indice;        // índice reportado por el oráculo
        bytes32 hashDatos;    // huella de los datos de NASA usados (procedencia)
        uint256 asegurados;
    }

    uint8 public constant DESCUENTO_ROTACION = 20; // % de descuento por rotación resiliente

    address public owner;
    address public oraculo;
    Zona[] public zonas;

    // zonaId => productor => tiene póliza
    mapping(uint256 => mapping(address => bool)) public tienePoliza;
    // zonaId => productor => ya cobró
    mapping(uint256 => mapping(address => bool)) public cobrado;
    // zonaId => productor => declaró rotación resiliente
    mapping(uint256 => mapping(address => bool)) public conRotacion;

    event ZonaCreada(uint256 indexed zonaId, string nombre, uint16 umbral, uint256 cobertura, uint256 primaBase);
    event PolizaComprada(uint256 indexed zonaId, address indexed productor, uint256 prima, bool conRotacion);
    event IndiceReportado(uint256 indexed zonaId, uint16 indice, bool disparada, bytes32 hashDatos);
    event PagoReclamado(uint256 indexed zonaId, address indexed productor, uint256 monto);

    error SoloOwner();
    error SoloOraculo();
    error ZonaInexistente();
    error PrimaIncorrecta(uint256 esperada);
    error YaAsegurado();
    error YaReportada();
    error SinPago();
    error FondosInsuficientes();

    modifier soloOwner() {
        if (msg.sender != owner) revert SoloOwner();
        _;
    }

    modifier soloOraculo() {
        if (msg.sender != oraculo) revert SoloOraculo();
        _;
    }

    modifier zonaValida(uint256 zonaId) {
        if (zonaId >= zonas.length) revert ZonaInexistente();
        _;
    }

    constructor(address _oraculo) {
        owner = msg.sender;
        oraculo = _oraculo;
    }

    /// @notice La aseguradora deposita fondos para pagar las coberturas.
    receive() external payable {}

    function cambiarOraculo(address nuevo) external soloOwner {
        oraculo = nuevo;
    }

    function crearZona(string calldata nombre, uint16 umbral, uint256 cobertura, uint256 primaBase)
        external
        soloOwner
        returns (uint256 zonaId)
    {
        zonaId = zonas.length;
        zonas.push(Zona(nombre, umbral, cobertura, primaBase, false, false, 0, bytes32(0), 0));
        emit ZonaCreada(zonaId, nombre, umbral, cobertura, primaBase);
    }

    function totalZonas() external view returns (uint256) {
        return zonas.length;
    }

    /// @notice Prima que paga un productor, con o sin descuento por rotación.
    function prima(uint256 zonaId, bool rotacionResiliente) public view zonaValida(zonaId) returns (uint256) {
        uint256 base = zonas[zonaId].primaBase;
        return rotacionResiliente ? (base * (100 - DESCUENTO_ROTACION)) / 100 : base;
    }

    /// @notice Compra una póliza para la temporada.
    /// @dev En el MVP el productor declara si adopta la rotación. En producción
    /// lo verificaría una cooperativa o un segundo oráculo (por ejemplo, con NDVI).
    function comprarPoliza(uint256 zonaId, bool rotacionResiliente) external payable zonaValida(zonaId) {
        Zona storage z = zonas[zonaId];
        if (z.reportada) revert YaReportada();
        if (tienePoliza[zonaId][msg.sender]) revert YaAsegurado();
        uint256 esperada = prima(zonaId, rotacionResiliente);
        if (msg.value != esperada) revert PrimaIncorrecta(esperada);

        tienePoliza[zonaId][msg.sender] = true;
        conRotacion[zonaId][msg.sender] = rotacionResiliente;
        z.asegurados += 1;
        emit PolizaComprada(zonaId, msg.sender, msg.value, rotacionResiliente);
    }

    /// @notice El oráculo publica el índice de la temporada y la huella de los datos usados.
    function reportarIndice(uint256 zonaId, uint16 indice, bytes32 hashDatos) external soloOraculo zonaValida(zonaId) {
        Zona storage z = zonas[zonaId];
        if (z.reportada) revert YaReportada();
        z.reportada = true;
        z.indice = indice;
        z.hashDatos = hashDatos;
        z.disparada = indice < z.umbral;
        emit IndiceReportado(zonaId, indice, z.disparada, hashDatos);
    }

    /// @notice Cada asegurado cobra su pago (patrón "pull": nadie empuja fondos a ciegas).
    function reclamar(uint256 zonaId) external zonaValida(zonaId) {
        Zona storage z = zonas[zonaId];
        if (!z.disparada || !tienePoliza[zonaId][msg.sender] || cobrado[zonaId][msg.sender]) revert SinPago();
        if (address(this).balance < z.cobertura) revert FondosInsuficientes();

        cobrado[zonaId][msg.sender] = true;
        (bool ok, ) = payable(msg.sender).call{value: z.cobertura}("");
        require(ok, "Transferencia fallida");
        emit PagoReclamado(zonaId, msg.sender, z.cobertura);
    }
}
