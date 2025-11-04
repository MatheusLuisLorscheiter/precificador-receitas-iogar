# ============================================================================
# SERVICO DE GERACAO DE PDF - FOOD COST SYSTEM
# ============================================================================
# Descricao: Servico para geracao de relatorios PDF profissionais de receitas
# Tecnologia: ReportLab 4.0.7
# Data: 04/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import os

# ============================================================================
# CONFIGURACOES GLOBAIS
# ============================================================================

# Cores institucionais IOGAR
COR_VERDE_IOGAR = colors.HexColor('#22c55e')  # Verde institucional
COR_ROSA_IOGAR = colors.HexColor('#ec4899')   # Rosa institucional
COR_CINZA_CLARO = colors.HexColor('#f3f4f6')  # Cinza para fundos
COR_CINZA_ESCURO = colors.HexColor('#6b7280') # Cinza para textos secundarios
COR_TEXTO_PRINCIPAL = colors.HexColor('#111827') # Texto principal

# Dimensoes da pagina A4
LARGURA_PAGINA, ALTURA_PAGINA = A4

# Margens do documento
MARGEM_ESQUERDA = 2 * cm
MARGEM_DIREITA = 2 * cm
MARGEM_SUPERIOR = 2 * cm
MARGEM_INFERIOR = 2 * cm

# Caminho para assets
ASSETS_PATH = Path(__file__).parent / "templates" / "pdf" / "assets"
LOGO_PATH = ASSETS_PATH / "logo_iogar.png"

# Icones Unicode para secoes
ICONE_INFO = "ℹ"           # Informacoes
ICONE_DADOS = "📋"         # Dados complementares
ICONE_INGREDIENTES = "🥘"  # Ingredientes
ICONE_DINHEIRO = "💰"      # Precificacao

# ============================================================================
# CLASSE PRINCIPAL DO SERVICO DE PDF
# ============================================================================

