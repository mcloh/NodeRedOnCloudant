# Node-RED com Persistência em IBM Cloudant (Deployment Manual)

Este projeto configura uma instância do Node-RED para utilizar um módulo de persistência customizado que armazena fluxos (flows), credenciais (credentials) e configurações (settings) numa base de dados IBM Cloudant. Adicionalmente, o editor do Node-RED é protegido por autenticação, configurada dinamicamente a partir de um vetor de utilizadores fornecido no mesmo JSON de credenciais do Cloudant.

Esta versão do projeto está preparada para deployment manual (ex: via consola do GCP Cloud Run ou outro serviço de containers).

## Estrutura do Repositório

- **`node-red-cloudant-storage/`**: Contém o módulo de persistência customizado para o Node-RED.
  - `cloudant-storage.js`: A lógica principal do plugin de armazenamento para interagir com o IBM Cloudant.
  - `package.json`: Define as dependências do módulo de armazenamento (principalmente o cliente `nano` para Cloudant).
- **`Dockerfile`**: Instruções para construir a imagem Docker do Node-RED, incluindo a instalação do módulo de persistência customizado e a cópia do ficheiro de configuração.
- **`settings.js`**: Ficheiro de configuração do Node-RED, modificado para utilizar o `node-red-contrib-cloudant-storage` como `storageModule` e para configurar a autenticação do editor (`adminAuth`) dinamicamente.
- **`README.md`**: Este ficheiro, com a descrição do projeto e instruções.

## Configuração e Implementação Manual

Para implementar esta aplicação manualmente (ex: no GCP Cloud Run):

1.  **Clone este repositório.**

2.  **Construa a Imagem Docker:**
    Navegue até ao diretório raiz do projeto e construa a imagem Docker:
    ```bash
    docker build -t o_nome_da_sua_imagem:tag .
    ```
    (Ex: `docker build -t gcr.io/seu-projeto-gcp/node-red-cloudant:latest .`)

3.  **Envie a Imagem para um Registo de Containers:**
    Envie a imagem construída para um registo de containers (ex: Google Container Registry - GCR, Docker Hub).
    ```bash
    docker push o_nome_da_sua_imagem:tag
    ```
    (Ex: `docker push gcr.io/seu-projeto-gcp/node-red-cloudant:latest`)

4.  **Configure a Variável de Ambiente `CLOUDANT_CREDENTIALS`:**
    Ao implementar o seu container (ex: no GCP Cloud Run), deverá configurar uma variável de ambiente chamada `CLOUDANT_CREDENTIALS`. Esta variável deve conter uma string JSON com:
    *   As credenciais de acesso ao seu IBM Cloudant (`url`, `app_db`).
    *   O vetor `nodered_users` para a autenticação do editor Node-RED.

    Exemplo do conteúdo da string JSON para `CLOUDANT_CREDENTIALS`:
    ```json
    {
      "url": "https://SUA_APIKEY_OU_USERNAME:SUA_PASSWORD@SEU_HOST.cloudantnosqldb.appdomain.cloud",
      "app_db": "nomeDaSuaBaseNodeRed",
      "nodered_users": [
        {
          "username": "admin",
          "password": "$2a$08$tcrS3GpuSXO3w0OBCg3dZ.TRkH3.cUbT/j2g59A22fXnmM6tLaZZe",
          "role": "admin"
        },
        {
          "username": "editor",
          "password": "$2a$08$abcdefghijklmnopqrstuv.wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234",
          "role": "user",
          "permissions": "read"
        }
      ]
    }
    ```
    **Importante sobre `nodered_users`**:
    *   Cada objeto de utilizador deve conter `username`, `password` (obrigatoriamente uma hash bcrypt), e `role`.
    *   O campo `role` é usado para determinar as `permissions`. Atualmente, `role: "admin"` concede permissões totais (`"*"`). Outros `role`s concedem permissões de leitura (`"read"`) por defeito. Pode expandir esta lógica no `settings.js` se necessitar de mais granularidade.
    *   **Gerar Hashes Bcrypt:** Pode gerar hashes bcrypt para as suas passwords utilizando a ferramenta de linha de comando do Node-RED: `node-red-admin hash-pw`. Copie a hash resultante para o campo `password`.
    *   Ao definir a variável de ambiente no seu serviço de container, certifique-se de que a string JSON é fornecida corretamente (pode necessitar de "escapar" caracteres especiais dependendo da interface do serviço).

5.  **Implemente o Container:**
    Utilize a consola do seu fornecedor de cloud (ex: GCP Cloud Run) para criar um novo serviço, utilizando a imagem Docker que enviou para o registo. Configure a variável de ambiente `CLOUDANT_CREDENTIALS` conforme descrito acima. Certifique-se também de que a porta do container (1880 por defeito, ou a definida em `uiPort` no `settings.js` se alterada) está corretamente mapeada e que o serviço está configurado para escutar na porta esperada pelo seu ambiente (ex: Cloud Run espera `PORT=8080` por defeito, o `settings.js` já está configurado para usar `process.env.PORT` ou 1880).

6.  **Aceda à sua Instância Node-RED:**
    Após a implementação bem-sucedida, aceda ao URL fornecido pelo seu serviço de container. Será solicitado o login com um dos utilizadores configurados. Os fluxos, credenciais e configurações serão persistidos na base de dados Cloudant especificada.

## Como Funciona o Módulo de Persistência

O módulo `node-red-contrib-cloudant-storage` implementa a Storage API do Node-RED.

-   **`init(settings)`**: Inicializa a ligação ao Cloudant utilizando as credenciais da variável de ambiente `CLOUDANT_CREDENTIALS`. Cria a base de dados especificada em `app_db` se esta não existir.
-   **`getFlows()` / `saveFlows(flows)`**: Lê/grava os fluxos do Node-RED de/para um documento chamado `nodered_flows` na base de dados Cloudant.
-   **`getCredentials()` / `saveCredentials(credentials)`**: Lê/grava as credenciais encriptadas do Node-RED de/para um documento chamado `nodered_credentials`.
-   **`getSettings()` / `saveSettings(settings)`**: Lê/grava as configurações do runtime do Node-RED de/para um documento chamado `nodered_settings`.

## Autenticação do Editor

O ficheiro `settings.js` na raiz do projeto instrui o Node-RED a utilizar o módulo de armazenamento e também configura a secção `adminAuth` dinamicamente:

-   Lê a variável de ambiente `CLOUDANT_CREDENTIALS`.
-   Se o JSON contiver um array `nodered_users` válido, configura a autenticação do editor do Node-RED.
-   Mapeia o campo `role` para `permissions` (ex: `admin` -> `*`, outros -> `read`).
-   As passwords **devem** ser hashes bcrypt.

Se `nodered_users` não for fornecido ou estiver malformado, a autenticação do editor não será ativada (comportamento por defeito do Node-RED, a menos que outra configuração de `adminAuth` seja definida manualmente no `settings.js`).

