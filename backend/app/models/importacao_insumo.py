# ============================================================================
# MODELO IMPORTACAO_INSUMO - Registro de importações de arquivos
# ============================================================================
# Descrição: Modelo para registrar todas as importações de insumos via Excel
# Data: 30/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


# ============================================================================
# ENUMS
# ============================================================================

class StatusImportacao(str, enum.Enum):
    """
    Status possíveis de uma importação.
    
    - PENDENTE: Arquivo enviado, aguardando processamento
    - PROCESSANDO: Importação em andamento
    - SUCESSO: Importação concluída com sucesso
    - SUCESSO_PARCIAL: Importação concluída com alguns erros
    - ERRO: Importação falhou completamente
    """
    PENDENTE = "pendente"
    PROCESSANDO = "processando"
    SUCESSO = "sucesso"
    SUCESSO_PARCIAL = "sucesso_parcial"
    ERRO = "erro"


# ============================================================================
# MODELO
# ============================================================================

class ImportacaoInsumo(Base):
    """
    Modelo para registro de importações de insumos via arquivo Excel.
    
    Este modelo registra:
    - Arquivo original enviado (nome, caminho, tamanho)
    - Status da importação (pendente, processando, sucesso, erro)
    - Estatísticas (total de linhas, sucessos, erros)
    - Logs de processamento
    - Vínculo com restaurante e usuário responsável
    - Timestamps de controle
    
    RELACIONAMENTOS:
    - N importacoes : 1 restaurante
    - N importacoes : 1 usuario (responsável pela importação)
    - 1 importacao : N insumos (registrados a partir dela)
    """
    
    __tablename__ = "importacoes_insumos"

    # ========================================================================
    # CAMPOS DE CONTROLE
    # ========================================================================
    
    id = Column(
        Integer, 
        primary_key=True, 
        index=True,
        comment="ID único da importação"
    )
    
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False,
        comment="Data/hora de criação do registro"
    )
    
    updated_at = Column(
        DateTime(timezone=True), 
        onupdate=func.now(),
        comment="Data/hora da última atualização"
    )

    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================
    
    restaurante_id = Column(
        Integer,
        ForeignKey("restaurantes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID do restaurante para o qual os insumos foram importados"
    )
    
    usuario_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID do usuário que realizou a importação"
    )

    # ========================================================================
    # INFORMAÇÕES DO ARQUIVO
    # ========================================================================
    
    nome_arquivo = Column(
        String(255),
        nullable=False,
        comment="Nome original do arquivo enviado"
    )
    
    caminho_arquivo = Column(
        String(500),
        nullable=False,
        comment="Caminho onde o arquivo foi armazenado no servidor"
    )
    
    tamanho_arquivo = Column(
        Integer,
        nullable=False,
        comment="Tamanho do arquivo em bytes"
    )
    
    tipo_mime = Column(
        String(100),
        nullable=False,
        default="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        comment="Tipo MIME do arquivo (application/vnd...xlsx)"
    )

    # ========================================================================
    # STATUS E PROCESSAMENTO
    # ========================================================================
    
    from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum

    # Na definição da coluna:
    status = Column(
        String(20),  # ← Usar String direto
        nullable=False,
        default="pendente",  # ← Valor minúsculo direto
        comment="Status atual da importação"
    )
    
    data_inicio_processamento = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data/hora de início do processamento"
    )
    
    data_fim_processamento = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data/hora de conclusão do processamento"
    )

    # ========================================================================
    # ESTATÍSTICAS DA IMPORTAÇÃO
    # ========================================================================
    
    total_linhas = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total de linhas no arquivo (excluindo cabeçalho)"
    )
    
    linhas_processadas = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Número de linhas processadas com sucesso"
    )
    
    linhas_com_erro = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Número de linhas que falharam no processamento"
    )
    
    linhas_ignoradas = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Número de linhas ignoradas (vazias, duplicadas, etc.)"
    )

    # ========================================================================
    # LOGS E DETALHES
    # ========================================================================
    
    log_processamento = Column(
        Text,
        nullable=True,
        comment="Log detalhado do processamento (JSON com erros e avisos)"
    )
    
    mensagem_erro = Column(
        Text,
        nullable=True,
        comment="Mensagem de erro principal, caso a importação falhe"
    )
    
    observacoes = Column(
        Text,
        nullable=True,
        comment="Observações adicionais sobre a importação"
    )

    # ========================================================================
    # RELACIONAMENTOS ORM
    # ========================================================================
    
    restaurante = relationship(
        "Restaurante",
        back_populates="importacoes_insumos"
    )
    
    usuario = relationship(
        "User",
        back_populates="importacoes_insumos"
    )
    
    insumos = relationship(
        "Insumo",
        back_populates="importacao",
        cascade="all, delete-orphan"
    )

    # ========================================================================
    # MÉTODOS AUXILIARES
    # ========================================================================
    
    def calcular_taxa_sucesso(self) -> float:
        """
        Calcula a taxa de sucesso da importação.
        
        Returns:
            float: Percentual de linhas processadas com sucesso (0-100)
        """
        if self.total_linhas == 0:
            return 0.0
        return (self.linhas_processadas / self.total_linhas) * 100
    
    def eh_sucesso_total(self) -> bool:
        """
        Verifica se a importação foi 100% bem-sucedida.
        
        Returns:
            bool: True se todas as linhas foram processadas com sucesso
        """
        return (
            self.status == StatusImportacao.SUCESSO and 
            self.linhas_com_erro == 0 and
            self.linhas_processadas == self.total_linhas
        )
    
    def __repr__(self):
        """
        Representação em string do objeto.
        """
        return (
            f"<ImportacaoInsumo(id={self.id}, "
            f"arquivo='{self.nome_arquivo}', "
            f"status='{self.status}', "
            f"sucesso={self.linhas_processadas}/{self.total_linhas})>"
        )