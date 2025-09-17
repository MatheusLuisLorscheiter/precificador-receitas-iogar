#!/usr/bin/env python3

# ============================================================================
# SCRIPT DE VALIDAÇÃO - CONFIGURAÇÃO DOCKER
# ============================================================================
# Descrição: Valida se toda a configuração Docker está correta
# Executa: python validate-docker-setup.py
# Data: 17/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
import subprocess
import json
import time
from pathlib import Path
from typing import List, Dict, Any

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class DockerValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success = []
        
    def print_header(self):
        print(f"{Colors.BLUE}{Colors.BOLD}")
        print("=" * 80)
        print("  VALIDAÇÃO DE CONFIGURAÇÃO DOCKER - FOOD COST SYSTEM")
        print("=" * 80)
        print(f"{Colors.END}")
        
    def print_success(self, message: str):
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
        self.success.append(message)
        
    def print_error(self, message: str):
        print(f"{Colors.RED}❌ {message}{Colors.END}")
        self.errors.append(message)
        
    def print_warning(self, message: str):
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")
        self.warnings.append(message)
        
    def print_info(self, message: str):
        print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

    def check_docker_installation(self) -> bool:
        """Verifica se Docker e Docker Compose estão instalados"""
        self.print_info("Verificando instalação do Docker...")
        
        # Verificar Docker
        try:
            result = subprocess.run(['docker', '--version'], 
                                  capture_output=True, text=True, check=True)
            docker_version = result.stdout.strip()
            self.print_success(f"Docker encontrado: {docker_version}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.print_error("Docker não está instalado ou não está no PATH")
            return False
            
        # Verificar Docker Compose
        try:
            result = subprocess.run(['docker-compose', '--version'], 
                                  capture_output=True, text=True, check=True)
            compose_version = result.stdout.strip()
            self.print_success(f"Docker Compose encontrado: {compose_version}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.print_error("Docker Compose não está instalado ou não está no PATH")
            return False
            
        # Verificar se Docker daemon está rodando
        try:
            subprocess.run(['docker', 'info'], 
                         capture_output=True, text=True, check=True)
            self.print_success("Docker daemon está rodando")
            return True
        except subprocess.CalledProcessError:
            self.print_error("Docker daemon não está rodando")
            return False

    def check_required_files(self) -> bool:
        """Verifica se todos os arquivos necessários existem"""
        self.print_info("Verificando arquivos necessários...")
        
        required_files = [
            'docker-compose.yml',
            '.env',
            'backend/Dockerfile',
            'frontend/Dockerfile',
            'frontend/nginx.conf',
            'docker-scripts.sh',
            'docker-scripts.ps1'
        ]
        
        all_present = True
        
        for file_path in required_files:
            if os.path.exists(file_path):
                self.print_success(f"Arquivo encontrado: {file_path}")
            else:
                self.print_error(f"Arquivo não encontrado: {file_path}")
                all_present = False
                
        return all_present

    def check_env_file(self) -> bool:
        """Verifica configurações do arquivo .env"""
        self.print_info("Verificando arquivo .env...")
        
        if not os.path.exists('.env'):
            self.print_error("Arquivo .env não encontrado")
            return False
            
        try:
            # Carregar variáveis do .env
            env_vars = {}
            with open('.env', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
            
            # Verificar variáveis obrigatórias
            required_vars = [
                'DATABASE_URL',
                'DB_NAME',
                'DB_USER', 
                'DB_PASSWORD',
                'REDIS_PASSWORD',
                'SECRET_KEY'
            ]
            
            all_present = True
            for var in required_vars:
                if var in env_vars and env_vars[var]:
                    self.print_success(f"Variável definida: {var}")
                else:
                    self.print_error(f"Variável ausente ou vazia: {var}")
                    all_present = False
                    
            # Verificar se senhas não são padrão
            if env_vars.get('SECRET_KEY', '').find('CHANGE-ME') != -1:
                self.print_warning("SECRET_KEY ainda usa valor padrão - altere para produção")
                
            return all_present
            
        except Exception as e:
            self.print_error(f"Erro ao ler arquivo .env: {e}")
            return False

    def check_docker_compose_syntax(self) -> bool:
        """Verifica sintaxe do docker-compose.yml"""
        self.print_info("Verificando sintaxe do docker-compose.yml...")
        
        try:
            result = subprocess.run(['docker-compose', 'config'], 
                                  capture_output=True, text=True, check=True)
            self.print_success("Sintaxe do docker-compose.yml está correta")
            return True
        except subprocess.CalledProcessError as e:
            self.print_error(f"Erro na sintaxe do docker-compose.yml: {e.stderr}")
            return False

    def check_dockerfile_syntax(self) -> bool:
        """Verifica sintaxe básica dos Dockerfiles"""
        self.print_info("Verificando sintaxe dos Dockerfiles...")
        
        dockerfiles = ['backend/Dockerfile', 'frontend/Dockerfile']
        all_valid = True
        
        for dockerfile in dockerfiles:
            if os.path.exists(dockerfile):
                try:
                    with open(dockerfile, 'r') as f:
                        content = f.read()
                        
                    # Verificações básicas
                    if 'FROM' not in content:
                        self.print_error(f"{dockerfile}: Não contém instrução FROM")
                        all_valid = False
                    else:
                        self.print_success(f"{dockerfile}: Sintaxe básica válida")
                        
                except Exception as e:
                    self.print_error(f"Erro ao ler {dockerfile}: {e}")
                    all_valid = False
            else:
                self.print_error(f"Dockerfile não encontrado: {dockerfile}")
                all_valid = False
                
        return all_valid

    def check_project_structure(self) -> bool:
        """Verifica estrutura básica do projeto"""
        self.print_info("Verificando estrutura do projeto...")
        
        required_dirs = [
            'backend',
            'backend/app',
            'frontend',
            'frontend/src'
        ]
        
        all_present = True
        
        for dir_path in required_dirs:
            if os.path.isdir(dir_path):
                self.print_success(f"Diretório encontrado: {dir_path}")
            else:
                self.print_error(f"Diretório não encontrado: {dir_path}")
                all_present = False
                
        # Verificar arquivos críticos do projeto
        critical_files = [
            'backend/requirements.txt',
            'backend/app/main.py',
            'frontend/package.json'
        ]
        
        for file_path in critical_files:
            if os.path.exists(file_path):
                self.print_success(f"Arquivo crítico encontrado: {file_path}")
            else:
                self.print_warning(f"Arquivo crítico não encontrado: {file_path}")
                
        return all_present

    def check_script_permissions(self) -> bool:
        """Verifica permissões dos scripts (Linux/Mac)"""
        if os.name == 'nt':  # Windows
            self.print_info("Sistema Windows - pulando verificação de permissões")
            return True
            
        self.print_info("Verificando permissões dos scripts...")
        
        script_file = 'docker-scripts.sh'
        if os.path.exists(script_file):
            # Verificar se tem permissão de execução
            if os.access(script_file, os.X_OK):
                self.print_success(f"{script_file} tem permissão de execução")
                return True
            else:
                self.print_warning(f"{script_file} não tem permissão de execução")
                self.print_info("Execute: chmod +x docker-scripts.sh")
                return False
        else:
            self.print_error(f"Script não encontrado: {script_file}")
            return False

    def generate_summary(self):
        """Gera resumo da validação"""
        self.print_info("\n" + "=" * 50)
        self.print_info("RESUMO DA VALIDAÇÃO")
        self.print_info("=" * 50)
        
        print(f"{Colors.GREEN}✅ Sucessos: {len(self.success)}{Colors.END}")
        print(f"{Colors.YELLOW}⚠️  Avisos: {len(self.warnings)}{Colors.END}")
        print(f"{Colors.RED}❌ Erros: {len(self.errors)}{Colors.END}")
        
        if self.errors:
            self.print_info("\n🔧 ERROS ENCONTRADOS:")
            for error in self.errors:
                print(f"  • {error}")
                
        if self.warnings:
            self.print_info("\n⚠️  AVISOS:")
            for warning in self.warnings:
                print(f"  • {warning}")
                
        # Status final
        if not self.errors:
            self.print_success("\n🎉 CONFIGURAÇÃO DOCKER VÁLIDA!")
            self.print_info("Sistema pronto para inicialização")
            self.print_info("Execute: ./docker-scripts.sh start")
        else:
            self.print_error("\n❌ CONFIGURAÇÃO POSSUI ERROS!")
            self.print_info("Corrija os erros antes de prosseguir")

    def run_validation(self):
        """Executa toda a validação"""
        self.print_header()
        
        validation_steps = [
            ("Instalação do Docker", self.check_docker_installation),
            ("Arquivos necessários", self.check_required_files), 
            ("Arquivo .env", self.check_env_file),
            ("Sintaxe docker-compose", self.check_docker_compose_syntax),
            ("Sintaxe Dockerfiles", self.check_dockerfile_syntax),
            ("Estrutura do projeto", self.check_project_structure),
            ("Permissões de scripts", self.check_script_permissions)
        ]
        
        for step_name, step_function in validation_steps:
            self.print_info(f"\n📋 {step_name}")
            print("-" * 40)
            
            try:
                step_function()
            except Exception as e:
                self.print_error(f"Erro inesperado em {step_name}: {e}")
                
        self.generate_summary()
        
        # Retornar código de saída
        return 0 if not self.errors else 1

def main():
    """Função principal"""
    validator = DockerValidator()
    exit_code = validator.run_validation()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()