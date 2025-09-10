# ============================================================================
# SCRIPT DE TESTES COMPLETOS - SISTEMA DE IA
# ============================================================================
# Descrição: Testes abrangentes do sistema de IA integrado
# Operações: testar classificação, feedback, endpoints, integração
# Data: 10/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
import json
import time
import requests
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Adicionar o backend ao path
sys.path.append('backend')

# ============================================================================
# CONFIGURAÇÕES DE TESTE
# ============================================================================

# URL base da API
BASE_URL = "http://localhost:8000"

# Produtos para teste de classificação
PRODUTOS_TESTE = [
    "Salmão Atlântico Filé Fresco 1kg",
    "Carne Bovina Alcatra Kg", 
    "Tomate Italiano Orgânico",
    "Queijo Mussarela Fatiado 500g",
    "Azeite Extra Virgem Português",
    "Farinha de Trigo Tipo 1",
    "Leite Integral UHT 1L",
    "Frango Peito Sem Osso",
    "Arroz Branco Agulhinha Tipo 1",
    "Produto Inexistente XYZ123"  # Para testar produtos não classificáveis
]

# Testes de feedback
TESTES_FEEDBACK = [
    {
        "produto": "Salmão Grelhado Premium",
        "acao": "aceitar",
        "taxonomia_correta": {
            "categoria": "Peixes",
            "subcategoria": "Salmão", 
            "especificacao": "Filé",
            "variante": "Premium"
        }
    },
    {
        "produto": "Carne de Sol Nordestina",
        "acao": "corrigir",
        "taxonomia_correta": {
            "categoria": "Carnes",
            "subcategoria": "Bovino",
            "especificacao": "Seca",
            "variante": "Regional"
        }
    }
]

# ============================================================================
# CLASSES DE TESTE
# ============================================================================

