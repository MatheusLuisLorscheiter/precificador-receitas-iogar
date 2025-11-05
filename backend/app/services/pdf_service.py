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
    Servico para geracao de PDFs de receitas.
    Design moderno inspirado em fichas tecnicas profissionais.
    
    Cores institucionais IOGAR:
    - Verde: #22c55e (cor principal)
    - Rosa: #ec4899 (cor secundaria)
    - Cinza escuro: #1e293b (fundo)
    - Branco: #ffffff (cards/conteudo)
    """
    
    def __init__(self):
        """Inicializa o servico de PDF com configuracoes padrao"""
        
        # ===================================================================
        # CORES DO TEMA - Inspirado em ficha de treino profissional
        # ===================================================================
        self.COR_FUNDO_GRADIENTE_INICIO = colors.HexColor('#0a0e27')  # Azul marinho escuro
        self.COR_FUNDO_GRADIENTE_FIM = colors.HexColor('#1a1a2e')     # Preto azulado
        self.COR_VERDE_BARRA = colors.HexColor('#047857')              # Verde escuro forte (green-700)
        self.COR_ROSA_BARRA = colors.HexColor('#be185d')               # Rosa escuro forte (pink-700)
        self.COR_BRANCO = colors.white                                 # Cards e textos
        self.COR_CARD_FUNDO = colors.white                             # Fundo branco dos cards
        self.COR_TEXTO_ESCURO = colors.HexColor('#1f2937')             # Texto principal
        self.COR_TEXTO_MEDIO = colors.HexColor('#6b7280')              # Texto secundario
        self.COR_SOMBRA = colors.HexColor('#00000033')                 # Sombra suave (33 = 20% opacidade)
        
        # ===================================================================
        # DIMENSOES E ESPACAMENTOS
        # ===================================================================
        self.MARGEM = 2 * cm
        self.LARGURA_BARRA_LATERAL = 1 * cm                            # Barra lateral dos cards
        self.BORDER_RADIUS = 12                                        # Raio das bordas arredondadas
        self.ESPACAMENTO_SECAO = 0.8 * cm
        self.ALTURA_FOTO_RECEITA = 8 * cm      # Espaco reservado para foto da receita
        self.ALTURA_FOTO_INSUMO = 2 * cm       # Espaco para foto de insumo
        
        # ===================================================================
        # ESTILOS DE TEXTO
        # ===================================================================
        self.estilos = self._criar_estilos()
        
        print("PDFService inicializado com sucesso - Design moderno")
    
    def _criar_estilos(self):
        """
        Cria estilos de texto customizados para o PDF.
        Retorna dicionario com estilos configurados.
        """
        estilos = {}
        
        # Estilo para titulo principal
        estilos['titulo_principal'] = ParagraphStyle(
            'TituloPrincipal',
            parent=getSampleStyleSheet()['Heading1'],
            fontSize=24,
            textColor=self.COR_BRANCO,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT,
            spaceAfter=10,
            leading=28
        )
        
        # Estilo para subtitulo (codigo da receita)
        estilos['subtitulo'] = ParagraphStyle(
            'Subtitulo',
            parent=getSampleStyleSheet()['Normal'],
            fontSize=14,
            textColor=self.COR_VERDE_IOGAR,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT,
            spaceAfter=6
        )
        
        # Estilo para titulo de secao
        estilos['titulo_secao'] = ParagraphStyle(
            'TituloSecao',
            parent=getSampleStyleSheet()['Heading2'],
            fontSize=14,
            textColor=self.COR_BRANCO,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            leftIndent=0,
            rightIndent=0
        )
        
        # Estilo para texto normal em cards
        estilos['texto_card'] = ParagraphStyle(
            'TextoCard',
            parent=getSampleStyleSheet()['Normal'],
            fontSize=10,
            textColor=self.COR_TEXTO_ESCURO,
            fontName='Helvetica',
            alignment=TA_LEFT,
            leading=14
        )
        
        # Estilo para texto em destaque
        estilos['texto_destaque'] = ParagraphStyle(
            'TextoDestaque',
            parent=getSampleStyleSheet()['Normal'],
            fontSize=11,
            textColor=self.COR_TEXTO_ESCURO,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT,
            leading=14
        )
        
        # Estilo para valores monetarios
        estilos['valor_monetario'] = ParagraphStyle(
            'ValorMonetario',
            parent=getSampleStyleSheet()['Normal'],
            fontSize=16,
            textColor=self.COR_VERDE_IOGAR,
            fontName='Helvetica-Bold',
            alignment=TA_RIGHT,
            leading=20
        )
        
        return estilos
    
    def _desenhar_barra_lateral(self, canvas, x, y, largura, altura, cor, texto):
        """
        Desenha uma barra lateral colorida com texto rotacionado.
        Similar as barras laranjas da ficha de treino.
        
        Parametros:
            canvas: Canvas do ReportLab
            x, y: Posicao inicial
            largura: Largura da barra
            altura: Altura da barra
            cor: Cor da barra (HexColor)
            texto: Texto a ser exibido rotacionado
        """
        # Desenhar retangulo colorido
        canvas.setFillColor(cor)
        canvas.rect(x, y, largura, altura, fill=True, stroke=False)
        
        # Adicionar texto rotacionado
        canvas.setFillColor(self.COR_BRANCO)
        canvas.setFont('Helvetica-Bold', 12)
        
        # Salvar estado do canvas
        canvas.saveState()
        
        # Rotacionar texto 90 graus e centralizar na barra
        canvas.translate(x + largura/2, y + altura/2)
        canvas.rotate(90)
        canvas.drawCentredString(0, 0, texto.upper())
        
        # Restaurar estado do canvas
        canvas.restoreState()
    
    def _criar_card_branco(self, largura, altura):
        """
        Cria um frame branco arredondado para conteudo.
        Simula os cards brancos da ficha de treino.
        
        Retorna uma tabela com fundo branco e bordas arredondadas.
        """
        return Table(
            [['']], 
            colWidths=[largura],
            rowHeights=[altura],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_CINZA_CLARO),
                ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ]
        )
    
    def _criar_placeholder_foto(self, largura, altura, texto="FOTO"):
        """
        Cria um placeholder visual para onde a foto sera inserida.
        
        Parametros:
            largura: Largura do espaco da foto
            altura: Altura do espaco da foto
            texto: Texto a exibir no placeholder
            
        Retorna um Flowable com o placeholder desenhado.
        """
        from reportlab.platypus import Spacer
        from reportlab.lib.utils import ImageReader
        
        # Criar uma tabela que simula o placeholder
        data = [[Paragraph(
            f'<para align="center"><b>{texto}</b><br/>'
            f'<font size="8" color="#94a3b8">(Espaço reservado para imagem)</font></para>',
            self.estilos['texto_card']
        )]]
        
        tabela_placeholder = Table(
            data,
            colWidths=[largura],
            rowHeights=[altura],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e2e8f0')),
                ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]
        )
        
        return tabela_placeholder
    
    def _criar_card_com_barra_lateral(self, conteudo, largura, altura_minima, cor_barra, texto_barra):
        """
        Cria um card estilo ficha de treino:
        - Fundo branco com bordas arredondadas
        - Barra lateral colorida com texto vertical
        - Sombra suave
        
        Parametros:
            conteudo: Lista de Flowables para o conteudo do card
            largura: Largura total do card
            altura_minima: Altura minima do card
            cor_barra: Cor da barra lateral (HexColor)
            texto_barra: Texto a exibir verticalmente na barra
            
        Retorna:
            Lista de Flowables representando o card completo
        """
        from reportlab.platypus import KeepTogether
        from reportlab.lib.units import mm
        
        # Largura da area de conteudo (descontando a barra lateral)
        largura_conteudo = largura - self.LARGURA_BARRA_LATERAL - 0.5*cm
        
        # Criar tabela principal do card (barra + conteudo)
        # Barra lateral
        texto_vertical = Paragraph(
            f'<para alignment="center"><b>{texto_barra.upper()}</b></para>',
            ParagraphStyle(
                'TextoVertical',
                fontSize=11,
                textColor=self.COR_BRANCO,
                fontName='Helvetica-Bold',
                alignment=TA_CENTER
            )
        )
        
        # Tabela com barra lateral + area de conteudo
        card_completo = Table(
            [[texto_vertical, conteudo]],
            colWidths=[self.LARGURA_BARRA_LATERAL, largura_conteudo],
            style=[
                # Fundo branco para area de conteudo
                ('BACKGROUND', (1, 0), (1, 0), self.COR_CARD_FUNDO),
                
                # Barra lateral colorida
                ('BACKGROUND', (0, 0), (0, 0), cor_barra),
                
                # Bordas arredondadas (simular com BOX)
                ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#e5e7eb')),
                
                # Sombra (simular com borda mais escura levemente deslocada)
                # ReportLab não tem sombra nativa, então usamos borda cinza
                
                # Alinhamento vertical
                ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
                ('VALIGN', (1, 0), (1, 0), 'TOP'),
                
                # Padding
                ('LEFTPADDING', (0, 0), (0, 0), 0),
                ('RIGHTPADDING', (0, 0), (0, 0), 0),
                ('TOPPADDING', (0, 0), (0, 0), 0),
                ('BOTTOMPADDING', (0, 0), (0, 0), 0),
                
                ('LEFTPADDING', (1, 0), (1, 0), 15),
                ('RIGHTPADDING', (1, 0), (1, 0), 15),
                ('TOPPADDING', (1, 0), (1, 0), 15),
                ('BOTTOMPADDING', (1, 0), (1, 0), 15),
            ]
        )
        
        return card_completo
    
    def _desenhar_fundo_com_marca_dagua(self, canvas, doc):
        """
        Desenha o fundo da página com:
        - Gradiente escuro (azul marinho para preto)
        - Logo IOGAR em marca d'agua (translúcido) nos cantos
        
        Este método é chamado automaticamente para cada página.
        """
        from reportlab.lib.utils import ImageReader
        import os
        
        # Obter dimensões da página
        page_width = doc.pagesize[0]
        page_height = doc.pagesize[1]
        
        # ===================================================================
        # DESENHAR GRADIENTE DE FUNDO
        # ===================================================================
        # ReportLab não tem gradiente nativo, então vamos simular com retângulos
        # graduais de cores entre azul marinho escuro e preto azulado
        
        num_faixas = 50  # Número de faixas para simular gradiente suave
        altura_faixa = page_height / num_faixas
        
        for i in range(num_faixas):
            # Interpolar entre cor inicial e final
            ratio = i / num_faixas
            
            # Interpolar RGB
            r1, g1, b1 = 10/255, 14/255, 39/255   # #0a0e27 (início)
            r2, g2, b2 = 26/255, 26/255, 46/255   # #1a1a2e (fim)
            
            r = r1 + (r2 - r1) * ratio
            g = g1 + (g2 - g1) * ratio
            b = b1 + (b2 - b1) * ratio
            
            canvas.setFillColorRGB(r, g, b)
            canvas.rect(0, page_height - (i + 1) * altura_faixa, page_width, altura_faixa, fill=True, stroke=False)
        
        # ===================================================================
        # DESENHAR LOGOS EM MARCA D'AGUA
        # ===================================================================
        logo_path = os.path.join(
            os.path.dirname(__file__),
            'templates', 'pdf', 'assets', 'iogar_logo.png'
        )
        
        if os.path.exists(logo_path):
            try:
                # Carregar imagem
                img = ImageReader(logo_path)
                img_width, img_height = img.getSize()
                
                # Calcular dimensões da marca d'agua (20% do tamanho da página)
                marca_width = page_width * 0.2
                marca_height = (img_height / img_width) * marca_width
                
                # Salvar estado do canvas
                canvas.saveState()
                
                # Aplicar opacidade (translúcido - 15%)
                canvas.setFillAlpha(0.15)
                canvas.setStrokeAlpha(0.15)
                
                # Logo no canto superior direito
                x_superior = page_width - marca_width - 2*cm
                y_superior = page_height - marca_height - 2*cm
                canvas.drawImage(logo_path, x_superior, y_superior, 
                               width=marca_width, height=marca_height, 
                               mask='auto', preserveAspectRatio=True)
                
                # Logo no canto inferior esquerdo
                x_inferior = 2*cm
                y_inferior = 2*cm
                canvas.drawImage(logo_path, x_inferior, y_inferior, 
                               width=marca_width, height=marca_height, 
                               mask='auto', preserveAspectRatio=True)
                
                # Restaurar estado do canvas
                canvas.restoreState()
                
            except Exception as e:
                print(f"⚠️ Aviso: Não foi possível carregar logo para marca d'agua: {e}")
        else:
            print(f"⚠️ Aviso: Logo não encontrado em: {logo_path}")
    
    
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
        status_receita = (receita_data.get('status') or 'N/A').lower()
        
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
    
    
    def gerar_pdf_receita(self, receita_data: Dict[str, Any], output_path: str) -> str:
        """
        Gera PDF de uma receita com design moderno inspirado em fichas tecnicas.
        
        Parametros:
            receita_data: Dicionario com dados da receita
            output_path: Caminho completo onde o PDF sera salvo
            
        Retorna:
            str: Caminho do arquivo PDF gerado
        """
        print(f"Gerando PDF da receita: {receita_data.get('nome', 'Sem nome')}")
        
        # ===================================================================
        # CONFIGURACAO DO DOCUMENTO
        # ===================================================================
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=self.MARGEM,
            leftMargin=self.MARGEM + self.LARGURA_BARRA_LATERAL,
            topMargin=self.MARGEM,
            bottomMargin=self.MARGEM,
            title=f"Receita - {receita_data.get('codigo', 'SEM-CODIGO')}"
        )
        
        # Lista de elementos que compoem o PDF
        elementos = []
        
        # ===================================================================
        # SECAO 1: CABECALHO COM FUNDO ESCURO
        # ===================================================================
        
        # Titulo "FICHA TÉCNICA"
        titulo_ficha = Paragraph(
            '<b>RELATÓRIO COMPLETO</b>',
            self.estilos['titulo_principal']
        )
        
        # Tabela de cabecalho com fundo escuro
        cabecalho_data = [[titulo_ficha]]
        tabela_cabecalho = Table(
            cabecalho_data,
            colWidths=[doc.width],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_FUNDO_ESCURO),
                ('LEFTPADDING', (0, 0), (-1, -1), 20),
                ('RIGHTPADDING', (0, 0), (-1, -1), 20),
                ('TOPPADDING', (0, 0), (-1, -1), 15),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ]
        )
        elementos.append(tabela_cabecalho)
        elementos.append(Spacer(1, self.ESPACAMENTO_SECAO))
        
        # ===================================================================
        # SECAO 2: NOME DA RECEITA E CODIGO
        # ===================================================================
        
        # Card com nome da receita
        nome_receita = receita_data.get('nome', 'Sem nome').upper()
        codigo_receita = receita_data.get('codigo', 'SEM-CODIGO')
        
        nome_formatado = Paragraph(
            f'<b>NOME:</b><br/><br/>'
            f'<font size="16" color="#0f172a"><b>{nome_receita}</b></font><br/><br/>'
            f'<font size="11" color="#16a34a"><b>Código: {codigo_receita}</b></font>',
            self.estilos['texto_card']
        )
        
        tabela_nome = Table(
            [[nome_formatado]],
            colWidths=[doc.width],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_CINZA_CLARO),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 18),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ]
        )
        elementos.append(tabela_nome)
        elementos.append(Spacer(1, self.ESPACAMENTO_SECAO))
        
        # ===================================================================
        # SECAO 3: ESPACO PARA FOTO DA RECEITA
        # ===================================================================
        
        placeholder_foto = self._criar_placeholder_foto(
            largura=doc.width,
            altura=self.ALTURA_FOTO_RECEITA,
            texto="FOTO DA RECEITA"
        )
        elementos.append(placeholder_foto)
        elementos.append(Spacer(1, self.ESPACAMENTO_SECAO))

        # ===================================================================
        # SECAO 4: INFORMACOES DA RECEITA (Cards lado a lado)
        # ===================================================================
        
        categoria = receita_data.get('categoria', 'Sem categoria')
        status = receita_data.get('status', 'ativo')
        rendimento = receita_data.get('rendimento', 0)
        tempo_preparo = receita_data.get('tempo_preparo', 0)
        responsavel = receita_data.get('responsavel', 'Não informado')
        
        # Criar 3 cards de informacao
        info_col1 = Paragraph(
            f'<b>CATEGORIA</b><br/>'
            f'<font color="#475569">{categoria}</font><br/><br/>'
            f'<b>STATUS</b><br/>'
            f'<font color="#22c55e"><b>● {status.upper()}</b></font>',
            self.estilos['texto_card']
        )
        
        info_col2 = Paragraph(
            f'<b>RENDIMENTO</b><br/>'
            f'<font color="#475569">{rendimento} porções</font><br/><br/>'
            f'<b>TEMPO DE PREPARO</b><br/>'
            f'<font color="#475569">{tempo_preparo} minutos</font>',
            self.estilos['texto_card']
        )
        
        info_col3 = Paragraph(
            f'<b>RESPONSÁVEL</b><br/>'
            f'<font color="#475569">{responsavel}</font>',
            self.estilos['texto_card']
        )
        
        # Tabela com 3 colunas de informacoes
        largura_col = (doc.width - 20) / 3
        tabela_info = Table(
            [[info_col1, info_col2, info_col3]],
            colWidths=[largura_col, largura_col, largura_col],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_CINZA_CLARO),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]
        )
        elementos.append(tabela_info)
        elementos.append(Spacer(1, self.ESPACAMENTO_SECAO * 1.5))
        
        # ===================================================================
        # QUEBRA DE PÁGINA - Ingredientes sempre em nova página
        # ===================================================================
        from reportlab.platypus import PageBreak
        elementos.append(PageBreak())
        
        # ===================================================================
        # SECAO 5: INGREDIENTES (com barra lateral verde)
        # ===================================================================
        
        # Titulo da secao com fundo verde
        titulo_ingredientes = Paragraph(
            '<b>INGREDIENTES</b>',
            self.estilos['titulo_secao']
        )
        
        tabela_titulo_ing = Table(
            [[titulo_ingredientes]],
            colWidths=[doc.width],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_VERDE_IOGAR),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]
        )
        elementos.append(tabela_titulo_ing)
        elementos.append(Spacer(1, 0.3 * cm))
        
        # Tabela de ingredientes
        ingredientes = receita_data.get('ingredientes', [])
        
        if ingredientes:
            # Cabecalho da tabela
            dados_ingredientes = [[
                Paragraph('<b>Nº</b>', self.estilos['texto_destaque']),
                Paragraph('<b>INGREDIENTE</b>', self.estilos['texto_destaque']),
                Paragraph('<b>FOTO</b>', self.estilos['texto_destaque']),
                Paragraph('<b>QTD</b>', self.estilos['texto_destaque']),
                Paragraph('<b>UNID</b>', self.estilos['texto_destaque']),
                Paragraph('<b>CUSTO</b>', self.estilos['texto_destaque']),
            ]]
            
            # Linhas de ingredientes
            for idx, ing in enumerate(ingredientes, 1):
                nome_ing = ing.get('nome', 'Sem nome')
                qtd = ing.get('quantidade', 0)
                unidade = ing.get('unidade', '')
                custo = ing.get('custo_total', 0)
                
                # Placeholder para foto do insumo (pequeno)
                foto_insumo = self._criar_placeholder_foto(
                    largura=2*cm,
                    altura=1.5*cm,
                    texto="📷"
                )
                
                dados_ingredientes.append([
                    Paragraph(f'{idx:02d}', self.estilos['texto_card']),
                    Paragraph(nome_ing, self.estilos['texto_card']),
                    foto_insumo,
                    Paragraph(f'{qtd:.3f}', self.estilos['texto_card']),
                    Paragraph(unidade, self.estilos['texto_card']),
                    Paragraph(f'R$ {custo:.2f}', self.estilos['texto_card']),
                ])
            
            # Criar tabela de ingredientes
            tabela_ingredientes = Table(
                dados_ingredientes,
                colWidths=[1*cm, 5*cm, 2.5*cm, 2*cm, 1.5*cm, 2.5*cm],
                style=[
                    # Cabecalho
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), self.COR_TEXTO_ESCURO),
                    
                    # Linhas alternadas
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [self.COR_BRANCO, colors.HexColor('#f8fafc')]),
                    
                    # Bordas
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
                    
                    # Alinhamento
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Numero centralizado
                    ('ALIGN', (2, 0), (2, -1), 'CENTER'),  # Foto centralizada
                    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),   # Quantidade a direita
                    ('ALIGN', (5, 0), (5, -1), 'RIGHT'),   # Custo a direita
                    
                    # Padding
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]
            )
            # Configurar tabela para evitar quebra de linha deixando apenas 1 ingrediente
            # Se houver mais de 3 ingredientes, permitir quebra; caso contrario, manter junto
            if len(ingredientes) > 3:
                tabela_ingredientes.hAlign = 'LEFT'
                tabela_ingredientes.keepWithNext = False
                # Aplicar splitByRow para controle de quebra
                tabela_ingredientes.splitByRow = True
                # Minimo de 3 linhas (cabecalho + 2 ingredientes) antes de quebrar
                tabela_ingredientes._splitRowIndex = 3
            else:
                # Para poucas linhas, manter tudo junto na mesma pagina
                tabela_ingredientes.keepWithNext = True
            elementos.append(tabela_ingredientes)
        else:
            # Mensagem caso nao haja ingredientes
            msg_sem_ingredientes = Paragraph(
                '<i>Nenhum ingrediente cadastrado para esta receita.</i>',
                self.estilos['texto_card']
            )
            elementos.append(msg_sem_ingredientes)
        
        elementos.append(Spacer(1, self.ESPACAMENTO_SECAO * 1.5))

        # ===================================================================
        # SECAO 6: PRECIFICACAO (com barra lateral rosa)
        # ===================================================================
        
        precificacao = receita_data.get('precificacao', {})
        
        if precificacao:
            # Titulo da secao com fundo rosa
            titulo_precificacao = Paragraph(
                '<b>PRECIFICAÇÃO</b>',
                self.estilos['titulo_secao']
            )
            
            tabela_titulo_prec = Table(
                [[titulo_precificacao]],
                colWidths=[doc.width],
                style=[
                    ('BACKGROUND', (0, 0), (-1, -1), self.COR_ROSA_IOGAR),
                    ('LEFTPADDING', (0, 0), (-1, -1), 15),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]
            )
            elementos.append(tabela_titulo_prec)
            elementos.append(Spacer(1, 0.3 * cm))
            
            # Extrair valores
            cmv_total = precificacao.get('cmv', 0)
            cmv_unitario = precificacao.get('cmv_unitario', 0)
            margem = precificacao.get('margem_sugerida', 0)
            preco_sugerido = precificacao.get('preco_sugerido', 0)
            preco_atual = precificacao.get('preco_venda_atual')
            
            # Cards de precificacao (2x2) com espaçamento aumentado
            card_cmv_total = Paragraph(
                f'<b>CMV TOTAL</b><br/><br/>'
                f'<font size="20" color="#db2777"><b>R$ {cmv_total:.2f}</b></font>',
                self.estilos['texto_card']
            )
            
            card_cmv_unit = Paragraph(
                f'<b>CMV UNITÁRIO</b><br/><br/>'
                f'<font size="16" color="#475569"><b>R$ {cmv_unitario:.2f}</b></font>',
                self.estilos['texto_card']
            )
            
            card_margem = Paragraph(
                f'<b>MARGEM SUGERIDA</b><br/><br/>'
                f'<font size="16" color="#16a34a"><b>{margem:.1f}%</b></font>',
                self.estilos['texto_card']
            )
            
            card_preco = Paragraph(
                f'<b>PREÇO SUGERIDO</b><br/><br/>'
                f'<font size="20" color="#16a34a"><b>R$ {preco_sugerido:.2f}</b></font>',
                self.estilos['texto_card']
            )
            
            # Tabela 2x2 de cards de precificacao com mais espaço
            largura_card_prec = (doc.width - 15) / 2
            tabela_precificacao = Table(
                [
                    [card_cmv_total, card_cmv_unit],
                    [card_margem, card_preco]
                ],
                colWidths=[largura_card_prec, largura_card_prec],
                rowHeights=[2.5*cm, 2.5*cm],
                style=[
                    ('BACKGROUND', (0, 0), (-1, -1), self.COR_CINZA_CLARO),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 20),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 20),
                    ('TOPPADDING', (0, 0), (-1, -1), 20),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
                ]
            )
            elementos.append(tabela_precificacao)
            
            # Preco de venda atual (se houver)
            if preco_atual:
                elementos.append(Spacer(1, 0.5 * cm))
                preco_atual_info = Paragraph(
                    f'<b>Preço de Venda Atual:</b> <font color="#22c55e"><b>R$ {preco_atual:.2f}</b></font>',
                    self.estilos['texto_destaque']
                )
                tabela_preco_atual = Table(
                    [[preco_atual_info]],
                    colWidths=[doc.width],
                    style=[
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
                        ('BOX', (0, 0), (-1, -1), 1, self.COR_VERDE_IOGAR),
                        ('LEFTPADDING', (0, 0), (-1, -1), 12),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                        ('TOPPADDING', (0, 0), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ]
                )
                elementos.append(tabela_preco_atual)
        
        # ===================================================================
        # SECAO 7: RODAPE
        # ===================================================================
        
        elementos.append(Spacer(1, 1.5 * cm))
        
        data_geracao = datetime.now().strftime('%d/%m/%Y às %H:%M')
        rodape_texto = Paragraph(
            f'<para align="center">'
            f'<font size="8" color="#94a3b8">'
            f'Gerado em: {data_geracao} | Sistema IOGAR Food Cost'
            f'</font>'
            f'</para>',
            self.estilos['texto_card']
        )
        
        tabela_rodape = Table(
            [[rodape_texto]],
            colWidths=[doc.width],
            style=[
                ('BACKGROUND', (0, 0), (-1, -1), self.COR_FUNDO_ESCURO),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]
        )
        elementos.append(tabela_rodape)
        
        # ===================================================================
        # GERAR O PDF
        # ===================================================================
        
        doc.build(elementos)
        
        print(f"PDF gerado com sucesso: {output_path}")
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