# ShareDirect

ShareDirect é uma aplicação web de compartilhamento de arquivos ponta a ponta (P2P) que permite transferir arquivos diretamente entre navegadores, sem armazenamento em servidores intermediários. Com suporte para proteção por senha e disponível em português, inglês e espanhol.

![ShareDirect Screenshot](screenshot.png)

## 🌟 Recursos

- 🔄 Transferência de arquivos P2P usando WebRTC
- 🔒 Proteção opcional com senha
- 🔗 Geração de links de compartilhamento
- 📱 Interface responsiva e moderna
- 🌐 Suporte a múltiplos idiomas (PT, EN, ES)
- 📊 Barra de progresso para acompanhamento das transferências
- 🔐 Criptografia ponta a ponta

## 🔧 Tecnologias

- WebRTC (via PeerJS)
- JavaScript (ES6+)
- HTML5 & CSS3
- CryptoJS para criptografia
- Armazenamento local para preferências de idioma

## 🚀 Como usar

### Compartilhar um arquivo:

1. Acesse a aplicação no navegador
2. Selecione um arquivo para compartilhar
3. Opcionalmente, proteja com senha
4. Clique em "Criar Compartilhamento"
5. Copie o link gerado e envie para o destinatário

### Receber um arquivo:

1. Acesse o link de compartilhamento
2. Se solicitado, digite a senha
3. Clique em "Receber Arquivo"
4. O arquivo será transferido diretamente do remetente

## ⚙️ Instalação

Não é necessário instalação. Basta clonar este repositório e abrir o arquivo `index.html` em um navegador moderno.

```bash
git clone https://github.com/thiagovalentedasilva/sharedirect.git
cd sharedirect

