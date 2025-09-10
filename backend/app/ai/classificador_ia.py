# ============================================================================
# SISTEMA DE IA LOCAL GRATUITA - CLASSIFICADOR DE INSUMOS
# ============================================================================
# Descrição: Core da IA para classificação automática de insumos em taxonomia
# Tecnologias: spaCy, fuzzywuzzy, re, json (100% gratuito)
# Sistema de aprendizado com feedback do usuário
# Data: 10/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import json
import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from datetime import datetime
import unicodedata

# Bibliotecas gratuitas para NLP
try:
    import spacy
    from spacy.lang.pt import Portuguese
except ImportError:
    spacy = None
    Portuguese = None

try:
    from fuzzywuzzy import fuzz, process
except ImportError:
    fuzz = None
    process = None

from collections import Counter
from sqlalchemy.orm import Session

# Imports do projeto
from app.crud import taxonomia as crud_taxonomia
from app.models.taxonomia import Taxonomia

# ============================================================================
# CONFIGURAÇÕES E CONSTANTES
# ============================================================================

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Caminhos dos arquivos de conhecimento
BASE_CONHECIMENTO_PATH = Path("backend/app/ai/data/base_conhecimento.json")
PADROES_APRENDIDOS_PATH = Path("backend/app/ai/data/padroes_aprendidos.json")
LOGS_FEEDBACK_PATH = Path("backend/app/ai/data/logs_feedback.json")

# Criar diretórios se não existirem
BASE_CONHECIMENTO_PATH.parent.mkdir(parents=True, exist_ok=True)

# ============================================================================
# CLASSE PRINCIPAL DO CLASSIFICADOR IA
# ============================================================================

class ClassificadorIA:
    """
    Sistema de IA local gratuita para classificação automática de insumos.
    
    Funcionalidades:
    - Análise NLP de nomes de produtos
    - Classificação em taxonomia hierárquica 
    - Sistema de scoring e confiança
    - Aprendizado contínuo com feedback
    - Base de conhecimento evolutiva
    
    Tecnologias utilizadas:
    - spaCy: processamento de linguagem natural
    - fuzzywuzzy: similaridade entre strings
    - JSON: base de conhecimento local
    - regex: limpeza e normalização
    """
    
    def __init__(self, db_session: Session = None):
        """
        Inicializa o classificador IA integrado ao sistema existente.
        
        Args:
            db_session: Sessão do banco para acessar taxonomias
        """
        self.db_session = db_session
        self.nlp = None
        self.padroes_aprendidos = {}
        
        # Inicializar componentes
        self._inicializar_nlp()
        self._carregar_padroes_aprendidos()
        
        # Importar CRUDs do sistema existente
        from app.crud import taxonomia as crud_taxonomia
        from app.crud import taxonomia_alias as crud_alias
        from app.utils import mapeamento_inteligente
        
        self.crud_taxonomia = crud_taxonomia
        self.crud_alias = crud_alias
        self.mapeamento_inteligente = mapeamento_inteligente
        
        # Inicializar componentes
        self._inicializar_nlp()
        self._carregar_base_conhecimento()
        self._carregar_padroes_aprendidos()
        
        logger.info("ClassificadorIA inicializado com sucesso")
    
    def _inicializar_nlp(self) -> None:
        """
        Inicializa processador de linguagem natural.
        
        Tenta carregar modelo português do spaCy, 
        senão usa processamento básico.
        """
        try:
            if spacy:
                # Tentar carregar modelo português
                try:
                    self.nlp = spacy.load("pt_core_news_sm")
                    logger.info("Modelo spaCy português carregado")
                except OSError:
                    # Modelo não instalado, usar processador básico
                    self.nlp = Portuguese()
                    logger.warning("Modelo pt_core_news_sm não encontrado, usando processador básico")
            else:
                logger.warning("spaCy não instalado, usando processamento básico de texto")
        except Exception as e:
            logger.error(f"Erro ao inicializar NLP: {e}")
            self.nlp = None
    
    def _carregar_base_conhecimento(self) -> None:
        """
        Carrega base de conhecimento do arquivo JSON.
        
        Se arquivo não existir, cria estrutura inicial.
        """
        try:
            if BASE_CONHECIMENTO_PATH.exists():
                with open(BASE_CONHECIMENTO_PATH, 'r', encoding='utf-8') as file:
                    self.base_conhecimento = json.load(file)
                logger.info(f"Base de conhecimento carregada: {len(self.base_conhecimento)} entradas")
            else:
                # Criar base inicial
                self.base_conhecimento = self._criar_base_conhecimento_inicial()
                self._salvar_base_conhecimento()
                logger.info("Base de conhecimento inicial criada")
        except Exception as e:
            logger.error(f"Erro ao carregar base de conhecimento: {e}")
            self.base_conhecimento = self._criar_base_conhecimento_inicial()
    
    def _carregar_padroes_aprendidos(self) -> None:
        """
        Carrega padrões aprendidos do arquivo JSON.
        
        Padrões incluem: sufixos de unidade, prefixos de marca,
        palavras de estado, termos regionais, etc.
        """
        try:
            if PADROES_APRENDIDOS_PATH.exists():
                with open(PADROES_APRENDIDOS_PATH, 'r', encoding='utf-8') as file:
                    self.padroes_aprendidos = json.load(file)
                logger.info("Padrões aprendidos carregados")
            else:
                # Criar padrões iniciais
                self.padroes_aprendidos = self._criar_padroes_iniciais()
                self._salvar_padroes_aprendidos()
                logger.info("Padrões iniciais criados")
        except Exception as e:
            logger.error(f"Erro ao carregar padrões aprendidos: {e}")
            self.padroes_aprendidos = self._criar_padroes_iniciais()
    
    def _analisar_nlp_complementar(self, nome_produto: str) -> List[Dict]:
    """
    Análise NLP complementar quando sistema existente não encontra correspondência.
    
    Args:
        nome_produto: Nome do produto para análise
        
    Returns:
        Lista de candidatos baseados em análise NLP
    """
    candidatos = []
    tokens = self.extrair_tokens(nome_produto)
    
    if len(tokens) < 1:
        return candidatos
    
    # Padrões básicos baseados em palavras-chave conhecidas
    padroes_categorias = {
        'carnes': ['alcatra', 'bife', 'lombo', 'frango', 'peito', 'carne'],
        'peixes': ['salmao', 'salmão', 'tilapia', 'peixe', 'file'],
        'verduras': ['tomate', 'cebola', 'alface', 'verdura'],
        'laticinios': ['leite', 'queijo', 'iogurte', 'manteiga'],
        'temperos': ['sal', 'pimenta', 'oregano', 'tempero'],
        'oleos': ['oleo', 'óleo', 'azeite']
    }
    
    for categoria, palavras_chave in padroes_categorias.items():
        for token in tokens:
            for palavra in palavras_chave:
                similaridade = self.calcular_similaridade(token, palavra)
                if similaridade > 0.7:
                    candidatos.append({
                        "tipo": "nlp_analise",
                        "categoria_sugerida": categoria.title(),
                        "score": similaridade * 0.6,  # Score reduzido para priorizar sistema existente
                        "fonte": "analise_nlp",
                        "palavra_encontrada": palavra
                    })
    
    return candidatos

    def _remover_duplicatas_taxonomias(self, candidatos: List[Dict]) -> List[Dict]:
        """Remove candidatos duplicados baseados na taxonomia."""
        candidatos_unicos = []
        taxonomias_vistas = set()
        
        for candidato in candidatos:
            # Identificador único da taxonomia
            if candidato.get("taxonomia"):
                taxonomia = candidato["taxonomia"]
                identificador = f"{taxonomia.categoria}_{taxonomia.subcategoria}_{taxonomia.especificacao}"
            elif candidato.get("taxonomia_data"):
                data = candidato["taxonomia_data"]
                identificador = f"{data.get('categoria', '')}_{data.get('subcategoria', '')}_{data.get('especificacao', '')}"
            else:
                identificador = candidato.get("categoria_sugerida", str(len(candidatos_unicos)))
            
            if identificador not in taxonomias_vistas:
                taxonomias_vistas.add(identificador)
                candidatos_unicos.append(candidato)
        
        return candidatos_unicos

    def _buscar_taxonomia_por_classificacao(self, classificacao: Dict):
        """Busca taxonomia no banco baseada na classificação sugerida."""
        if not self.db_session:
            return None
        
        try:
            return self.crud_taxonomia.get_taxonomia_by_hierarquia(
                db=self.db_session,
                categoria=classificacao.get("categoria"),
                subcategoria=classificacao.get("subcategoria"),
                especificacao=classificacao.get("especificacao"),
                variante=classificacao.get("variante")
            )
        except Exception as e:
            logger.error(f"Erro ao buscar taxonomia: {e}")
            return None

    def _buscar_ou_criar_taxonomia(self, taxonomia_data: Dict):
        """Busca taxonomia existente ou cria nova se não existir."""
        if not self.db_session:
            return None
        
        try:
            # Primeiro tentar buscar existente
            taxonomia = self.crud_taxonomia.get_taxonomia_by_hierarquia(
                db=self.db_session,
                categoria=taxonomia_data.get("categoria"),
                subcategoria=taxonomia_data.get("subcategoria"),
                especificacao=taxonomia_data.get("especificacao"),
                variante=taxonomia_data.get("variante")
            )
            
            if taxonomia:
                return taxonomia
            
            # Criar nova taxonomia se não existir
            from app.schemas.taxonomia import TaxonomiaCreate
            
            nova_taxonomia = TaxonomiaCreate(
                categoria=taxonomia_data["categoria"],
                subcategoria=taxonomia_data["subcategoria"],
                especificacao=taxonomia_data.get("especificacao"),
                variante=taxonomia_data.get("variante"),
                descricao=f"Criada automaticamente via IA para produto: {taxonomia_data.get('produto_origem', 'N/A')}",
                ativo=True
            )
            
            return self.crud_taxonomia.create_taxonomia(db=self.db_session, taxonomia=nova_taxonomia)
            
        except Exception as e:
            logger.error(f"Erro ao buscar/criar taxonomia: {e}")
            return None            
    
    def _salvar_padroes_aprendidos(self) -> None:
        """Salva padrões aprendidos no arquivo JSON."""
        try:
            with open(PADROES_APRENDIDOS_PATH, 'w', encoding='utf-8') as file:
                json.dump(self.padroes_aprendidos, file, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Erro ao salvar padrões aprendidos: {e}")
    
    def normalizar_texto(self, texto: str) -> str:
        """
        Normaliza texto removendo acentos, caracteres especiais e convertendo para minúsculas.
        
        Args:
            texto (str): Texto original
            
        Returns:
            str: Texto normalizado
        """
        if not texto:
            return ""
        
        # Converter para minúsculas
        texto = texto.lower()
        
        # Remover acentos
        texto = unicodedata.normalize('NFD', texto)
        texto = ''.join(char for char in texto if unicodedata.category(char) != 'Mn')
        
        # Remover caracteres especiais e números (exceto espaços e hífens)
        texto = re.sub(r'[^\w\s\-]', ' ', texto)
        
        # Normalizar espaços múltiplos
        texto = re.sub(r'\s+', ' ', texto).strip()
        
        return texto
    
    def extrair_tokens(self, nome_produto: str) -> List[str]:
        """
        Extrai tokens (palavras) relevantes do nome do produto.
        
        Args:
            nome_produto (str): Nome do produto a ser analisado
            
        Returns:
            List[str]: Lista de tokens extraídos
        """
        texto_normalizado = self.normalizar_texto(nome_produto)
        
        if self.nlp:
            # Usar spaCy para tokenização avançada
            doc = self.nlp(texto_normalizado)
            tokens = [token.lemma_ for token in doc if not token.is_stop and len(token.text) > 2]
        else:
            # Tokenização básica
            tokens = texto_normalizado.split()
        
        # Remover palavras irrelevantes usando padrões aprendidos
        palavras_ignorar = self.padroes_aprendidos.get("palavras_ignorar", [])
        tokens_filtrados = [token for token in tokens if token not in palavras_ignorar]
        
        # Remover sufixos de unidade
        sufixos_unidade = self.padroes_aprendidos.get("sufixos_unidade", [])
        tokens_sem_unidade = [token for token in tokens_filtrados if token not in sufixos_unidade]
        
        return tokens_sem_unidade
    
    def calcular_similaridade(self, texto1: str, texto2: str) -> float:
        """
        Calcula similaridade entre dois textos usando fuzzywuzzy.
        
        Args:
            texto1 (str): Primeiro texto
            texto2 (str): Segundo texto
            
        Returns:
            float: Score de similaridade (0.0 a 1.0)
        """
        if not fuzz:
            # Fallback simples se fuzzywuzzy não estiver disponível
            return 1.0 if texto1.lower() == texto2.lower() else 0.0
        
        # Normalizar ambos os textos
        texto1_norm = self.normalizar_texto(texto1)
        texto2_norm = self.normalizar_texto(texto2)
        
        # Usar diferentes algoritmos do fuzzywuzzy e pegar a melhor pontuação
        ratio = fuzz.ratio(texto1_norm, texto2_norm)
        partial_ratio = fuzz.partial_ratio(texto1_norm, texto2_norm)
        token_sort = fuzz.token_sort_ratio(texto1_norm, texto2_norm)
        token_set = fuzz.token_set_ratio(texto1_norm, texto2_norm)
        
        # Retornar a melhor pontuação convertida para 0.0-1.0
        melhor_score = max(ratio, partial_ratio, token_sort, token_set)
        return melhor_score / 100.0
    
    def buscar_taxonomias_existentes(self, nome_produto: str) -> List[Dict]:
        """
        Busca correspondências no sistema de taxonomias e aliases existente.
        
        Args:
            nome_produto (str): Nome do produto a ser classificado
            
        Returns:
            List[Dict]: Lista de possíveis classificações com score
        """
        if not self.db_session:
            return []
        
        candidatos = []
        
        # 1. Buscar no sistema de aliases existente
        try:
            aliases_encontrados = self.crud_alias.buscar_aliases_por_termo(
                db=self.db_session, 
                termo=nome_produto, 
                limite=5
            )
            
            for alias_match in aliases_encontrados:
                if alias_match.taxonomia:
                    candidatos.append({
                        "tipo": "alias_existente",
                        "taxonomia": alias_match.taxonomia,
                        "score": alias_match.confianca / 100.0,
                        "fonte": "sistema_aliases"
                    })
        except Exception as e:
            logger.warning(f"Erro ao buscar aliases: {e}")
        
        # 2. Usar mapeamento inteligente existente
        try:
            sugestoes_mapeamento = self.mapeamento_inteligente.sugerir_taxonomias_inteligente(
                db=self.db_session,
                nome_insumo=nome_produto,
                limite=3
            )
            
            for sugestao in sugestoes_mapeamento:
                candidatos.append({
                    "tipo": "mapeamento_inteligente",
                    "taxonomia_data": sugestao,
                    "score": sugestao.get('score', 0.0),
                    "fonte": "mapeamento_existente"
                })
        except Exception as e:
            logger.warning(f"Erro no mapeamento inteligente: {e}")
        
        # 3. Complementar com análise NLP própria
        candidatos_nlp = self._analisar_nlp_complementar(nome_produto)
        candidatos.extend(candidatos_nlp)
        
        # Ordenar por score e remover duplicatas
        candidatos_unicos = self._remover_duplicatas_taxonomias(candidatos)
        candidatos_unicos.sort(key=lambda x: x["score"], reverse=True)
        
        return candidatos_unicos[:5]
    
    def classificar_produto(self, nome_produto: str) -> Dict[str, Any]:
        """
        Classifica um produto usando sistema integrado (aliases + mapeamento + IA).
        """
        if not nome_produto or not nome_produto.strip():
            return {
                "sucesso": False,
                "erro": "Nome do produto não pode estar vazio",
                "confianca": 0.0
            }
        
        try:
            # Buscar usando sistema integrado
            candidatos = self.buscar_taxonomias_existentes(nome_produto)
            
            if not candidatos:
                return {
                    "sucesso": False,
                    "motivo": "Nenhuma correspondência encontrada no sistema",
                    "termo_analisado": nome_produto,
                    "tokens_extraidos": self.extrair_tokens(nome_produto),
                    "confianca": 0.0,
                    "requer_aprendizado": True,
                    "sugestao_acao": "Considere adicionar manualmente ao sistema de taxonomias"
                }
            
            # Processar melhor candidato
            melhor_candidato = candidatos[0]
            
            # Converter resultado baseado na fonte
            if melhor_candidato["tipo"] == "alias_existente":
                taxonomia = melhor_candidato["taxonomia"]
                return {
                    "sucesso": True,
                    "categoria": taxonomia.categoria,
                    "subcategoria": taxonomia.subcategoria,
                    "especificacao": taxonomia.especificacao,
                    "variante": taxonomia.variante,
                    "taxonomia_id": taxonomia.id,
                    "codigo_taxonomia": taxonomia.codigo_taxonomia,
                    "confianca": melhor_candidato["score"],
                    "fonte": "sistema_aliases",
                    "termo_analisado": nome_produto,
                    "detalhes_match": {
                        "tipo": "alias",
                        "fonte": "sistema_existente"
                    },
                    "alternativas": self._formatar_alternativas(candidatos[1:3]),
                    "requer_revisao": melhor_candidato["score"] < 0.8
                }
                
            elif melhor_candidato["tipo"] == "mapeamento_inteligente":
                data = melhor_candidato["taxonomia_data"]
                return {
                    "sucesso": True,
                    "categoria": data.get("categoria"),
                    "subcategoria": data.get("subcategoria"),
                    "especificacao": data.get("especificacao"),
                    "variante": data.get("variante"),
                    "taxonomia_id": data.get("taxonomia_id"),
                    "codigo_taxonomia": data.get("codigo_taxonomia"),
                    "confianca": melhor_candidato["score"],
                    "fonte": "mapeamento_inteligente",
                    "termo_analisado": nome_produto,
                    "detalhes_match": {
                        "tipo": "mapeamento",
                        "palavras_encontradas": data.get("palavras_encontradas", [])
                    },
                    "alternativas": self._formatar_alternativas(candidatos[1:3]),
                    "requer_revisao": melhor_candidato["score"] < 0.7
                }
                
            else:  # Análise NLP complementar
                return {
                    "sucesso": True,
                    "categoria": melhor_candidato.get("categoria_sugerida"),
                    "subcategoria": "A definir",  # NLP não define subcategoria
                    "especificacao": None,
                    "variante": None,
                    "confianca": melhor_candidato["score"],
                    "fonte": "analise_nlp",
                    "termo_analisado": nome_produto,
                    "detalhes_match": {
                        "tipo": "nlp",
                        "palavra_encontrada": melhor_candidato.get("palavra_encontrada")
                    },
                    "alternativas": [],
                    "requer_revisao": True,  # NLP sempre requer revisão
                    "sugestao_acao": "Revise e complete a classificação manualmente"
                }
                
        except Exception as e:
            logger.error(f"Erro na classificação: {e}")
            return {
                "sucesso": False,
                "erro": f"Erro interno: {str(e)}",
                "confianca": 0.0
            }

    def _formatar_alternativas(self, candidatos: List[Dict]) -> List[Dict]:
        """Formata candidatos alternativos para resposta."""
        alternativas = []
        
        for candidato in candidatos:
            if candidato["tipo"] == "alias_existente":
                taxonomia = candidato["taxonomia"]
                alternativas.append({
                    "categoria": taxonomia.categoria,
                    "subcategoria": taxonomia.subcategoria,
                    "especificacao": taxonomia.especificacao,
                    "variante": taxonomia.variante,
                    "confianca": candidato["score"]
                })
            elif candidato["tipo"] == "mapeamento_inteligente":
                data = candidato["taxonomia_data"]
                alternativas.append({
                    "categoria": data.get("categoria"),
                    "subcategoria": data.get("subcategoria"),
                    "especificacao": data.get("especificacao"),
                    "variante": data.get("variante"),
                    "confianca": candidato["score"]
                })
        
        return alternativas
    
    def registrar_feedback(self, nome_produto: str, classificacao_sugerida: Dict, 
                          acao: str, taxonomia_correta: Dict = None) -> bool:
        """
        Registra feedback do usuário para aprendizado.
        
        Args:
            nome_produto (str): Nome do produto classificado
            classificacao_sugerida (Dict): Classificação que foi sugerida
            acao (str): "aceitar" ou "corrigir"
            taxonomia_correta (Dict): Taxonomia correta (se corrigido)
            
        Returns:
            bool: True se feedback foi registrado com sucesso
        """
        try:
            timestamp = datetime.now().isoformat()
            
            # Registrar log do feedback
            feedback_log = {
                "timestamp": timestamp,
                "nome_produto": nome_produto,
                "classificacao_sugerida": classificacao_sugerida,
                "acao": acao,
                "taxonomia_correta": taxonomia_correta
            }
            
            # Salvar log (para auditoria)
            self._salvar_log_feedback(feedback_log)
            
            if acao == "aceitar":
                self._processar_feedback_positivo(nome_produto, classificacao_sugerida)
            elif acao == "corrigir":
                self._processar_correcao(nome_produto, classificacao_sugerida, taxonomia_correta)
            
            # Salvar base atualizada
            self._salvar_base_conhecimento()
            
            logger.info(f"Feedback registrado: {acao} para '{nome_produto}'")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao registrar feedback: {e}")
            return False
    
    def _processar_feedback_positivo(self, nome_produto: str, classificacao: Dict) -> None:
        """Processa feedback positivo (usuário aceitou a sugestão)."""
        # Encontrar entrada na base de conhecimento
        chave_encontrada = None
        for chave, dados in self.base_conhecimento.get("conhecimento", {}).items():
            if (dados.get("categoria") == classificacao.get("categoria") and
                dados.get("subcategoria") == classificacao.get("subcategoria")):
                chave_encontrada = chave
                break
        
        if chave_encontrada:
            # Incrementar confirmações
            self.base_conhecimento["conhecimento"][chave_encontrada]["confirmacoes"] += 1
            
            # Adicionar nome do produto aos aliases se não existir
            aliases = self.base_conhecimento["conhecimento"][chave_encontrada]["aliases"]
            nome_normalizado = self.normalizar_texto(nome_produto)
            if nome_normalizado not in aliases:
                aliases.append(nome_normalizado)
            
            # Atualizar confiança
            confirmacoes = self.base_conhecimento["conhecimento"][chave_encontrada]["confirmacoes"]
            correcoes = self.base_conhecimento["conhecimento"][chave_encontrada]["correcoes"]
            nova_confianca = min(confirmacoes / (confirmacoes + correcoes), 0.95)
            self.base_conhecimento["conhecimento"][chave_encontrada]["confianca"] = nova_confianca
    
    def _processar_correcao(self, nome_produto: str, classificacao_errada: Dict, 
                           taxonomia_correta: Dict) -> None:
        """Processa correção (usuário corrigiu a classificação)."""
        # Encontrar e penalizar classificação errada
        for chave, dados in self.base_conhecimento.get("conhecimento", {}).items():
            if (dados.get("categoria") == classificacao_errada.get("categoria") and
                dados.get("subcategoria") == classificacao_errada.get("subcategoria")):
                dados["correcoes"] += 1
                
                # Atualizar confiança
                confirmacoes = dados["confirmacoes"]
                correcoes = dados["correcoes"]
                if confirmacoes + correcoes > 0:
                    nova_confianca = confirmacoes / (confirmacoes + correcoes)
                    dados["confianca"] = max(nova_confianca, 0.1)  # Mínimo 10%
                break
        
        # Criar ou atualizar entrada correta
        chave_correta = self._gerar_chave_taxonomia(taxonomia_correta)
        
        if chave_correta in self.base_conhecimento.get("conhecimento", {}):
            # Atualizar existente
            dados_corretos = self.base_conhecimento["conhecimento"][chave_correta]
            dados_corretos["confirmacoes"] += 1
            
            # Adicionar alias
            nome_normalizado = self.normalizar_texto(nome_produto)
            if nome_normalizado not in dados_corretos["aliases"]:
                dados_corretos["aliases"].append(nome_normalizado)
        else:
            # Criar nova entrada
            self.base_conhecimento["conhecimento"][chave_correta] = {
                "aliases": [self.normalizar_texto(nome_produto)],
                "palavras_chave": self.extrair_tokens(nome_produto),
                "categoria": taxonomia_correta.get("categoria"),
                "subcategoria": taxonomia_correta.get("subcategoria"),
                "especificacao": taxonomia_correta.get("especificacao"),
                "variante": taxonomia_correta.get("variante"),
                "confianca": 0.6,  # Confiança inicial moderada
                "confirmacoes": 1,
                "correcoes": 0
            }
    
    def _gerar_chave_taxonomia(self, taxonomia: Dict) -> str:
        """
        Gera chave única para entrada na base de conhecimento.
        
        Args:
            taxonomia (Dict): Dados da taxonomia
            
        Returns:
            str: Chave única
        """
        categoria = self.normalizar_texto(taxonomia.get("categoria", ""))
        subcategoria = self.normalizar_texto(taxonomia.get("subcategoria", ""))
        especificacao = self.normalizar_texto(taxonomia.get("especificacao", ""))
        
        chave = f"{categoria}_{subcategoria}"
        if especificacao:
            chave += f"_{especificacao}"
            
        return chave
    
    def _salvar_log_feedback(self, feedback_log: Dict) -> None:
        """Salva log de feedback para auditoria."""
        try:
            logs = []
            if LOGS_FEEDBACK_PATH.exists():
                with open(LOGS_FEEDBACK_PATH, 'r', encoding='utf-8') as file:
                    logs = json.load(file)
            
            logs.append(feedback_log)
            
            # Manter apenas últimos 1000 logs
            if len(logs) > 1000:
                logs = logs[-1000:]
            
            with open(LOGS_FEEDBACK_PATH, 'w', encoding='utf-8') as file:
                json.dump(logs, file, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Erro ao salvar log de feedback: {e}")
    
    def obter_estatisticas(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do sistema de IA.
        
        Returns:
            Dict: Estatísticas do sistema
        """
        try:
            total_entradas = len(self.base_conhecimento.get("conhecimento", {}))
            total_confirmacoes = sum(
                dados.get("confirmacoes", 0) 
                for dados in self.base_conhecimento.get("conhecimento", {}).values()
            )
            total_correcoes = sum(
                dados.get("correcoes", 0)
                for dados in self.base_conhecimento.get("conhecimento", {}).values()
            )
            
            if total_confirmacoes + total_correcoes > 0:
                taxa_acerto = total_confirmacoes / (total_confirmacoes + total_correcoes)
            else:
                taxa_acerto = 0.0
            
            # Estatísticas por categoria
            categorias = {}
            for dados in self.base_conhecimento.get("conhecimento", {}).values():
                categoria = dados.get("categoria", "Não classificado")
                if categoria not in categorias:
                    categorias[categoria] = 0
                categorias[categoria] += 1
            
            return {
                "total_entradas_conhecimento": total_entradas,
                "total_confirmacoes": total_confirmacoes,
                "total_correcoes": total_correcoes,
                "taxa_acerto": round(taxa_acerto, 3),
                "distribuicao_categorias": categorias,
                "versao_base": self.base_conhecimento.get("versao", "1.0.0"),
                "ultima_atualizacao": self.base_conhecimento.get("ultima_atualizacao"),
                "spacy_disponivel": self.nlp is not None,
                "fuzzywuzzy_disponivel": fuzz is not None
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar estatísticas: {e}")
            return {"erro": str(e)}


# ============================================================================
# INSTÂNCIA GLOBAL DO CLASSIFICADOR
# ============================================================================

# Instância global que será reutilizada
_classificador_global = None

def obter_classificador(db_session: Session = None) -> ClassificadorIA:
    """
    Obtém instância global do classificador IA.
    
    Args:
        db_session: Sessão do banco (opcional)
        
    Returns:
        ClassificadorIA: Instância do classificador
    """
    global _classificador_global
    
    if _classificador_global is None:
        _classificador_global = ClassificadorIA(db_session)
    elif db_session:
        _classificador_global.db_session = db_session
    
    return _classificador_global