class PDFService:
    """
    Servico para geracao de relatorios PDF de receitas.
    
    Responsabilidades:
    - Gerar PDFs profissionais de receitas individuais
    - Aplicar template com identidade visual IOGAR
    - Incluir todas informacoes relevantes da receita
    - Gerar PDFs em lote quando necessario
    """
    
    def __init__(self):
        """Inicializa o servico de PDF com configuracoes padrao"""
        self.styles = getSampleStyleSheet()
        self._configurar_estilos_customizados()
    
    
    def _configurar_estilos_customizados(self):
        """
        Configura estilos customizados para o PDF.
        Define estilos para titulos, subtitulos, texto normal e tabelas.
        """
        # Estilo para titulo principal
        self.styles.add(ParagraphStyle(
            name='TituloPrincipal',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=COR_VERDE_IOGAR,
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para subtitulos
        self.styles.add(ParagraphStyle(
            name='Subtitulo',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=COR_ROSA_IOGAR,
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal com destaque
        self.styles.add(ParagraphStyle(
            name='TextoDestaque',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=COR_TEXTO_PRINCIPAL,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='TextoNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=COR_TEXTO_PRINCIPAL,
            spaceAfter=4,
            fontName='Helvetica'
        ))
        
        # Estilo para rodape
        self.styles.add(ParagraphStyle(
            name='Rodape',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=COR_CINZA_ESCURO,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
    
    
    def _criar_cabecalho(self, elementos: list) -> None:
        """
        Cria o cabecalho do PDF com logo IOGAR e gradiente decorativo.
        
        Args:
            elementos: Lista de elementos do PDF onde o cabecalho sera adicionado
        """
        from reportlab.platypus import KeepTogether
        from reportlab.lib.utils import ImageReader
        
        # Criar box com gradiente usando tabela estilizada
        dados_header = [['']]
        header_box = Table(dados_header, colWidths=[LARGURA_PAGINA - 4*cm], rowHeights=[3*cm])
        
        # Aplicar estilo com gradiente simulado (duas cores)
        header_box.setStyle(TableStyle([
            # Fundo com cor principal (verde IOGAR)
            ('BACKGROUND', (0, 0), (-1, -1), COR_VERDE_IOGAR),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        
        elementos.append(header_box)
        elementos.append(Spacer(1, -2.5*cm))  # Sobrepor elementos no gradiente
        
        # Adicionar logo se existir (sobreposto ao gradiente)
        if LOGO_PATH.exists():
            try:
                logo = Image(str(LOGO_PATH), width=4*cm, height=2*cm)
                logo.hAlign = 'CENTER'
                elementos.append(logo)
                elementos.append(Spacer(1, 0.3*cm))
            except:
                # Se falhar ao carregar logo, continuar sem ele
                pass
        else:
            elementos.append(Spacer(1, 0.5*cm))
        
        # Titulo do sistema em branco sobre o gradiente
        titulo_sistema = Paragraph(
            "<font color='white' size='14'><b>FOOD COST SYSTEM - IOGAR</b></font>",
            self.styles['TextoNormal']
        )
        elementos.append(titulo_sistema)
        elementos.append(Spacer(1, 0.5*cm))
        
        # Restaurar espaçamento normal
        elementos.append(Spacer(1, 0.3*cm))
        
        # Linha separadora decorativa
        self._adicionar_linha_separadora(elementos)
    
    
    def _adicionar_linha_separadora(self, elementos: list) -> None:
        """
        Adiciona uma linha separadora visual ao PDF.
        
        Args:
            elementos: Lista de elementos do PDF
        """
        linha_dados = [['', '']]
        linha_tabela = Table(linha_dados, colWidths=[LARGURA_PAGINA - 4*cm])
        linha_tabela.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 2, COR_VERDE_IOGAR),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, COR_CINZA_CLARO),
        ]))
        elementos.append(linha_tabela)
        elementos.append(Spacer(1, 0.5*cm))
    
    
    def _criar_secao_informacoes_basicas(
        self, 
        elementos: list, 
        receita_data: Dict[str, Any]
    ) -> None:
        """
        Cria secao com informacoes basicas da receita.
        
        Args:
            elementos: Lista de elementos do PDF
            receita_data: Dicionario com dados da receita
        """
        # Titulo da secao
        elementos.append(Paragraph(
            f"{ICONE_INFO} INFORMACOES DA RECEITA",
            self.styles['Subtitulo']
        ))
        
        # Nome da receita (destaque principal)
        nome_receita = Paragraph(
            f"<b>{receita_data.get('nome', 'N/A')}</b>",
            self.styles['TituloPrincipal']
        )
        elementos.append(nome_receita)
        elementos.append(Spacer(1, 0.3*cm))
        
        # Preparar status com badge colorido
        status_receita = receita_data.get('status', 'N/A').lower()
        
        # Definir cor do badge baseado no status
        if status_receita == 'ativo':
            cor_status = COR_VERDE_IOGAR
            texto_status = '● ATIVO'
        elif status_receita == 'inativo':
            cor_status = COR_CINZA_ESCURO
            texto_status = '● INATIVO'
        elif status_receita == 'pendente':
            cor_status = colors.HexColor('#f59e0b')  # Laranja
            texto_status = '● PENDENTE'
        elif status_receita == 'processado':
            cor_status = COR_ROSA_IOGAR
            texto_status = '● PROCESSADO'
        else:
            cor_status = COR_CINZA_ESCURO
            texto_status = f'● {status_receita.upper()}'
        
        # Criar parágrafo com status colorido
        status_paragraph = Paragraph(
            f"<font color='{cor_status.hexval()}'><b>{texto_status}</b></font>",
            self.styles['TextoNormal']
        )
        
        # Dados basicos em tabela
        dados_basicos = [
            ['Codigo:', receita_data.get('codigo', 'N/A')],
            ['Categoria:', receita_data.get('categoria', 'N/A')],
            ['Status:', status_paragraph],
        ]
        
        tabela_basica = Table(dados_basicos, colWidths=[5*cm, 10*cm])
        tabela_basica.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), COR_CINZA_CLARO),
            ('TEXTCOLOR', (0, 0), (-1, -1), COR_TEXTO_PRINCIPAL),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, COR_CINZA_CLARO),
        ]))
        
        elementos.append(tabela_basica)
        elementos.append(Spacer(1, 0.5*cm))
    
    
    def _criar_secao_dados_complementares(
        self, 
        elementos: list, 
        receita_data: Dict[str, Any]
    ) -> None:
        """
        Cria secao com dados complementares da receita.
        
        Args:
            elementos: Lista de elementos do PDF
            receita_data: Dicionario com dados da receita
        """
        # Titulo da secao com icone
        elementos.append(Paragraph(
            f"{ICONE_DADOS} DADOS COMPLEMENTARES",
            self.styles['Subtitulo']
        ))
        elementos.append(Spacer(1, 0.3*cm))
        
        dados_complementares = [
            ['Rendimento:', f"{receita_data.get('rendimento', 'N/A')} {receita_data.get('unidade_rendimento', '')}"],
            ['Tempo de Preparo:', f"{receita_data.get('tempo_preparo', 'N/A')} minutos"],
            ['Responsavel:', receita_data.get('responsavel', 'N/A')],
        ]
        
        tabela_complementar = Table(dados_complementares, colWidths=[5*cm, 10*cm])
        tabela_complementar.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), COR_CINZA_CLARO),
            ('TEXTCOLOR', (0, 0), (-1, -1), COR_TEXTO_PRINCIPAL),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, COR_CINZA_CLARO),
        ]))
        
        elementos.append(tabela_complementar)
        elementos.append(Spacer(1, 0.5*cm))

    def _criar_secao_ingredientes(
        self, 
        elementos: list, 
        ingredientes: list
    ) -> None:
        """
        Cria secao com tabela de ingredientes da receita.
        
        Args:
            elementos: Lista de elementos do PDF
            ingredientes: Lista de dicionarios com dados dos ingredientes
                Formato esperado: [
                    {
                        'nome': str,
                        'quantidade': float,
                        'unidade': str,
                        'preco_unitario': float,
                        'custo_total': float
                    }
                ]
        """
        # Titulo da secao
        elementos.append(Paragraph(
            f"{ICONE_INGREDIENTES} INGREDIENTES",
            self.styles['Subtitulo']
        ))
        elementos.append(Spacer(1, 0.3*cm))
        
        # Verificar se há ingredientes
        if not ingredientes or len(ingredientes) == 0:
            elementos.append(Paragraph(
                "Nenhum ingrediente cadastrado para esta receita.",
                self.styles['TextoNormal']
            ))
            elementos.append(Spacer(1, 0.5*cm))
            return
        
        # Cabecalho da tabela
        dados_tabela = [
            ['Ingrediente', 'Quantidade', 'Unidade', 'Preco Unit.', 'Custo Total']
        ]
        
        # Adicionar linhas de ingredientes
        for ing in ingredientes:
            dados_tabela.append([
                ing.get('nome', 'N/A'),
                f"{ing.get('quantidade', 0):.2f}",
                ing.get('unidade', ''),
                f"R$ {ing.get('preco_unitario', 0):.2f}",
                f"R$ {ing.get('custo_total', 0):.2f}"
            ])
        
        # Criar tabela com larguras proporcionais
        larguras_colunas = [7*cm, 2.5*cm, 2*cm, 2.5*cm, 2.5*cm]
        tabela_ingredientes = Table(dados_tabela, colWidths=larguras_colunas)
        
        # Estilo da tabela
        estilo_tabela = TableStyle([
            # Cabecalho
            ('BACKGROUND', (0, 0), (-1, 0), COR_VERDE_IOGAR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Corpo da tabela
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), COR_TEXTO_PRINCIPAL),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),      # Nome: esquerda
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),    # Quantidade: centro
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),    # Unidade: centro
            ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),    # Precos: direita
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('PADDING', (0, 1), (-1, -1), 8),
            
            # Linhas zebradas para melhor leitura
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COR_CINZA_CLARO]),
            
            # Bordas
            ('GRID', (0, 0), (-1, -1), 0.5, COR_CINZA_ESCURO),
            ('BOX', (0, 0), (-1, -1), 1.5, COR_VERDE_IOGAR),
        ])
        
        tabela_ingredientes.setStyle(estilo_tabela)
        elementos.append(tabela_ingredientes)
        elementos.append(Spacer(1, 0.5*cm))

    def _criar_secao_precificacao(
        self, 
        elementos: list, 
        precificacao_data: Dict[str, Any]
    ) -> None:
        """
        Cria secao com informacoes de precificacao e CMV.
        
        Args:
            elementos: Lista de elementos do PDF
            precificacao_data: Dicionario com dados de precificacao
                Formato esperado: {
                    'cmv': float,
                    'cmv_unitario': float,
                    'margem_sugerida': float,
                    'preco_sugerido': float,
                    'preco_venda_atual': float (opcional)
                }
        """
        # Titulo da secao com destaque
        elementos.append(Paragraph(
            f"{ICONE_DINHEIRO} PRECIFICACAO E CUSTOS",
            self.styles['Subtitulo']
        ))
        elementos.append(Spacer(1, 0.3*cm))
        
        # Extrair dados
        cmv = precificacao_data.get('cmv', 0)
        cmv_unitario = precificacao_data.get('cmv_unitario', 0)
        margem_sugerida = precificacao_data.get('margem_sugerida', 0)
        preco_sugerido = precificacao_data.get('preco_sugerido', 0)
        preco_venda_atual = precificacao_data.get('preco_venda_atual', None)
        
        # Dados de precificacao
        dados_precificacao = [
            ['CMV Total:', f"R$ {cmv:.2f}"],
            ['CMV Unitario:', f"R$ {cmv_unitario:.2f}"],
            ['Margem Sugerida:', f"{margem_sugerida:.1f}%"],
            ['Preco Sugerido:', f"R$ {preco_sugerido:.2f}"],
        ]
        
        # Adicionar preco de venda atual se existir
        if preco_venda_atual is not None and preco_venda_atual > 0:
            dados_precificacao.append(['Preco de Venda Atual:', f"R$ {preco_venda_atual:.2f}"])
        
        # Criar tabela de precificacao
        tabela_precificacao = Table(dados_precificacao, colWidths=[6*cm, 9*cm])
        
        # Estilo da tabela com destaque em rosa
        estilo_precificacao = TableStyle([
            # Coluna de labels
            ('BACKGROUND', (0, 0), (0, -1), COR_ROSA_IOGAR),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, -1), 11),
            ('PADDING', (0, 0), (0, -1), 10),
            
            # Coluna de valores
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ('TEXTCOLOR', (1, 0), (1, -1), COR_TEXTO_PRINCIPAL),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (1, 0), (1, -1), 12),
            ('PADDING', (1, 0), (1, -1), 10),
            
            # Bordas
            ('GRID', (0, 0), (-1, -1), 1, COR_CINZA_CLARO),
            ('BOX', (0, 0), (-1, -1), 2, COR_ROSA_IOGAR),
            
            # Destaque especial para CMV Total (primeira linha)
            ('BACKGROUND', (1, 0), (1, 0), COR_CINZA_CLARO),
            ('FONTSIZE', (1, 0), (1, 0), 14),
        ])
        
        tabela_precificacao.setStyle(estilo_precificacao)
        elementos.append(tabela_precificacao)
        elementos.append(Spacer(1, 0.5*cm))
        
        # Adicionar nota explicativa
        nota_explicativa = Paragraph(
            "<i>Nota: Os valores de precificacao sao calculados automaticamente "
            "com base nos custos dos ingredientes e margens sugeridas.</i>",
            self.styles['TextoNormal']
        )
        elementos.append(nota_explicativa)
        elementos.append(Spacer(1, 0.5*cm))
    
    
    def _criar_rodape(self, canvas_obj: canvas.Canvas, doc: SimpleDocTemplate) -> None:
        """
        Cria o rodape do PDF com data de geracao e identificacao do sistema.
        
        Args:
            canvas_obj: Objeto canvas do ReportLab
            doc: Documento PDF
        """
        canvas_obj.saveState()
        
        # Data de geracao
        data_atual = datetime.now().strftime("%d/%m/%Y %H:%M")
        texto_rodape = f"Gerado em {data_atual} - Food Cost System - IOGAR"
        
        # Posicionar rodape
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(COR_CINZA_ESCURO)
        canvas_obj.drawCentredString(
            LARGURA_PAGINA / 2,
            MARGEM_INFERIOR / 2,
            texto_rodape
        )
        
        canvas_obj.restoreState()
    
    
    def gerar_pdf_receita(
        self, 
        receita_data: Dict[str, Any], 
        output_path: str
    ) -> str:
        """
        Gera PDF completo de uma receita com todas as secoes.
        
        Args:
            receita_data: Dicionario com todos os dados da receita
                Formato esperado: {
                    'codigo': str,
                    'nome': str,
                    'categoria': str,
                    'status': str,
                    'rendimento': float,
                    'unidade_rendimento': str,
                    'tempo_preparo': int,
                    'responsavel': str,
                    'ingredientes': list,
                    'precificacao': dict
                }
            output_path: Caminho onde o PDF sera salvo
            
        Returns:
            Caminho do arquivo PDF gerado
        """
        # Criar documento PDF
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=MARGEM_ESQUERDA,
            rightMargin=MARGEM_DIREITA,
            topMargin=MARGEM_SUPERIOR,
            bottomMargin=MARGEM_INFERIOR
        )
        
        # Lista de elementos do PDF
        elementos = []
        
        # Adicionar todas as secoes do PDF na ordem correta
        self._criar_cabecalho(elementos)
        self._criar_secao_informacoes_basicas(elementos, receita_data)
        self._criar_secao_dados_complementares(elementos, receita_data)
        
        # Adicionar secao de ingredientes se existir
        ingredientes = receita_data.get('ingredientes', [])
        if ingredientes:
            self._criar_secao_ingredientes(elementos, ingredientes)
        
        # Adicionar secao de precificacao se existir
        precificacao = receita_data.get('precificacao', None)
        if precificacao:
            self._criar_secao_precificacao(elementos, precificacao)
        
        # Construir PDF com rodape personalizado em todas as paginas
        doc.build(elementos, onFirstPage=self._criar_rodape, onLaterPages=self._criar_rodape)
        
        return output_path


# ============================================================================
# FUNCAO AUXILIAR PARA CRIAR INSTANCIA DO SERVICO
# ============================================================================

def obter_pdf_service() -> PDFService:
    """
    Retorna uma instancia do servico de PDF.
    
    Returns:
        Instancia de PDFService configurada
    """
    return PDFService()