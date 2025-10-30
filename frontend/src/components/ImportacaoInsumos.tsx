// ============================================================================
// COMPONENTE - IMPORTAÇÃO DE INSUMOS VIA EXCEL
// ============================================================================
// Descrição: Interface para upload e importação de insumos via arquivo Excel
// Data: 30/10/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface PreviewDados {
  nome_arquivo: string;
  total_linhas: number;
  colunas_detectadas: string[];
  primeiras_linhas: any[];
  mapeamento_colunas: Record<string, string>;
  avisos: string[];
}

interface ResultadoImportacao {
  importacao_id: number;
  status: string;
  total_linhas: number;
  linhas_processadas: number;
  linhas_com_erro: number;
  linhas_ignoradas: number;
}

type EtapaImportacao = 'upload' | 'preview' | 'processando' | 'concluido';

interface ImportacaoInsumosProps {
  restauranteId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ImportacaoInsumos: React.FC<ImportacaoInsumosProps> = ({
  restauranteId,
  onClose,
  onSuccess
}) => {
  // Estados
  const [etapa, setEtapa] = useState<EtapaImportacao>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importacaoId, setImportacaoId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewDados | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contador, setContador] = useState<number>(60);
  const [intervaloId, setIntervaloId] = useState<NodeJS.Timeout | null>(null);

// Limpar intervalo ao desmontar componente
useEffect(() => {
return () => {
    if (intervaloId) {
    clearInterval(intervaloId);
    }
};
}, [intervaloId]);

