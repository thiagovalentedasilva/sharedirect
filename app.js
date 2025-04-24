// Funções de suporte para internacionalização
let currentLanguage = 'pt'; // Idioma padrão

// Função para traduzir a interface
function translateUI(lang) {
    if (!translations[lang]) {
        console.error(`Idioma não suportado: ${lang}`);
        return;
    }
    
    currentLanguage = lang;
    document.documentElement.lang = lang;
    
    // Traduz todos os elementos com o atributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Traduz placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Atualiza botões de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Salva preferência no localStorage
    localStorage.setItem('preferredLanguage', lang);
}

// Função para obter texto traduzido
function i18n(key) {
    return translations[currentLanguage][key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
    // Configuração de idioma
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    } else {
        // Detectar idioma do navegador como fallback
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            currentLanguage = browserLang;
        }
    }
    
    // Inicializar a interface no idioma correto
    translateUI(currentLanguage);
    
    // Adicionar evento aos botões de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            translateUI(lang);
        });
    });

    // Elementos da UI
    const fileInput = document.getElementById('file-input');
    const passwordCheckbox = document.getElementById('password-checkbox');
    const passwordSection = document.querySelector('.password-section');
    const passwordInput = document.getElementById('password-input');
    const createShareBtn = document.getElementById('create-share-btn');
    const setupSection = document.getElementById('setup-section');
    const shareInfo = document.getElementById('share-info');
    const shareUrl = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const connStatus = document.getElementById('connection-status');
    const statusBadge = document.querySelector('.status-badge');
    const connectedPeerInfo = document.getElementById('connected-peer-info');
    const peerId = document.getElementById('peer-id');
    const transferProgress = document.getElementById('transfer-progress');
    const senderProgressBar = document.getElementById('sender-progress-bar');
    const receiveSection = document.getElementById('receive-section');
    const passwordRequired = document.getElementById('password-required');
    const receivePassword = document.getElementById('receive-password');
    const submitPasswordBtn = document.getElementById('submit-password-btn');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const receiveFileBtn = document.getElementById('receive-file-btn');
    const receiveProgress = document.getElementById('receive-progress');
    const receiverProgressBar = document.getElementById('receiver-progress-bar');

    // Variáveis globais
    let peer;
    let connection;
    let selectedFile;
    let hasPassword = false;
    let password = '';
    let fileMetadata = null;
    let chunks = [];
    
    // Configurar a interface inicial
    passwordCheckbox.addEventListener('change', () => {
        passwordSection.style.display = passwordCheckbox.checked ? 'block' : 'none';
        hasPassword = passwordCheckbox.checked;
    });

    // Verificar se estamos no modo de compartilhamento ou recebimento
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('id');
    
    if (shareId) {
        // Modo de recebimento
        setupSection.style.display = 'none';
        receiveSection.style.display = 'block';
        
        // Verificar se o compartilhamento tem senha
        const isEncrypted = urlParams.get('encrypted') === 'true';
        
        if (isEncrypted) {
            passwordRequired.style.display = 'block';
        }
        
        // Conectar ao peer em qualquer caso - isso corrige o problema de conexão
        connectToPeer(shareId);
    } else {
        // Modo de compartilhamento
        initPeer();
    }

    // Inicializar o peer para compartilhamento
    function initPeer() {
        peer = new Peer(null, {
            debug: 2
        });

        peer.on('open', (id) => {
            console.log('Meu ID peer é: ' + id);
        });

        peer.on('connection', (conn) => {
            connection = conn;
            handleConnection();
        });

        peer.on('error', (err) => {
            console.error('Erro no peer:', err);
            connStatus.textContent = i18n('errorInitConnection') + ' ' + err.message;
            statusBadge.className = 'status-badge error';
        });
    }

    // Manipular conexão peer
    function handleConnection() {
        connStatus.textContent = i18n('connectedWith');
        statusBadge.className = 'status-badge success';
        connectedPeerInfo.style.display = 'block';
        peerId.textContent = connection.peer;

        connection.on('data', (data) => {
            if (data.type === 'password-request') {
                if (hasPassword && passwordInput.value) {
                    const passwordHash = CryptoJS.SHA256(passwordInput.value).toString();
                    connection.send({ 
                        type: 'password-response',
                        isPasswordProtected: hasPassword,
                        passwordHash: hasPassword ? passwordHash : null,
                        fileInfo: {
                            name: selectedFile.name,
                            size: selectedFile.size,
                            type: selectedFile.type
                        }
                    });
                } else {
                    connection.send({ 
                        type: 'password-response',
                        isPasswordProtected: false,
                        fileInfo: {
                            name: selectedFile.name,
                            size: selectedFile.size,
                            type: selectedFile.type
                        }
                    });
                }
            } else if (data.type === 'password-attempt') {
                const attemptHash = CryptoJS.SHA256(data.password).toString();
                const correctHash = CryptoJS.SHA256(passwordInput.value).toString();
                
                if (attemptHash === correctHash) {
                    connection.send({ type: 'password-correct' });
                } else {
                    connection.send({ type: 'password-incorrect' });
                }
            } else if (data.type === 'file-request') {
                sendFile();
            }
        });

        connection.on('close', () => {
            connStatus.textContent = i18n('connectionClosed');
            statusBadge.className = 'status-badge';
            connectedPeerInfo.style.display = 'none';
        });

        connection.on('error', (err) => {
            console.error('Erro na conexão:', err);
            connStatus.textContent = i18n('errorConnectingPeer') + ' ' + err.message;
            statusBadge.className = 'status-badge error';
        });
    }

    // Enviar arquivo em chunks
    function sendFile() {
        if (!selectedFile) return;
        
        const reader = new FileReader();
        const chunkSize = 16384; // 16KB chunks
        let offset = 0;
        
        reader.onload = (e) => {
            connection.send({
                type: 'file-chunk',
                data: e.target.result
            });
            
            offset += e.target.result.byteLength;
            const progress = Math.min(100, Math.floor((offset / selectedFile.size) * 100));
            transferProgress.textContent = `${progress}%`;
            senderProgressBar.style.width = `${progress}%`;
            
            if (offset < selectedFile.size) {
                // Há mais para ler
                readSlice(offset);
            } else {
                // Arquivo completo enviado
                connection.send({ type: 'file-complete' });
                transferProgress.textContent = '100% - ' + i18n('completed');
            }
        };
        
        const readSlice = (o) => {
            const slice = selectedFile.slice(o, o + chunkSize);
            reader.readAsArrayBuffer(slice);
        };
        
        // Iniciar o processo de leitura e envio
        readSlice(0);
    }

    // Conectar ao peer compartilhador
    function connectToPeer(id) {
        peer = new Peer(null, {
            debug: 2
        });

        peer.on('open', (myId) => {
            console.log('Peer local inicializado com ID:', myId);
            try {
                // Estabelecer conexão com o peer remoto
                connection = peer.connect(id, {
                    reliable: true
                });
                
                // Aguardar a abertura da conexão
                connection.on('open', () => {
                    console.log('Conexão estabelecida com o peer:', id);
                    
                    // Solicitar informações do arquivo e verificar senha, se necessário
                    connection.send({ type: 'password-request' });
                    
                    // Configurar handlers para eventos de dados recebidos
                    connection.on('data', (data) => {
                        if (data.type === 'password-response') {
                            if (data.isPasswordProtected) {
                                fileMetadata = data.fileInfo;
                                passwordRequired.style.display = 'block';
                            } else {
                                fileMetadata = data.fileInfo;
                                passwordRequired.style.display = 'none';
                                showFileInfo();
                            }
                        } else if (data.type === 'password-correct') {
                            passwordRequired.style.display = 'none';
                            showFileInfo();
                        } else if (data.type === 'password-incorrect') {
                            alert(i18n('passwordIncorrect'));
                        } else if (data.type === 'file-chunk') {
                            // Receber chunk do arquivo
                            chunks.push(data.data);
                            
                            const totalReceived = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
                            const progress = Math.min(100, Math.floor((totalReceived / fileMetadata.size) * 100));
                            receiveProgress.textContent = `${progress}%`;
                            receiverProgressBar.style.width = `${progress}%`;
                        } else if (data.type === 'file-complete') {
                            // Arquivo completo recebido, juntar chunks e fazer download
                            saveFile();
                        }
                    });
                });
                
                connection.on('error', (err) => {
                    console.error('Erro na conexão:', err);
                    alert(i18n('errorConnectingPeer') + ' ' + err.message);
                });
            } catch (err) {
                console.error('Falha ao iniciar conexão com peer:', err);
                alert(i18n('errorInitConnection') + ' ' + err.message);
            }
        });
        
        peer.on('error', (err) => {
            console.error('Erro no peer:', err);
            alert(i18n('errorInitConnection') + ' ' + err.message);
        });
    }

    // Exibir informações do arquivo a ser recebido
    function showFileInfo() {
        fileInfo.style.display = 'block';
        fileName.textContent = fileMetadata.name;
        fileSize.textContent = formatFileSize(fileMetadata.size);
    }

    // Salvar arquivo recebido
    function saveFile() {
        receiveProgress.textContent = '100% - ' + i18n('processing');
        
        // Combinar todos os chunks em um único ArrayBuffer
        const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
        const fileData = new Uint8Array(totalLength);
        
        let offset = 0;
        for (const chunk of chunks) {
            fileData.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }
        
        // Criar blob e link de download
        const blob = new Blob([fileData], { type: fileMetadata.type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileMetadata.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        receiveProgress.textContent = '100% - ' + i18n('completed');
    }

    // Utilitários
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Event Listeners
    createShareBtn.addEventListener('click', () => {
        if (!fileInput.files.length) {
            alert(i18n('errorNoFile'));
            return;
        }
        
        selectedFile = fileInput.files[0];
        
        // Verificar se o arquivo possui tamanho maior que 0 bytes
        if (selectedFile.size === 0) {
            alert(i18n('errorEmptyFile'));
            return;
        }
        
        password = hasPassword ? passwordInput.value : '';
        
        if (hasPassword && !password) {
            alert(i18n('errorNoPassword'));
            return;
        }
        
        setupSection.style.display = 'none';
        shareInfo.style.display = 'block';
        
        // Gerar URL de compartilhamento
        const shareURL = `${window.location.origin}${window.location.pathname}?id=${peer.id}&encrypted=${hasPassword}`;
        shareUrl.value = shareURL;
    });

    copyUrlBtn.addEventListener('click', () => {
        shareUrl.select();
        document.execCommand('copy');
        copyUrlBtn.textContent = i18n('copied');
        setTimeout(() => {
            copyUrlBtn.textContent = i18n('copyBtn');
        }, 2000);
    });

    submitPasswordBtn.addEventListener('click', () => {
        // Verificar se a conexão está estabelecida
        if (!connection || !connection.open) {
            alert(i18n('errorConnection'));
            console.error('Tentativa de enviar senha sem conexão estabelecida.');
            return;
        }
        
        if (!receivePassword.value) {
            alert(i18n('errorNoPasswordReceive'));
            return;
        }
        
        try {
            connection.send({
                type: 'password-attempt',
                password: receivePassword.value
            });
        } catch (err) {
            console.error('Erro ao enviar senha:', err);
            alert(i18n('errorSendingPwd'));
        }
    });

    receiveFileBtn.addEventListener('click', () => {
        // Verificar se a conexão está estabelecida
        if (!connection || !connection.open) {
            alert(i18n('errorRequestFile'));
            return;
        }
        
        chunks = [];
        receiveFileBtn.disabled = true;
        receiveFileBtn.textContent = i18n('receiving');
        
        try {
            connection.send({ type: 'file-request' });
        } catch (err) {
            console.error('Erro ao solicitar arquivo:', err);
            alert(i18n('errorRequestingFile'));
            receiveFileBtn.disabled = false;
            receiveFileBtn.textContent = i18n('receiveFileBtn');
        }
    });

    // Para melhorar a experiência do usuário com o input de arquivo
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileLabel = document.querySelector('label[for="file-input"]');
            fileLabel.textContent = `${i18n('fileSelected')} ${file.name} (${formatFileSize(file.size)})`;
        }
    });
});