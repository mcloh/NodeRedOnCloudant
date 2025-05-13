# Node-RED com Persistência em IBM Cloudant no GCP Cloud Run

Este projeto configura uma instância do Node-RED para utilizar um módulo de persistência customizado que armazena fluxos (flows), credenciais (credentials) e configurações (settings) numa base de dados IBM Cloudant. A aplicação é desenhada para ser implementada no GCP Cloud Run através de um pipeline de CI/CD com GitHub Actions.

## Estrutura do Repositório

- **`.github/workflows/cloudrun-deploy.yml`**: Define o workflow do GitHub Actions para construir a imagem Docker e implementar a aplicação no GCP Cloud Run.
- **`node-red-cloudant-storage/`**: Contém o módulo de persistência customizado para o Node-RED.
  - `cloudant-storage.js`: A lógica principal do plugin de armazenamento para interagir com o IBM Cloudant.
  - `package.json`: Define as dependências do módulo de armazenamento (principalmente o cliente `nano` para Cloudant).
- **`Dockerfile`**: Instruções para construir a imagem Docker do Node-RED, incluindo a instalação do módulo de persistência customizado e a cópia do ficheiro de configuração.
- **`settings.js`**: Ficheiro de configuração do Node-RED, modificado para utilizar o `node-red-contrib-cloudant-storage` como `storageModule`.
- **`README.md`**: Este ficheiro, com a descrição do projeto e instruções.

## Configuração e Implementação

Para implementar esta aplicação, siga os passos abaixo:

1.  **Fork/Clone este repositório.**

2.  **Configure os Segredos no GitHub:**
    No seu repositório GitHub, vá a `Settings` > `Secrets and variables` > `Actions` e adicione os seguintes segredos, que são necessários para o workflow de CI/CD (`cloudrun-deploy.yml`):

    *   `GCP_PROJECT_ID`: O ID do seu projeto Google Cloud.
    *   `GCP_PROJECT_NUMBER`: O número do seu projeto Google Cloud.
    *   `GCP_SERVICE_ACCOUNT`: O email da conta de serviço Google Cloud que o GitHub Actions utilizará para implementar no Cloud Run. Esta conta de serviço deve ter as permissões necessárias (ex: `Cloud Run Admin`, `Storage Admin` para GCR, `Service Account User` se estiver a usar Workload Identity Federation).
    *   `GCP_WORKLOAD_IDENTITY_POOL`: O ID do seu Workload Identity Pool no GCP.
    *   `GCP_WORKLOAD_IDENTITY_PROVIDER`: O ID do seu Workload Identity Provider no GCP.
    *   `CLOUD_RUN_SERVICE_NAME`: O nome que deseja dar ao seu serviço no Cloud Run (ex: `node-red-cloudant`).
    *   `CLOUD_RUN_REGION`: A região do GCP onde o serviço Cloud Run será implementado (ex: `us-central1`).
    *   `CLOUDANT_CREDENTIALS_JSON`: As credenciais de acesso ao seu IBM Cloudant, em formato JSON string. Este JSON deve conter os campos `url` (com utilizador e password embebidos ou usando IAM apikey) e `app_db` (o nome da base de dados a ser utilizada/criada). Exemplo (substitua com os seus dados reais):
        ```json
        {\"apikey\": \"SUA_APIKEY\", \"host\": \"SEU_HOST.cloudantnosqldb.appdomain.cloud\", \"iam_apikey_description\": \"desc\", \"iam_apikey_name\": \"nome\", \"iam_role_crn\": \"crn_role\", \"iam_serviceid_crn\": \"crn_serviceid\", \"password\": \"SUA_PASSWORD_SE_APLICAVEL\", \"port\": 443, \"url\": \"https://SUA_APIKEY:SUA_PASSWORD_OU_APIKEY_V2@SEU_HOST.cloudantnosqldb.appdomain.cloud\", \"username\": \"SEU_USERNAME_OU_APIKEY_V2\", \"app_db\": \"nomeDaSuaBaseNodeRed\"}
        ```
        **Importante**: Certifique-se de que o JSON está corretamente "escapado" se o estiver a colar diretamente na interface de segredos do GitHub, ou forneça-o como uma string JSON válida.

3.  **Variável de Ambiente `CLOUDANT_CREDENTIALS`:**
    O módulo `cloudant-storage.js` espera que as credenciais do Cloudant sejam fornecidas através de uma variável de ambiente chamada `CLOUDANT_CREDENTIALS`. O workflow do GitHub Actions (`cloudrun-deploy.yml`) já está configurado para passar o segredo `CLOUDANT_CREDENTIALS_JSON` do GitHub para esta variável de ambiente no serviço Cloud Run.

4.  **Commit e Push:**
    Faça commit de quaisquer alterações e faça push para o branch `main` (ou o seu branch default). Isto irá acionar o workflow do GitHub Actions.

5.  **Monitorize o Workflow:**
    Vá à aba `Actions` no seu repositório GitHub para monitorizar o progresso do build e da implementação.

6.  **Aceda à sua Instância Node-RED:**
    Após a implementação bem-sucedida, o workflow irá mostrar o URL da sua aplicação Node-RED no Cloud Run. Os fluxos, credenciais e configurações serão persistidos na base de dados Cloudant especificada.

## Como Funciona o Módulo de Persistência

O módulo `node-red-contrib-cloudant-storage` implementa a Storage API do Node-RED.

-   **`init(settings)`**: Inicializa a ligação ao Cloudant utilizando as credenciais da variável de ambiente `CLOUDANT_CREDENTIALS`. Cria a base de dados especificada em `app_db` se esta não existir.
-   **`getFlows()` / `saveFlows(flows)`**: Lê/grava os fluxos do Node-RED de/para um documento chamado `nodered_flows` na base de dados Cloudant.
-   **`getCredentials()` / `saveCredentials(credentials)`**: Lê/grava as credenciais encriptadas do Node-RED de/para um documento chamado `nodered_credentials`.
-   **`getSettings()` / `saveSettings(settings)`**: Lê/grava as configurações do runtime do Node-RED de/para um documento chamado `nodered_settings`.

O ficheiro `settings.js` na raiz do projeto instrui o Node-RED a utilizar este módulo de armazenamento.

