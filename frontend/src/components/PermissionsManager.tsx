/**
 * ============================================================================
 * GERENCIADOR DE PERMISSÕES - Interface Admin
 * ============================================================================
 * Descrição: Interface para ADMIN configurar permissões por perfil
 * Acesso: Apenas ADMIN via Automação IOGAR > Controle de Usuários > Gerenciar
 * Data: 22/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Shield, Save, X, AlertCircle, Check } from 'lucide-react';
import { ROLE_INFO, getRoleLabel } from '../constants/roles';
import { API_BASE_URL } from '../config';

// Tipos de recursos e ações
const RECURSOS = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'INSUMOS', label: 'Insumos' },
  { value: 'RECEITAS', label: 'Receitas' },
  { value: 'FORNECEDORES', label: 'Fornecedores' },
  { value: 'RESTAURANTES', label: 'Restaurantes' },
  { value: 'USUARIOS', label: 'Usuários' },
  { value: 'IA_CLASSIFICACAO', label: 'IA Classificação' },
  { value: 'RELATORIOS', label: 'Relatórios' },
  { value: 'CONFIGURACOES', label: 'Configurações' },
  { value: 'MONITORAMENTO', label: 'Monitoramento' }
];

const ACOES = [
  { value: 'VISUALIZAR', label: 'Visualizar' },
  { value: 'CRIAR', label: 'Criar' },
  { value: 'EDITAR', label: 'Editar' },
  { value: 'DELETAR', label: 'Deletar' },
  { value: 'GERENCIAR', label: 'Gerenciar' }
];

const ESCOPOS = [
  { value: 'TODOS', label: 'Todos os dados' },
  { value: 'REDE', label: 'Toda a rede' },
  { value: 'LOJA', label: 'Apenas sua loja' },
  { value: 'PROPRIOS', label: 'Apenas próprios' }
];

interface Permission {
  id: number;
  role: string;
  resource: string;
  action: string;
  data_scope: string;
  enabled: boolean;
}

interface PermissionsManagerProps {
  onClose: () => void;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ onClose }) => {
  console.log('🚀 PermissionsManager renderizado!');
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>('MANAGER');
  const [permissoes, setPermissoes] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  // Perfis disponíveis (exceto ADMIN que tem tudo)
  const perfisDisponiveis = ['CONSULTANT', 'OWNER', 'MANAGER', 'OPERATOR'];

  // Carregar permissões do perfil selecionado
  useEffect(() => {
    console.log('⚡ useEffect disparado! Perfil:', perfilSelecionado);
    carregarPermissoes();
  }, [perfilSelecionado]);

  const carregarPermissoes = async () => {
    console.log('🔍 Iniciando carregamento de permissões para:', perfilSelecionado);
    setLoading(true);
    setMensagem(null);
    try {
      const token = localStorage.getItem('foodcost_access_token');
      console.log('🔑 Token encontrado:', token ? 'SIM' : 'NÃO');
      
      if (!token) {
        console.log('❌ Token não encontrado!');
        setMensagem({ tipo: 'error', texto: 'Token de autenticação não encontrado' });
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/api/v1/permissions/role/${perfilSelecionado}`;
      console.log('📡 Fazendo requisição para:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        setPermissoes(data);
      } else if (response.status === 401 || response.status === 403) {
        console.log('🚫 Sem permissão');
        setMensagem({ tipo: 'error', texto: 'Sem permissão para acessar' });
      } else {
        const errorData = await response.json();
        console.log('❌ Erro:', errorData);
        setMensagem({ tipo: 'error', texto: errorData.detail || 'Erro ao carregar permissões' });
      }
    } catch (error) {
      console.error('💥 Erro na requisição:', error);
      setMensagem({ tipo: 'error', texto: 'Erro ao conectar com o servidor' });
    } finally {
      console.log('🏁 Finalizando carregamento');
      setLoading(false);
    }
  };

  const togglePermissao = (permissaoId: number) => {
    setPermissoes(prev =>
      prev.map(p =>
        p.id === permissaoId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const alterarEscopo = (permissaoId: number, novoEscopo: string) => {
    setPermissoes(prev =>
      prev.map(p =>
        p.id === permissaoId ? { ...p, data_scope: novoEscopo } : p
      )
    );
  };

  const salvarPermissoes = async () => {
    setSalvando(true);
    try {
      // Atualizar cada permissão modificada
      for (const permissao of permissoes) {
        await fetch(`${API_BASE_URL}/api/v1/permissions/${permissao.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('foodcost_access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            enabled: permissao.enabled,
            data_scope: permissao.data_scope
          })
        });
      }

      setMensagem({ tipo: 'success', texto: 'Permissões salvas com sucesso!' });
      setTimeout(() => setMensagem(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar permissões' });
    } finally {
      setSalvando(false);
    }
  };

  // Agrupar permissões por recurso
  const permissoesPorRecurso = RECURSOS.map(recurso => ({
    recurso: recurso.value,
    label: recurso.label,
    permissoes: permissoes.filter(p => p.resource === recurso.value)
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Gerenciador de Permissões</h2>
              <p className="text-purple-100 text-sm">Configure permissões por perfil de usuário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`p-4 ${mensagem.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex items-center space-x-2`}>
            {mensagem.tipo === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        {/* Seletor de perfil */}
        <div className="p-6 bg-gray-50 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o Perfil
          </label>
          <select
            value={perfilSelecionado}
            onChange={(e) => setPerfilSelecionado(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-white border-2 border-green-500 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-600"
          >
            <option value="">Selecione o Perfil</option>
            {perfisDisponiveis.map(role => (
              <option key={role} value={role}>
                {getRoleLabel(role as any)} - {ROLE_INFO[role as keyof typeof ROLE_INFO].description}
              </option>
            ))}
          </select>
        </div>

        {/* Tabela de permissões */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {permissoesPorRecurso.map(({ recurso, label, permissoes: perms }) => (
                <div key={recurso} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                  </div>
                  
                  {perms.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Nenhuma permissão configurada
                    </div>
                  ) : (
                    <div className="divide-y">
                      {perms.map(permissao => (
                        <div key={permissao.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Toggle enabled */}
                            <button
                              onClick={() => togglePermissao(permissao.id)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                permissao.enabled ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                permissao.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>

                            {/* Ação */}
                            <div className="w-32">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                permissao.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {ACOES.find(a => a.value === permissao.action)?.label}
                              </span>
                            </div>

                            {/* Escopo */}
                            <div className="flex-1">
                              <select
                                value={permissao.data_scope}
                                onChange={(e) => alterarEscopo(permissao.id, e.target.value)}
                                disabled={!permissao.enabled}
                                className={`px-3 py-2 border-2 rounded-lg text-sm ${
                                  permissao.enabled ? 'bg-white border-green-500' : 'border-gray-200 bg-gray-50 text-gray-400'
                                }`}
                              >
                                {ESCOPOS.map(escopo => (
                                  <option key={escopo.value} value={escopo.value}>
                                    {escopo.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={salvarPermissoes}
            disabled={salvando}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{salvando ? 'Salvando...' : 'Salvar Permissões'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManager;