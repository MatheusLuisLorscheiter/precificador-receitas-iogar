# ============================================================================
# UTILITÁRIOS - Validação de CPF e CNPJ
# ============================================================================
# Descrição: Funções para validação de CPF e CNPJ brasileiros
# Data: 03/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import re
from typing import Optional, Tuple


def limpar_documento(documento: str) -> str:
    """
    Remove caracteres especiais de CPF/CNPJ, mantendo apenas números.
    
    Args:
        documento (str): CPF ou CNPJ com ou sem formatação
        
    Returns:
        str: Documento limpo (apenas números)
    """
    if not documento:
        return ""
    return re.sub(r'[^0-9]', '', documento)


def validar_cpf(cpf: str) -> bool:
    """
    Valida um CPF brasileiro.
    
    Args:
        cpf (str): CPF a ser validado (com ou sem formatação)
        
    Returns:
        bool: True se CPF válido, False caso contrário
    """
    # Remove caracteres especiais
    cpf_limpo = limpar_documento(cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf_limpo) != 11:
        return False
    
    # Verifica se não são todos os dígitos iguais
    if cpf_limpo == cpf_limpo[0] * 11:
        return False
    
    # Calcula primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf_limpo[i]) * (10 - i)
    
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verifica primeiro dígito
    if int(cpf_limpo[9]) != digito1:
        return False
    
    # Calcula segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf_limpo[i]) * (11 - i)
    
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verifica segundo dígito
    return int(cpf_limpo[10]) == digito2


def validar_cnpj(cnpj: str) -> bool:
    """
    Valida um CNPJ brasileiro.
    
    Args:
        cnpj (str): CNPJ a ser validado (com ou sem formatação)
        
    Returns:
        bool: True se CNPJ válido, False caso contrário
    """
    # Remove caracteres especiais
    cnpj_limpo = limpar_documento(cnpj)
    
    # Verifica se tem 14 dígitos
    if len(cnpj_limpo) != 14:
        return False
    
    # Verifica se não são todos os dígitos iguais
    if cnpj_limpo == cnpj_limpo[0] * 14:
        return False
    
    # Calcula primeiro dígito verificador
    sequencia1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(12):
        soma += int(cnpj_limpo[i]) * sequencia1[i]
    
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verifica primeiro dígito
    if int(cnpj_limpo[12]) != digito1:
        return False
    
    # Calcula segundo dígito verificador
    sequencia2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = 0
    for i in range(13):
        soma += int(cnpj_limpo[i]) * sequencia2[i]
    
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verifica segundo dígito
    return int(cnpj_limpo[13]) == digito2


def identificar_tipo_documento(documento: str) -> Optional[str]:
    """
    Identifica se um documento é CPF ou CNPJ baseado no comprimento.
    
    Args:
        documento (str): Documento a ser identificado
        
    Returns:
        Optional[str]: "CPF", "CNPJ" ou None se inválido
    """
    documento_limpo = limpar_documento(documento)
    
    if len(documento_limpo) == 11:
        return "CPF"
    elif len(documento_limpo) == 14:
        return "CNPJ"
    else:
        return None


def validar_cpf_ou_cnpj(documento: str) -> Tuple[bool, Optional[str]]:
    """
    Valida um documento que pode ser CPF ou CNPJ.
    
    Args:
        documento (str): CPF ou CNPJ a ser validado
        
    Returns:
        Tuple[bool, Optional[str]]: (é_válido, tipo_documento)
            - é_válido: True se o documento é válido
            - tipo_documento: "CPF", "CNPJ" ou None se inválido
    """
    if not documento:
        return False, None
    
    tipo = identificar_tipo_documento(documento)
    
    if tipo == "CPF":
        return validar_cpf(documento), "CPF"
    elif tipo == "CNPJ":
        return validar_cnpj(documento), "CNPJ"
    else:
        return False, None


def formatar_cpf(cpf: str) -> str:
    """
    Formata um CPF no padrão XXX.XXX.XXX-XX.
    
    Args:
        cpf (str): CPF a ser formatado (apenas números)
        
    Returns:
        str: CPF formatado
    """
    cpf_limpo = limpar_documento(cpf)
    if len(cpf_limpo) != 11:
        return cpf_limpo
    
    return f"{cpf_limpo[:3]}.{cpf_limpo[3:6]}.{cpf_limpo[6:9]}-{cpf_limpo[9:]}"


def formatar_cnpj(cnpj: str) -> str:
    """
    Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX.
    
    Args:
        cnpj (str): CNPJ a ser formatado (apenas números)
        
    Returns:
        str: CNPJ formatado
    """
    cnpj_limpo = limpar_documento(cnpj)
    if len(cnpj_limpo) != 14:
        return cnpj_limpo
    
    return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"


def formatar_documento(documento: str) -> str:
    """
    Formata um documento (CPF ou CNPJ) automaticamente baseado no comprimento.
    
    Args:
        documento (str): CPF ou CNPJ a ser formatado
        
    Returns:
        str: Documento formatado
    """
    documento_limpo = limpar_documento(documento)
    tipo = identificar_tipo_documento(documento_limpo)
    
    if tipo == "CPF":
        return formatar_cpf(documento_limpo)
    elif tipo == "CNPJ":
        return formatar_cnpj(documento_limpo)
    else:
        return documento_limpo