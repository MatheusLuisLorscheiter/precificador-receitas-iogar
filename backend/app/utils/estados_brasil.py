# ============================================================================
# UTILITÁRIOS - Estados Brasileiros
# ============================================================================
# Descrição: Lista de estados brasileiros para validação e uso em selects
# Data: 28/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

# Lista de estados brasileiros (UF)
ESTADOS_BRASILEIROS = [
    {"sigla": "AC", "nome": "Acre"},
    {"sigla": "AL", "nome": "Alagoas"},
    {"sigla": "AP", "nome": "Amapá"},
    {"sigla": "AM", "nome": "Amazonas"},
    {"sigla": "BA", "nome": "Bahia"},
    {"sigla": "CE", "nome": "Ceará"},
    {"sigla": "DF", "nome": "Distrito Federal"},
    {"sigla": "ES", "nome": "Espírito Santo"},
    {"sigla": "GO", "nome": "Goiás"},
    {"sigla": "MA", "nome": "Maranhão"},
    {"sigla": "MT", "nome": "Mato Grosso"},
    {"sigla": "MS", "nome": "Mato Grosso do Sul"},
    {"sigla": "MG", "nome": "Minas Gerais"},
    {"sigla": "PA", "nome": "Pará"},
    {"sigla": "PB", "nome": "Paraíba"},
    {"sigla": "PR", "nome": "Paraná"},
    {"sigla": "PE", "nome": "Pernambuco"},
    {"sigla": "PI", "nome": "Piauí"},
    {"sigla": "RJ", "nome": "Rio de Janeiro"},
    {"sigla": "RN", "nome": "Rio Grande do Norte"},
    {"sigla": "RS", "nome": "Rio Grande do Sul"},
    {"sigla": "RO", "nome": "Rondônia"},
    {"sigla": "RR", "nome": "Roraima"},
    {"sigla": "SC", "nome": "Santa Catarina"},
    {"sigla": "SP", "nome": "São Paulo"},
    {"sigla": "SE", "nome": "Sergipe"},
    {"sigla": "TO", "nome": "Tocantins"}
]

# Apenas as siglas (para validação)
SIGLAS_ESTADOS = [estado["sigla"] for estado in ESTADOS_BRASILEIROS]

# Função para obter nome do estado pela sigla
def get_nome_estado(sigla: str) -> str:
    """
    Retorna o nome completo do estado pela sigla.
    
    Args:
        sigla (str): Sigla do estado (ex: "SP")
        
    Returns:
        str: Nome completo do estado ou a própria sigla se não encontrado
    """
    for estado in ESTADOS_BRASILEIROS:
        if estado["sigla"] == sigla.upper():
            return estado["nome"]
    return sigla

# Função para validar sigla de estado
def is_valid_uf(sigla: str) -> bool:
    """
    Valida se a sigla é um estado brasileiro válido.
    
    Args:
        sigla (str): Sigla a ser validada
        
    Returns:
        bool: True se válida, False caso contrário
    """
    return sigla.upper() in SIGLAS_ESTADOS