  // ========================================================================
  // FUNÇÃO: HANDLE DRAG & DROP
  // ========================================================================

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validarESetarArquivo(files[0]);
    }
  }, []);

  // ========================================================================
  // FUNÇÃO: VALIDAR E SETAR ARQUIVO
  // ========================================================================

  const validarESetarArquivo = (file: File) => {
    // Validar extensão
    if (!file.name.endsWith('.xlsx')) {
      setErro('Apenas arquivos .xlsx são aceitos');
      return;
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setArquivo(file);
    setErro(null);
  };

  // ========================================================================
  // FUNÇÃO: HANDLE FILE INPUT
  // ========================================================================

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      validarESetarArquivo(files[0]);
    }
  };

  // ========================================================================
  // FUNÇÃO: UPLOAD E PREVIEW
  // ========================================================================

  const handleUpload = async () => {
    if (!arquivo) return;

    setEtapa('processando');
    setErro(null);

    try {
      const formData = new FormData();
      formData.append('file', arquivo);
      formData.append('restaurante_id', restauranteId.toString());

      const response = await fetch('/api/v1/importacoes/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao fazer upload');
      }

      const data = await response.json();
      setImportacaoId(data.importacao_id);
      setPreview(data.preview);
      setEtapa('preview');

    } catch (error: any) {
      setErro(error.message || 'Erro ao processar arquivo');
      setEtapa('upload');
    }
  };

  // ========================================================================
  // FUNÇÃO: CONFIRMAR E PROCESSAR
  // ========================================================================

  const handleConfirmar = async () => {
    if (!importacaoId) return;

    setEtapa('processando');
    setErro(null);

    try {
        const response = await fetch('/api/v1/importacoes/processar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            importacao_id: importacaoId,
            confirmar: true
        })
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao processar importação');
        }

        const data = await response.json();
        setResultado(data);
        setEtapa('concluido');
        setContador(60); // Resetar contador

        // Iniciar contagem regressiva
        const intervalo = setInterval(() => {
        setContador((prev) => {
            if (prev <= 1) {
            clearInterval(intervalo);
            // Usar setTimeout para evitar warning de estado durante render
            setTimeout(() => {
                if (onSuccess) {
                onSuccess();
                }
                onClose();
            }, 0);
            return 0;
            }
            return prev - 1;
        });
        }, 1000);

        setIntervaloId(intervalo);

    } catch (error: any) {
        setErro(error.message || 'Erro ao processar importação');
        setEtapa('preview');
    }
    };

  // ========================================================================
  // FUNÇÃO: CANCELAR
  // ========================================================================

  const handleCancelar = () => {
    setArquivo(null);
    setImportacaoId(null);
    setPreview(null);
    setResultado(null);
    setErro(null);
    setEtapa('upload');
  };

  // ========================================================================
  // RENDER: ETAPA UPLOAD
  // ========================================================================

  const renderUpload = () => (
    <div className="space-y-6">
      {/* Area de Drag & Drop */}
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <FileSpreadsheet 
              className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            />
          </div>

          {arquivo ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                {arquivo.name}
              </p>
              <p className="text-xs text-gray-500">
                {(arquivo.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={() => setArquivo(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-base font-medium text-gray-900">
                  Arraste o arquivo Excel aqui
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou clique para selecionar
                </p>
              </div>

              <label className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}

          <p className="text-xs text-gray-500">
            Formato aceito: .xlsx | Tamanho máximo: 10MB
          </p>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Erro</p>
            <p className="text-sm text-red-700 mt-1">{erro}</p>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleUpload}
          disabled={!arquivo}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ========================================================================
  // RENDER: ETAPA PREVIEW
  // ========================================================================

  const renderPreview = () => {
    if (!preview) return null;

    return (
      <div className="space-y-6">
        {/* Informações do Arquivo */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Informações do Arquivo
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nome:</span>
              <span className="ml-2 font-medium">{preview.nome_arquivo}</span>
            </div>
            <div>
              <span className="text-gray-600">Total de linhas:</span>
              <span className="ml-2 font-medium">{preview.total_linhas}</span>
            </div>
          </div>
        </div>

        {/* Avisos */}
        {preview.avisos.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              Avisos
            </h3>
            <ul className="space-y-1">
              {preview.avisos.map((aviso, index) => (
                <li key={index} className="text-sm text-yellow-800">
                  {aviso}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview dos Dados */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Preview dos Dados (primeiras 5 linhas)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Preço</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unidade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.primeiras_linhas.map((linha, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{linha.codigo}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{linha.nome}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      R$ {linha.preco_compra_real?.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{linha.unidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancelar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Confirmar e Importar
          </button>
        </div>
      </div>
    );
  };

  // ========================================================================
  // RENDER: ETAPA PROCESSANDO
  // ========================================================================

  const renderProcessando = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-lg font-medium text-gray-900">
        Processando importação...
      </p>
      <p className="text-sm text-gray-600">
        Isso pode levar alguns instantes
      </p>
    </div>
  );

  // ========================================================================
  // RENDER: ETAPA CONCLUÍDO
  // ========================================================================

  const renderConcluido = () => {
    if (!resultado) return null;

    const sucesso = resultado.linhas_com_erro === 0;
    const taxaSucesso = resultado.total_linhas > 0 
        ? Math.round((resultado.linhas_processadas / resultado.total_linhas) * 100)
        : 0;

    return (
        <div className="space-y-6">
        {/* Header com gradiente IOGAR */}
        <div className={`
            rounded-xl p-6 
            ${sucesso 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }
        `}>
            <div className="flex items-center space-x-4 text-white">
            {sucesso ? (
                <div className="bg-white/20 p-3 rounded-full">
                <CheckCircle className="w-8 h-8" />
                </div>
            ) : (
                <div className="bg-white/20 p-3 rounded-full">
                <AlertCircle className="w-8 h-8" />
                </div>
            )}
            <div className="flex-1">
                <h3 className="text-2xl font-bold">
                {sucesso ? 'Importação Concluída com Sucesso!' : 'Importação Concluída com Avisos'}
                </h3>
                <p className="text-white/90 mt-1">
                {resultado.linhas_processadas} de {resultado.total_linhas} insumos importados ({taxaSucesso}%)
                </p>
            </div>
            </div>
        </div>

        {/* Cards de estatísticas com estilo IOGAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <div className="bg-gray-200 p-1.5 rounded">
                📊
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
                {resultado.total_linhas}
            </p>
            <p className="text-xs text-gray-500 mt-1">linhas processadas</p>
            </div>

            {/* Sucesso */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Importados</span>
                <div className="bg-green-200 p-1.5 rounded">
                ✅
                </div>
            </div>
            <p className="text-2xl font-bold text-green-900">
                {resultado.linhas_processadas}
            </p>
            <p className="text-xs text-green-600 mt-1">com sucesso</p>
            </div>

            {/* Erros */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Erros</span>
                <div className="bg-red-200 p-1.5 rounded">
                ❌
                </div>
            </div>
            <p className="text-2xl font-bold text-red-900">
                {resultado.linhas_com_erro}
            </p>
            <p className="text-xs text-red-600 mt-1">com falha</p>
            </div>

            {/* Ignorados */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700">Ignorados</span>
                <div className="bg-yellow-200 p-1.5 rounded">
                ⚠️
                </div>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
                {resultado.linhas_ignoradas}
            </p>
            <p className="text-xs text-yellow-600 mt-1">fora da faixa</p>
            </div>
        </div>

        {/* Mensagem de sucesso com animação */}
        {sucesso && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6">
            <div className="flex items-start space-x-4">
                <div className="bg-green-500 p-2 rounded-full animate-pulse">
                <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                <h4 className="font-semibold text-green-900 text-lg mb-2">
                    🎉 Insumos importados com sucesso!
                </h4>
                <p className="text-green-800 text-sm">
                    Todos os {resultado.linhas_processadas} insumos foram adicionados ao sistema e já estão disponíveis para uso.
                </p>
                <p className="text-green-700 text-sm mt-3 font-medium">
                    ⏱️ Esta janela fechará automaticamente em <span className="text-green-900 font-bold text-lg">{contador}</span> segundo{contador !== 1 ? 's' : ''}
                </p>
                </div>
            </div>
            </div>
        )}

        {/* Botão de fechar */}
        <div className="flex justify-end">
            <button
                onClick={() => {
                    if (intervaloId) {
                        clearInterval(intervaloId);
                    }
                    onClose();
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium"
            >
                Fechar Agora
            </button>
        </div>
        </div>
    );
    };

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Importar Insumos via Excel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {etapa === 'upload' && renderUpload()}
          {etapa === 'preview' && renderPreview()}
          {etapa === 'processando' && renderProcessando()}
          {etapa === 'concluido' && renderConcluido()}
        </div>
      </div>
    </div>
  );
};

export default ImportacaoInsumos;