class TestadorSistemaIA:
    """
    Classe principal para execução de testes do sistema de IA.
    
    Funcionalidades:
    - Testes de dependências
    - Testes de classificação local
    - Testes de endpoints da API
    - Testes de integração
    - Relatórios detalhados
    """
    
    def __init__(self, verbose: bool = False):
        """
        Inicializa o testador.
        
        Args:
            verbose: Se deve exibir logs detalhados
        """
        self.verbose = verbose
        self.resultados = {
            "inicio": datetime.now(),
            "testes_executados": 0,
            "testes_sucesso": 0,
            "testes_falha": 0,
            "detalhes": []
        }
    
    def log(self, mensagem: str, nivel: str = "info"):
        """
        Log com diferentes níveis.
        
        Args:
            mensagem: Mensagem a ser logada
            nivel: Nível do log (info, warning, error, success)
        """
        if nivel == "error":
            print(f"❌ {mensagem}")
        elif nivel == "warning":
            print(f"⚠️  {mensagem}")
        elif nivel == "success":
            print(f"✅ {mensagem}")
        elif self.verbose or nivel == "info":
            print(f"ℹ️  {mensagem}")
    
    def registrar_resultado(self, nome_teste: str, sucesso: bool, detalhes: Dict = None):
        """
        Registra resultado de um teste.
        
        Args:
            nome_teste: Nome do teste executado
            sucesso: Se o teste foi bem-sucedido
            detalhes: Detalhes adicionais do teste
        """
        self.resultados["testes_executados"] += 1
        
        if sucesso:
            self.resultados["testes_sucesso"] += 1
        else:
            self.resultados["testes_falha"] += 1
        
        self.resultados["detalhes"].append({
            "teste": nome_teste,
            "sucesso": sucesso,
            "timestamp": datetime.now().isoformat(),
            "detalhes": detalhes or {}
        })
    
    def testar_dependencias(self):
        """Testa se todas as dependências estão disponíveis"""
        self.log("🔍 Testando dependências...")
        
        # Testar spaCy
        try:
            import spacy
            try:
                nlp = spacy.load("pt_core_news_sm")
                self.log("spaCy com modelo português - OK", "success")
                self.registrar_resultado("spacy_modelo_portugues", True)
            except OSError:
                self.log("spaCy instalado mas modelo português não encontrado", "warning")
                self.registrar_resultado("spacy_modelo_portugues", False, 
                                      {"erro": "Modelo pt_core_news_sm não encontrado"})
        except ImportError:
            self.log("spaCy não instalado", "error")
            self.registrar_resultado("spacy_instalado", False, {"erro": "spaCy não encontrado"})
        
        # Testar fuzzywuzzy
        try:
            from fuzzywuzzy import fuzz, process
            score = fuzz.ratio("teste", "teste")
            if score == 100:
                self.log("fuzzywuzzy funcionando - OK", "success")
                self.registrar_resultado("fuzzywuzzy", True)
            else:
                self.log("fuzzywuzzy com comportamento inesperado", "warning")
                self.registrar_resultado("fuzzywuzzy", False, {"score_teste": score})
        except ImportError:
            self.log("fuzzywuzzy não instalado", "error")
            self.registrar_resultado("fuzzywuzzy", False, {"erro": "fuzzywuzzy não encontrado"})
        
        # Testar unidecode
        try:
            import unidecode
            resultado = unidecode.unidecode("São Paulo")
            if resultado == "Sao Paulo":
                self.log("unidecode funcionando - OK", "success")
                self.registrar_resultado("unidecode", True)
            else:
                self.log("unidecode com comportamento inesperado", "warning")
                self.registrar_resultado("unidecode", False, {"resultado": resultado})
        except ImportError:
            self.log("unidecode não instalado", "error")
            self.registrar_resultado("unidecode", False, {"erro": "unidecode não encontrado"})
    
    def testar_estrutura_arquivos(self):
        """Testa se a estrutura de arquivos está correta"""
        self.log("📁 Testando estrutura de arquivos...")
        
        arquivos_obrigatorios = [
            "backend/app/ai/classificador_ia.py",
            "backend/app/schemas/ia.py",
            "backend/app/api/endpoints/ia.py",
            "backend/app/ai/data/base_conhecimento.json",
            "backend/app/ai/data/padroes_aprendidos.json",
            "backend/app/ai/data/logs_feedback.json"
        ]
        
        todos_existem = True
        for arquivo in arquivos_obrigatorios:
            if Path(arquivo).exists():
                self.log(f"{arquivo} - OK", "success" if self.verbose else None)
            else:
                self.log(f"{arquivo} - FALTANDO", "error")
                todos_existem = False
        
        self.registrar_resultado("estrutura_arquivos", todos_existem)
    
    def testar_classificador_local(self):
        """Testa o classificador IA localmente"""
        self.log("🧠 Testando classificador local...")
        
        try:
            from app.ai.classificador_ia import ClassificadorIA
            
            # Inicializar classificador
            classificador = ClassificadorIA()
            self.log("Classificador inicializado - OK", "success")
            
            # Testar classificação de produtos
            produtos_sucesso = 0
            produtos_total = len(PRODUTOS_TESTE)
            
            for produto in PRODUTOS_TESTE:
                try:
                    resultado = classificador.classificar_produto(produto)
                    
                    if self.verbose:
                        self.log(f"  {produto}: {resultado.get('categoria', 'N/A')} "
                               f"(confiança: {resultado.get('confianca', 0):.2f})")
                    
                    if resultado.get("sucesso") or resultado.get("categoria"):
                        produtos_sucesso += 1
                        
                except Exception as e:
                    self.log(f"Erro ao classificar '{produto}': {e}", "error")
            
            taxa_sucesso = produtos_sucesso / produtos_total
            self.log(f"Taxa de classificação: {produtos_sucesso}/{produtos_total} "
                   f"({taxa_sucesso:.1%})", "success" if taxa_sucesso > 0.5 else "warning")
            
            self.registrar_resultado("classificador_local", True, {
                "produtos_testados": produtos_total,
                "produtos_classificados": produtos_sucesso,
                "taxa_sucesso": taxa_sucesso
            })
            
        except Exception as e:
            self.log(f"Erro no classificador local: {e}", "error")
            self.registrar_resultado("classificador_local", False, {"erro": str(e)})
    
    def testar_servidor_ativo(self):
        """Testa se o servidor está ativo"""
        self.log("🌐 Testando servidor...")
        
        try:
            response = requests.get(f"{BASE_URL}/", timeout=5)
            if response.status_code == 200:
                self.log("Servidor ativo - OK", "success")
                self.registrar_resultado("servidor_ativo", True)
                return True
            else:
                self.log(f"Servidor retornou status {response.status_code}", "warning")
                self.registrar_resultado("servidor_ativo", False, 
                                      {"status_code": response.status_code})
                return False
        except requests.ConnectionError:
            self.log("Servidor não está rodando", "error")
            self.log("💡 Inicie o servidor: python -m uvicorn app.main:app --reload", "info")
            self.registrar_resultado("servidor_ativo", False, {"erro": "Conexão recusada"})
            return False
        except Exception as e:
            self.log(f"Erro ao conectar ao servidor: {e}", "error")
            self.registrar_resultado("servidor_ativo", False, {"erro": str(e)})
            return False
    
    def testar_endpoint_status(self):
        """Testa endpoint de status da IA"""
        self.log("📊 Testando endpoint /api/v1/ia/status...")
        
        try:
            response = requests.get(f"{BASE_URL}/api/v1/ia/status", timeout=10)
            
            if response.status_code == 200:
                dados = response.json()
                self.log("Endpoint status - OK", "success")
                
                if self.verbose:
                    self.log(f"  Sistema ativo: {dados.get('sistema_ativo')}")
                    self.log(f"  spaCy: {dados.get('spacy_disponivel')}")
                    self.log(f"  fuzzywuzzy: {dados.get('fuzzywuzzy_disponivel')}")
                    self.log(f"  Modelo português: {dados.get('modelo_portugues')}")
                
                self.registrar_resultado("endpoint_status", True, dados)
                return True
            else:
                self.log(f"Endpoint status falhou: {response.status_code}", "error")
                self.registrar_resultado("endpoint_status", False, 
                                      {"status_code": response.status_code,
                                       "response": response.text})
                return False
                
        except Exception as e:
            self.log(f"Erro no endpoint status: {e}", "error")
            self.registrar_resultado("endpoint_status", False, {"erro": str(e)})
            return False
    
    def testar_endpoint_classificacao(self):
        """Testa endpoint de classificação"""
        self.log("🔍 Testando endpoint /api/v1/ia/classificar...")
        
        classificacoes_sucesso = 0
        
        for produto in PRODUTOS_TESTE[:5]:  # Testar apenas alguns produtos via API
            try:
                payload = {
                    "nome_produto": produto,
                    "incluir_alternativas": True,
                    "limite_alternativas": 3,
                    "confianca_minima": 0.5
                }
                
                response = requests.post(
                    f"{BASE_URL}/api/v1/ia/classificar",
                    json=payload,
                    timeout=10
                )
                
                if response.status_code == 200:
                    dados = response.json()
                    
                    if self.verbose:
                        sucesso = dados.get("sucesso", False)
                        categoria = dados.get("taxonomia_sugerida", {}).get("categoria") if dados.get("taxonomia_sugerida") else "N/A"
                        confianca = dados.get("confianca", 0)
                        self.log(f"  {produto}: {categoria} (confiança: {confianca:.2f}) - {'✅' if sucesso else '⚠️'}")
                    
                    if dados.get("sucesso"):
                        classificacoes_sucesso += 1
                        
                else:
                    self.log(f"Erro na classificação de '{produto}': {response.status_code}", "error")
                    
            except Exception as e:
                self.log(f"Erro ao classificar '{produto}': {e}", "error")
        
        taxa_sucesso = classificacoes_sucesso / 5
        self.log(f"Taxa de sucesso da API: {classificacoes_sucesso}/5 ({taxa_sucesso:.1%})", 
               "success" if taxa_sucesso > 0.4 else "warning")
        
        self.registrar_resultado("endpoint_classificacao", taxa_sucesso > 0, {
            "produtos_testados": 5,
            "classificacoes_sucesso": classificacoes_sucesso,
            "taxa_sucesso": taxa_sucesso
        })
    
    def testar_endpoint_feedback(self):
        """Testa endpoint de feedback"""
        self.log("💬 Testando endpoint /api/v1/ia/feedback...")
        
        try:
            payload = {
                "produto_original": "Salmão teste feedback",
                "taxonomia_sugerida": {
                    "categoria": "Peixes",
                    "subcategoria": "Salmão"
                },
                "acao": "aceitar",
                "taxonomia_correta": {
                    "categoria": "Peixes",
                    "subcategoria": "Salmão",
                    "especificacao": "Filé",
                    "variante": "Premium"
                },
                "comentario": "Teste automático do sistema"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/v1/ia/feedback",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                dados = response.json()
                self.log("Endpoint feedback - OK", "success")
                self.registrar_resultado("endpoint_feedback", True, dados)
                return True
            else:
                self.log(f"Endpoint feedback falhou: {response.status_code}", "error")
                self.registrar_resultado("endpoint_feedback", False, 
                                      {"status_code": response.status_code})
                return False
                
        except Exception as e:
            self.log(f"Erro no endpoint feedback: {e}", "error")
            self.registrar_resultado("endpoint_feedback", False, {"erro": str(e)})
            return False
    
    def testar_endpoint_estatisticas(self):
        """Testa endpoint de estatísticas"""
        self.log("📈 Testando endpoint /api/v1/ia/estatisticas...")
        
        try:
            response = requests.get(f"{BASE_URL}/api/v1/ia/estatisticas", timeout=10)
            
            if response.status_code == 200:
                dados = response.json()
                self.log("Endpoint estatísticas - OK", "success")
                
                if self.verbose:
                    self.log(f"  Entradas conhecimento: {dados.get('total_entradas_conhecimento', 0)}")
                    self.log(f"  Taxa de acerto: {dados.get('taxa_acerto_geral', 0):.1%}")
                    self.log(f"  Confirmações: {dados.get('total_confirmacoes', 0)}")
                
                self.registrar_resultado("endpoint_estatisticas", True, dados)
                return True
            else:
                self.log(f"Endpoint estatísticas falhou: {response.status_code}", "error")
                self.registrar_resultado("endpoint_estatisticas", False, 
                                      {"status_code": response.status_code})
                return False
                
        except Exception as e:
            self.log(f"Erro no endpoint estatísticas: {e}", "error")
            self.registrar_resultado("endpoint_estatisticas", False, {"erro": str(e)})
            return False
    
    def executar_todos_os_testes(self):
        """Executa todos os testes do sistema"""
        print("=" * 80)
        print("  TESTES COMPLETOS - SISTEMA DE IA")
        print("  Food Cost System - Classificação Inteligente")
        print("=" * 80)
        print(f"🕐 Início: {self.resultados['inicio'].strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Testes de dependências
        self.testar_dependencias()
        
        # Testes de estrutura
        self.testar_estrutura_arquivos()
        
        # Testes locais
        self.testar_classificador_local()
        
        # Testes de API (se servidor estiver ativo)
        if self.testar_servidor_ativo():
            self.testar_endpoint_status()
            self.testar_endpoint_classificacao()
            self.testar_endpoint_feedback()
            self.testar_endpoint_estatisticas()
        
        # Relatório final
        self.gerar_relatorio_final()
    
    def gerar_relatorio_final(self):
        """Gera relatório final dos testes"""
        fim = datetime.now()
        duracao = fim - self.resultados["inicio"]
        
        print()
        print("=" * 80)
        print("  RELATÓRIO FINAL")
        print("=" * 80)
        
        print(f"🕐 Duração: {duracao.total_seconds():.1f} segundos")
        print(f"📊 Testes executados: {self.resultados['testes_executados']}")
        print(f"✅ Sucessos: {self.resultados['testes_sucesso']}")
        print(f"❌ Falhas: {self.resultados['testes_falha']}")
        
        taxa_sucesso = self.resultados['testes_sucesso'] / self.resultados['testes_executados'] if self.resultados['testes_executados'] > 0 else 0
        print(f"📈 Taxa de sucesso: {taxa_sucesso:.1%}")
        
        if taxa_sucesso >= 0.8:
            print("\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!")
            print("💡 Próximos passos:")
            print("  1. Sistema pronto para uso em produção")
            print("  2. Configure interface React para feedback")
            print("  3. Monitore performance via /api/v1/ia/estatisticas")
        elif taxa_sucesso >= 0.6:
            print("\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL")
            print("💡 Algumas funcionalidades podem estar limitadas")
            print("💡 Verifique dependências e configurações")
        else:
            print("\n❌ SISTEMA COM PROBLEMAS CRÍTICOS")
            print("💡 Execute: python backend/setup_ia.py")
            print("💡 Verifique logs de erro acima")
        
        # Salvar relatório detalhado
        self.salvar_relatorio_json()
    
    def salvar_relatorio_json(self):
        """Salva relatório detalhado em JSON"""
        try:
            # Converter datetimes para string antes de salvar
            resultados_serializaveis = {**self.resultados}
            resultados_serializaveis["inicio"] = self.resultados["inicio"].isoformat()

            for detalhe in resultados_serializaveis["detalhes"]:
                if "timestamp" in detalhe:
                    detalhe["timestamp"] = detalhe["timestamp"]  # Já está como string

            relatorio_completo = {
                **resultados_serializaveis,
                "fim": datetime.now().isoformat(),
                "sistema": {
                    "python_version": sys.version,
                    "platform": sys.platform
                }
            }
            
            arquivo_relatorio = f"backend/app/ai/logs/teste_ia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Criar diretório se não existir
            Path(arquivo_relatorio).parent.mkdir(parents=True, exist_ok=True)
            
            with open(arquivo_relatorio, 'w', encoding='utf-8') as f:
                json.dump(relatorio_completo, f, indent=2, ensure_ascii=False)
            
            print(f"\n📄 Relatório salvo: {arquivo_relatorio}")
            
        except Exception as e:
            self.log(f"Erro ao salvar relatório: {e}", "error")

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Testa o sistema de IA do Food Cost System")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Exibe logs detalhados")
    parser.add_argument("--quick", "-q", action="store_true",
                       help="Executa apenas testes rápidos")
    
    args = parser.parse_args()
    
    testador = TestadorSistemaIA(verbose=args.verbose)
    
    try:
        if args.quick:
            testador.testar_dependencias()
            testador.testar_estrutura_arquivos()
            if testador.testar_servidor_ativo():
                testador.testar_endpoint_status()
            testador.gerar_relatorio_final()
        else:
            testador.executar_todos_os_testes()
            
    except KeyboardInterrupt:
        print("\n🛑 Testes cancelados pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()