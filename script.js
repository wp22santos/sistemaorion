// Máscaras para CPF e RG
function mascararCPF(cpf) {
    return cpf
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

function mascararRG(rg) {
    return rg
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{1})\d+?$/, '$1');
}

// Gerenciamento de dados
class GerenciadorDados {
    constructor() {
        this.db = null;
        this.registros = [];
        this.abordagens = [];
        this.pessoasSelecionadas = new Set();
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AbordadosDB', 2);

            request.onerror = () => reject(request.error);

            request.onsuccess = async () => {
                this.db = request.result;
                await this.carregarRegistros();
                await this.carregarAbordagens();
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (db.objectStoreNames.contains('registros')) {
                    db.deleteObjectStore('registros');
                }
                if (db.objectStoreNames.contains('abordagens')) {
                    db.deleteObjectStore('abordagens');
                }
                
                const registrosStore = db.createObjectStore('registros', { 
                    keyPath: 'id',
                    autoIncrement: true 
                });
                registrosStore.createIndex('nome', 'nome');
                registrosStore.createIndex('rg', 'rg');
                registrosStore.createIndex('cpf', 'cpf');

                const abordagensStore = db.createObjectStore('abordagens', { 
                    keyPath: 'id',
                    autoIncrement: true 
                });
                abordagensStore.createIndex('data', 'data');
            };
        });
    }

    async carregarRegistros() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['registros'], 'readonly');
            const store = transaction.objectStore('registros');
            const request = store.getAll();

            request.onsuccess = () => {
                this.registros = request.result;
                resolve(this.registros);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async carregarAbordagens() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['abordagens'], 'readonly');
            const store = transaction.objectStore('abordagens');
            const request = store.getAll();

            request.onsuccess = () => {
                this.abordagens = request.result;
                console.log('Abordagens carregadas:', this.abordagens.length);
                resolve(this.abordagens);
            };

            request.onerror = () => {
                console.error('Erro ao carregar abordagens:', request.error);
                reject(request.error);
            };
        });
    }

    async adicionar(dados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            
            dados.dataCadastro = new Date().toISOString();
            const request = store.add(dados);

            request.onsuccess = () => {
                this.registros.push({ ...dados, id: request.result });
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async adicionarAbordagem(dados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['abordagens'], 'readwrite');
            const store = transaction.objectStore('abordagens');
            
            dados.data = new Date().toISOString();
            console.log('Salvando abordagem:', dados);
            
            const request = store.add(dados);

            request.onsuccess = () => {
                const novaAbordagem = { ...dados, id: request.result };
                this.abordagens.push(novaAbordagem);
                console.log('Abordagem salva com sucesso:', novaAbordagem);
                console.log('Total de abordagens:', this.abordagens.length);
                resolve(novaAbordagem);
            };
            
            request.onerror = () => {
                console.error('Erro ao salvar abordagem:', request.error);
                reject(request.error);
            };
        });
    }

    async editar(id, dados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            const request = store.get(id);

            request.onsuccess = () => {
                const registro = request.result;
                const registroAtualizado = { ...registro, ...dados };
                const requestUpdate = store.put(registroAtualizado);

                requestUpdate.onsuccess = () => {
                    const index = this.registros.findIndex(r => r.id === id);
                    if (index !== -1) {
                        this.registros[index] = registroAtualizado;
                    }
                    resolve(true);
                };

                requestUpdate.onerror = () => reject(requestUpdate.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async excluir(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            const request = store.delete(id);

            request.onsuccess = () => {
                this.registros = this.registros.filter(r => r.id !== id);
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    buscar(termo) {
        termo = termo.toLowerCase();
        return this.registros.filter(registro => 
            registro.nome?.toLowerCase().includes(termo) ||
            registro.rg?.includes(termo) ||
            registro.cpf?.includes(termo)
        );
    }

    buscarPessoas(termo) {
        if (!termo) return [];
        
        termo = termo.toLowerCase();
        return this.registros.filter(registro => 
            registro.nome?.toLowerCase().includes(termo) ||
            registro.rg?.includes(termo) ||
            registro.cpf?.includes(termo)
        );
    }

    adicionarPessoaSelecionada(pessoa) {
        this.pessoasSelecionadas.add(pessoa);
    }

    removerPessoaSelecionada(pessoa) {
        this.pessoasSelecionadas.delete(pessoa);
    }

    limparPessoasSelecionadas() {
        this.pessoasSelecionadas.clear();
    }

    getPessoasSelecionadas() {
        return Array.from(this.pessoasSelecionadas);
    }

    async adicionarPessoa(dados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            
            dados.dataCadastro = new Date().toISOString();
            const request = store.add(dados);

            request.onsuccess = () => {
                const novaPessoa = { ...dados, id: request.result };
                this.registros.push(novaPessoa);
                resolve(novaPessoa);
            };

            request.onerror = () => reject(request.error);
        });
    }

    buscarPessoasAbordagem(pessoasIds) {
        if (!Array.isArray(pessoasIds)) {
            console.error('pessoasIds não é um array:', pessoasIds);
            return [];
        }
        
        console.log('Buscando pessoas:', { pessoasIds, registros: this.registros });
        const pessoas = pessoasIds
            .map(id => this.registros.find(r => r.id === id))
            .filter(Boolean);
            
        console.log('Pessoas encontradas:', pessoas);
        return pessoas;
    }
}

// Inicialização e eventos
document.addEventListener('DOMContentLoaded', async () => {
    const gerenciador = new GerenciadorDados();
    
    // Aguarda a inicialização completa do gerenciador
    await gerenciador.init();
    
    // Elementos do DOM
    const searchInput = document.getElementById('searchInput');
    const registrosList = document.getElementById('registrosList');
    const noResults = document.getElementById('noResults');
    const modalCadastro = document.getElementById('modalCadastro');
    const modalNovaPessoa = document.getElementById('modalNovaPessoa');
    const btnNovaAbordagem = document.getElementById('btnNovaAbordagem');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const btnFecharModalPessoa = document.getElementById('btnFecharModalPessoa');
    const btnSalvarAbordagem = document.getElementById('btnSalvarAbordagem');
    const searchPessoas = document.getElementById('searchPessoas');
    const resultadosBusca = document.getElementById('resultadosBusca');
    const pessoasSelecionadas = document.getElementById('pessoasSelecionadas');
    const semResultados = document.getElementById('semResultados');
    const btnNovaPessoa = document.getElementById('btnNovaPessoa');
    const btnGPS = document.getElementById('btnGPS');
    const formNovaPessoa = document.getElementById('formNovaPessoa');
    const fotoPessoa = document.getElementById('fotoPessoa');
    const previewFoto = document.getElementById('previewFoto');

    // Campos de endereço
    const logradouro = document.getElementById('logradouro');
    const numero = document.getElementById('numero');
    const complemento = document.getElementById('complemento');
    const bairro = document.getElementById('bairro');
    const cidade = document.getElementById('cidade');

    // Campos da nova pessoa
    const nomePessoa = document.getElementById('nomePessoa');
    const dataNascimento = document.getElementById('dataNascimento');
    const rgPessoa = document.getElementById('rgPessoa');
    const cpfPessoa = document.getElementById('cpfPessoa');
    const nomeMae = document.getElementById('nomeMae');
    const nomePai = document.getElementById('nomePai');
    const enderecoPessoa = document.getElementById('enderecoPessoa');

    // Campos do veículo
    const placaVeiculo = document.getElementById('placaVeiculo');
    const marcaVeiculo = document.getElementById('marcaVeiculo');
    const modeloVeiculo = document.getElementById('modeloVeiculo');
    const corVeiculo = document.getElementById('corVeiculo');
    const fotoVeiculo = document.getElementById('fotoVeiculo');
    const previewFotoVeiculo = document.getElementById('previewFotoVeiculo');

    // Variáveis para fotos
    let fotoPrincipal = null;
    let fotosAdicionais = [];
    let fotoVeiculoAtual = null;

    // Constantes
    const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMyQTJGNDUiLz48cGF0aCBkPSJNNjAgNDBDNTEuNzE1NyA0MCA0NSA0Ni43MTU3IDQ1IDU1QzQ1IDYzLjI4NDMgNTEuNzE1NyA3MCA2MCA3MEM2OC4yODQzIDcwIDc1IDYzLjI4NDMgNzUgNTVDNzUgNDYuNzE1NyA2OC4yODQzIDQwIDYwIDQwWk04NSA4NUM4NSA4NS4wMDAxIDg1IDg1LjAwMDEgODUgODVDODUgODMuMzQzMiA4My42NTY5IDgyIDgyIDgySDM4QzM2LjM0MzEgODIgMzUgODMuMzQzMiAzNSA4NUMzNSA5My4yODQzIDQxLjcxNTcgMTAwIDUwIDEwMEg3MEM3OC4yODQzIDEwMCA4NSA5My4yODQzIDg1IDg1WiIgZmlsbD0iIzFBMUYzNSIvPjwvc3ZnPg==';

    // Função para obter endereço via GPS
    async function obterEndereco(latitude, longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
            const data = await response.json();
            
            if (data.address) {
                logradouro.value = data.address.road || '';
                numero.value = data.address.house_number || '';
                bairro.value = data.address.suburb || '';
                cidade.value = data.address.city || data.address.town || '';
            }
        } catch (erro) {
            console.error('Erro ao obter endereço:', erro);
            mostrarMensagem('Erro ao obter endereço', 'erro');
        }
    }

    // Função para obter localização atual
    function obterLocalizacao() {
        if (!navigator.geolocation) {
            mostrarMensagem('Geolocalização não suportada pelo navegador', 'erro');
            return;
        }

        btnGPS.disabled = true;
        btnGPS.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Localizando...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await obterEndereco(position.coords.latitude, position.coords.longitude);
                    mostrarMensagem('Localização obtida com sucesso!', 'sucesso');
                } catch (erro) {
                    console.error('Erro:', erro);
                    mostrarMensagem('Erro ao obter localização', 'erro');
                } finally {
                    btnGPS.disabled = false;
                    btnGPS.innerHTML = '<i class="fas fa-location-arrow"></i> Usar GPS';
                }
            },
            (erro) => {
                console.error('Erro de geolocalização:', erro);
                mostrarMensagem('Erro ao obter localização', 'erro');
                btnGPS.disabled = false;
                btnGPS.innerHTML = '<i class="fas fa-location-arrow"></i> Usar GPS';
            }
        );
    }

    // Função para verificar se todos os campos de endereço estão preenchidos
    function verificarEnderecoPreenchido() {
        return Boolean(logradouro.value && numero.value && bairro.value && cidade.value);
    }

    // Função para obter endereço completo
    function obterEnderecoCompleto() {
        const partes = [
            logradouro.value,
            numero.value,
            complemento.value ? `(${complemento.value})` : '',
            bairro.value,
            cidade.value
        ].filter(Boolean);

        return partes.join(', ');
    }

    // Função para criar preview de foto
    function criarPreviewFoto(file, previewElement, onLoad) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const resultado = e.target.result;
            previewElement.innerHTML = `<img src="${resultado}" alt="Preview">`;
            if (onLoad) onLoad(resultado);
        };
        reader.readAsDataURL(file);
    }

    // Função para adicionar nova foto
    function adicionarNovaFoto() {
        const container = document.createElement('div');
        container.className = 'foto-upload adicional';
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'user';
        input.className = 'foto-input';
        
        const preview = document.createElement('div');
        preview.className = 'foto-preview';
        preview.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Adicionar Foto</span>
        `;
        
        container.appendChild(input);
        container.appendChild(preview);
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            criarPreviewFoto(file, preview, (resultado) => {
                fotosAdicionais.push(resultado);
                preview.innerHTML = `
                    <img src="${resultado}" alt="Preview">
                    <button type="button" class="btn-remover-foto">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Adicionar novo campo de foto se necessário
                const todasFotos = document.querySelectorAll('.foto-upload.adicional');
                const ultimaFoto = todasFotos[todasFotos.length - 1];
                if (ultimaFoto.querySelector('img')) {
                    fotosAdicionais.appendChild(criarNovaFotoUpload());
                }
            });
        });
        
        return container;
    }

    // Eventos
    btnGPS.addEventListener('click', obterLocalizacao);

    btnNovaPessoa.addEventListener('click', () => {
        modalNovaPessoa.style.display = 'block';
        formNovaPessoa.reset();
        fotoAtual = null;
        previewFoto.innerHTML = `
            <i class="fas fa-camera"></i>
            <span>Adicionar Foto</span>
        `;
    });

    btnFecharModalPessoa.addEventListener('click', () => {
        modalNovaPessoa.style.display = 'none';
        formNovaPessoa.reset();
    });

    formNovaPessoa.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const dados = {
                nome: nomePessoa.value,
                dataNascimento: dataNascimento.value,
                rg: rgPessoa.value,
                cpf: cpfPessoa.value,
                nomeMae: nomeMae.value,
                nomePai: nomePai.value,
                endereco: enderecoPessoa.value,
                fotos: {
                    principal: fotoPrincipal,
                    adicionais: fotosAdicionais.filter(Boolean)
                },
                veiculo: {
                    placa: placaVeiculo.value,
                    marca: marcaVeiculo.value,
                    modelo: modeloVeiculo.value,
                    cor: corVeiculo.value,
                    foto: fotoVeiculoAtual
                },
                dataCadastro: new Date().toISOString()
            };

            const novaPessoa = await gerenciador.adicionarPessoa(dados);
            gerenciador.adicionarPessoaSelecionada(novaPessoa);
            renderizarPessoasSelecionadas();
            
            modalNovaPessoa.style.display = 'none';
            formNovaPessoa.reset();
            
            // Limpar todas as fotos
            fotoPrincipal = null;
            fotosAdicionais = [];
            fotoVeiculoAtual = null;
            
            previewFoto.innerHTML = `
                <i class="fas fa-camera"></i>
                <span>Foto Principal</span>
            `;
            
            previewFotoVeiculo.innerHTML = `
                <i class="fas fa-camera"></i>
                <span>Foto do Veículo</span>
            `;
            
            const fotosAdicionaisContainer = document.getElementById('fotosAdicionais');
            fotosAdicionaisContainer.innerHTML = '';
            fotosAdicionaisContainer.appendChild(adicionarNovaFoto());
            
            mostrarMensagem('Pessoa cadastrada com sucesso!', 'sucesso');
            
            // Limpar a busca e esconder resultados
            searchPessoas.value = '';
            resultadosBusca.style.display = 'none';
            semResultados.style.display = 'none';
            
            // Atualizar botão salvar
            atualizarBotaoSalvar();
        } catch (erro) {
            console.error('Erro ao cadastrar pessoa:', erro);
            mostrarMensagem('Erro ao cadastrar pessoa!', 'erro');
        }
    });

    // Máscaras
    rgPessoa.addEventListener('input', (e) => {
        e.target.value = mascararRG(e.target.value);
    });

    cpfPessoa.addEventListener('input', (e) => {
        e.target.value = mascararCPF(e.target.value);
    });

    // Função para atualizar estado do botão salvar
    function atualizarBotaoSalvar() {
        const enderecoPreenchido = verificarEnderecoPreenchido();
        const temPessoas = gerenciador.getPessoasSelecionadas().length > 0;
        btnSalvarAbordagem.disabled = !enderecoPreenchido || !temPessoas;
        console.log('Atualizando botão:', { enderecoPreenchido, temPessoas, disabled: btnSalvarAbordagem.disabled });
    }

    // Eventos de campos de endereço
    [logradouro, numero, bairro, cidade].forEach(campo => {
        campo.addEventListener('input', () => {
            atualizarBotaoSalvar();
        });
    });

    // Atualizar evento de salvar abordagem
    btnSalvarAbordagem.addEventListener('click', async () => {
        try {
            const enderecoCompleto = obterEnderecoCompleto();
            const dados = {
                endereco: enderecoCompleto,
                pessoas: gerenciador.getPessoasSelecionadas().map(p => p.id),
                data: new Date().toISOString()
            };

            console.log('Salvando nova abordagem:', dados);
            const novaAbordagem = await gerenciador.adicionarAbordagem(dados);
            console.log('Abordagem salva:', novaAbordagem);
            
            modalCadastro.style.display = 'none';
            
            // Limpar formulário
            gerenciador.limparPessoasSelecionadas();
            renderizarPessoasSelecionadas();
            [logradouro, numero, complemento, bairro, cidade].forEach(campo => campo.value = '');
            
            // Recarregar a lista de abordagens
            await gerenciador.carregarAbordagens();
            renderizarRegistros();
            
            mostrarMensagem('Abordagem registrada com sucesso!', 'sucesso');
        } catch (erro) {
            console.error('Erro ao salvar abordagem:', erro);
            mostrarMensagem('Erro ao registrar abordagem!', 'erro');
        }
    });

    // Renderizar registros
    function renderizarRegistros(resultadosBusca = null) {
        const abordagens = resultadosBusca || gerenciador.abordagens;
        
        if (abordagens.length === 0) {
            registrosList.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        registrosList.innerHTML = abordagens
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .map(abordagem => {
                const pessoas = gerenciador.buscarPessoasAbordagem(abordagem.pessoas);
                if (!pessoas.length) return '';
                
                const pessoaPrincipal = pessoas[0];
                const outrasPessoas = pessoas.slice(1);
                
                return `
                    <div class="registro-item" data-id="${pessoaPrincipal.id}">
                        <div class="registro-header">
                            <img 
                                src="${pessoaPrincipal.fotos?.principal || PLACEHOLDER_IMAGE}"
                                alt="${pessoaPrincipal.nome}"
                                class="registro-foto"
                            />
                            <div>
                                <h3 class="registro-nome">${pessoaPrincipal.nome}</h3>
                                <div class="registro-data">
                                    <i class="fas fa-calendar"></i>
                                    ${new Date(abordagem.data).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div class="registro-grid">
                            <div class="registro-campo">
                                <span class="registro-label">RG:</span>
                                <span class="registro-valor">${pessoaPrincipal.rg || '-'}</span>
                            </div>
                            <div class="registro-campo">
                                <span class="registro-label">CPF:</span>
                                <span class="registro-valor">${pessoaPrincipal.cpf || '-'}</span>
                            </div>
                            <div class="registro-endereco">
                                <i class="fas fa-map-marker-alt registro-endereco-icon"></i>
                                <span class="registro-valor">${abordagem.endereco}</span>
                            </div>
                            ${outrasPessoas.length > 0 ? `
                                <div class="outras-pessoas-links">
                                    ${outrasPessoas.map(pessoa => `
                                        <button class="pessoa-link" data-id="${pessoa.id}">
                                            <img src="${pessoa.fotos?.principal || PLACEHOLDER_IMAGE}" alt="${pessoa.nome}">
                                            <span>${pessoa.nome}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        // Adicionar evento de clique para os links de pessoas
        document.querySelectorAll('.pessoa-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que o clique propague para o card
                const pessoaId = parseInt(link.dataset.id);
                mostrarDetalhesPessoa(pessoaId);
            });
        });
    }

    // Renderizar pessoas selecionadas
    function renderizarPessoasSelecionadas() {
        const pessoas = gerenciador.getPessoasSelecionadas();
        
        if (pessoas.length === 0) {
            pessoasSelecionadas.style.display = 'none';
            return;
        }

        pessoasSelecionadas.style.display = 'block';
        pessoasSelecionadas.innerHTML = pessoas.map(pessoa => `
            <div class="pessoa-item">
                <div class="pessoa-info">
                    <img 
                        src="${pessoa.foto || PLACEHOLDER_IMAGE}"
                        alt="${pessoa.nome}"
                        class="pessoa-foto"
                    />
                    <span class="pessoa-nome">${pessoa.nome}</span>
                </div>
                <button 
                    class="btn-remover"
                    data-id="${pessoa.id}"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        atualizarBotaoSalvar();
    }

    // Renderizar resultados da busca
    function renderizarResultadosBusca(resultados) {
        if (resultados.length === 0) {
            resultadosBusca.style.display = 'none';
            semResultados.style.display = 'block';
            return;
        }

        semResultados.style.display = 'none';
        resultadosBusca.style.display = 'block';
        resultadosBusca.innerHTML = resultados.map(pessoa => `
            <button 
                class="resultado-item"
                data-id="${pessoa.id}"
            >
                <div class="resultado-info">
                    <img 
                        src="${pessoa.foto || PLACEHOLDER_IMAGE}"
                        alt="${pessoa.nome}"
                        class="pessoa-foto"
                    />
                    <div class="resultado-texto">
                        <div class="resultado-nome">${pessoa.nome}</div>
                        <div class="resultado-rg">RG: ${pessoa.rg || '-'}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </button>
        `).join('');
    }

    // Eventos
    searchInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        if (!termo) {
            renderizarRegistros();
            return;
        }

        const abordagensFiltradas = gerenciador.abordagens.filter(abordagem => {
            const pessoas = gerenciador.buscarPessoasAbordagem(abordagem.pessoas);
            return pessoas.some(pessoa => 
                pessoa.nome?.toLowerCase().includes(termo) ||
                pessoa.rg?.includes(termo) ||
                pessoa.cpf?.includes(termo)
            );
        });

        renderizarRegistros(abordagensFiltradas);
    });

    btnNovaAbordagem.addEventListener('click', () => {
        modalCadastro.style.display = 'block';
        gerenciador.limparPessoasSelecionadas();
        renderizarPessoasSelecionadas();
        searchPessoas.value = '';
        [logradouro, numero, complemento, bairro, cidade].forEach(campo => campo.value = '');
        resultadosBusca.style.display = 'none';
        semResultados.style.display = 'none';
        atualizarBotaoSalvar();
    });

    btnFecharModal.addEventListener('click', () => {
        modalCadastro.style.display = 'none';
    });

    searchPessoas.addEventListener('input', (e) => {
        const resultados = gerenciador.buscarPessoas(e.target.value);
        renderizarResultadosBusca(resultados);
    });

    resultadosBusca.addEventListener('click', (e) => {
        const button = e.target.closest('.resultado-item');
        if (!button) return;

        const id = parseInt(button.dataset.id);
        const pessoa = gerenciador.registros.find(r => r.id === id);
        
        if (pessoa) {
            gerenciador.adicionarPessoaSelecionada(pessoa);
            renderizarPessoasSelecionadas();
            searchPessoas.value = '';
            resultadosBusca.style.display = 'none';
            atualizarBotaoSalvar();
        }
    });

    pessoasSelecionadas.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-remover');
        if (!button) return;

        const id = parseInt(button.dataset.id);
        const pessoa = gerenciador.registros.find(r => r.id === id);
        
        if (pessoa) {
            gerenciador.removerPessoaSelecionada(pessoa);
            renderizarPessoasSelecionadas();
            atualizarBotaoSalvar();
        }
    });

    // Inicialização
    renderizarRegistros();

    // Elementos da página de detalhes
    const paginaDetalhes = document.getElementById('paginaDetalhes');
    const btnVoltarDetalhes = document.getElementById('btnVoltarDetalhes');
    const pessoaFotoDetalhes = document.getElementById('pessoaFotoDetalhes');
    const pessoaNomeDetalhes = document.getElementById('pessoaNomeDetalhes');
    const pessoaDataNascimentoDetalhes = document.getElementById('pessoaDataNascimentoDetalhes');
    const pessoaRGDetalhes = document.getElementById('pessoaRGDetalhes');
    const pessoaCPFDetalhes = document.getElementById('pessoaCPFDetalhes');
    const pessoaMaeDetalhes = document.getElementById('pessoaMaeDetalhes');
    const pessoaPaiDetalhes = document.getElementById('pessoaPaiDetalhes');
    const pessoaEnderecoDetalhes = document.getElementById('pessoaEnderecoDetalhes');
    const veiculoCard = document.getElementById('veiculoCard');
    const veiculoFotoDetalhes = document.getElementById('veiculoFotoDetalhes');
    const veiculoPlacaDetalhes = document.getElementById('veiculoPlacaDetalhes');
    const veiculoModeloDetalhes = document.getElementById('veiculoModeloDetalhes');
    const veiculoCorDetalhes = document.getElementById('veiculoCorDetalhes');
    const historicoAbordagens = document.getElementById('historicoAbordagens');

    // Função para mostrar detalhes da pessoa
    function mostrarDetalhesPessoa(pessoaId) {
        const pessoa = gerenciador.registros.find(r => r.id === pessoaId);
        if (!pessoa) return;

        // Preencher dados básicos
        pessoaFotoDetalhes.src = pessoa.fotos?.principal || PLACEHOLDER_IMAGE;
        pessoaNomeDetalhes.textContent = pessoa.nome;
        pessoaDataNascimentoDetalhes.textContent = new Date(pessoa.dataNascimento).toLocaleDateString();
        pessoaRGDetalhes.textContent = pessoa.rg || '-';
        pessoaCPFDetalhes.textContent = pessoa.cpf || '-';
        pessoaMaeDetalhes.textContent = pessoa.nomeMae || '-';
        pessoaPaiDetalhes.textContent = pessoa.nomePai || '-';
        pessoaEnderecoDetalhes.textContent = pessoa.endereco || '-';

        // Preencher dados do veículo
        if (pessoa.veiculo?.placa) {
            veiculoCard.style.display = 'block';
            veiculoFotoDetalhes.src = pessoa.veiculo.foto || PLACEHOLDER_IMAGE;
            veiculoPlacaDetalhes.textContent = pessoa.veiculo.placa;
            veiculoModeloDetalhes.textContent = `${pessoa.veiculo.marca} ${pessoa.veiculo.modelo}`;
            veiculoCorDetalhes.textContent = pessoa.veiculo.cor;
        } else {
            veiculoCard.style.display = 'none';
        }

        // Preencher histórico de abordagens
        const abordagensPessoa = gerenciador.abordagens.filter(a => 
            a.pessoas.includes(pessoaId)
        );

        if (abordagensPessoa.length > 0) {
            historicoAbordagens.innerHTML = abordagensPessoa.map(abordagem => {
                const outrasPessoas = gerenciador.buscarPessoasAbordagem(abordagem.pessoas)
                    .filter(p => p.id !== pessoaId);
                
                const pessoasHtml = outrasPessoas.length > 0 
                    ? `
                        <div class="outras-pessoas">
                            <span class="dado-label">Abordado com:</span>
                            ${outrasPessoas.map(p => `
                                <a href="#" class="pessoa-link" data-id="${p.id}">
                                    <img src="${p.fotos?.principal || PLACEHOLDER_IMAGE}" alt="${p.nome}">
                                    ${p.nome}
                                </a>
                            `).join('')}
                        </div>
                    `
                    : '';

                return `
                    <div class="abordagem-item">
                        <div class="abordagem-data">
                            ${new Date(abordagem.data).toLocaleDateString()}
                        </div>
                        <div class="abordagem-endereco">
                            <i class="fas fa-map-marker-alt"></i>
                            ${abordagem.endereco}
                        </div>
                        ${pessoasHtml}
                    </div>
                `;
            }).join('');
        } else {
            historicoAbordagens.innerHTML = `
                <div class="sem-resultados">
                    Nenhuma abordagem registrada
                </div>
            `;
        }

        // Mostrar página de detalhes
        document.querySelector('.container').style.display = 'none';
        paginaDetalhes.style.display = 'block';
    }

    // Eventos da página de detalhes
    btnVoltarDetalhes.addEventListener('click', () => {
        paginaDetalhes.style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    });

    historicoAbordagens.addEventListener('click', (e) => {
        const link = e.target.closest('.pessoa-link');
        if (!link) return;

        e.preventDefault();
        const pessoaId = parseInt(link.dataset.id);
        mostrarDetalhesPessoa(pessoaId);
    });

    // Adicionar evento de clique nos registros
    registrosList.addEventListener('click', (e) => {
        const registroItem = e.target.closest('.registro-item');
        if (!registroItem) return;

        const pessoaId = parseInt(registroItem.dataset.id);
        mostrarDetalhesPessoa(pessoaId);
    });
});

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo) {
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem ${tipo}`;
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.remove();
    }, 3000);
}